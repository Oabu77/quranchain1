// ══════════════════════════════════════════════════════════════
// Dar Al-Nas Bank Discord Bot
// Dar Al-Nas™ — Full Islamic Banking & Treasury
// Part of DarCloud Empire — Omar Mohammad Abunadi
// ══════════════════════════════════════════════════════════════
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// ── Shared modules ──────────────────────────────────────────
const onboardingDb = require('../shared/onboarding-db');
const onboardingEngine = require('../shared/onboarding-engine');
const stripeIntegration = require('../shared/stripe-integration');
const botIpc = require('../shared/bot-ipc');
const masjidFinder = require('../shared/masjid-finder');
const { MeshRouter } = require('../shared/mesh-router');
const openaiAgents = require('../shared/openai-agents');
const discordPremium = require('../shared/discord-premium');
const meshRouter = new MeshRouter('darnas');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const API = process.env.API_BASE || 'http://localhost:8787';

client.once('ready', () => {
  console.log(`✓ Dar Al-Nas Bank bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 10 + onboarding`);

  // Start IPC server + mesh routing
  const meshHandlers = meshRouter.getIpcHandlers();
  botIpc.startIpcServer("darnas", {
    "/open-account": async (req, body) => {
      onboardingDb.getOrCreateMember(body.discord_id, body.discord_tag);
      onboardingDb.provisionService(body.discord_id, "DarNas Banking", "banking", { type: body.account_type || "checking" });
      return { success: true, account_type: body.account_type || "checking" };
    },
    ...meshHandlers,
  });
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
    try {
      const handled = await onboardingEngine.handleOnboardingInteraction(interaction, "darnas");
      if (handled) return;
    } catch (err) { console.error(`Onboarding interaction error: ${err.message}`); }
  }

  if (!interaction.isChatInputCommand()) return;

  // Handle shared onboarding commands
  const onboardCmds = ["onboard", "dashboard", "referral", "services", "subscribe"];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, "darnas"); } catch (err) {
      console.error(`[${interaction.commandName}] ${err.message}`);
    }
    return;
  }

  const commandName = interaction.commandName;
  
  try {
    
    const SERVICES = {
      accounts: { checking: { fee: '$0', min: '$0', apy: '0%' }, savings: { type: 'Mudarabah', apy: '4.2%', shariah: true }, business: { type: 'Musharakah', credit: 'up to $500K' } },
      treasury: { aum: '$2.4B', funds: ['DarCapital Halal VC Fund', 'DarWealth Growth Fund', 'DarSukuk Bond Fund', 'DarWaqf Endowment'], performance: '+18.7% YTD' },
      merchant: { terminals: 12400, online: true, settlement: '< 24h', fees: '1.9% + $0.25', halal: 'certified' },
      investments: { assets: ['Halal Stocks', 'Sukuk Bonds', 'Real Estate', 'Commodities', 'Private Equity'], screening: 'AI-powered Shariah screening', minInvestment: '$100' },
      remittance: { corridors: 57, networks: 'OIC Nations', speed: '< 1 hour', fee: '0.5%', compliance: 'Full AML/KYC' },
      credit: { scoring: 'Islamic Credit Bureau', factors: ['Payment History', 'Riba-Free Score', 'Community Trust', 'Zakat Compliance'], range: '300-850' },
      mortgage: { type: 'Murabaha / Musharakah', down: '$5,000', approval: 'Auto', riba: '0%', markets: 31, program: 'DarMortgage Zero-Riba Home Finance' },
      exchange: { pairs: ['BTC/USD', 'ETH/USD', 'QRN/USD', 'Gold/USD'], type: 'Shariah-compliant', screening: 'Automated halal coin screening', products: ['Spot', 'Murabaha Forward', 'Islamic Options'] }
    };
    
    switch (commandName) {
      case 'bank-dashboard': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🏦 Dar Al-Nas™ Banking Dashboard')
          .setDescription('Full Islamic Banking — Zero Riba, Full Shariah Compliance')
          .addFields(
            { name: '💰 Treasury AUM', value: SERVICES.treasury.aum, inline: true },
            { name: '📊 YTD Performance', value: SERVICES.treasury.performance, inline: true },
            { name: '🏪 Merchant Terminals', value: SERVICES.merchant.terminals.toLocaleString(), inline: true },
            { name: '🌍 Remittance Corridors', value: SERVICES.remittance.corridors + ' OIC Nations', inline: true },
            { name: '🏠 Mortgage Markets', value: SERVICES.mortgage.markets + ' USA Cities', inline: true },
            { name: '💱 Exchange Pairs', value: SERVICES.exchange.pairs.length + ' active', inline: true },
            { name: '📋 Account Types', value: '• Checking (\$0 fees)\n• Savings (4.2% APY Mudarabah)\n• Business (Musharakah)', inline: false },
          ).setFooter({ text: 'Dar Al-Nas Bank™ — Banking Without Riba' }).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-accounts': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('💳 Dar Al-Nas Account Types')
          .addFields(
            { name: '🟢 Checking Account', value: '• Fee: \$0\n• Minimum: \$0\n• Debit Card: Halal Card™\n• ATM: Free worldwide', inline: true },
            { name: '🟡 Savings Account', value: '• Type: Mudarabah Profit-Sharing\n• APY: 4.2%\n• Shariah Certified\n• No lock-in period', inline: true },
            { name: '🔵 Business Account', value: '• Type: Musharakah Partnership\n• Credit: Up to \$500K\n• Merchant POS included\n• API access', inline: true },
          ).setFooter({ text: 'All accounts are 100% Riba-free and Shariah-certified' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-treasury': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🏛️ DarTreasury & Capital')
          .addFields(
            { name: 'AUM', value: SERVICES.treasury.aum, inline: true },
            { name: 'Performance', value: SERVICES.treasury.performance, inline: true },
            { name: '📊 Funds', value: SERVICES.treasury.funds.map((f,i) => `${i+1}. ${f}`).join('\n') },
          ).setFooter({ text: 'DarCapital™ — Halal Venture Capital' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-merchant': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🏪 Merchant Services')
          .addFields(
            { name: 'Active Terminals', value: SERVICES.merchant.terminals.toLocaleString(), inline: true },
            { name: 'Settlement', value: SERVICES.merchant.settlement, inline: true },
            { name: 'Fee', value: SERVICES.merchant.fees, inline: true },
            { name: 'Features', value: '• POS Terminal\n• Online Payment Gateway\n• Mobile Payments\n• QR Code Payments\n• Halal Certified Processing' },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-investments': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('📈 Investment Products')
          .addFields(
            { name: 'Asset Classes', value: SERVICES.investments.assets.map(a => `• ${a}`).join('\n') },
            { name: 'Screening', value: SERVICES.investments.screening, inline: true },
            { name: 'Min Investment', value: SERVICES.investments.minInvestment, inline: true },
          ).setFooter({ text: 'All investments screened for Shariah compliance' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-remittance': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🌍 DarRemit — Cross-Border Transfers')
          .addFields(
            { name: 'Corridors', value: SERVICES.remittance.corridors + ' OIC Nations', inline: true },
            { name: 'Speed', value: SERVICES.remittance.speed, inline: true },
            { name: 'Fee', value: SERVICES.remittance.fee, inline: true },
            { name: 'Compliance', value: SERVICES.remittance.compliance, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-credit': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('📊 DarCredit — Islamic Credit Bureau')
          .addFields(
            { name: 'Score Range', value: SERVICES.credit.range, inline: true },
            { name: 'Scoring Factors', value: SERVICES.credit.factors.map(f => `• ${f}`).join('\n') },
          ).setFooter({ text: 'Riba-free credit scoring — ethical by design' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-mortgage': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🏠 DarMortgage — Zero-Riba Home Finance')
          .addFields(
            { name: 'Program', value: SERVICES.mortgage.program },
            { name: 'Type', value: SERVICES.mortgage.type, inline: true },
            { name: 'Down Payment', value: SERVICES.mortgage.down, inline: true },
            { name: 'Riba', value: SERVICES.mortgage.riba, inline: true },
            { name: 'Approval', value: SERVICES.mortgage.approval, inline: true },
            { name: 'Markets', value: SERVICES.mortgage.markets + ' USA cities', inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-exchange': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('💱 DarExchange — Shariah-Compliant Trading')
          .addFields(
            { name: 'Pairs', value: SERVICES.exchange.pairs.map(p => `• ${p}`).join('\n'), inline: true },
            { name: 'Products', value: SERVICES.exchange.products.map(p => `• ${p}`).join('\n'), inline: true },
            { name: 'Screening', value: SERVICES.exchange.screening },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-help': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🏦 Dar Al-Nas Bank Commands')
          .setDescription(['/bank-dashboard', '/bank-accounts', '/bank-treasury', '/bank-merchant', '/bank-investments', '/bank-remittance', '/bank-credit', '/bank-mortgage', '/bank-exchange', '/masjid', '/prayer', '/qibla'].map(c => `\`${c}\``).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'masjid': {
        await interaction.deferReply();
        const location = interaction.options.getString('location');
        const radius = interaction.options.getInteger('radius') || 10;
        const geo = await masjidFinder.geocode(location);
        if (!geo) { await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('❌ Location Not Found').setDescription(`Could not find "${location}".`)] }); break; }
        const mosques = await masjidFinder.findMosquesNearby(geo.lat, geo.lon, radius, 10);
        const qibla = masjidFinder.getQiblaDirection(geo.lat, geo.lon);
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle(`🕌 Mosques Near ${location}`)
          .setDescription(`**${mosques.length}** mosques within ${radius}km\n🧭 **Qibla:** ${qibla.bearing}° ${qibla.compass} | ${qibla.distToKaaba} km to Makkah\n\n` + masjidFinder.formatMosqueList(mosques) + masjidFinder.getSignupCTA())
          .setFooter({ text: 'Dar Al-Nas™ Masjid Finder — Powered by DarCloud' }).setTimestamp();
        await interaction.editReply({ embeds: [embed] }); break;
      }
      case 'prayer': {
        await interaction.deferReply();
        const location = interaction.options.getString('location');
        const geo = await masjidFinder.geocode(location);
        if (!geo) { await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('❌ Location Not Found').setDescription(`Could not find "${location}".`)] }); break; }
        const times = await masjidFinder.getPrayerTimes(geo.lat, geo.lon);
        const qibla = masjidFinder.getQiblaDirection(geo.lat, geo.lon);
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle(`🕐 Prayer Times — ${location}`)
          .setDescription(`📅 **${times.date}** | 🌙 **${times.hijri}**\n🧭 Qibla: **${qibla.bearing}° ${qibla.compass}**`)
          .addFields(
            { name: '🌅 Fajr', value: times.fajr, inline: true }, { name: '☀️ Sunrise', value: times.sunrise, inline: true },
            { name: '🕐 Dhuhr', value: times.dhuhr, inline: true }, { name: '🌤️ Asr', value: times.asr, inline: true },
            { name: '🌅 Maghrib', value: times.maghrib, inline: true }, { name: '🌙 Isha', value: times.isha, inline: true },
          ).setFooter({ text: `Method: ${times.method} | Dar Al-Nas™ — DarCloud Empire` }).setTimestamp();
        await interaction.editReply({ embeds: [embed] }); break;
      }
      case 'qibla': {
        await interaction.deferReply();
        const location = interaction.options.getString('location');
        const geo = await masjidFinder.geocode(location);
        if (!geo) { await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('❌ Location Not Found').setDescription(`Could not find "${location}".`)] }); break; }
        const qibla = masjidFinder.getQiblaDirection(geo.lat, geo.lon);
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle(`🧭 Qibla Direction — ${location}`)
          .setDescription(`📍 From: ${geo.displayName.split(',').slice(0,3).join(',')}\n🕋 To: Al-Masjid al-Haram, Makkah\n\n🧭 **Direction: ${qibla.bearing}° ${qibla.compass}**\n📏 **Distance: ${qibla.distToKaaba.toLocaleString()} km**`)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] }); break;
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('darnas-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'darnas-bot', { userId: interaction.user.id });
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
    console.error(`[Dar Al-Nas Bank] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[Dar Al-Nas Bank] Client error:', err.message); });
client.on('shardError', err => { console.error('[Dar Al-Nas Bank] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[Dar Al-Nas Bank] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
