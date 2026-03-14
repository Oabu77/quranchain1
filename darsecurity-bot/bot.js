// ══════════════════════════════════════════════════════════════
// DarSecurity Discord Bot
// DarSecurity™ — Cybersecurity, Quantum Tech & Space Systems
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
const meshRouter = new MeshRouter('darsecurity');

client.once('ready', () => {
  console.log(`✓ DarSecurity bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 8`);
  botIpc.startIpcServer('darsecurity', meshRouter.getIpcHandlers());
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
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'darsecurity'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'darsecurity'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const SEC = {
      cyber: { soc: '24/7/365', analysts: 180, threats: { blocked: '4.2M/day', incidents: 12, severity: { critical: 0, high: 3, medium: 9 } }, tools: ['SIEM', 'EDR', 'XDR', 'SOAR', 'Threat Intel'], certifications: ['SOC2 Type II', 'ISO 27001', 'PCI DSS', 'HIPAA'] },
      comms: { encryption: 'AES-256 + Kyber-1024', protocols: ['Signal Protocol', 'MeshTalk E2EE', 'Quantum Key Distribution'], users: 890000, zeroKnowledge: true, metadata: 'Zero-metadata architecture' },
      quantum: { qubits: 1024, algorithms: ['Kyber-1024', 'Dilithium-5', 'SPHINCS+', 'BB84 QKD'], services: ['Post-Quantum Encryption', 'Quantum Key Distribution', 'Quantum Random Number Gen', 'Quantum-Safe TLS'], readiness: '100% post-quantum ready' },
      space: { satellites: 24, orbits: ['LEO', 'MEO', 'GEO'], services: ['Communications', 'Earth Observation', 'Navigation', 'Internet'], groundStations: 8, launches: 6 },
      strategic: { systems: ['Critical Infrastructure Protection', 'SCADA Security', 'Military-Grade Encryption', 'Air-Gap Networks', 'Nuclear Facility Security'], clearance: 'Top Secret', customers: 'Government & Defense' },
      identity: { users: 4200000, methods: ['Biometric', 'Zero-Knowledge Proof', 'Decentralized ID (DID)', 'Verifiable Credentials'], chain: 'QuranChain', compliance: 'eIDAS, NIST 800-63' }
    };
    
    switch (commandName) {
      case 'sec-dashboard': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🛡️ DarSecurity™ Defense Dashboard')
          .addFields(
            { name: '🔒 SOC Status', value: SEC.cyber.soc, inline: true },
            { name: '🚫 Threats Blocked', value: SEC.cyber.threats.blocked, inline: true },
            { name: '⚛️ Qubits', value: SEC.quantum.qubits.toString(), inline: true },
            { name: '🛰️ Satellites', value: SEC.space.satellites.toString(), inline: true },
            { name: '🆔 Identity Users', value: SEC.identity.users.toLocaleString(), inline: true },
            { name: '📡 Secure Users', value: SEC.comms.users.toLocaleString(), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-cyber': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🔒 DarCybersecurity™ SOC')
          .addFields(
            { name: 'SOC', value: SEC.cyber.soc, inline: true },
            { name: 'Analysts', value: SEC.cyber.analysts.toString(), inline: true },
            { name: 'Threats Blocked/Day', value: SEC.cyber.threats.blocked, inline: true },
            { name: 'Active Incidents', value: `Critical: ${SEC.cyber.threats.severity.critical} | High: ${SEC.cyber.threats.severity.high} | Medium: ${SEC.cyber.threats.severity.medium}` },
            { name: 'Tools', value: SEC.cyber.tools.join(', ') },
            { name: 'Certifications', value: SEC.cyber.certifications.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-comms': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('📡 Dar Secure Comms™')
          .addFields(
            { name: 'Encryption', value: SEC.comms.encryption, inline: true },
            { name: 'Users', value: SEC.comms.users.toLocaleString(), inline: true },
            { name: 'Zero Knowledge', value: SEC.comms.zeroKnowledge ? 'Yes' : 'No', inline: true },
            { name: 'Protocols', value: SEC.comms.protocols.join('\n') },
            { name: 'Metadata', value: SEC.comms.metadata },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-quantum': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('⚛️ DarQuantum™ Computing')
          .addFields(
            { name: 'Qubits', value: SEC.quantum.qubits.toString(), inline: true },
            { name: 'Readiness', value: SEC.quantum.readiness, inline: true },
            { name: 'Algorithms', value: SEC.quantum.algorithms.join(', ') },
            { name: 'Services', value: SEC.quantum.services.join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-space': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🛰️ Dar Space Systems™')
          .addFields(
            { name: 'Satellites', value: SEC.space.satellites.toString(), inline: true },
            { name: 'Ground Stations', value: SEC.space.groundStations.toString(), inline: true },
            { name: 'Launches', value: SEC.space.launches.toString(), inline: true },
            { name: 'Orbits', value: SEC.space.orbits.join(', ') },
            { name: 'Services', value: SEC.space.services.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-strategic': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🏛️ Dar Strategic Systems™')
          .addFields(
            { name: 'Clearance', value: SEC.strategic.clearance, inline: true },
            { name: 'Customers', value: SEC.strategic.customers, inline: true },
            { name: 'Systems', value: SEC.strategic.systems.join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-identity': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🆔 DarIdentity™ — Decentralized KYC')
          .addFields(
            { name: 'Users', value: SEC.identity.users.toLocaleString(), inline: true },
            { name: 'Blockchain', value: SEC.identity.chain, inline: true },
            { name: 'Compliance', value: SEC.identity.compliance, inline: true },
            { name: 'Methods', value: SEC.identity.methods.join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-help': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🛡️ DarSecurity Commands')
          .setDescription(['/sec-dashboard', '/sec-cyber', '/sec-comms', '/sec-quantum', '/sec-space', '/sec-strategic', '/sec-identity'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('darsecurity-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'darsecurity-bot', { userId: interaction.user.id });
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
    console.error(`[DarSecurity] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[DarSecurity] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarSecurity] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarSecurity] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
