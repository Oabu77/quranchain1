// Register Dar Al-Nas Bank slash commands
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    { name: 'bank-dashboard', description: 'Full banking dashboard — accounts, treasury, capital' },
    { name: 'bank-accounts', description: 'Checking, savings, business accounts — zero fees' },
    { name: 'bank-treasury', description: 'DarTreasury capital & venture fund overview' },
    { name: 'bank-merchant', description: 'Merchant Services — POS, online payments, settlement' },
    { name: 'bank-investments', description: 'Investment portfolio — halal stocks, sukuk, funds' },
    { name: 'bank-remittance', description: 'DarRemit — cross-border transfers (57 OIC nations)' },
    { name: 'bank-credit', description: 'DarCredit — Islamic credit scoring & bureau' },
    { name: 'bank-mortgage', description: 'Zero-riba home finance — $5K down auto-approval' },
    { name: 'bank-exchange', description: 'DarExchange — Shariah-compliant forex & crypto' },
    { name: 'bank-help', description: 'Dar Al-Nas Bank bot commands' },
    { name: 'setup', description: '⚡ Auto-install & configure ALL DarCloud services' },
    { name: 'my-services', description: '📋 View all your provisioned DarCloud services' },
    { name: 'onboard', description: '🚀 Start your onboarding journey' },
    { name: 'dashboard', description: '📊 View your personal dashboard' },
    { name: 'referral', description: '🔗 Get your referral link' },
    { name: 'services', description: '🛒 Browse available services' },
    { name: 'subscribe', description: '💳 Subscribe to premium services' },
];

const { SlashCommandBuilder: SCB } = require('discord.js');
const masjidCommands = [
  new SCB().setName('masjid').setDescription('🕌 Find mosques near any location worldwide')
    .addStringOption(o => o.setName('location').setDescription('City, address, or place').setRequired(true))
    .addIntegerOption(o => o.setName('radius').setDescription('Search radius in km (default: 10)').setRequired(false).setMinValue(1).setMaxValue(50)),
  new SCB().setName('prayer').setDescription('🕐 Get prayer times for any location')
    .addStringOption(o => o.setName('location').setDescription('City or address').setRequired(true)),
  new SCB().setName('qibla').setDescription('🧭 Get Qibla direction from any location')
    .addStringOption(o => o.setName('location').setDescription('Your city or address').setRequired(true)),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  console.log(`Registering 16 Dar Al-Nas Bank commands...`);
  try {
    const built = commands.map(c => new SlashCommandBuilder().setName(c.name).setDescription(c.description));
    // Upgrade command with plan option
    const upgradeCmd = new SlashCommandBuilder()
      .setName("upgrade")
      .setDescription("⬆️ Upgrade your DarCloud plan")
      .addStringOption((opt) =>
        opt.setName("plan").setDescription("Plan to upgrade to").setRequired(true)
          .addChoices(
            { name: "Professional ($49/mo)", value: "pro" },
            { name: "Enterprise ($499/mo)", value: "enterprise" },
            { name: "FungiMesh Node ($19.99/mo)", value: "fungimesh_node" },
            { name: "HWC Premium ($99/mo)", value: "hwc_premium" },
          ));
    built.push(upgradeCmd);
    const aiAskCmd = new SlashCommandBuilder()
      .setName("ai-ask")
      .setDescription("🤖 Ask our AI assistant a question")
      .addStringOption((opt) => opt.setName("question").setDescription("Your question").setRequired(true));
    built.push(aiAskCmd);
    const premiumCmd = new SlashCommandBuilder()
      .setName("premium")
      .setDescription("⭐ View your DarCloud Premium status & upgrade");
    built.push(premiumCmd);
    const shopCmd = new SlashCommandBuilder()
      .setName("shop")
      .setDescription("🛒 DarCloud Shop — browse & buy premium subscriptions");
    built.push(shopCmd);
    const allCmds = [...built.map(b => b.toJSON()), ...masjidCommands.map(c => c.toJSON())];
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
      { body: allCmds }
    );
    console.log(`✓ Registered 16 commands to guild ${process.env.DISCORD_GUILD_ID}`);
  } catch (err) {
    console.log('Failed:', err);
    process.exit(1);
  }
})();
