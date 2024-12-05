const Genius = require("genius-lyrics");
const Client = new Genius.Client(
	"RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);

const cache = {};

module.exports = async (req, res) => {
	const { id } = req.query;

	if (!id || isNaN(id)) {
		return res
			.status(400)
			.json({ error: "The id parameter must be a valid number." });
	}
	if (cache[id]) {
		return cache[id];
	}
	const numericId = parseInt(id, 10);
	const song = await Client.songs.get(numericId);
	const lyrics = await song.lyrics();
	cache[id] = lyrics;
	res
		.status(200)
		.setHeader("Access-Control-Allow-Origin", "*")
		.json({ artist: song.artist.name, title: song.title, lyrics: lyrics });
};
