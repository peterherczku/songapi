const Genius = require("genius-lyrics");
const Client = new Genius.Client(
  "RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);

module.exports = async (req, res) => {
  const { title, artist } = req.query;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }
  const searches = await Client.songs.search(title + (artist ?? ""));

  // Pick first one
  const results = searches.map((search) => ({
    id: search.id,
    title: search.title,
    artist: search.artist.name,
  }));

  res
    .status(200)
    .setHeader("Access-Control-Allow-Origin", "*")
    .json({ searchResults: results });
};
