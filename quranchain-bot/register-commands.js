// ==========================================================
// QuranChain™ Blockchain Bot — Slash Command Registration
// ==========================================================
const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { readFileSync } = require("fs");
const { resolve } = require("path");

// Load .env
try {
  const env = readFileSync(resolve(__dirname, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#") && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env");
  process.exit(1);
}

const CHAIN_CHOICES = [
  { name: "QuranChain", value: "QuranChain" },
  { name: "Ethereum", value: "Ethereum" },
  { name: "Bitcoin", value: "Bitcoin" },
  { name: "Polygon", value: "Polygon" },
  { name: "Arbitrum", value: "Arbitrum" },
  { name: "Solana", value: "Solana" },
  { name: "Base", value: "Base" },
  { name: "BNB Chain", value: "BNB Chain" },
  { name: "Avalanche", value: "Avalanche" },
  { name: "Optimism", value: "Optimism" },
];

const commands = [
  // ── Wallet & Economy ──
  new SlashCommandBuilder().setName("wallet").setDescription("View your QRN wallet balance, level, and mining power"),
  new SlashCommandBuilder().setName("send").setDescription("Send QRN to another user")
    .addUserOption(o => o.setName("to").setDescription("Recipient").setRequired(true))
    .addNumberOption(o => o.setName("amount").setDescription("Amount of QRN to send").setRequired(true).setMinValue(0.01))
    .addStringOption(o => o.setName("memo").setDescription("Optional memo").setRequired(false)),
  new SlashCommandBuilder().setName("daily").setDescription("Claim your daily QRN reward (streak bonus!)"),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Top 10 QRN holders"),
  new SlashCommandBuilder().setName("transactions").setDescription("View your transaction history"),

  // ── Blockchain ──
  new SlashCommandBuilder().setName("mine").setDescription("Mine a block on any of the 47 chains and earn QRN")
    .addStringOption(o => o.setName("chain").setDescription("Chain to mine on (default: QuranChain)").setRequired(false)
      .addChoices(...CHAIN_CHOICES)),
  new SlashCommandBuilder().setName("chain").setDescription("QuranChain network statistics — blocks, supply, validators"),
  new SlashCommandBuilder().setName("validators").setDescription("View all 14 active validators (Omar AI™, QuranChain AI™, etc.)"),
  new SlashCommandBuilder().setName("chains").setDescription("List all 47 live blockchain networks"),
  new SlashCommandBuilder().setName("gas").setDescription("Gas toll revenue breakdown across chains"),

  // ── Games (Earn QRN) ──
  new SlashCommandBuilder().setName("quiz").setDescription("Quran knowledge quiz — earn 20-50 QRN per correct answer"),
  new SlashCommandBuilder().setName("scramble").setDescription("Islamic word scramble — earn 25-50 QRN"),
  new SlashCommandBuilder().setName("answer").setDescription("Answer a word scramble puzzle")
    .addStringOption(o => o.setName("guess").setDescription("Your answer").setRequired(true)),
  new SlashCommandBuilder().setName("treasure").setDescription("Treasure hunt — find items worth 5 to 1000 QRN"),
  new SlashCommandBuilder().setName("gamestats").setDescription("View game statistics for a player")
    .addUserOption(o => o.setName("player").setDescription("Player to view (default: you)").setRequired(false)),

  // ── Ecosystem ──
  new SlashCommandBuilder().setName("ecosystem").setDescription("DarCloud ecosystem — 101 companies across 6 tiers"),
  new SlashCommandBuilder().setName("revenue").setDescription("Revenue distribution — 30/40/10/18/2 immutable split"),
  new SlashCommandBuilder().setName("help").setDescription("QuranChain bot commands and information"),

  // ── Masjid & Prayer ──
  new SlashCommandBuilder().setName("masjid").setDescription("🕌 Find mosques near any location worldwide")
    .addStringOption(o => o.setName("location").setDescription("City, address, or place (e.g. Houston TX, London, Cairo)").setRequired(true))
    .addIntegerOption(o => o.setName("radius").setDescription("Search radius in km (default: 10)").setRequired(false).setMinValue(1).setMaxValue(50)),
  new SlashCommandBuilder().setName("prayer").setDescription("🕐 Get prayer times for any location")
    .addStringOption(o => o.setName("location").setDescription("City or address").setRequired(true)),
  new SlashCommandBuilder().setName("qibla").setDescription("🧭 Get Qibla direction from any location")
    .addStringOption(o => o.setName("location").setDescription("Your city or address").setRequired(true)),

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

  // ─── Smart Contract Commands ────────────────
  new SlashCommandBuilder()
    .setName("contract-deploy")
    .setDescription("📜 Deploy a smart contract on QuranChain")
    .addStringOption(opt =>
      opt.setName("type").setDescription("Contract type").setRequired(true)
        .addChoices(
          { name: "NFT Collection", value: "nft_collection" },
          { name: "Token Contract (QRC-20)", value: "token" },
          { name: "Staking Pool", value: "staking" },
          { name: "Escrow Contract", value: "escrow" },
          { name: "Auction House", value: "auction" },
          { name: "Revenue Sharing", value: "revenue_share" },
          { name: "Token Vesting", value: "vesting" },
          { name: "Governance / DAO", value: "governance" },
          { name: "Subscription", value: "subscription" },
          { name: "NFT Marketplace", value: "marketplace" },
        ))
    .addStringOption(opt =>
      opt.setName("name").setDescription("Contract name").setRequired(true)),

  new SlashCommandBuilder()
    .setName("my-contracts")
    .setDescription("📜 View your deployed smart contracts"),

  // ─── NFT Trading Commands ──────────────────
  new SlashCommandBuilder()
    .setName("nft-mint")
    .setDescription("🎨 Mint an NFT on your smart contract")
    .addStringOption(opt =>
      opt.setName("contract").setDescription("Contract ID (QRC-...)").setRequired(true))
    .addStringOption(opt =>
      opt.setName("name").setDescription("NFT name").setRequired(true))
    .addStringOption(opt =>
      opt.setName("description").setDescription("NFT description"))
    .addStringOption(opt =>
      opt.setName("category").setDescription("NFT category")
        .addChoices(
          { name: "Islamic Art & Calligraphy", value: "islamic_art" },
          { name: "Quran Verse", value: "quran_verse" },
          { name: "Real Estate Deed", value: "real_estate" },
          { name: "Business Equity", value: "business_equity" },
          { name: "Intellectual Property", value: "intellectual_property" },
          { name: "Sukuk Bond", value: "sukuk_bond" },
          { name: "Halal Certification", value: "halal_certification" },
          { name: "Validator Badge", value: "validator_badge" },
          { name: "Mesh Node Token", value: "mesh_node" },
          { name: "Domain Name", value: "domain_name" },
          { name: "Membership NFT", value: "membership" },
          { name: "Land Deed", value: "land_deed" },
          { name: "Carbon Credit", value: "carbon_credit" },
          { name: "Education Certificate", value: "education" },
          { name: "Governance Token", value: "governance" },
        ))
    .addStringOption(opt =>
      opt.setName("rarity").setDescription("NFT rarity tier")
        .addChoices(
          { name: "⬜ Common (10 QRN)", value: "common" },
          { name: "🟩 Uncommon (25 QRN)", value: "uncommon" },
          { name: "🟦 Rare (100 QRN)", value: "rare" },
          { name: "🟪 Epic (500 QRN)", value: "epic" },
          { name: "🟧 Legendary (2500 QRN)", value: "legendary" },
          { name: "🟨 Divine (10000 QRN)", value: "divine" },
        ))
    .addNumberOption(opt =>
      opt.setName("price").setDescription("List price in QRN (0 = don't list)")),

  new SlashCommandBuilder()
    .setName("nft-buy")
    .setDescription("🛒 Buy an NFT from the marketplace")
    .addStringOption(opt =>
      opt.setName("token").setDescription("NFT Token ID").setRequired(true)),

  new SlashCommandBuilder()
    .setName("nft-sell")
    .setDescription("🏷️ List your NFT for sale on the marketplace")
    .addStringOption(opt =>
      opt.setName("token").setDescription("NFT Token ID to sell").setRequired(true))
    .addNumberOption(opt =>
      opt.setName("price").setDescription("Asking price in QRN").setRequired(true)),

  new SlashCommandBuilder()
    .setName("nft-transfer")
    .setDescription("📤 Transfer an NFT to another user")
    .addStringOption(opt =>
      opt.setName("token").setDescription("NFT Token ID to transfer").setRequired(true))
    .addUserOption(opt =>
      opt.setName("to").setDescription("Recipient").setRequired(true)),

  new SlashCommandBuilder()
    .setName("nft-gallery")
    .setDescription("🖼️ View NFT collection")
    .addUserOption(opt =>
      opt.setName("owner").setDescription("User to view (default: you)")),

  new SlashCommandBuilder()
    .setName("nft-market")
    .setDescription("🏪 Browse the QuranChain NFT marketplace")
    .addStringOption(opt =>
      opt.setName("category").setDescription("Filter by category")
        .addChoices(
          { name: "Islamic Art", value: "islamic_art" },
          { name: "Real Estate", value: "real_estate" },
          { name: "Business Equity", value: "business_equity" },
          { name: "Sukuk Bond", value: "sukuk_bond" },
          { name: "Membership", value: "membership" },
          { name: "Governance", value: "governance" },
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
].map(cmd => cmd.toJSON());

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} QuranChain slash commands...`);
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(`✓ Registered ${commands.length} commands to guild ${GUILD_ID}`);
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log(`✓ Registered ${commands.length} global commands`);
    }
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
})();
