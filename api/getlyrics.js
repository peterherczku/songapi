const Genius = require("genius-lyrics");
const Client = new Genius.Client(
	"RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);
import { Redis } from "@upstash/redis";

async function getAccessToken() {
	const data = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			Authorization:
				"Basic " +
				new Buffer.from(
					process.env.SPOTIFY_CLIENT_ID +
						":" +
						process.env.SPOTIFY_CLIENT_SECRET
				).toString("base64"),
		},
		body: "grant_type=client_credentials",
	});
	return (await data.json()).access_token;
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
	console.log(token);
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
	console.log(data);
	const spotifyEmbed =
		Array.isArray(data.tracks?.items) && data.tracks.items.length > 0
			? data.tracks.items[0].id
			: "";
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
