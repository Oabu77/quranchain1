const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { readFileSync } = require("fs");
const { resolve } = require("path");
try {
  const env = readFileSync(resolve(__dirname, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#") && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
if (!TOKEN || !CLIENT_ID) { console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID"); process.exit(1); }

const commands = [
  new SlashCommandBuilder().setName("mesh-status").setDescription("FungiMesh network status — 340K nodes, 6 continents"),
  new SlashCommandBuilder().setName("mesh-nodes").setDescription("Registered mesh nodes from D1 database"),
  new SlashCommandBuilder().setName("mesh-connect").setDescription("Connection info & how to join the mesh"),
  new SlashCommandBuilder().setName("mesh-encryption").setDescription("Quantum encryption stack (Kyber-1024, Dilithium-5, BB84)"),
  new SlashCommandBuilder().setName("mesh-layers").setDescription("Dual-layer architecture — Node.js + Python"),
  new SlashCommandBuilder().setName("mesh-docker").setDescription("Docker relay node fleet (5 nodes)"),
  new SlashCommandBuilder().setName("mesh-regions").setDescription("Continental coverage & latency map"),
  new SlashCommandBuilder().setName("mesh-heartbeat").setDescription("Heartbeat & health monitoring status"),
  new SlashCommandBuilder().setName("mesh-topology").setDescription("Network topology & bio-inspiration"),
  new SlashCommandBuilder().setName("mesh-help").setDescription("FungiMesh bot commands"),

  // WiFi Gateway commands (B.A.T.M.A.N. + hostapd)
  new SlashCommandBuilder().setName("wifi-status").setDescription("WiFi gateway mesh status — B.A.T.M.A.N. + WireGuard"),
  new SlashCommandBuilder().setName("wifi-gateways").setDescription("List all WiFi gateway/antenna nodes"),
  new SlashCommandBuilder().setName("wifi-clients").setDescription("Connected WiFi clients across all gateways"),
  new SlashCommandBuilder().setName("wifi-deploy").setDescription("Deploy a new WiFi gateway node — installer instructions"),

  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("⚡ Auto-install & configure ALL DarCloud services"),

  new SlashCommandBuilder()
    .setName("my-services")
    .setDescription("📋 View all your provisioned DarCloud services"),

  new SlashCommandBuilder()
    .setName("upgrade")
    .setDescription("⬆️ Upgrade your DarCloud plan")
    .addStringOption((opt) =>
      opt.setName("plan").setDescription("Plan to upgrade to").setRequired(true)
        .addChoices(
          { name: "Professional ($49/mo)", value: "pro" },
          { name: "Enterprise ($499/mo)", value: "enterprise" },
          { name: "FungiMesh Node ($19.99/mo)", value: "fungimesh_node" },
          { name: "HWC Premium ($99/mo)", value: "hwc_premium" },
        )),

  new SlashCommandBuilder().setName("onboard").setDescription("🚀 Start your onboarding journey"),
  new SlashCommandBuilder().setName("dashboard").setDescription("📊 View your personal dashboard"),
  new SlashCommandBuilder().setName("referral").setDescription("🔗 Get your referral link"),
  new SlashCommandBuilder().setName("services").setDescription("🛒 Browse available services"),
  new SlashCommandBuilder().setName("subscribe").setDescription("💳 Subscribe to premium services"),
  new SlashCommandBuilder()
    .setName("ai-ask")
    .setDescription("🤖 Ask our AI assistant a question")
    .addStringOption((opt) => opt.setName("question").setDescription("Your question").setRequired(true)),
  new SlashCommandBuilder().setName("premium").setDescription("⭐ View your DarCloud Premium status & upgrade"),
  new SlashCommandBuilder().setName("shop").setDescription("🛒 DarCloud Shop — browse & buy premium subscriptions"),
].map(c => c.toJSON());

const rest = new REST().setToken(TOKEN);
(async () => {
  console.log(`Registering ${commands.length} FungiMesh commands...`);
  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✓ Registered ${commands.length} commands to guild ${GUILD_ID}`);
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✓ Registered ${commands.length} global commands`);
  }
})().catch(e => { console.error("Failed:", e); process.exit(1); });
