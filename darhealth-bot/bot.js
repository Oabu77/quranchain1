// ══════════════════════════════════════════════════════════════
// DarHealth Discord Bot
// DarHealth™ — Halal Healthcare & Telemedicine
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
const meshRouter = new MeshRouter('darhealth');

client.once('ready', () => {
  console.log(`✓ DarHealth bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 9`);
  botIpc.startIpcServer('darhealth', meshRouter.getIpcHandlers());
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
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'darhealth'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'darhealth'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const HEALTH = {
      clinics: { count: 147, specialties: ['Family Medicine', 'Pediatrics', 'OB/GYN', 'Cardiology', 'Endocrinology', 'Dermatology', 'Mental Health', 'Dental'], cities: 31, hours: '7 AM - 10 PM', walkIn: true },
      telemed: { providers: 420, languages: ['English', 'Arabic', 'Urdu', 'Malay', 'Turkish', 'French'], wait: '< 5 minutes', cost: '$25/visit', platforms: ['Web', 'iOS', 'Android', 'MeshTalk'] },
      hospitals: { facilities: 12, beds: 3600, icu: 480, emergency: '24/7', accreditation: 'JCI Accredited' },
      pharma: { products: 2400, halal: '100% Halal Certified', delivery: 'Same-day', compounding: true, otc: true },
      biotech: { trials: 34, focus: ['Genomics', 'Immunotherapy', 'Stem Cell', 'Halal Vaccines', 'AI Diagnostics'], partners: 8 },
      takaful: { members: 89000, plans: ['Individual', 'Family', 'Business', 'Senior'], coverage: 'Medical, Dental, Vision, Mental Health', premium: 'From $49/mo' }
    };
    
    switch (commandName) {
      case 'health-dashboard': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🏥 DarHealth™ Healthcare Dashboard')
          .addFields(
            { name: '🏨 Clinics', value: HEALTH.clinics.count + ' locations', inline: true },
            { name: '💻 Telemed Providers', value: HEALTH.telemed.providers.toString(), inline: true },
            { name: '🏗️ Hospitals', value: HEALTH.hospitals.facilities + ' facilities', inline: true },
            { name: '💊 Pharma Products', value: HEALTH.pharma.products.toLocaleString(), inline: true },
            { name: '🧬 Clinical Trials', value: HEALTH.biotech.trials.toString(), inline: true },
            { name: '🛡️ Takaful Members', value: HEALTH.takaful.members.toLocaleString(), inline: true },
          ).setFooter({ text: 'DarHealth™ — Halal Healthcare For All' }).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-clinics': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🏨 Dar Clinics™ Network')
          .addFields(
            { name: 'Locations', value: HEALTH.clinics.count + ' across ' + HEALTH.clinics.cities + ' cities', inline: true },
            { name: 'Hours', value: HEALTH.clinics.hours, inline: true },
            { name: 'Walk-In', value: HEALTH.clinics.walkIn ? 'Yes' : 'No', inline: true },
            { name: 'Specialties', value: HEALTH.clinics.specialties.map(s => `• ${s}`).join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-telemed': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('💻 Dar Telemed™ — Virtual Healthcare')
          .addFields(
            { name: 'Providers', value: HEALTH.telemed.providers.toString(), inline: true },
            { name: 'Wait Time', value: HEALTH.telemed.wait, inline: true },
            { name: 'Cost', value: HEALTH.telemed.cost, inline: true },
            { name: 'Languages', value: HEALTH.telemed.languages.join(', ') },
            { name: 'Platforms', value: HEALTH.telemed.platforms.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-hospitals': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🏗️ Dar Hospitals™ Network')
          .addFields(
            { name: 'Facilities', value: HEALTH.hospitals.facilities.toString(), inline: true },
            { name: 'Total Beds', value: HEALTH.hospitals.beds.toLocaleString(), inline: true },
            { name: 'ICU Beds', value: HEALTH.hospitals.icu.toString(), inline: true },
            { name: 'Emergency', value: HEALTH.hospitals.emergency, inline: true },
            { name: 'Accreditation', value: HEALTH.hospitals.accreditation, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-pharma': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('💊 DarPharmacy™ — Halal Pharmaceuticals')
          .addFields(
            { name: 'Products', value: HEALTH.pharma.products.toLocaleString(), inline: true },
            { name: 'Certification', value: HEALTH.pharma.halal, inline: true },
            { name: 'Delivery', value: HEALTH.pharma.delivery, inline: true },
            { name: 'Services', value: '• Halal-certified medications\n• Custom compounding\n• OTC products\n• Supplements & vitamins' },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-biotech': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🧬 Dar BioTech™ — Research & Development')
          .addFields(
            { name: 'Active Trials', value: HEALTH.biotech.trials.toString(), inline: true },
            { name: 'Partners', value: HEALTH.biotech.partners.toString(), inline: true },
            { name: 'Focus Areas', value: HEALTH.biotech.focus.map(f => `• ${f}`).join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-wellness': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🧘 Wellness & Preventive Care')
          .addFields(
            { name: 'Programs', value: '• Annual Health Screening\n• Fitness & Nutrition Plans\n• Mental Health Support\n• Islamic Mindfulness\n• Chronic Disease Management\n• Maternal & Child Health' },
            { name: 'Access', value: 'Free for all DarHealth members\nDiscounted for HWC members' },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-takaful': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🛡️ DarTakaful™ — Islamic Health Insurance')
          .addFields(
            { name: 'Members', value: HEALTH.takaful.members.toLocaleString(), inline: true },
            { name: 'Starting At', value: HEALTH.takaful.premium, inline: true },
            { name: 'Plans', value: HEALTH.takaful.plans.map(p => `• ${p}`).join('\n'), inline: true },
            { name: 'Coverage', value: HEALTH.takaful.coverage },
          ).setFooter({ text: 'Cooperative insurance — no gambling, no riba' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-help': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🏥 DarHealth Commands')
          .setDescription(['/health-dashboard', '/health-clinics', '/health-telemed', '/health-hospitals', '/health-pharma', '/health-biotech', '/health-wellness', '/health-takaful'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('darhealth-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'darhealth-bot', { userId: interaction.user.id });
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
    console.error(`[DarHealth] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[DarHealth] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarHealth] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarHealth] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
