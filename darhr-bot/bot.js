// ══════════════════════════════════════════════════════════════
// DarHR Discord Bot
// DarHR™ — Muslim Workforce, Consulting & Marketing
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
const meshRouter = new MeshRouter('darhr');

client.once('ready', () => {
  console.log(`✓ DarHR bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 7`);
  botIpc.startIpcServer('darhr', meshRouter.getIpcHandlers());
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
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'darhr'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'darhr'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const HR = {
      workforce: { employees: 14200, departments: 45, countries: 21, remote: '62%', satisfaction: '4.6/5' },
      jobs: { openPositions: 340, categories: ['Engineering', 'AI/ML', 'Finance', 'Healthcare', 'Legal', 'Marketing', 'Operations', 'Customer Service'], apply: 'careers.darcloud.host' },
      consulting: { clients: 450, projects: 1200, specialties: ['Islamic Finance', 'Shariah Compliance', 'Halal Certification', 'Market Entry', 'Digital Transformation'], revenue: '$24M annual' },
      marketing: { clients: 890, campaigns: 4200, channels: ['SEO', 'Social Media', 'Content', 'Email', 'PPC', 'Influencer'], revenue: '$18M annual' },
      benefits: { items: ['Halal health insurance (DarTakaful)', 'Zero-riba home finance (DarMortgage)', 'Free Islamic education (DarEdu)', 'Prayer room & wudu facilities', 'Hajj/Umrah assistance', 'Zakat auto-deduction', 'Flexible Jummah schedule', 'Profit-sharing (Mudarabah)'] }
    };
    
    switch (commandName) {
      case 'hr-dashboard': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('👥 DarHR™ Workforce Dashboard')
          .addFields(
            { name: '👥 Employees', value: HR.workforce.employees.toLocaleString(), inline: true },
            { name: '🏢 Departments', value: HR.workforce.departments.toString(), inline: true },
            { name: '🌍 Countries', value: HR.workforce.countries.toString(), inline: true },
            { name: '🏠 Remote', value: HR.workforce.remote, inline: true },
            { name: '⭐ Satisfaction', value: HR.workforce.satisfaction, inline: true },
            { name: '📋 Open Positions', value: HR.jobs.openPositions.toString(), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-jobs': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('💼 Open Positions — ' + HR.jobs.openPositions)
          .addFields(
            { name: 'Categories', value: HR.jobs.categories.join(', ') },
            { name: 'Apply', value: HR.jobs.apply },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-consulting': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('🏛️ DarConsulting™ — Advisory')
          .addFields(
            { name: 'Clients', value: HR.consulting.clients.toString(), inline: true },
            { name: 'Projects', value: HR.consulting.projects.toLocaleString(), inline: true },
            { name: 'Revenue', value: HR.consulting.revenue, inline: true },
            { name: 'Specialties', value: HR.consulting.specialties.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-marketing': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('📣 DarMarketing™ — Digital Growth')
          .addFields(
            { name: 'Clients', value: HR.marketing.clients.toString(), inline: true },
            { name: 'Campaigns', value: HR.marketing.campaigns.toLocaleString(), inline: true },
            { name: 'Revenue', value: HR.marketing.revenue, inline: true },
            { name: 'Channels', value: HR.marketing.channels.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-workforce': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('📊 Workforce Analytics')
          .addFields(
            { name: 'Total Employees', value: HR.workforce.employees.toLocaleString(), inline: true },
            { name: 'Departments', value: HR.workforce.departments.toString(), inline: true },
            { name: 'Countries', value: HR.workforce.countries.toString(), inline: true },
            { name: 'Remote %', value: HR.workforce.remote, inline: true },
            { name: 'Satisfaction', value: HR.workforce.satisfaction, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-benefits': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('🎁 Employee Benefits & Halal Perks')
          .setDescription(HR.benefits.items.map(b => `• ${b}`).join('\n'))
          .setFooter({ text: 'All benefits are Shariah-compliant' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-help': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('👥 DarHR Commands')
          .setDescription(['/hr-dashboard', '/hr-jobs', '/hr-consulting', '/hr-marketing', '/hr-workforce', '/hr-benefits'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('darhr-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'darhr-bot', { userId: interaction.user.id });
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
    console.error(`[DarHR] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[DarHR] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarHR] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarHR] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
