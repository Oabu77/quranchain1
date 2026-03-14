// ══════════════════════════════════════════════════════════════
// DarTransport Discord Bot
// DarTransport™ — Aviation, Airlines & Ground Transport
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
const meshRouter = new MeshRouter('dartransport');

client.once('ready', () => {
  console.log(`✓ DarTransport bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 8`);
  botIpc.startIpcServer('dartransport', meshRouter.getIpcHandlers());
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
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'dartransport'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'dartransport'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const TRANSPORT = {
      oliveair: { aircraft: 48, routes: 120, passengers: '8.4M annual', hubs: ['Dallas DFW', 'Dubai DXB', 'Istanbul IST', 'Kuala Lumpur KUL'], onTime: '94%', halal: 'Full halal meals, prayer space', class: ['Economy', 'Business', 'First'] },
      cargo: { freighters: 12, capacity: '240K tons/year', routes: 85, warehouses: 8, express: '< 24 hours', cold: true, hazmat: 'Certified' },
      darairlines: { aircraft: 24, routes: 65, focus: 'OIC Regional', passengers: '3.2M annual', hubs: ['Jeddah JED', 'Cairo CAI', 'Karachi KHI'] },
      ground: { vehicles: 1200, types: ['Bus', 'Shuttle', 'Limousine', 'Truck', 'Van'], cities: 45, rideshare: true, electric: '40% fleet', app: 'DarRide™' },
      fleet: { totalAircraft: 84, totalVehicles: 1200, newest: 'Boeing 787-9 Dreamliner', avgAge: '4.2 years', maintenance: 'FAA Part 145' }
    };
    
    switch (commandName) {
      case 'fly-dashboard': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('✈️ DarTransport™ Operations Dashboard')
          .addFields(
            { name: '✈️ OliveAir Passengers', value: TRANSPORT.oliveair.passengers, inline: true },
            { name: '📦 Cargo Capacity', value: TRANSPORT.cargo.capacity, inline: true },
            { name: '🛫 Dar Airlines Pax', value: TRANSPORT.darairlines.passengers, inline: true },
            { name: '🚌 Ground Vehicles', value: TRANSPORT.ground.vehicles.toLocaleString(), inline: true },
            { name: '✈️ Total Aircraft', value: TRANSPORT.fleet.totalAircraft.toString(), inline: true },
            { name: '⏱️ On-Time', value: TRANSPORT.oliveair.onTime, inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-oliveair': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('✈️ OliveAir™ — Passenger Airline')
          .addFields(
            { name: 'Aircraft', value: TRANSPORT.oliveair.aircraft.toString(), inline: true },
            { name: 'Routes', value: TRANSPORT.oliveair.routes.toString(), inline: true },
            { name: 'Passengers', value: TRANSPORT.oliveair.passengers, inline: true },
            { name: 'On-Time', value: TRANSPORT.oliveair.onTime, inline: true },
            { name: 'Hubs', value: TRANSPORT.oliveair.hubs.join('\n') },
            { name: 'Classes', value: TRANSPORT.oliveair.class.join(', ') },
            { name: 'Halal', value: TRANSPORT.oliveair.halal },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-cargo': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('📦 OliveAir Cargo™')
          .addFields(
            { name: 'Freighters', value: TRANSPORT.cargo.freighters.toString(), inline: true },
            { name: 'Capacity', value: TRANSPORT.cargo.capacity, inline: true },
            { name: 'Routes', value: TRANSPORT.cargo.routes.toString(), inline: true },
            { name: 'Express', value: TRANSPORT.cargo.express, inline: true },
            { name: 'Warehouses', value: TRANSPORT.cargo.warehouses.toString(), inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-darairlines': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('🛫 Dar Airlines™ — Regional')
          .addFields(
            { name: 'Aircraft', value: TRANSPORT.darairlines.aircraft.toString(), inline: true },
            { name: 'Routes', value: TRANSPORT.darairlines.routes.toString(), inline: true },
            { name: 'Passengers', value: TRANSPORT.darairlines.passengers, inline: true },
            { name: 'Focus', value: TRANSPORT.darairlines.focus },
            { name: 'Hubs', value: TRANSPORT.darairlines.hubs.join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-ground': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('🚌 Dar Transport™ — Ground Fleet')
          .addFields(
            { name: 'Vehicles', value: TRANSPORT.ground.vehicles.toLocaleString(), inline: true },
            { name: 'Cities', value: TRANSPORT.ground.cities.toString(), inline: true },
            { name: 'Electric', value: TRANSPORT.ground.electric, inline: true },
            { name: 'Types', value: TRANSPORT.ground.types.join(', ') },
            { name: 'App', value: TRANSPORT.ground.app },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-routes': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('🗺️ Route Network')
          .addFields(
            { name: 'OliveAir Routes', value: TRANSPORT.oliveair.routes.toString(), inline: true },
            { name: 'Cargo Routes', value: TRANSPORT.cargo.routes.toString(), inline: true },
            { name: 'Regional Routes', value: TRANSPORT.darairlines.routes.toString(), inline: true },
            { name: 'OliveAir Hubs', value: TRANSPORT.oliveair.hubs.join(', ') },
            { name: 'Regional Hubs', value: TRANSPORT.darairlines.hubs.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-fleet': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('🛩️ Fleet Details')
          .addFields(
            { name: 'Total Aircraft', value: TRANSPORT.fleet.totalAircraft.toString(), inline: true },
            { name: 'Ground Vehicles', value: TRANSPORT.fleet.totalVehicles.toLocaleString(), inline: true },
            { name: 'Newest Aircraft', value: TRANSPORT.fleet.newest, inline: true },
            { name: 'Average Age', value: TRANSPORT.fleet.avgAge, inline: true },
            { name: 'Maintenance', value: TRANSPORT.fleet.maintenance, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-help': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('✈️ DarTransport Commands')
          .setDescription(['/fly-dashboard', '/fly-oliveair', '/fly-cargo', '/fly-darairlines', '/fly-ground', '/fly-routes', '/fly-fleet'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('dartransport-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'dartransport-bot', { userId: interaction.user.id });
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
    console.error(`[DarTransport] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[DarTransport] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarTransport] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarTransport] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
