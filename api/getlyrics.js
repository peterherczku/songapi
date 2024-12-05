const Genius = require("genius-lyrics");
const Client = new Genius.Client(
	"RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);
import { createClient } from "redis";

module.exports = async (req, res) => {
	const { id } = req.query;
	const client = createClient();
	await client.connect();

	if (!id || isNaN(id)) {
		return res
			.status(400)
			.json({ error: "The id parameter must be a valid number." });
	}
	const cached = await client.get(id);
	if (cached) {
		console.log("Cache hit");
		return cached;
	}
	const numericId = parseInt(id, 10);
	const song = await Client.songs.get(numericId);
	const lyrics = await song.lyrics();
	client.set(id, lyrics);
	res
		.status(200)
		.setHeader("Access-Control-Allow-Origin", "*")
		.json({ artist: song.artist.name, title: song.title, lyrics: lyrics });
};
