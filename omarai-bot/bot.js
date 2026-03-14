// ══════════════════════════════════════════════════════════════
// Omar AI Discord Bot
// Omar AI™ — AMĀN Control Plane & Sovereign Vision Layer
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
const meshRouter = new MeshRouter('omarai');

client.once('ready', () => {
  console.log(`✓ Omar AI bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 9`);
  botIpc.startIpcServer('omarai', meshRouter.getIpcHandlers());
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
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'omarai'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'omarai'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const EMPIRE = {
      founder: 'Omar Mohammad Abunadi',
      companies: 101, tiers: 6,
      tierBreakdown: { 'Tier 1 — Core Platform': 10, 'Tier 2 — Islamic Finance': 20, 'Tier 3 — AI & Technology': 20, 'Tier 4 — Halal Lifestyle': 15, 'Tier 5 — Blockchain & DeFi': 15, 'Tier 6 — International': 21 },
      aiAgents: 66, assistants: 12, blockchains: 47, meshNodes: 340000,
      revenueSplit: { founder: '30%', aiValidators: '40%', hardware: '10%', ecosystem: '18%', zakat: '2%' },
      regions: ['USA (HQ)', 'UAE DIFC', 'UK', 'Malaysia', 'Saudi Arabia', 'Turkey', 'Egypt', 'Pakistan', 'Indonesia', 'Bangladesh', 'Nigeria', 'Jordan', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Morocco', 'Tunisia', 'Singapore', 'Canada', 'Germany'],
      bots: ['DarCloud#8658', 'QuranChain#8518', 'FungiMesh', 'MeshTalk', 'AI Fleet', 'HWC', 'DarLaw', 'DarPay', 'Dar Al-Nas Bank', 'DarHealth', 'DarMedia', 'DarRealty', 'DarCommerce', 'DarTrade', 'DarEdu', 'DarEnergy', 'DarSecurity', 'DarTransport', 'DarTelecom', 'Omar AI', 'DarDefi', 'DarHR']
    };
    
    switch (commandName) {
      case 'omar-status': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('👑 AMĀN Control Plane™ — System Status')
          .setDescription(`\`\`\`\nFOUNDER: ${EMPIRE.founder}\nSTATUS: SOVEREIGN ACTIVE\nCOMPANIES: ${EMPIRE.companies} across ${EMPIRE.tiers} tiers\nAI AGENTS: ${EMPIRE.aiAgents} + ${EMPIRE.assistants} GPT-4o\nBLOCKCHAINS: ${EMPIRE.blockchains} live networks\nMESH NODES: ${EMPIRE.meshNodes.toLocaleString()}\nREGIONS: ${EMPIRE.regions.length} international offices\n\`\`\``)
          .setFooter({ text: 'AMĀN Control Plane™ — Sovereign Vision Layer' }).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-empire': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('🏛️ DarCloud Empire — Full Overview')
          .addFields(
            ...Object.entries(EMPIRE.tierBreakdown).map(([tier, count]) => ({ name: tier, value: count + ' companies', inline: true }))
          ).setFooter({ text: `Total: ${EMPIRE.companies} companies across ${EMPIRE.tiers} tiers` });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-ai-core': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('🤖 Omar AI™ & QuranChain AI™')
          .addFields(
            { name: 'Omar AI™', value: 'Primary sovereign AI validator\nRole: Executive intelligence & orchestration\nStatus: ACTIVE', inline: true },
            { name: 'QuranChain AI™', value: 'Blockchain consensus validator\nRole: Policy engine & Shariah logic\nStatus: ACTIVE', inline: true },
            { name: 'Total Fleet', value: `${EMPIRE.aiAgents} AI agents + ${EMPIRE.assistants} GPT-4o assistants`, inline: false },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-revenue': {
        const split = EMPIRE.revenueSplit;
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('💰 Revenue Distribution (IMMUTABLE)')
          .addFields(
            { name: '👑 Founder Royalty', value: split.founder, inline: true },
            { name: '🤖 AI Validators', value: split.aiValidators, inline: true },
            { name: '🖥️ Hardware/Hosts', value: split.hardware, inline: true },
            { name: '🌐 Ecosystem Fund', value: split.ecosystem, inline: true },
            { name: '🕌 Zakat', value: split.zakat, inline: true },
          ).setFooter({ text: 'Revenue split is immutable — hardcoded into all smart contracts' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-governance': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('⚖️ Governance Layer')
          .addFields(
            { name: 'Policy Engine', value: 'QuranChain AI™ — automated Shariah compliance' },
            { name: 'Identity System', value: 'DarIdentity™ — Decentralized KYC/DID' },
            { name: 'Legal Framework', value: '11 DarLaw AI agents — 50+ jurisdictions' },
            { name: 'Shariah Board', value: 'DarShariah™ Compliance Board — certified scholars' },
            { name: 'Audit', value: 'Real-time on-chain audit trail — immutable' },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-regions': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('🌍 International Operations — ' + EMPIRE.regions.length + ' Offices')
          .setDescription(EMPIRE.regions.map((r, i) => `${i+1}. ${r}`).join('\n'));
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-founder': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('👑 Founder Console™ — Executive Dashboard')
          .setDescription(`**Founder:** ${EMPIRE.founder}`)
          .addFields(
            { name: '🏢 Companies', value: EMPIRE.companies.toString(), inline: true },
            { name: '🤖 AI Agents', value: EMPIRE.aiAgents.toString(), inline: true },
            { name: '⛓️ Blockchains', value: EMPIRE.blockchains.toString(), inline: true },
            { name: '🌐 Mesh Nodes', value: EMPIRE.meshNodes.toLocaleString(), inline: true },
            { name: '🌍 Regions', value: EMPIRE.regions.length.toString(), inline: true },
            { name: '🤖 Discord Bots', value: EMPIRE.bots.length.toString(), inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-bots': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('🤖 All Active Discord Bots')
          .setDescription(EMPIRE.bots.map((b, i) => `${i+1}. **${b}**`).join('\n'))
          .setFooter({ text: EMPIRE.bots.length + ' bots across the DarCloud Empire' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-help': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('👑 Omar AI Commands')
          .setDescription(['/omar-status', '/omar-empire', '/omar-ai-core', '/omar-revenue', '/omar-governance', '/omar-regions', '/omar-founder', '/omar-bots'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('omarai-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'omarai-bot', { userId: interaction.user.id });
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
    console.error(`[Omar AI] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[Omar AI] Client error:', err.message); });
client.on('shardError', err => { console.error('[Omar AI] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[Omar AI] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
