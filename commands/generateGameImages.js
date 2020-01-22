const { mkdir, readdir, copyFile, stat, unlink } = require("fs").promises;
const { extname, basename } = require("path");
const sharp = require("sharp");
const loadGamelist = require("../utils/loadGamelist");

const imageWidth = 1920;
const imageHeight = 1080;
const marginTop = 200;
const marginBottom = 200;
const titleRight = 1580;
const borderSize = 15;
const fontSize = 60;

async function createGameName(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${imageWidth} ${imageHeight}">';
    <defs>
      <style type="text/css">
        @font-face {
          font-family: GameTitle;
          src: url('${__dirname}/../fonts/OpenSans-ExtraBold.ttf') format("truetype");
        }
      </style>
    </defs>
    <text x="${titleRight}" y="${marginTop}" font-family="GameTitle" text-anchor="end" font-size="${fontSize}" style="fill: #ffffff; font-family: GameTitle"><![CDATA[${name}]]></text>
  </svg>`;
  const svgBuffer = Buffer.from(svg);

  return sharp(svgBuffer)
    .resize(imageWidth, imageHeight, {
      withoutEnlargement: true
    })
    .png()
    .toBuffer();
}

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
  return `${process.cwd()}/images/default_game_image.png`;
}

async function getGameImageDestinationPath(systemDirectoryPath, game) {
  const extension = extname(game.path);
  const filename = basename(game.path, extension);
  const destinationDirectoryPath = `${systemDirectoryPath}/theme-neolao-01-generated`;
  await mkdir(destinationDirectoryPath, { recursive: true });
  return `${destinationDirectoryPath}/${filename}.png`;
}

async function composeWithPreviousAndNextImages(mainImagePath, previousImagePath, nextImagePath, destinationPath) {
  const previousImage = await sharp(previousImagePath)
    .extract({
      left: 0,
      top: imageHeight - marginBottom - borderSize - marginTop,
      width: imageWidth,
      height: marginBottom + borderSize + marginTop
    })
    .greyscale()
    .toBuffer();
  const nextImage = await sharp(nextImagePath)
    .extract({ left: 0, top: 0, width: imageWidth, height: marginTop + borderSize + marginBottom })
    .greyscale()
    .toBuffer();
  return sharp({
    create: {
      width: imageWidth,
      height: imageHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      { input: previousImage, left: 0, top: 0 },
      { input: nextImage, left: 0, top: imageHeight - marginBottom - borderSize - marginTop },
      { input: mainImagePath, left: 0, top: 0 }
    ])
    .toFile(destinationPath);
}
async function composeWithPreviousImage(mainImagePath, previousImagePath, destinationPath) {
  const previousImage = await sharp(previousImagePath)
    .extract({
      left: 0,
      top: imageHeight - marginBottom - borderSize - marginTop,
      width: imageWidth,
      height: marginBottom + borderSize + marginTop
    })
    .greyscale()
    .toBuffer();
  return sharp({
    create: {
      width: imageWidth,
      height: imageHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      { input: previousImage, left: 0, top: 0 },
      { input: mainImagePath, left: 0, top: 0 }
    ])
    .toFile(destinationPath);
}

async function composeWithNextImage(mainImagePath, nextImagePath, destinationPath) {
  const nextImage = await sharp(nextImagePath)
    .extract({ left: 0, top: 0, width: imageWidth, height: marginTop + borderSize + marginBottom })
    .greyscale()
    .toBuffer();
  return sharp({
    create: {
      width: imageWidth,
      height: imageHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      { input: nextImage, left: 0, top: imageHeight - marginBottom - borderSize - marginTop },
      { input: mainImagePath, left: 0, top: 0 }
    ])
    .toFile(destinationPath);
}

async function addGameName(imagePath, name) {
  const gameNameImage = await createGameName(name);
  const temporaryPath = `${imagePath}.tmp.png`;
  await copyFile(imagePath, temporaryPath);
  await sharp(temporaryPath)
    .composite([{ input: gameNameImage, left: 0, top: 0 }])
    .toFile(imagePath);
  await unlink(temporaryPath);
}

async function generateGameImage(systemDirectoryPath, currentGame, previousGame, nextGame) {
  process.stdout.write(`  - ${currentGame.name} ... `);

  const currentImagePath = await getGameImageSourcePath(systemDirectoryPath, currentGame);
  const destinationPath = await getGameImageDestinationPath(systemDirectoryPath, currentGame);

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

    await addGameName(destinationPath, currentGame.name);
  } catch (error) {
    process.stdout.write("ERROR\n");
    console.error(error);
    return;
  }
  process.stdout.write("OK\n");
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
        nextGame = games[index + 1];
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
  const systemDirectoryNames = await readdir(systemsDirectoryPath);
  for await (const systemDirectoryName of systemDirectoryNames) {
    const systemDirectoryPath = `${systemsDirectoryPath}/${systemDirectoryName}`;
    await generateSystemGameImages(systemDirectoryName, systemDirectoryPath);
  }
};
