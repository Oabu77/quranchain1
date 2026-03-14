// ══════════════════════════════════════════════════════════════
// DarDeFi Discord Bot
// DarDeFi™ — Halal DeFi, NFTs, Staking & DEX
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
const meshRouter = new MeshRouter('dardefi');

client.once('ready', () => {
  console.log(`✓ DarDeFi bot online as ${client.user.tag}`);
  console.log(`  Guild: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Commands: 9`);
  botIpc.startIpcServer('dardefi', meshRouter.getIpcHandlers());
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

  // Handle onboarding interactions (buttons, modals, selects)
  if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
    try {
      const handled = await onboardingEngine.handleOnboardingInteraction(interaction, 'dardefi');
      if (handled) return;
    } catch (err) { console.error(`[DarDeFi] Onboarding interaction error: ${err.message}`); }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  // Register user on every command
  onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);

  // Handle shared onboarding commands
  const onboardCmds = ['onboard', 'dashboard', 'referral', 'services', 'subscribe'];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, 'dardefi'); } catch (err) {
      console.error(`[DarDeFi] [${interaction.commandName}] ${err.message}`);
    }
    return;
  }

  const commandName = interaction.commandName;
  
  try {
    
    const DEFI = {
      tvl: '$420M', protocols: 8, users: 180000,
      swap: { pairs: 2400, volume24h: '$18.4M', liquidity: '$120M', fee: '0.3%', screening: 'Automated halal token screening', chains: 12 },
      staking: { staked: '$89M', apy: '4.2% - 18.7%', validators: 14, lockPeriods: ['Flexible', '30 days', '90 days', '365 days'], rewards: 'QRN + governance tokens' },
      nft: { collections: 340, items: 89000, volume: '$4.2M', categories: ['Islamic Art', 'Calligraphy', 'Quran Verses', 'Historical', 'Charitable'], royalties: 'Creator + Zakat' },
      bridge: { chains: 47, volume: '$240M bridged', speed: '< 5 minutes', fee: '0.1%', security: 'Multi-sig + MPC' },
      wallet: { users: 890000, chains: 47, features: ['Multi-sig', 'Hardware wallet', 'DeFi browser', 'NFT gallery', 'Staking'], security: 'Non-custodial, Kyber-1024' },
      dao: { proposals: 120, voters: 24000, treasury: '$18M', model: 'Shura (Islamic consultation)', quorum: '10% of staked QRN' },
      launchpad: { projects: 34, raised: '$42M', screening: 'Shariah Advisory Board', tiers: ['Seed', 'Private', 'Public'], vestingSchedule: true }
    };
    
    switch (commandName) {
      case 'defi-dashboard': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🔮 DarDeFi™ Protocol Dashboard')
          .addFields(
            { name: '💰 TVL', value: DEFI.tvl, inline: true },
            { name: '📊 Protocols', value: DEFI.protocols.toString(), inline: true },
            { name: '👥 Users', value: DEFI.users.toLocaleString(), inline: true },
            { name: '💱 DEX Volume (24h)', value: DEFI.swap.volume24h, inline: true },
            { name: '🥩 Total Staked', value: DEFI.staking.staked, inline: true },
            { name: '🌉 Bridged', value: DEFI.bridge.volume, inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-swap': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('💱 DarSwap™ — Halal DEX')
          .addFields(
            { name: 'Pairs', value: DEFI.swap.pairs.toLocaleString(), inline: true },
            { name: '24h Volume', value: DEFI.swap.volume24h, inline: true },
            { name: 'Liquidity', value: DEFI.swap.liquidity, inline: true },
            { name: 'Fee', value: DEFI.swap.fee, inline: true },
            { name: 'Chains', value: DEFI.swap.chains.toString(), inline: true },
            { name: 'Screening', value: DEFI.swap.screening },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-staking': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🥩 DarStaking™ — Halal Yield')
          .addFields(
            { name: 'Total Staked', value: DEFI.staking.staked, inline: true },
            { name: 'APY Range', value: DEFI.staking.apy, inline: true },
            { name: 'Validators', value: DEFI.staking.validators.toString(), inline: true },
            { name: 'Lock Periods', value: DEFI.staking.lockPeriods.join(', ') },
            { name: 'Rewards', value: DEFI.staking.rewards },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-nft': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🎨 DarNFT™ — Islamic Digital Assets')
          .addFields(
            { name: 'Collections', value: DEFI.nft.collections.toString(), inline: true },
            { name: 'Items', value: DEFI.nft.items.toLocaleString(), inline: true },
            { name: 'Volume', value: DEFI.nft.volume, inline: true },
            { name: 'Categories', value: DEFI.nft.categories.join(', ') },
            { name: 'Royalties', value: DEFI.nft.royalties },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-bridge': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🌉 DarBridge™ — Cross-Chain')
          .addFields(
            { name: 'Supported Chains', value: DEFI.bridge.chains.toString(), inline: true },
            { name: 'Total Bridged', value: DEFI.bridge.volume, inline: true },
            { name: 'Speed', value: DEFI.bridge.speed, inline: true },
            { name: 'Fee', value: DEFI.bridge.fee, inline: true },
            { name: 'Security', value: DEFI.bridge.security, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-wallet': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('👛 DarWallet™ — Multi-Chain Wallet')
          .addFields(
            { name: 'Users', value: DEFI.wallet.users.toLocaleString(), inline: true },
            { name: 'Chains', value: DEFI.wallet.chains.toString(), inline: true },
            { name: 'Security', value: DEFI.wallet.security, inline: true },
            { name: 'Features', value: DEFI.wallet.features.join('\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-dao': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🏛️ DarDAO™ — Shura Governance')
          .addFields(
            { name: 'Proposals', value: DEFI.dao.proposals.toString(), inline: true },
            { name: 'Voters', value: DEFI.dao.voters.toLocaleString(), inline: true },
            { name: 'Treasury', value: DEFI.dao.treasury, inline: true },
            { name: 'Model', value: DEFI.dao.model },
            { name: 'Quorum', value: DEFI.dao.quorum },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-launchpad': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🚀 DarLaunchpad™ — Token Launches')
          .addFields(
            { name: 'Projects Launched', value: DEFI.launchpad.projects.toString(), inline: true },
            { name: 'Total Raised', value: DEFI.launchpad.raised, inline: true },
            { name: 'Tiers', value: DEFI.launchpad.tiers.join(', '), inline: true },
            { name: 'Screening', value: DEFI.launchpad.screening },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-help': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🔮 DarDeFi Commands')
          .setDescription(['/defi-dashboard', '/defi-swap', '/defi-staking', '/defi-nft', '/defi-bridge', '/defi-wallet', '/defi-dao', '/defi-launchpad'].map(c => `\`${c}\``).join(' • '));
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
        const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant('dardefi-bot');
        const result = await openaiAgents.askAssistant(question, assistantId, 'dardefi-bot', { userId: interaction.user.id });
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
    console.error(`[DarDeFi] Error in /${commandName}:`, error.message);
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
client.on('error', err => { console.error('[DarDeFi] Client error:', err.message); });
client.on('shardError', err => { console.error('[DarDeFi] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[DarDeFi] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
