// Register DarHealth slash commands
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    { name: 'health-dashboard', description: 'DarHealth system overview — clinics, telemed, pharma' },
    { name: 'health-clinics', description: 'Dar Clinics™ — locations, services, specialties' },
    { name: 'health-telemed', description: 'Dar Telemed™ — virtual consultations & telehealth' },
    { name: 'health-hospitals', description: 'Dar Hospitals™ network — facilities & capacity' },
    { name: 'health-pharma', description: 'DarPharmacy™ — halal pharmaceuticals & products' },
    { name: 'health-biotech', description: 'Dar BioTech™ — research & clinical trials' },
    { name: 'health-wellness', description: 'Wellness & preventive care programs' },
    { name: 'health-takaful', description: 'DarTakaful™ — Islamic cooperative health insurance' },
    { name: 'health-help', description: 'DarHealth bot commands' },
    { name: 'setup', description: '⚡ Auto-install & configure ALL DarCloud services' },
    { name: 'my-services', description: '📋 View all your provisioned DarCloud services' },
    { name: 'onboard', description: '🚀 Start your onboarding journey' },
    { name: 'dashboard', description: '📊 View your personal dashboard' },
    { name: 'referral', description: '🔗 Get your referral link' },
    { name: 'services', description: '🛒 Browse available services' },
    { name: 'subscribe', description: '💳 Subscribe to premium services' },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  console.log(`Registering 12 DarHealth commands...`);
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
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
      { body: built.map(b => b.toJSON()) }
    );
    console.log(`✓ Registered 12 commands to guild ${process.env.DISCORD_GUILD_ID}`);
  } catch (err) {
    console.log('Failed:', err);
    process.exit(1);
  }
})();
