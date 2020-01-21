const { opendir, copyFile, stat } = require("fs").promises;
const { extname, basename } = require("path");
const sharp = require("sharp");
const loadGamelist = require("../utils/loadGamelist");

async function getGameImageSourcePath(systemDirectoryPath, game) {
  const extension = extname(game.path);
  const filename = basename(game.path, extension);
  const sourcePath = `${systemDirectoryPath}/theme-neolao-01-source/${filename}.png`;
  try {
    const sourceStats = await stat(sourcePath);
    if (sourceStats.isFile()) {
      return sourcePath;
    }
  } catch (error) {
    // No source file
  }
  return `${__dirname}/images/default_game_image.png`;
}

function getGameImageDestinationPath(systemDirectoryPath, game) {
  const extension = extname(game.path);
  const filename = basename(game.path, extension);
  return `${systemDirectoryPath}/theme-neolao-01-generated/${filename}.png`;
}

async function composeWithPreviousAndNextImages(mainImagePath, previousImagePath, nextImagePath, destinationPath) {
  const previousImage = await sharp(previousImagePath)
    .greyscale()
    .toBuffer();
  const nextImage = await sharp(nextImagePath)
    .greyscale()
    .toBuffer();
  return sharp(mainImagePath)
    .composite([
      { input: previousImage, top: -390 + 90 + 10 },
      { input: nextImage, top: 390 - 90 - 10 },
      { input: mainImagePath }
    ])
    .toFile(destinationPath);
}
async function composeWithPreviousImage(mainImagePath, previousImagePath, destinationPath) {
  const previousImage = await sharp(previousImagePath)
    .greyscale()
    .toBuffer();
  return sharp(mainImagePath)
    .composite([{ input: previousImage, top: -390 + 90 + 10 }, { input: mainImagePath }])
    .toFile(destinationPath);
}
async function composeWithNextImage(mainImagePath, nextImagePath, destinationPath) {
  const nextImage = await sharp(nextImagePath)
    .greyscale()
    .toBuffer();
  return sharp(mainImagePath)
    .composite([{ input: nextImage, top: 390 - 90 - 10 }, { input: mainImagePath }])
    .toFile(destinationPath);
}

async function generateGameImage(systemDirectoryPath, currentGame, previousGame, nextGame) {
  process.stdout.write(`  - ${currentGame.name} ... `);

  const currentImagePath = await getGameImageSourcePath(systemDirectoryPath, currentGame);
  const destinationPath = getGameImageDestinationPath(systemDirectoryPath, currentGame);

  try {
    if (previousGame && nextGame) {
      const previousImagePath = await getGameImageSourcePath(systemDirectoryPath, previousGame);
      const nextImagePath = await getGameImageSourcePath(systemDirectoryPath, nextGame);
      await composeWithPreviousAndNextImages(currentImagePath, previousImagePath, nextImagePath, destinationPath);
    } else if (previousGame) {
      const previousImagePath = await getGameImageSourcePath(systemDirectoryPath, previousGame);
      await composeWithPreviousImage(currentImagePath, previousImagePath, destinationPath);
    } else if (nextGame) {
      const nextImagePath = await getGameImageSourcePath(systemDirectoryPath, nextGame);
      await composeWithNextImage(currentImagePath, nextImagePath, destinationPath);
    } else {
      await copyFile(currentImagePath, destinationPath);
    }
  } catch (error) {
    process.stdout.write("ERROR");
    return;
  }
  process.stdout.write("OK");
}

async function generateSystemGameImages(name, directoryPath) {
  process.stdout.write(`System ${name}:\n`);

  const gamelistPath = `${directoryPath}/gamelist.xml`;
  try {
    const games = await loadGamelist(gamelistPath);
    for (let index = 0; index < games.length; index++) {
      const currentGame = games[index];
      let previousGame;
      let nextGame;
      if (index > 0) {
        previousGame = games[index - 1];
      }
      if (index < games.length - 1) {
        nextGame = games[games.length + 1];
      }
      await generateGameImage(directoryPath, currentGame, previousGame, nextGame);
    }
  } catch (error) {
    process.stdout.write(`No gamelist.xml\n`);
  }
  process.stdout.write(`\n`);
}

module.exports = async function generateGameImages() {
  const systemsDirectoryPath = "/recalbox/share/roms";
  const systemDirectories = await opendir(systemsDirectoryPath);
  for await (const systemDirectory of systemDirectories) {
    const systemDirectoryPath = `${systemsDirectoryPath}/${systemDirectory.name}`;
    await generateSystemGameImages(systemDirectory.name, systemDirectoryPath);
  }
};
