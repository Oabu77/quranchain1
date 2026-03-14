// ══════════════════════════════════════════════════════════════
// DarMedia Discord Bot
// DarMedia™ — Islamic Media, Broadcasting & Streaming
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
const meshRouter = new MeshRouter('darmedia');

client.once('ready', () => {
  console.log(`✓ DarMedia bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 8`);
  botIpc.startIpcServer('darmedia', meshRouter.getIpcHandlers());
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
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'darmedia'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'darmedia'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const MEDIA = {
      broadcast: { channels: 7, quranReciters: 120, languages: 15, live: true, quality: '4K HDR', storage: 'QuranChain immutable' },
      radio: { stations: 24, genres: ['Quran Recitation', 'Islamic Nasheeds', 'News & Talk', 'Education', 'Youth', 'Arabic Pop (Halal)'], podcasts: 180, listeners: '2.4M monthly' },
      streaming: { library: 15000, categories: ['Documentaries', 'Nasheeds', 'Islamic History', 'Quran Learning', 'Kids', 'Family Films'], quality: '4K UHD', offline: true },
      tv: { channels: 12, live: true, coverage: 'Global', satellites: ['Arabsat', 'Nilesat', 'Turksat', 'Astra'], iptv: true },
      news: { bureaus: 22, reporters: 180, languages: 8, updates: '24/7', focus: 'Islamic world affairs, halal economy, tech' },
      studios: { locations: 5, capacity: ['Film Studio', 'Sound Stage', 'Recording Studio', 'Post-Production', 'VFX Lab', 'Motion Capture'], staff: 340 }
    };
    
    switch (commandName) {
      case 'media-dashboard': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📺 DarMedia™ Network Dashboard')
          .addFields(
            { name: '📡 Broadcast Channels', value: MEDIA.broadcast.channels.toString(), inline: true },
            { name: '📻 Radio Stations', value: MEDIA.radio.stations.toString(), inline: true },
            { name: '🎬 Streaming Library', value: MEDIA.streaming.library.toLocaleString() + ' titles', inline: true },
            { name: '📺 TV Channels', value: MEDIA.tv.channels.toString(), inline: true },
            { name: '📰 News Bureaus', value: MEDIA.news.bureaus.toString(), inline: true },
            { name: '🎥 Studios', value: MEDIA.studios.locations + ' locations', inline: true },
          ).setFooter({ text: 'DarMedia™ — Islamic Content For The World' }).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-broadcast': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📡 QuranChain Broadcast™')
          .addFields(
            { name: 'Live Channels', value: MEDIA.broadcast.channels.toString(), inline: true },
            { name: 'Quran Reciters', value: MEDIA.broadcast.quranReciters.toString(), inline: true },
            { name: 'Languages', value: MEDIA.broadcast.languages.toString(), inline: true },
            { name: 'Quality', value: MEDIA.broadcast.quality, inline: true },
            { name: 'Storage', value: MEDIA.broadcast.storage },
          ).setFooter({ text: 'Quran preserved immutably on QuranChain™' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-radio': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📻 Dar Radio™')
          .addFields(
            { name: 'Stations', value: MEDIA.radio.stations.toString(), inline: true },
            { name: 'Podcasts', value: MEDIA.radio.podcasts.toString(), inline: true },
            { name: 'Listeners', value: MEDIA.radio.listeners, inline: true },
            { name: 'Genres', value: MEDIA.radio.genres.map(g => `• ${g}`).join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-streaming': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('🎬 Dar Streaming™')
          .addFields(
            { name: 'Library', value: MEDIA.streaming.library.toLocaleString() + ' titles', inline: true },
            { name: 'Quality', value: MEDIA.streaming.quality, inline: true },
            { name: 'Offline', value: MEDIA.streaming.offline ? 'Yes' : 'No', inline: true },
            { name: 'Categories', value: MEDIA.streaming.categories.map(c => `• ${c}`).join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-tv': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📺 Dar TV™ — Islamic Television')
          .addFields(
            { name: 'Channels', value: MEDIA.tv.channels.toString(), inline: true },
            { name: 'Coverage', value: MEDIA.tv.coverage, inline: true },
            { name: 'IPTV', value: MEDIA.tv.iptv ? 'Available' : 'No', inline: true },
            { name: 'Satellites', value: MEDIA.tv.satellites.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-news': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📰 Dar News™ — World News Service')
          .addFields(
            { name: 'Bureaus', value: MEDIA.news.bureaus.toString(), inline: true },
            { name: 'Reporters', value: MEDIA.news.reporters.toString(), inline: true },
            { name: 'Languages', value: MEDIA.news.languages.toString(), inline: true },
            { name: 'Coverage', value: MEDIA.news.updates, inline: true },
            { name: 'Focus', value: MEDIA.news.focus },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-studios': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('🎥 Dar Studios™ — Production')
          .addFields(
            { name: 'Locations', value: MEDIA.studios.locations.toString(), inline: true },
            { name: 'Staff', value: MEDIA.studios.staff.toString(), inline: true },
            { name: 'Facilities', value: MEDIA.studios.capacity.map(c => `• ${c}`).join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-help': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📺 DarMedia Commands')
          .setDescription(['/media-dashboard', '/media-broadcast', '/media-radio', '/media-streaming', '/media-tv', '/media-news', '/media-studios'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('darmedia-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'darmedia-bot', { userId: interaction.user.id });
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
    console.error(`[DarMedia] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[DarMedia] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarMedia] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarMedia] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
