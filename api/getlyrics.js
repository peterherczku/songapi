const Genius = require("genius-lyrics");
const Client = new Genius.Client(
	"RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);
import { get, set } from "@vercel/edge-config";

const cache = {};

module.exports = async (req, res) => {
	const { id } = req.query;

	if (!id || isNaN(id)) {
		return res
			.status(400)
			.json({ error: "The id parameter must be a valid number." });
	}
	const cached = await get(id);
	if (cached) {
		console.log("Cache hit");
		return cached;
	}
	const numericId = parseInt(id, 10);
	const song = await Client.songs.get(numericId);
	const lyrics = await song.lyrics();
	set(id, lyrics);
	res
		.status(200)
		.setHeader("Access-Control-Allow-Origin", "*")
		.json({ artist: song.artist.name, title: song.title, lyrics: lyrics });
};
