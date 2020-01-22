const { readFile } = require("fs").promises;
const xml2js = require("xml2js");
const getAbsolutePath = require("./getAbsolutePath");

function normalizeGame(game) {
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
}

function sortByName(game1, game2) {
  if (game1.name < game2.name) {
    return -1;
  }

  if (game1.name > game2.name) {
    return 1;
  }

  return 0;
}

module.exports = async function loadGamelist(filePath) {
  const absoluteFilePath = getAbsolutePath(filePath, process.cwd());
  const parser = new xml2js.Parser();
  const xml = await readFile(absoluteFilePath);
  const data = await parser.parseStringPromise(xml);
  const games = data.gameList.game;

  return games.map(normalizeGame).sort(sortByName);
};
