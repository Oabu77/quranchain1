// ══════════════════════════════════════════════════════════════
// DarTelecom Discord Bot
// DarTelecom™ — eSIM, WiFi, Fiber, 5G & Satellite + ISP Mgmt
// Part of DarCloud Empire — Omar Mohammad Abunadi
// ══════════════════════════════════════════════════════════════
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
const ISP_API = process.env.ISP_API || 'http://localhost:3000';
const meshRouter = new MeshRouter('dartelecom');

client.once('ready', () => {
  console.log(`✓ DarTelecom bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 19`);
  botIpc.startIpcServer('dartelecom', meshRouter.getIpcHandlers());
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
    // Handle ISP subscribe buttons first
    if (interaction.isButton() && interaction.customId.startsWith('isp_subscribe_')) {
      const plan = interaction.customId.replace('isp_subscribe_', '');
      await interaction.deferReply();
      try {
        const res = await fetch(`${API}/telecom/subscribers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: interaction.user.globalName || interaction.user.username,
            email: `${interaction.user.id}@dartelecom.darcloud.host`,
            discord_id: interaction.user.id,
            plan,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        const embed = new EmbedBuilder().setColor(0x00FF88).setTitle('✅ Subscribed to DarTelecom!')
          .addFields(
            { name: 'Plan', value: data.subscriber.plan, inline: true },
            { name: 'IMSI', value: data.subscriber.imsi, inline: true },
            { name: 'eSIM', value: data.sim.iccid, inline: false },
            { name: 'Activation', value: `\`${data.esim_activation}\``, inline: false },
          ).setTimestamp();
        await interaction.editReply({ embeds: [embed] });
      } catch (e) { await interaction.editReply({ content: `❌ ${e.message}` }); }
      return;
    }
    // Handle onboarding buttons/modals/selects
    try { const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'dartelecom'); if (handled) return; }
    catch (err) { console.error(`Onboarding error: ${err.message}`); }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
  const onboardCmds = ['onboard','dashboard','referral','services','subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'dartelecom'); } catch (err) { await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {}); }
    return;
  }
  const commandName = interaction.commandName;
  
  try {
    
    const TELECOM = {
      esim: { countries: 190, carriers: 450, plans: ['Data Only', 'Voice + Data', 'Unlimited', 'IoT'], activation: 'Instant QR', pricing: 'From $3/GB' },
      wifi: { hotspots: 45000, cities: 120, speed: 'Up to 1 Gbps', mesh: 'FungiMesh-powered', free: 'Community tier available' },
      fiber: { coverage: '31 cities', speed: 'Up to 10 Gbps', customers: 180000, uptime: '99.99%', plans: ['Residential 1G: $49/mo', 'Business 5G: $149/mo', 'Enterprise 10G: Custom'] },
      fiveG: { towers: 2400, coverage: '18 cities', speed: 'Up to 10 Gbps', latency: '< 1ms', slicing: 'Network slicing available' },
      satellite: { satellites: 24, coverage: 'Global', speed: 'Up to 500 Mbps', latency: '20ms (LEO)', plans: ['Basic: $49/mo', 'Premium: $99/mo', 'Maritime: Custom', 'Aviation: Custom'] },
      hardware: { products: ['5G Router', 'Mesh WiFi Node', 'eSIM Adapter', 'Satellite Terminal', 'IoT Gateway'], manufacturing: 'In-house', warranty: '3 years', support: '24/7' }
    };
    
    switch (commandName) {
      case 'telecom-dashboard': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📡 DarTelecom™ Network Dashboard')
          .addFields(
            { name: '📱 eSIM Countries', value: TELECOM.esim.countries.toString(), inline: true },
            { name: '📶 WiFi Hotspots', value: TELECOM.wifi.hotspots.toLocaleString(), inline: true },
            { name: '🔗 Fiber Customers', value: TELECOM.fiber.customers.toLocaleString(), inline: true },
            { name: '📡 5G Towers', value: TELECOM.fiveG.towers.toLocaleString(), inline: true },
            { name: '🛰️ Satellites', value: TELECOM.satellite.satellites.toString(), inline: true },
            { name: '⚡ Max Speed', value: TELECOM.fiber.speed, inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-esim': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📱 Dar eSIM™ — Global Connectivity')
          .addFields(
            { name: 'Countries', value: TELECOM.esim.countries.toString(), inline: true },
            { name: 'Carriers', value: TELECOM.esim.carriers.toString(), inline: true },
            { name: 'Activation', value: TELECOM.esim.activation, inline: true },
            { name: 'Pricing', value: TELECOM.esim.pricing },
            { name: 'Plans', value: TELECOM.esim.plans.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-wifi': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📶 Dar WiFi Grid™')
          .addFields(
            { name: 'Hotspots', value: TELECOM.wifi.hotspots.toLocaleString(), inline: true },
            { name: 'Cities', value: TELECOM.wifi.cities.toString(), inline: true },
            { name: 'Speed', value: TELECOM.wifi.speed, inline: true },
            { name: 'Mesh', value: TELECOM.wifi.mesh },
            { name: 'Free Tier', value: TELECOM.wifi.free },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-fiber': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('🔗 Dar Fiber Net™')
          .addFields(
            { name: 'Coverage', value: TELECOM.fiber.coverage, inline: true },
            { name: 'Customers', value: TELECOM.fiber.customers.toLocaleString(), inline: true },
            { name: 'Max Speed', value: TELECOM.fiber.speed, inline: true },
            { name: 'Uptime', value: TELECOM.fiber.uptime, inline: true },
            { name: 'Plans', value: TELECOM.fiber.plans.join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-5g': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📡 Dar5G™ — Core Network')
          .addFields(
            { name: 'Towers', value: TELECOM.fiveG.towers.toLocaleString(), inline: true },
            { name: 'Coverage', value: TELECOM.fiveG.coverage, inline: true },
            { name: 'Speed', value: TELECOM.fiveG.speed, inline: true },
            { name: 'Latency', value: TELECOM.fiveG.latency, inline: true },
            { name: 'Slicing', value: TELECOM.fiveG.slicing },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-satellite': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('🛰️ Dar Sat Net™')
          .addFields(
            { name: 'Satellites', value: TELECOM.satellite.satellites.toString(), inline: true },
            { name: 'Coverage', value: TELECOM.satellite.coverage, inline: true },
            { name: 'Speed', value: TELECOM.satellite.speed, inline: true },
            { name: 'Latency', value: TELECOM.satellite.latency, inline: true },
            { name: 'Plans', value: TELECOM.satellite.plans.join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-hardware': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('🔧 Dar Network HW™')
          .addFields(
            { name: 'Products', value: TELECOM.hardware.products.join('\n') },
            { name: 'Manufacturing', value: TELECOM.hardware.manufacturing, inline: true },
            { name: 'Warranty', value: TELECOM.hardware.warranty, inline: true },
            { name: 'Support', value: TELECOM.hardware.support, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-help': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📡 DarTelecom Commands')
          .setDescription(['/telecom-dashboard', '/telecom-esim', '/telecom-wifi', '/telecom-fiber', '/telecom-5g', '/telecom-satellite', '/telecom-hardware', '/isp-status', '/isp-subscribe', '/isp-plans', '/isp-provision', '/isp-network', '/isp-nodes', '/isp-billing', '/isp-esim'].map(c => `\`${c}\``).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
      // ═══ ISP Management Commands ═══
      case 'isp-status': {
        await interaction.deferReply();
        try {
          const res = await fetch(`${API}/telecom/dashboard`);
          const data = await res.json();
          if (!data.success) throw new Error('API error');
          const embed = new EmbedBuilder().setColor(0x00D4AA).setTitle('📡 DarTelecom™ ISP Dashboard')
            .addFields(
              { name: '🏢 Network', value: `${data.isp.name}\n${data.isp.network} (${data.isp.core})`, inline: false },
              { name: '📊 Status', value: data.isp.status.toUpperCase(), inline: true },
              { name: '👥 Active Subs', value: String(data.subscribers?.active || 0), inline: true },
              { name: '📱 Active SIMs', value: String(data.sims_active || 0), inline: true },
              { name: '🔗 Mesh Nodes', value: String(data.mesh_nodes_online || 0), inline: true },
              { name: '💰 MRR', value: data.mrr, inline: true },
              { name: '📈 ARR', value: data.arr, inline: true },
            )
            .addFields(
              { name: '💸 Revenue Split', value: [
                `Founder 30%: ${data.revenue_split.founder_30}`,
                `AI Validators 40%: ${data.revenue_split.ai_validators_40}`,
                `Hardware 10%: ${data.revenue_split.hardware_hosts_10}`,
                `Ecosystem 18%: ${data.revenue_split.ecosystem_18}`,
                `Zakat 2%: ${data.revenue_split.zakat_2}`,
              ].join('\n') }
            ).setTimestamp();
          await interaction.editReply({ embeds: [embed] });
        } catch (e) { await interaction.editReply({ content: `❌ ISP API error: ${e.message}` }); }
        break;
      }
      case 'isp-plans': {
        try {
          const res = await fetch(`${API}/telecom/plans`);
          const data = await res.json();
          const plans = data.plans || {};
          const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📋 DarTelecom™ ISP Plans');
          for (const [key, plan] of Object.entries(plans)) {
            const p = plan;
            embed.addFields({ name: `${p.name}`, value: [
              `💲 $${p.price}/mo`,
              `📶 ${p.data_gb === -1 ? 'Unlimited' : p.data_gb + 'GB'} Data`,
              `⚡ ${p.speed_mbps === -1 ? 'Unlimited' : p.speed_mbps + ' Mbps'}`,
              `📧 ${p.sms === -1 ? 'Unlimited' : p.sms} SMS`,
              `📞 ${p.voice_min === -1 ? 'Unlimited' : p.voice_min} min`,
            ].join(' | '), inline: false });
          }
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('isp_subscribe_starter').setLabel('Starter $19.99').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('isp_subscribe_pro').setLabel('Pro $39.99').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('isp_subscribe_unlimited').setLabel('Unlimited $59.99').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('isp_subscribe_business').setLabel('Business $99.99').setStyle(ButtonStyle.Danger),
          );
          await interaction.reply({ embeds: [embed], components: [row] });
        } catch (e) { await interaction.reply({ content: `❌ ${e.message}`, ephemeral: true }); }
        break;
      }
      case 'isp-subscribe': {
        await interaction.deferReply();
        const subPlan = interaction.options.getString('plan') || 'starter';
        try {
          const res = await fetch(`${API}/telecom/subscribers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: interaction.user.globalName || interaction.user.username,
              email: `${interaction.user.id}@dartelecom.darcloud.host`,
              discord_id: interaction.user.id,
              plan: subPlan,
            }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Provisioning failed');
          const embed = new EmbedBuilder().setColor(0x00FF88).setTitle('✅ DarTelecom Subscriber Provisioned!')
            .addFields(
              { name: '🆔 Subscriber ID', value: data.subscriber.subscriber_id, inline: false },
              { name: '📱 IMSI', value: data.subscriber.imsi, inline: true },
              { name: '📋 Plan', value: data.subscriber.plan, inline: true },
              { name: '📶 Status', value: data.subscriber.status, inline: true },
              { name: '💳 SIM (eSIM)', value: data.sim.iccid, inline: false },
              { name: '🔗 eSIM Activation', value: `\`${data.esim_activation}\``, inline: false },
              { name: '🌐 Network', value: data.network, inline: false },
            ).setTimestamp().setFooter({ text: 'DarTelecom™ by DarCloud' });
          await interaction.editReply({ embeds: [embed] });
        } catch (e) { await interaction.editReply({ content: `❌ ${e.message}` }); }
        break;
      }
      case 'isp-provision': {
        await interaction.deferReply();
        const provName = interaction.options.getString('name');
        const provEmail = interaction.options.getString('email');
        const provPlan = interaction.options.getString('plan') || 'starter';
        if (!provName || !provEmail) { await interaction.editReply({ content: '❌ Name and email required' }); break; }
        try {
          const res = await fetch(`${API}/telecom/subscribers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: provName, email: provEmail, plan: provPlan }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Failed');
          const embed = new EmbedBuilder().setColor(0x00FF88).setTitle('✅ New Subscriber Provisioned')
            .addFields(
              { name: 'Name', value: provName, inline: true },
              { name: 'Plan', value: data.subscriber.plan, inline: true },
              { name: 'IMSI', value: data.subscriber.imsi, inline: true },
              { name: 'ICCID', value: data.sim.iccid, inline: false },
              { name: 'eSIM Code', value: `\`${data.esim_activation}\``, inline: false },
            ).setTimestamp();
          await interaction.editReply({ embeds: [embed] });
        } catch (e) { await interaction.editReply({ content: `❌ ${e.message}` }); }
        break;
      }
      case 'isp-network': {
        await interaction.deferReply();
        try {
          const res = await fetch(`${API}/telecom/network/status`);
          const data = await res.json();
          if (!data.success) throw new Error('API error');
          const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('🌐 DarTelecom Network Status')
            .addFields(
              { name: '📡 Network', value: `${data.network.name}\nPLMN: ${data.network.plmn}\nCore: ${data.network.core}`, inline: false },
              { name: '5G Functions', value: data.network.functions['5G'].join(', '), inline: false },
              { name: '4G Functions', value: data.network.functions['4G'].join(', '), inline: false },
              { name: 'RAN', value: data.network.functions['RAN'].join(', '), inline: true },
              { name: '👥 Subscribers', value: String(data.subscribers_active), inline: true },
              { name: '📱 SIMs', value: String(data.sims_active), inline: true },
              { name: '🔗 Mesh Nodes', value: String(data.mesh_nodes_online), inline: true },
            )
            .addFields(
              { name: '🛡️ Capabilities', value: Object.entries(data.capabilities).filter(([,v]) => v).map(([k]) => `✅ ${k}`).join('\n'), inline: false },
            ).setTimestamp();
          await interaction.editReply({ embeds: [embed] });
        } catch (e) { await interaction.editReply({ content: `❌ ${e.message}` }); }
        break;
      }
      case 'isp-nodes': {
        await interaction.deferReply();
        try {
          const res = await fetch(`${API}/telecom/mesh/nodes`);
          const data = await res.json();
          if (!data.success) throw new Error('API error');
          const nodes = (data.nodes || []).slice(0, 10);
          const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('🔗 ISP Mesh Nodes')
            .setDescription(`Total: ${data.total || 0} nodes`);
          if (nodes.length === 0) {
            embed.addFields({ name: 'No nodes', value: 'No mesh nodes registered yet. Run `/isp-subscribe` with mesh_node plan.' });
          }
          for (const node of nodes) {
            embed.addFields({ name: `${node.status === 'online' ? '🟢' : '🔴'} ${node.node_id}`, value: [
              `Region: ${node.region || 'auto'}`,
              `HW: ${node.hardware || 'unknown'}`,
              `Traffic: ${((node.traffic_forwarded_bytes || 0) / (1024*1024*1024)).toFixed(2)} GB`,
              `Uptime: ${((node.uptime_seconds || 0) / 3600).toFixed(1)}h`,
            ].join(' | '), inline: false });
          }
          await interaction.editReply({ embeds: [embed] });
        } catch (e) { await interaction.editReply({ content: `❌ ${e.message}` }); }
        break;
      }
      case 'isp-billing': {
        await interaction.deferReply();
        try {
          const res = await fetch(`${API}/telecom/billing/summary`);
          const data = await res.json();
          if (!data.success) throw new Error('API error');
          const embed = new EmbedBuilder().setColor(0x00D4AA).setTitle('💰 DarTelecom Billing Summary')
            .addFields(
              { name: '📊 MRR', value: `$${data.mrr}`, inline: true },
              { name: '📈 ARR', value: `$${data.arr}`, inline: true },
              { name: '👥 Active', value: String(data.active_subscribers), inline: true },
            )
            .addFields(
              { name: '📋 Plan Breakdown', value: Object.entries(data.plan_breakdown || {}).map(([k,v]) => `${k}: ${v}`).join('\n') || 'No subscribers', inline: false },
              { name: '💸 Revenue Split', value: [
                `Founder: $${data.revenue_split.founder}`,
                `AI Validators: $${data.revenue_split.ai_validators}`,
                `Hardware: $${data.revenue_split.hardware_hosts}`,
                `Ecosystem: $${data.revenue_split.ecosystem}`,
                `Zakat: $${data.revenue_split.zakat}`,
              ].join('\n'), inline: false },
            ).setTimestamp();
          await interaction.editReply({ embeds: [embed] });
        } catch (e) { await interaction.editReply({ content: `❌ ${e.message}` }); }
        break;
      }
      case 'isp-esim': {
        await interaction.deferReply();
        const subId = interaction.options.getString('subscriber_id');
        if (!subId) { await interaction.editReply({ content: '❌ Subscriber ID required' }); break; }
        try {
          const res = await fetch(`${API}/telecom/esim/${subId}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Not found');
          const esim = data.esim;
          const embed = new EmbedBuilder().setColor(0x00FF88).setTitle('📱 eSIM Activation Profile')
            .addFields(
              { name: 'ICCID', value: esim.iccid, inline: true },
              { name: 'IMSI', value: esim.imsi, inline: true },
              { name: 'Network', value: esim.network, inline: true },
              { name: 'APN', value: esim.apn, inline: true },
              { name: 'PLMN', value: esim.plmn, inline: true },
              { name: 'Type', value: esim.type, inline: true },
              { name: '🔑 Activation Code', value: `\`${esim.activation_code}\``, inline: false },
              { name: '📱 QR Data', value: `\`${esim.qr_data}\``, inline: false },
              { name: '📋 Instructions', value: esim.instructions.join('\n'), inline: false },
            ).setTimestamp().setFooter({ text: 'Scan QR or enter activation code on your device' });
          await interaction.editReply({ embeds: [embed] });
        } catch (e) { await interaction.editReply({ content: `❌ ${e.message}` }); }
        break;
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('dartelecom-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'dartelecom-bot', { userId: interaction.user.id });
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
    console.error(`[DarTelecom] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[DarTelecom] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarTelecom] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarTelecom] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
