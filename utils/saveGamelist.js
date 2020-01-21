const xml2js = require("xml2js");
const { writeFile } = require("fs").promises;

module.exports = async function saveGamelist(games, filePath) {
  const builder = new xml2js.Builder();
  const xmlObject = { gameList: { game: games } };
  const xml = builder.buildObject(xmlObject);

  await writeFile(filePath, xml);
};
