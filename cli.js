#!/usr/bin/env node

const program = require("commander");
const info = require("./package.json");
const generateGameImages = require("./commands/generateGameImages");
const updateGamelists = require("./commands/updateGamelists");

program.version(info.version);
program
  .command("generateGameImages [system]")
  .description("Generate game images")
  .action(generateGameImages);
program
  .command("updateGamelists")
  .description("Update gamelists with the generated images")
  .action(updateGamelists);
program.on("command:*", () => {
  console.error("Invalid command: %s\nSee --help for a list of available commands.", program.args.join(" "));
  process.exit(1);
});
program.parse(process.argv);

const noCommandSpecified = process.argv.length <= 2;
if (noCommandSpecified) {
  program.help();
}
