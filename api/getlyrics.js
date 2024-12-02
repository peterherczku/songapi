const Genius = require("genius-lyrics");
const Client = new Genius.Client(
  "RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id || isNaN(id)) {
    return res
      .status(400)
      .json({ error: "The id parameter must be a valid number." });
  }
  const numericId = parseInt(id, 10);
  const song = await Client.songs.get(numericId);
  const lyrics = await song.lyrics();

  res.status(200).json({ lyrics: lyrics });
};
