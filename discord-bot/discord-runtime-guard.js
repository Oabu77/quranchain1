const { PermissionFlagsBits } = require("discord.js");
const { authorizeSensitiveCommand } = require("./admin-command-policy");

const DENIAL_MESSAGE = "⛔ You are not authorized to run this command.";
const UNCONFIGURED_MESSAGE = "⛔ Operator authorization is not configured for this command.";

function isAdministrator(interaction) {
  try {
    return Boolean(interaction?.memberPermissions?.has?.(PermissionFlagsBits.Administrator));
  } catch {
    return false;
  }
}

async function denyInteraction(interaction, code) {
  const payload = {
    content: code === "OPERATOR_POLICY_UNCONFIGURED" ? UNCONFIGURED_MESSAGE : DENIAL_MESSAGE,
    ephemeral: true,
  };

  if (interaction?.deferred || interaction?.replied) {
    if (typeof interaction.followUp === "function") {
      await interaction.followUp(payload).catch(() => {});
    }
    return;
  }

  if (typeof interaction?.reply === "function") {
    await interaction.reply(payload).catch(() => {});
  }
}

function wrapInteractionListener(listener, env = process.env) {
  return async function securedInteractionListener(interaction, ...args) {
    if (!interaction?.isChatInputCommand?.()) {
      return listener.call(this, interaction, ...args);
    }

    const decision = authorizeSensitiveCommand({
      commandName: interaction.commandName,
      userId: interaction.user?.id,
      isAdministrator: isAdministrator(interaction),
      operatorIdsRaw: env.DISCORD_OPERATOR_USER_IDS,
    });

    if (!decision.allowed) {
      await denyInteraction(interaction, decision.code);
      return undefined;
    }

    return listener.call(this, interaction, ...args);
  };
}

function installDiscordRuntimeGuard(ClientClass, env = process.env) {
  if (!ClientClass?.prototype || ClientClass.prototype.__darcloudRuntimeGuardInstalled) return;

  const originalOn = ClientClass.prototype.on;
  if (typeof originalOn !== "function") {
    throw new TypeError("Discord Client.prototype.on is unavailable");
  }

  ClientClass.prototype.on = function securedOn(eventName, listener) {
    if (eventName === "interactionCreate" && typeof listener === "function") {
      return originalOn.call(this, eventName, wrapInteractionListener(listener, env));
    }
    return originalOn.call(this, eventName, listener);
  };

  Object.defineProperty(ClientClass.prototype, "__darcloudRuntimeGuardInstalled", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}

module.exports = {
  DENIAL_MESSAGE,
  UNCONFIGURED_MESSAGE,
  isAdministrator,
  denyInteraction,
  wrapInteractionListener,
  installDiscordRuntimeGuard,
};
