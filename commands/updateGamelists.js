const { readdir } = require("fs").promises;
const { extname, basename } = require("path");
const loadGamelist = require("../utils/loadGamelist");
const saveGamelist = require("../utils/saveGamelist");

function getGameImagePath(game) {
  const extension = extname(game.path);
  const filename = basename(game.path, extension);
  return `./theme-neolao-01-generated/${filename}.png`;
}

async function updateSystemGamelist(directoryPath) {
  process.stdout.write(`System ${directoryPath}:\n`);
  const gamelistPath = `${directoryPath}/gamelist.xml`;

  let games;
  try {
    games = await loadGamelist(gamelistPath);
  } catch (error) {
    process.stdout.write("No gamelist.xml\n\n");
    return;
  }

  for (const game of games) {
    game.image = getGameImagePath(game);
  }

  try {
    await saveGamelist(games, gamelistPath);
  } catch (error) {
    process.stdout.write(`Unable to save ${gamelistPath}\n`);
  }

  process.stdout.write("\n");
}

module.exports = async function updateGamelists() {
  const systemsDirectoryPath = "/recalbox/share/roms";
  const systemDirectoryNames = await readdir(systemsDirectoryPath);
  for await (const systemDirectoryName of systemDirectoryNames) {
    const systemDirectoryPath = `${systemsDirectoryPath}/${systemDirectoryName}`;
    await updateSystemGamelist(systemDirectoryPath);
  }
};
