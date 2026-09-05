// Security wrapper for Discord slash-command registration.
// Keeps the historical command definitions intact while enforcing
// administrator-only default permissions on infrastructure-control commands.
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { secureCommandJson } = require("./admin-command-policy");

const originalToJSON = SlashCommandBuilder.prototype.toJSON;

SlashCommandBuilder.prototype.toJSON = function securedToJSON(...args) {
  const json = originalToJSON.apply(this, args);
  return secureCommandJson(json, PermissionFlagsBits.Administrator);
};

require("./register-commands-legacy");
