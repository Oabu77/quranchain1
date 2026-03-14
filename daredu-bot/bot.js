// ══════════════════════════════════════════════════════════════
// DarEdu Discord Bot
// DarEdu™ — Islamic Education, University & Research
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
const meshRouter = new MeshRouter('daredu');

client.once('ready', () => {
  console.log(`✓ DarEdu bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 8`);
  botIpc.startIpcServer('daredu', meshRouter.getIpcHandlers());
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
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'daredu'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'daredu'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const EDU = {
      university: { students: 24000, programs: 85, faculties: ['Engineering', 'Medicine', 'Law', 'Business', 'Islamic Studies', 'Computer Science', 'Architecture', 'Arts'], campuses: 4, accreditation: 'AACSB, ABET, ACPE' },
      academy: { courses: 450, certifications: 120, categories: ['Cloud Computing', 'AI/ML', 'Blockchain', 'Cybersecurity', 'Islamic Finance', 'Digital Marketing', 'Project Management'], completions: 89000 },
      online: { students: 45000, grades: 'K-12', curriculum: 'Islamic + STEM + Arts', languages: ['English', 'Arabic', 'Urdu', 'Malay'], live: true, tutors: 800 },
      research: { papers: 1200, grants: '$42M', focus: ['AI Ethics', 'Islamic Finance', 'Quantum Computing', 'Halal Tech', 'Blockchain Governance', 'Mesh Networks'], partnerships: 34 },
      scholars: { scholars: 340, fatwas: 8900, languages: 12, specializations: ['Fiqh', 'Hadith', 'Tafsir', 'Aqeedah', 'Islamic History', 'Contemporary Issues'], verified: true },
      quran: { students: 120000, programs: ['Tajweed', 'Hifz (Memorization)', 'Tafsir (Interpretation)', 'Arabic Language', 'Qiraat (Recitation Styles)'], teachers: 2400, ijazah: true }
    };
    
    switch (commandName) {
      case 'edu-dashboard': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('🎓 DarEdu™ Academic Dashboard')
          .addFields(
            { name: '🏛️ University Students', value: EDU.university.students.toLocaleString(), inline: true },
            { name: '📜 Academy Courses', value: EDU.academy.courses.toString(), inline: true },
            { name: '🏫 Online Students', value: EDU.online.students.toLocaleString(), inline: true },
            { name: '📚 Research Papers', value: EDU.research.papers.toLocaleString(), inline: true },
            { name: '🕌 Scholars', value: EDU.scholars.scholars.toString(), inline: true },
            { name: '📖 Quran Students', value: EDU.quran.students.toLocaleString(), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-university': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('🏛️ Dar University™')
          .addFields(
            { name: 'Students', value: EDU.university.students.toLocaleString(), inline: true },
            { name: 'Programs', value: EDU.university.programs.toString(), inline: true },
            { name: 'Campuses', value: EDU.university.campuses.toString(), inline: true },
            { name: 'Faculties', value: EDU.university.faculties.join(', ') },
            { name: 'Accreditation', value: EDU.university.accreditation },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-academy': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('📜 Dar Academy™')
          .addFields(
            { name: 'Courses', value: EDU.academy.courses.toString(), inline: true },
            { name: 'Certifications', value: EDU.academy.certifications.toString(), inline: true },
            { name: 'Completions', value: EDU.academy.completions.toLocaleString(), inline: true },
            { name: 'Categories', value: EDU.academy.categories.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-online': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('🏫 Dar Online School™')
          .addFields(
            { name: 'Students', value: EDU.online.students.toLocaleString(), inline: true },
            { name: 'Grades', value: EDU.online.grades, inline: true },
            { name: 'Tutors', value: EDU.online.tutors.toString(), inline: true },
            { name: 'Curriculum', value: EDU.online.curriculum },
            { name: 'Languages', value: EDU.online.languages.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-research': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('📚 Dar Research Institute™')
          .addFields(
            { name: 'Papers', value: EDU.research.papers.toLocaleString(), inline: true },
            { name: 'Grants', value: EDU.research.grants, inline: true },
            { name: 'Partnerships', value: EDU.research.partnerships.toString(), inline: true },
            { name: 'Focus Areas', value: EDU.research.focus.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-scholars': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('🕌 Scholar Net™')
          .addFields(
            { name: 'Scholars', value: EDU.scholars.scholars.toString(), inline: true },
            { name: 'Fatwas', value: EDU.scholars.fatwas.toLocaleString(), inline: true },
            { name: 'Languages', value: EDU.scholars.languages.toString(), inline: true },
            { name: 'Specializations', value: EDU.scholars.specializations.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-quran': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('📖 Quran Learning Programs')
          .addFields(
            { name: 'Students', value: EDU.quran.students.toLocaleString(), inline: true },
            { name: 'Teachers', value: EDU.quran.teachers.toLocaleString(), inline: true },
            { name: 'Ijazah', value: EDU.quran.ijazah ? 'Available' : 'No', inline: true },
            { name: 'Programs', value: EDU.quran.programs.join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-help': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('🎓 DarEdu Commands')
          .setDescription(['/edu-dashboard', '/edu-university', '/edu-academy', '/edu-online', '/edu-research', '/edu-scholars', '/edu-quran'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('daredu-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'daredu-bot', { userId: interaction.user.id });
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
    console.error(`[DarEdu] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[DarEdu] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarEdu] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarEdu] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
