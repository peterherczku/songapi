const Genius = require("genius-lyrics");
const Client = new Genius.Client(
  "RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);

module.exports = async (req, res) => {
  const searches = await Client.songs.search("happy");

  // Pick first one
  const results = searches.map((search) => ({
    id: search.id,
    title: search.title,
    artist: search.artist.name,
  }));

  res.status(200).json({ searchResults: results });
};
