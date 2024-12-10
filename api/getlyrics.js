const Genius = require("genius-lyrics");
const Client = new Genius.Client(
	"RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);
import { Redis } from "@upstash/redis";

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
	redis.set(id, {
		id: id,
		artist: song.artist.name,
		artist_image: song.artist.image,
		title: song.title,
		lyrics: lyrics,
		thumbnail: song.thumbnail,
	});
	res.status(200).setHeader("Access-Control-Allow-Origin", "*").json({
		id: id,
		artist: song.artist.name,
		artist_image: song.artist.image,
		title: song.title,
		lyrics: lyrics,
		thumbnail: song.thumbnail,
	});
};
