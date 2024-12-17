import parse, { TextNode } from "node-html-parser";
const Genius = require("genius-lyrics");
const Client = new Genius.Client(
	"RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);
const { HttpProxyAgent } = require("http-proxy-agent");
import { Redis } from "@upstash/redis";
const proxy = process.env.PROXY_URL;
const proxyHost = proxy.split(":")[0];
const proxyPort = proxy.split(":")[1];
const proxyUser = proxy.split(":")[2];
const proxyPass = proxy.split(":")[3];

// Construct the proxy URL
const proxyUrl = `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;
const proxyAgent = new HttpProxyAgent(proxyUrl);

async function fetchLyrics(url) {
	try {
		const res = await fetch(url, {
			agent: proxyAgent,
		});
		const text = await res.text();

		// Parse HTML text
		const document = parse(text);

		// Find the lyrics root element (use querySelector for single element)
		const lyricsRoot = document.querySelector("#lyrics-root");

		if (!lyricsRoot) {
			console.error("Could not find #lyrics-root in the document");
			return null;
		}

		// Replace <br> tags with newline characters
		lyricsRoot.querySelectorAll("br").forEach((y) => {
			y.replaceWith(new TextNode("\n"));
		});

		// Extract and clean the text
		const lyrics = lyricsRoot.text.trim();

		return lyrics;
	} catch (error) {
		console.error("Error fetching lyrics:", error);
		return null;
	}
}

async function getAccessToken(redis) {
	const cached = await redis.get("spotify_token");
	if (cached) {
		console.log("Using cached token");
		return cached;
	}

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
	redis.set("spotify_token", data.access_token, { ex: data.expires_in });
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
	const lyrics = await fetchLyrics(song.url);
	const token = await getAccessToken(redis);
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
