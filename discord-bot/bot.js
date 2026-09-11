// Security entrypoint for the DarCloud Discord bot.
// Install the runtime authorization guard before the legacy bot registers
// its interactionCreate handler, then execute the preserved implementation.
const { Client } = require("discord.js");
const { installDiscordRuntimeGuard } = require("./discord-runtime-guard");

installDiscordRuntimeGuard(Client, process.env);
require("./bot-legacy");
