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

const CATEGORIES = ["Core AI","Gas Toll","Expert","Bot Workers","Infrastructure","Validators","Revenue","DarLaw Legal"];

const commands = [
  new SlashCommandBuilder().setName("ai-fleet").setDescription("Full AI fleet overview — 66 agents across 8 categories"),
  new SlashCommandBuilder().setName("ai-assistants").setDescription("12 GPT-4o specialized assistants"),
  new SlashCommandBuilder().setName("ai-benchmark").setDescription("System-wide AI fleet benchmark & grading"),
  new SlashCommandBuilder().setName("ai-category").setDescription("View agents in a specific category")
    .addStringOption(o => o.setName("name").setDescription("Category name").setRequired(true)
      .addChoices(...CATEGORIES.map(c => ({ name: c, value: c })))),
  new SlashCommandBuilder().setName("ai-core").setDescription("7 core AI orchestrator agents"),
  new SlashCommandBuilder().setName("ai-workers").setDescription("10 automated bot workers"),
  new SlashCommandBuilder().setName("ai-validators").setDescription("6 data integrity validator agents"),
  new SlashCommandBuilder().setName("ai-legal").setDescription("11 DarLaw legal AI agents"),
  new SlashCommandBuilder().setName("ai-revenue").setDescription("6 revenue & commerce agents"),
  new SlashCommandBuilder().setName("ai-stats").setDescription("Fleet statistics by platform and category"),
  new SlashCommandBuilder().setName("ai-help").setDescription("AI Fleet bot commands"),

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
  console.log(`Registering ${commands.length} AI Fleet commands...`);
  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✓ Registered ${commands.length} commands to guild ${GUILD_ID}`);
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✓ Registered ${commands.length} global commands`);
  }
})().catch(e => { console.error("Failed:", e); process.exit(1); });
