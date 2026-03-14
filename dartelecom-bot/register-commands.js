// Register DarTelecom slash commands
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    { name: 'telecom-dashboard', description: 'DarTelecom™ full network overview' },
    { name: 'telecom-esim', description: 'Dar eSIM™ — global eSIM service (190+ countries)' },
    { name: 'telecom-wifi', description: 'Dar WiFi Grid™ — mesh WiFi hotspots' },
    { name: 'telecom-fiber', description: 'Dar Fiber Net™ — fiber optic network' },
    { name: 'telecom-5g', description: 'Dar5G™ — 5G core network infrastructure' },
    { name: 'telecom-satellite', description: 'Dar Sat Net™ — satellite internet service' },
    { name: 'telecom-hardware', description: 'Dar Network HW™ — routers, modems, devices' },
    { name: 'telecom-help', description: 'DarTelecom bot commands' },
    { name: 'isp-status', description: '📡 DarTelecom ISP dashboard — live subscribers, revenue, network' },
    { name: 'isp-plans', description: '📋 View all DarTelecom ISP plans with pricing' },
    { name: 'isp-network', description: '🌐 5G core network status — all NFs + mesh' },
    { name: 'isp-nodes', description: '🔗 List ISP mesh relay nodes' },
    { name: 'isp-billing', description: '💰 Revenue summary — MRR/ARR + splits' },
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
  console.log(`Registering 19 DarTelecom commands...`);
  try {
    const built = commands.map(c => new SlashCommandBuilder().setName(c.name).setDescription(c.description));

    // ISP subscribe command with plan option
    const ispSubscribe = new SlashCommandBuilder()
      .setName("isp-subscribe")
      .setDescription("📱 Subscribe to DarTelecom — get eSIM + 5G access")
      .addStringOption((opt) =>
        opt.setName("plan").setDescription("ISP plan").setRequired(false)
          .addChoices(
            { name: "Starter ($19.99/mo)", value: "starter" },
            { name: "Pro ($39.99/mo)", value: "pro" },
            { name: "Unlimited ($59.99/mo)", value: "unlimited" },
            { name: "Business ($99.99/mo)", value: "business" },
            { name: "Mesh Node (Free/Revenue)", value: "mesh_node" },
          ));
    built.push(ispSubscribe);

    // ISP provision (admin) command
    const ispProvision = new SlashCommandBuilder()
      .setName("isp-provision")
      .setDescription("🔧 Admin: Provision new subscriber manually")
      .addStringOption((opt) => opt.setName("name").setDescription("Subscriber name").setRequired(true))
      .addStringOption((opt) => opt.setName("email").setDescription("Subscriber email").setRequired(true))
      .addStringOption((opt) =>
        opt.setName("plan").setDescription("ISP plan").setRequired(false)
          .addChoices(
            { name: "Starter", value: "starter" },
            { name: "Pro", value: "pro" },
            { name: "Unlimited", value: "unlimited" },
            { name: "Business", value: "business" },
          ));
    built.push(ispProvision);

    // ISP eSIM command
    const ispEsim = new SlashCommandBuilder()
      .setName("isp-esim")
      .setDescription("📱 Get eSIM activation profile for a subscriber")
      .addStringOption((opt) => opt.setName("subscriber_id").setDescription("Subscriber UUID").setRequired(true));
    built.push(ispEsim);

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
    console.log(`✓ Registered 19 commands to guild ${process.env.DISCORD_GUILD_ID}`);
  } catch (err) {
    console.log('Failed:', err);
    process.exit(1);
  }
})();
