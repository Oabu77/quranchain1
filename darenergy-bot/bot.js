// ══════════════════════════════════════════════════════════════
// DarEnergy Discord Bot
// DarEnergy™ — Energy, Oil, Mining & Resources
// Part of DarCloud Empire — Omar Mohammad Abunadi
// ══════════════════════════════════════════════════════════════
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const onboardingDb = require('../shared/onboarding-db');
const onboardingEngine = require('../shared/onboarding-engine');
const stripeIntegration = require('../shared/stripe-integration');
const botIpc = require('../shared/bot-ipc');
const masjidFinder = require('../shared/masjid-finder');
const { MeshRouter } = require('../shared/mesh-router');
const openaiAgents = require('../shared/openai-agents');
const discordPremium = require('../shared/discord-premium');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const API = process.env.API_BASE || 'http://localhost:8787';
const meshRouter = new MeshRouter('darenergy');

client.once('ready', () => {
  console.log(`✓ DarEnergy bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 7`);
  botIpc.startIpcServer('darenergy', meshRouter.getIpcHandlers());
  meshRouter.start().then(() => console.log(`✓ MESH ROUTER ONLINE — ${meshRouter.nodeId}`)).catch(() => {});
});

client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'premium_compare') {
    await interaction.deferReply({ ephemeral: true });
    const comp = discordPremium.createComparisonEmbed();
    await interaction.editReply(comp);
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith('shop_buy_')) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const result = discordPremium.handleShopButton(interaction.customId);
      if (result.handled && result.plan) {
        const session = await stripeIntegration.createCheckoutSession(interaction.user.id, result.plan);
        const embed = new EmbedBuilder().setColor(0xFFD700).setTitle('💳 Checkout').setDescription(`🔗 **[Complete Checkout](${session.url})**`).setTimestamp();
        await interaction.editReply({ embeds: [embed] });
      }
      return;
    } catch (err) { if (!interaction.replied) await interaction.editReply({ content: '❌ ' + err.message }).catch(() => {}); return; }
  }

  // Handle onboarding interactions
  if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'darenergy'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'darenergy'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const ENERGY = {
      oil: { production: '245K barrels/day', reserves: '1.2B barrels', refining: '180K bbl/day', terminals: 8, trading: '24/7 spot & futures', compliance: 'Shariah-screened commodities' },
      mining: { operations: 12, minerals: ['Gold', 'Silver', 'Copper', 'Lithium', 'Rare Earth'], production: '$890M annual', employees: 4200, sustainability: 'ISO 14001' },
      water: { plants: 18, capacity: '240M gallons/day', customers: 2400000, desalination: 3, wastewater: 8, quality: 'WHO Standards' },
      solar: { installations: 340, capacity: '2.4 GW', panels: '4.8M', investment: '$3.2B', co2Saved: '1.8M tons/year' },
      grid: { coverage: '48 states', substations: 120, smartMeters: 890000, uptime: '99.97%', renewable: '42% mix' }
    };
    
    switch (commandName) {
      case 'energy-dashboard': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('⚡ DarEnergy™ Resource Dashboard')
          .addFields(
            { name: '🛢️ Oil Production', value: ENERGY.oil.production, inline: true },
            { name: '⛏️ Mining Ops', value: ENERGY.mining.operations.toString(), inline: true },
            { name: '💧 Water Plants', value: ENERGY.water.plants.toString(), inline: true },
            { name: '☀️ Solar Capacity', value: ENERGY.solar.capacity, inline: true },
            { name: '🔌 Grid Coverage', value: ENERGY.grid.coverage, inline: true },
            { name: '♻️ Renewable Mix', value: ENERGY.grid.renewable, inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-oil': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('🛢️ Dar Oil Trading™')
          .addFields(
            { name: 'Production', value: ENERGY.oil.production, inline: true },
            { name: 'Reserves', value: ENERGY.oil.reserves, inline: true },
            { name: 'Refining', value: ENERGY.oil.refining, inline: true },
            { name: 'Terminals', value: ENERGY.oil.terminals.toString(), inline: true },
            { name: 'Trading', value: ENERGY.oil.trading },
            { name: 'Compliance', value: ENERGY.oil.compliance },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-mining': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('⛏️ Dar Mining™')
          .addFields(
            { name: 'Operations', value: ENERGY.mining.operations.toString(), inline: true },
            { name: 'Annual Production', value: ENERGY.mining.production, inline: true },
            { name: 'Employees', value: ENERGY.mining.employees.toLocaleString(), inline: true },
            { name: 'Minerals', value: ENERGY.mining.minerals.join(', ') },
            { name: 'Sustainability', value: ENERGY.mining.sustainability },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-water': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('💧 Dar Water™')
          .addFields(
            { name: 'Plants', value: ENERGY.water.plants.toString(), inline: true },
            { name: 'Capacity', value: ENERGY.water.capacity, inline: true },
            { name: 'Customers', value: ENERGY.water.customers.toLocaleString(), inline: true },
            { name: 'Desalination', value: ENERGY.water.desalination + ' plants', inline: true },
            { name: 'Quality', value: ENERGY.water.quality, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-solar': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('☀️ Solar & Renewable Energy')
          .addFields(
            { name: 'Installations', value: ENERGY.solar.installations.toString(), inline: true },
            { name: 'Capacity', value: ENERGY.solar.capacity, inline: true },
            { name: 'Investment', value: ENERGY.solar.investment, inline: true },
            { name: 'CO₂ Saved', value: ENERGY.solar.co2Saved, inline: true },
            { name: 'Panels', value: ENERGY.solar.panels, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-grid': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('🔌 Power Grid Infrastructure')
          .addFields(
            { name: 'Coverage', value: ENERGY.grid.coverage, inline: true },
            { name: 'Substations', value: ENERGY.grid.substations.toString(), inline: true },
            { name: 'Smart Meters', value: ENERGY.grid.smartMeters.toLocaleString(), inline: true },
            { name: 'Uptime', value: ENERGY.grid.uptime, inline: true },
            { name: 'Renewable Mix', value: ENERGY.grid.renewable, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-help': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('⚡ DarEnergy Commands')
          .setDescription(['/energy-dashboard', '/energy-oil', '/energy-mining', '/energy-water', '/energy-solar', '/energy-grid'].map(c => `\`${c}\``).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'setup': {
        await interaction.deferReply();
        const autoSetup = require("../shared/auto-setup");
        const onboardingDb = require("../shared/onboarding-db");
        onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
        const results = autoSetup.setupAllServices(interaction.user.id, interaction.user.tag || interaction.user.username);
        const { embed: sEmbed, row } = autoSetup.createSetupCompleteEmbed(interaction.user.tag || interaction.user.username, results);
        await interaction.editReply({ embeds: [sEmbed], components: row ? [row] : [] });
        break;
      }
      case 'my-services': {
        await interaction.deferReply();
        const autoSetup2 = require("../shared/auto-setup");
        const msEmbed = autoSetup2.createServiceStatusEmbed(interaction.user.id, interaction.user.tag || interaction.user.username);
        await interaction.editReply({ embeds: [msEmbed] });
        break;
      }
      case 'upgrade': {
        await interaction.deferReply();
        const stripe = require("../shared/stripe-integration");
        const uPlan = interaction.options.getString("plan");
        try {
          const session = await stripe.createCheckoutSession(interaction.user.id, uPlan);
          const upEmbed = new EmbedBuilder().setColor(0x00D4AA).setTitle("⬆️ Upgrade Plan").setDescription("Click below:\n\n[🔗 Checkout](" + session.url + ")");
          await interaction.editReply({ embeds: [upEmbed] });
        } catch (e) { await interaction.editReply({ content: "❌ " + e.message }); }
        break;
      }
      case 'ai-ask': {
        await interaction.deferReply();
        const usageCheck = discordPremium.checkUsageLimit(interaction, 'ai-ask');
        if (!usageCheck.allowed) { const upsell = discordPremium.createUpsellEmbed(usageCheck, 'ai-ask'); await interaction.editReply(upsell); break; }
        discordPremium.trackUsage(interaction.user.id, 'ai-ask');
        const question = interaction.options.getString('question');
        const agent = interaction.options.getString('agent') || null;
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('darenergy-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'darenergy-bot', { userId: interaction.user.id });
        const aiEmbed = new EmbedBuilder().setColor(result.success ? 0x10B981 : 0xEF4444).setTitle(`🤖 ${result.assistant || 'AI'}`).setDescription(result.success ? result.answer : `❌ ${result.error}`).setFooter({ text: result.success ? `${result.model} • ${result.tokens} tokens` : 'OpenAI' }).setTimestamp();
        await interaction.editReply({ embeds: [aiEmbed] });
        break;
      }
      case 'premium': {
        await interaction.deferReply();
        const embed = discordPremium.createPremiumStatusEmbed(interaction);
        const tier = discordPremium.getUserTier(interaction);
        if (tier !== 'empire') { const c = discordPremium.createComparisonEmbed(); await interaction.editReply({ embeds: [embed, ...c.embeds], components: c.components }); }
        else { await interaction.editReply({ embeds: [embed] }); }
        break;
      }
      case 'shop': {
        await interaction.deferReply();
        const shopData = discordPremium.createShopEmbed(interaction);
        await interaction.editReply(shopData);
        break;
      }
    }
  } catch (error) {
    console.error(`[DarEnergy] Error in /${commandName}:`, error.message);
    const reply = { content: '❌ Command failed: ' + error.message, ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
    else await interaction.reply(reply);
  }
});

// Discord Premium entitlement events
client.on('entitlementCreate', e => { discordPremium.handleEntitlementCreate(e); console.log(`[PREMIUM] New sub: ${e.userId}`); });
client.on('entitlementUpdate', (o, n) => { discordPremium.handleEntitlementUpdate(o, n); });
client.on('entitlementDelete', e => { discordPremium.handleEntitlementDelete(e); console.log(`[PREMIUM] Cancelled: ${e.userId}`); });

// Auto-reconnect
client.on('error', err => { console.error('[DarEnergy] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarEnergy] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarEnergy] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
