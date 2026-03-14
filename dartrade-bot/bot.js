// ══════════════════════════════════════════════════════════════
// DarTrade Discord Bot
// DarTrade™ — Global Trade, Logistics & Import/Export
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
const meshRouter = new MeshRouter('dartrade');

client.once('ready', () => {
  console.log(`✓ DarTrade bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 7`);
  botIpc.startIpcServer('dartrade', meshRouter.getIpcHandlers());
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
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'dartrade'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'dartrade'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const TRADE = {
      operations: { corridors: 57, countries: 'OIC + EU + ASEAN', volume: '$4.2B annual', vessels: 24, aircraft: 8, trucks: 340 },
      import: { categories: ['Electronics', 'Textiles', 'Food & Agriculture', 'Machinery', 'Raw Materials', 'Pharmaceuticals'], clearance: '< 48 hours', tariff: 'AI-optimized', compliance: 'Full WTO/WCO' },
      shipping: { vessels: 24, ports: 45, containerCapacity: '180K TEU', routes: ['Middle East ↔ USA', 'Asia ↔ Europe', 'Africa ↔ Americas', 'Intra-OIC'], tracking: 'Real-time satellite' },
      freight: { trucks: 340, warehouses: 18, coverage: '48 US states + Canada', sameDay: true, cold: 'Cold chain available', hazmat: false },
      customs: { clearance: '< 48 hours', ai: 'AI classification', docs: 'Automated', compliance: ['WTO', 'WCO', 'C-TPAT', 'AEO'], languages: 8 },
      global: { offices: 22, markets: 57, partnerships: 180, ftz: 8, specialization: 'Halal trade certification & routing' }
    };
    
    switch (commandName) {
      case 'trade-dashboard': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('🚢 DarTrade™ Global Operations')
          .addFields(
            { name: '🌍 Corridors', value: TRADE.operations.corridors.toString(), inline: true },
            { name: '💰 Annual Volume', value: TRADE.operations.volume, inline: true },
            { name: '🚢 Vessels', value: TRADE.operations.vessels.toString(), inline: true },
            { name: '✈️ Aircraft', value: TRADE.operations.aircraft.toString(), inline: true },
            { name: '🚛 Trucks', value: TRADE.operations.trucks.toString(), inline: true },
            { name: '📦 Ports', value: TRADE.shipping.ports.toString(), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-import': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('📋 Import/Export Operations')
          .addFields(
            { name: 'Categories', value: TRADE.import.categories.join(', ') },
            { name: 'Clearance', value: TRADE.import.clearance, inline: true },
            { name: 'Tariff', value: TRADE.import.tariff, inline: true },
            { name: 'Compliance', value: TRADE.import.compliance, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-shipping': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('🚢 Dar Shipping™')
          .addFields(
            { name: 'Vessels', value: TRADE.shipping.vessels.toString(), inline: true },
            { name: 'Ports', value: TRADE.shipping.ports.toString(), inline: true },
            { name: 'Capacity', value: TRADE.shipping.containerCapacity, inline: true },
            { name: 'Routes', value: TRADE.shipping.routes.join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-freight': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('🚛 Dar Freight™')
          .addFields(
            { name: 'Trucks', value: TRADE.freight.trucks.toString(), inline: true },
            { name: 'Warehouses', value: TRADE.freight.warehouses.toString(), inline: true },
            { name: 'Coverage', value: TRADE.freight.coverage, inline: true },
            { name: 'Cold Chain', value: TRADE.freight.cold },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-customs': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('📑 Customs & Compliance')
          .addFields(
            { name: 'Clearance Time', value: TRADE.customs.clearance, inline: true },
            { name: 'Classification', value: TRADE.customs.ai, inline: true },
            { name: 'Documentation', value: TRADE.customs.docs, inline: true },
            { name: 'Certifications', value: TRADE.customs.compliance.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-global': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('🌍 Dar Global Trade™')
          .addFields(
            { name: 'Offices', value: TRADE.global.offices.toString(), inline: true },
            { name: 'Markets', value: TRADE.global.markets.toString(), inline: true },
            { name: 'Partnerships', value: TRADE.global.partnerships.toString(), inline: true },
            { name: 'Free Trade Zones', value: TRADE.global.ftz.toString(), inline: true },
            { name: 'Specialization', value: TRADE.global.specialization },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-help': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('🚢 DarTrade Commands')
          .setDescription(['/trade-dashboard', '/trade-import', '/trade-shipping', '/trade-freight', '/trade-customs', '/trade-global'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('dartrade-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'dartrade-bot', { userId: interaction.user.id });
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
    console.error(`[DarTrade] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[DarTrade] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarTrade] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarTrade] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
