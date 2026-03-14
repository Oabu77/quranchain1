// ══════════════════════════════════════════════════════════════
// DarCommerce Discord Bot
// DarCommerce™ — Halal Marketplace, Food, Travel & Lifestyle
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
const meshRouter = new MeshRouter('darcommerce');

client.once('ready', () => {
  console.log(`✓ DarCommerce bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 9`);
  botIpc.startIpcServer('darcommerce', meshRouter.getIpcHandlers());
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
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'darcommerce'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'darcommerce'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const COMMERCE = {
      marketplace: { sellers: 24000, products: 890000, categories: ['Electronics', 'Clothing', 'Food', 'Beauty', 'Home', 'Books', 'Health', 'Toys'], halal: '100% verified', payments: 'DarPay / Halal Card' },
      food: { suppliers: 3400, certifications: ['USDA Organic', 'Halal Certified', 'Non-GMO'], delivery: 'Same day', cities: 31, products: ['Fresh Meat', 'Groceries', 'Prepared Meals', 'Snacks', 'Beverages'] },
      travel: { destinations: 120, hotels: 8500, flights: true, hajj: true, umrah: true, packages: ['Hajj Premium', 'Umrah Standard', 'Family Vacation', 'Business Travel'], halalHotels: 'Alcohol-free, prayer facilities' },
      fashion: { brands: 450, items: 120000, categories: ['Abayas', 'Thobes', 'Hijabs', 'Modest Dresses', 'Activewear', 'Kids'], designers: 180 },
      restaurants: { locations: 680, cuisines: ['Arabic', 'Turkish', 'Pakistani', 'Malaysian', 'Mediterranean', 'American Halal'], delivery: 'DarLogistics', rating: '4.7/5' },
      logistics: { warehouses: 12, coverage: '48 US states', sameDay: true, international: '57 OIC nations', tracking: 'Real-time GPS' },
      gaming: { games: 45, genres: ['Education', 'Adventure', 'Strategy', 'Quran Quiz', 'History', 'Puzzle'], players: 340000, platform: 'Web, iOS, Android' }
    };
    
    switch (commandName) {
      case 'shop-dashboard': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🛒 DarCommerce™ Dashboard')
          .addFields(
            { name: '🏪 Sellers', value: COMMERCE.marketplace.sellers.toLocaleString(), inline: true },
            { name: '📦 Products', value: COMMERCE.marketplace.products.toLocaleString(), inline: true },
            { name: '🍖 Food Suppliers', value: COMMERCE.food.suppliers.toLocaleString(), inline: true },
            { name: '✈️ Destinations', value: COMMERCE.travel.destinations.toString(), inline: true },
            { name: '👗 Fashion Brands', value: COMMERCE.fashion.brands.toString(), inline: true },
            { name: '🍽️ Restaurants', value: COMMERCE.restaurants.locations.toString(), inline: true },
            { name: '🎮 Games', value: COMMERCE.gaming.games.toString(), inline: true },
            { name: '📦 Warehouses', value: COMMERCE.logistics.warehouses.toString(), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-marketplace': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🏪 DarCommerce Marketplace')
          .addFields(
            { name: 'Sellers', value: COMMERCE.marketplace.sellers.toLocaleString(), inline: true },
            { name: 'Products', value: COMMERCE.marketplace.products.toLocaleString(), inline: true },
            { name: 'Categories', value: COMMERCE.marketplace.categories.join(', ') },
            { name: 'Payment', value: COMMERCE.marketplace.payments },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-food': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🍖 DarFood™ & DarFresh™')
          .addFields(
            { name: 'Suppliers', value: COMMERCE.food.suppliers.toLocaleString(), inline: true },
            { name: 'Delivery', value: COMMERCE.food.delivery, inline: true },
            { name: 'Cities', value: COMMERCE.food.cities.toString(), inline: true },
            { name: 'Products', value: COMMERCE.food.products.join(', ') },
            { name: 'Certifications', value: COMMERCE.food.certifications.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-travel': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('✈️ DarTravel™ — Halal Tourism')
          .addFields(
            { name: 'Destinations', value: COMMERCE.travel.destinations.toString(), inline: true },
            { name: 'Hotels', value: COMMERCE.travel.hotels.toLocaleString(), inline: true },
            { name: 'Hajj/Umrah', value: 'Available ✓', inline: true },
            { name: 'Packages', value: COMMERCE.travel.packages.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-fashion': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('👗 DarFashion™ — Modest Fashion')
          .addFields(
            { name: 'Brands', value: COMMERCE.fashion.brands.toString(), inline: true },
            { name: 'Items', value: COMMERCE.fashion.items.toLocaleString(), inline: true },
            { name: 'Designers', value: COMMERCE.fashion.designers.toString(), inline: true },
            { name: 'Categories', value: COMMERCE.fashion.categories.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-restaurants': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🍽️ Dar Restaurants™')
          .addFields(
            { name: 'Locations', value: COMMERCE.restaurants.locations.toString(), inline: true },
            { name: 'Rating', value: COMMERCE.restaurants.rating, inline: true },
            { name: 'Delivery', value: COMMERCE.restaurants.delivery, inline: true },
            { name: 'Cuisines', value: COMMERCE.restaurants.cuisines.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-logistics': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('📦 DarLogistics™')
          .addFields(
            { name: 'Warehouses', value: COMMERCE.logistics.warehouses.toString(), inline: true },
            { name: 'Coverage', value: COMMERCE.logistics.coverage, inline: true },
            { name: 'Same Day', value: COMMERCE.logistics.sameDay ? 'Yes' : 'No', inline: true },
            { name: 'International', value: COMMERCE.logistics.international },
            { name: 'Tracking', value: COMMERCE.logistics.tracking },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-gaming': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🎮 DarGaming™')
          .addFields(
            { name: 'Games', value: COMMERCE.gaming.games.toString(), inline: true },
            { name: 'Players', value: COMMERCE.gaming.players.toLocaleString(), inline: true },
            { name: 'Platform', value: COMMERCE.gaming.platform, inline: true },
            { name: 'Genres', value: COMMERCE.gaming.genres.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-help': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🛒 DarCommerce Commands')
          .setDescription(['/shop-dashboard', '/shop-marketplace', '/shop-food', '/shop-travel', '/shop-fashion', '/shop-restaurants', '/shop-logistics', '/shop-gaming'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('darcommerce-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'darcommerce-bot', { userId: interaction.user.id });
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
client.on('error', err => { console.error('[DarCommerce] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarCommerce] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarCommerce] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
