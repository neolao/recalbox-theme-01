const { readFile } = require("fs").promises;
const xml2js = require("xml2js");
const getAbsolutePath = require("./getAbsolutePath");

module.exports = async function loadGamelist(filePath) {
  const absoluteFilePath = getAbsolutePath(filePath, process.cwd());
  const parser = new xml2js.Parser();
  const xml = await readFile(absoluteFilePath);
  const data = await parser.parseStringPromise(xml);
  const games = data.gameList.game;

  return games.map(game => {
    const normalized = {};

    for (const key in game) {
      if (Array.isArray(game[key]) && game[key].length === 0) {
        normalized[key] = undefined;
      } else if (Array.isArray(game[key]) && game[key].length === 1) {
        const [value] = game[key];
        normalized[key] = value;
      } else {
        normalized[key] = game[key];
      }
    }

    return normalized;
  });
};
