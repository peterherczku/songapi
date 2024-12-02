const Genius = require("genius-lyrics");
const Client = new Genius.Client(
  "RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);

module.exports = async (req, res) => {
  const searches = await Client.songs.search("happy");

  // Pick first one
  const results = searches[0];

  const lyrics = await results.lyrics();

  res.status(200).json({ searchResults: lyrics });
};
