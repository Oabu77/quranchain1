// ══════════════════════════════════════════════════════════════
// DarRealty Discord Bot
// Dar Realty™ — Real Estate, Smart Cities & Construction
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
const meshRouter = new MeshRouter('darrealty');

client.once('ready', () => {
  console.log(`✓ DarRealty bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 8`);
  botIpc.startIpcServer('darrealty', meshRouter.getIpcHandlers());
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
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'darrealty'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'darrealty'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const REALTY = {
      residential: { markets: 31, listings: 4200, avgPrice: '$285,000', program: 'DarMortgage Zero-Riba', down: '$5,000', approval: 'Auto', cities: ['Dallas TX','Houston TX','Chicago IL','Detroit MI','Atlanta GA','Philadelphia PA','Northern VA','Columbus OH','Indianapolis IN','Memphis TN','Milwaukee WI','Minneapolis MN','St Louis MO','Raleigh NC','Tampa FL','Orlando FL','Jacksonville FL','Nashville TN','Kansas City MO','Oklahoma City OK','Louisville KY','Richmond VA','Charlotte NC','San Antonio TX','Austin TX','Baltimore MD','Dearborn MI','Patterson NJ','Brooklyn NY','Jersey City NJ','Bridgeview IL'] },
      commercial: { properties: 340, sqft: '8.2M', occupancy: '94%', types: ['Office', 'Retail', 'Medical', 'Warehouse', 'Mixed-Use'] },
      smartCities: { projects: 3, planned: ['Dar Al Nas Community TX', 'Dar Heights MI', 'Dar Gardens GA'], features: ['Solar Power', 'EV Charging', 'Fiber Internet', 'Masjid', 'Halal Market', 'Islamic School', 'Community Center', 'Parks'] },
      construction: { active: 18, completed: 47, value: '$890M', type: 'Istisna milestone-based' },
      propertyMgmt: { units: 12400, occupancy: '96%', maintenance: '24/7', portal: 'Online tenant portal' },
      tokenized: { assets: 24, totalValue: '$180M', chain: 'QuranChain', minInvestment: '$100', holders: 8400 }
    };
    
    switch (commandName) {
      case 'realty-dashboard': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏗️ DarRealty™ Portfolio Dashboard')
          .addFields(
            { name: '🏠 Residential', value: REALTY.residential.listings.toLocaleString() + ' listings', inline: true },
            { name: '🏢 Commercial', value: REALTY.commercial.properties + ' properties', inline: true },
            { name: '🌆 Smart Cities', value: REALTY.smartCities.projects + ' projects', inline: true },
            { name: '🏗️ Construction', value: REALTY.construction.active + ' active', inline: true },
            { name: '🏘️ Managed Units', value: REALTY.propertyMgmt.units.toLocaleString(), inline: true },
            { name: '🔗 Tokenized', value: '$' + (REALTY.tokenized.totalValue), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-residential': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏠 Dar Al Nas Real Estate™')
          .addFields(
            { name: 'Markets', value: REALTY.residential.markets + ' USA cities', inline: true },
            { name: 'Listings', value: REALTY.residential.listings.toLocaleString(), inline: true },
            { name: 'Avg Price', value: REALTY.residential.avgPrice, inline: true },
            { name: 'Program', value: REALTY.residential.program },
            { name: 'Down Payment', value: REALTY.residential.down + ' = Auto-Approved', inline: true },
            { name: 'Top Cities', value: REALTY.residential.cities.slice(0,10).join(', ') + '...' },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-commercial': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏢 DarProperty™ Commercial')
          .addFields(
            { name: 'Properties', value: REALTY.commercial.properties.toString(), inline: true },
            { name: 'Total SqFt', value: REALTY.commercial.sqft, inline: true },
            { name: 'Occupancy', value: REALTY.commercial.occupancy, inline: true },
            { name: 'Types', value: REALTY.commercial.types.map(t => `• ${t}`).join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-smartcities': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🌆 Smart Cities Projects')
          .addFields(
            { name: 'Planned Communities', value: REALTY.smartCities.planned.map(p => `• ${p}`).join('\n') },
            { name: 'Features', value: REALTY.smartCities.features.map(f => `• ${f}`).join('\n') },
          ).setFooter({ text: 'Complete Islamic community lifestyle' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-construction': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏗️ Construction & Development')
          .addFields(
            { name: 'Active Projects', value: REALTY.construction.active.toString(), inline: true },
            { name: 'Completed', value: REALTY.construction.completed.toString(), inline: true },
            { name: 'Total Value', value: REALTY.construction.value, inline: true },
            { name: 'Finance Type', value: REALTY.construction.type },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-property-mgmt': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏘️ Property Management')
          .addFields(
            { name: 'Managed Units', value: REALTY.propertyMgmt.units.toLocaleString(), inline: true },
            { name: 'Occupancy', value: REALTY.propertyMgmt.occupancy, inline: true },
            { name: 'Maintenance', value: REALTY.propertyMgmt.maintenance, inline: true },
            { name: 'Tenant Portal', value: REALTY.propertyMgmt.portal },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-tokenized': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🔗 DarTokenize™ — On-Chain Real Estate')
          .addFields(
            { name: 'Tokenized Assets', value: REALTY.tokenized.assets.toString(), inline: true },
            { name: 'Total Value', value: REALTY.tokenized.totalValue, inline: true },
            { name: 'Min Investment', value: REALTY.tokenized.minInvestment, inline: true },
            { name: 'Blockchain', value: REALTY.tokenized.chain, inline: true },
            { name: 'Token Holders', value: REALTY.tokenized.holders.toLocaleString(), inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-help': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏗️ DarRealty Commands')
          .setDescription(['/realty-dashboard', '/realty-residential', '/realty-commercial', '/realty-smartcities', '/realty-construction', '/realty-property-mgmt', '/realty-tokenized'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('darrealty-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'darrealty-bot', { userId: interaction.user.id });
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
    console.error(`[DarRealty] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[DarRealty] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarRealty] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarRealty] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
