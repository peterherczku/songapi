const Genius = require("genius-lyrics");
const Client = new Genius.Client(
  "RhhiJZGKjlALygOmujteGUe8iW8e6gnAgS3Sm96wzvWWmFtPOogXTmwSMhQTMYWS"
);

module.exports = async (req, res) => {
  const searches = await Client.songs.search("faded");

  // Pick first one
  const firstSong = searches[0];
  console.log("About the Song:\n", firstSong, "\n");

  // Ok lets get the lyrics
  const lyrics = await firstSong.lyrics();
  res.status(200).json({ lyrics: "lyrics" });
};
