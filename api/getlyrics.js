const Genius = require("genius-lyrics");
const Client = new Genius.Client(
	"RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);
import { Redis } from "@upstash/redis";

async function getAccessToken(redis) {
	if (redis.exists("spotify_token")) return redis.get("spotify_token");

	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			Authorization:
				"Basic NzBiMTFjY2Y2MTE3NGYwYWIzMmM1Y2M0YTM1ZTg5MWU6NjI4Y2ZjYWZjZTg1NGMyY2JmY2UxZjJlMDEwOGQ2YWQ=",
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: "grant_type=client_credentials",
	});

	const data = await response.json();
	redis.set("spotify_token", data.access_token, "EX", data.expires_in);
	return data.access_token;
}

module.exports = async (req, res) => {
	const { id } = req.query;
	const redis = Redis.fromEnv();

	if (!id || isNaN(id)) {
		return res
			.status(400)
			.json({ error: "The id parameter must be a valid number." });
	}
	const cached = await redis.get(id);
	if (cached) {
		console.log("Cache hit");
		return res
			.status(200)
			.setHeader("Access-Control-Allow-Origin", "*")
			.json(cached);
	}
	const numericId = parseInt(id, 10);
	const song = await Client.songs.get(numericId);
	const lyrics = await song.lyrics();
	const token = await getAccessToken();
	const spotifyCall = await fetch(
		`https://api.spotify.com/v1/search?q=track%3A${encodeURIComponent(
			song.title
		)}%2520artist%3A${encodeURIComponent(
			song.artist.name
		)}&type=track&limit=1&offset=0`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	const data = await spotifyCall.json();
	const trackId =
		Array.isArray(data.tracks?.items) && data.tracks.items.length > 0
			? data.tracks.items[0].id
			: "";
	const spotifyEmbed = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;
	redis.set(id, {
		id: id,
		artist: {
			id: song.artist.id,
			name: song.artist.name,
			image: song.artist.image,
		},
		spotifyEmbed: spotifyEmbed,
		artist_image: song.artist.image,
		title: song.title,
		lyrics: lyrics,
		thumbnail: song.thumbnail,
	});
	res
		.status(200)
		.setHeader("Access-Control-Allow-Origin", "*")
		.json({
			id: id,
			artist: {
				id: song.artist.id,
				name: song.artist.name,
				image: song.artist.image,
			},

			spotifyEmbed: spotifyEmbed,
			title: song.title,
			lyrics: lyrics,
			thumbnail: song.thumbnail,
		});
};
