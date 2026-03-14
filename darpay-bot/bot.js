// ==========================================================
// DarPay™ Revenue Engine Bot — LIVE Payments, Stripe, Gas Tolls
// 47 chains · 30% immutable founder royalty · 5 revenue streams
// Integrated with QuranChain blockchain & shared onboarding
// ==========================================================
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { readFileSync, appendFileSync } = require("fs");
const { resolve } = require("path");

// ── Shared modules ──────────────────────────────────────────
const onboardingDb = require("../shared/onboarding-db");
const stripeIntegration = require("../shared/stripe-integration");
const botIpc = require("../shared/bot-ipc");
const onboardingEngine = require("../shared/onboarding-engine");
const { MeshRouter } = require("../shared/mesh-router");const openaiAgents = require('../shared/openai-agents');const meshRouter = new MeshRouter("darpay");
const discordPremium = require('../shared/discord-premium');

try {
  const env = readFileSync(resolve(__dirname, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#") && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}

const TOKEN = process.env.DISCORD_TOKEN;
const API = process.env.API_BASE || "http://localhost:8787";
if (!TOKEN) { console.error("Missing DISCORD_TOKEN"); process.exit(1); }

function log(level, msg) {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}`;
  console.log(line);
  try { appendFileSync(resolve(__dirname, "bot.log"), line + "\n"); } catch {}
}

// ── Revenue Data (from contracts — IMMUTABLE) ─────────────
const REVENUE_SPLIT = stripeIntegration.REVENUE_SPLIT;
const GAS_TOLL_CHAINS = stripeIntegration.GAS_TOLL_CHAINS;

const REVENUE_STREAMS = [
  { name: "Gas Toll Highway", icon: "⛽", desc: "0.1% toll on 47 blockchain networks", endpoint: "blockchain.darcloud.host" },
  { name: "Fiat Payments", icon: "💳", desc: "DarPay™ Stripe-powered halal processor", endpoint: "payments.darcloud.host" },
  { name: "Subscriptions", icon: "📊", desc: "SaaS tier billing (Free → Enterprise)", endpoint: "billing.darcloud.host" },
  { name: "Enterprise Licensing", icon: "🏢", desc: "B2B enterprise cloud services", endpoint: "enterprise.darcloud.host" },
  { name: "Network Provider", icon: "🌐", desc: "FungiMesh bandwidth & relay fees", endpoint: "mesh.darcloud.host" },
];

function payEmbed() {
  return new EmbedBuilder().setColor(0x22c55e).setFooter({ text: "DarPay™ · Revenue Engine · 30% Founder Royalty IMMUTABLE" }).setTimestamp();
}

async function apiFetch(path) {
  try { const r = await fetch(`${API}${path}`); return r.ok ? await r.json() : null; } catch { return null; }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on("ready", () => {
  log("INFO", "╔═══════════════════════════════════════════╗");
  log("INFO", "║   DarPay™ Revenue Engine Bot — ONLINE     ║");
  log("INFO", "╚═══════════════════════════════════════════╝");
  log("INFO", `✓ Logged in as ${client.user.tag}`);
  log("INFO", `✓ Stripe: ${process.env.STRIPE_SECRET_KEY ? "LIVE" : "SIMULATION"}`);
  log("INFO", `✓ ${REVENUE_STREAMS.length} revenue streams`);
  log("INFO", `✓ ${GAS_TOLL_CHAINS.length} gas toll chains`);
  log("INFO", `✓ 30% Founder Royalty: IMMUTABLE`);

  // Start IPC + mesh routing
  const meshHandlers = meshRouter.getIpcHandlers();
  botIpc.startIpcServer("darpay", {
    "/checkout": async (req, body) => {
      const session = await stripeIntegration.createCheckoutSession(body.discord_id, body.product, body.metadata || {});
      return session;
    },
    "/revenue-report": async () => stripeIntegration.getRevenueReport(),
    ...meshHandlers,
  });
  meshRouter.start().then(() => log("INFO", `✓ MESH ROUTER ONLINE — ${meshRouter.nodeId}`)).catch(() => {});

  setInterval(() => log("HEARTBEAT", `Streams: ${REVENUE_STREAMS.length} | Chains: ${GAS_TOLL_CHAINS.length}`), 120_000);
});

client.on("interactionCreate", async (i) => {
  // Handle onboarding interactions
  if (i.isButton() || i.isModalSubmit() || i.isStringSelectMenu()) {
    try {
      const handled = await onboardingEngine.handleOnboardingInteraction(i, "darpay");
      if (handled) return;
    } catch (err) { log("ERROR", `Onboarding interaction: ${err.message}`); }
  }

  // Premium button handler
  if (i.isButton() && i.customId === "premium_compare") {
    await i.deferReply({ ephemeral: true });
    const comp = discordPremium.createComparisonEmbed();
    await i.editReply(comp);
    return;
  }

  if (i.isButton() && i.customId.startsWith('shop_buy_')) {
    try {
      await i.deferReply({ ephemeral: true });
      const result = discordPremium.handleShopButton(i.customId);
      if (result.handled && result.plan) {
        const session = await stripeIntegration.createCheckoutSession(i.user.id, result.plan);
        const embed = new EmbedBuilder().setColor(0xFFD700).setTitle('💳 Checkout').setDescription(`🔗 **[Complete Checkout](${session.url})**`).setTimestamp();
        await i.editReply({ embeds: [embed] });
      }
      return;
    } catch (err) { if (!i.replied) await i.editReply({ content: '❌ ' + err.message }).catch(() => {}); return; }
  }

  if (!i.isChatInputCommand()) return;
  const cmd = i.commandName;

  // Handle shared onboarding commands
  const onboardCmds = ["onboard", "dashboard", "referral", "services", "subscribe"];
  if (onboardCmds.includes(cmd)) {
    try { await onboardingEngine.handleOnboardingCommand(i, "darpay"); } catch (err) {
      log("ERROR", `[${cmd}] ${err.message}`);
      if (!i.replied) await i.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {});
    }
    return;
  }

  try {
    if (cmd === "pay-dashboard") {
      const report = stripeIntegration.getRevenueReport();
      const e = payEmbed().setTitle("💰 DarPay™ Revenue Dashboard");
      e.setDescription(
        `**Total Revenue:** ${report.total_revenue_display}\n` +
        `**Members:** ${report.members.total} (${report.members.onboarded} onboarded)\n` +
        `**Conversion:** ${report.members.conversion_rate}\n` +
        `**Gas Toll Chains:** ${report.gas_toll_chains}\n\n` +
        `**Revenue Splits:**\n` +
        `👑 Founder: ${report.splits.founder}\n` +
        `🤖 Validators: ${report.splits.validators}\n` +
        `🖥️ Hardware: ${report.splits.hardware}\n` +
        `🌍 Ecosystem: ${report.splits.ecosystem}\n` +
        `🕌 Zakat: ${report.splits.zakat}`
      );
      for (const s of REVENUE_STREAMS) {
        e.addFields({ name: `${s.icon} ${s.name}`, value: `${s.desc}\n\`${s.endpoint}\``, inline: true });
      }
      await i.reply({ embeds: [e] });

    } else if (cmd === "pay-checkout") {
      const product = i.options.getString("product");
      const userId = i.user.id;
      const userTag = i.user.tag || i.user.username;

      // Ensure member exists
      onboardingDb.getOrCreateMember(userId, userTag);

      const session = await stripeIntegration.createCheckoutSession(userId, product);

      const e = payEmbed().setTitle("💳 DarPay Checkout");
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Complete Payment")
          .setStyle(ButtonStyle.Link)
          .setURL(session.url),
      );

      const productInfo = stripeIntegration.STRIPE_PRODUCTS[product];
      e.setDescription(
        `**Product:** ${productInfo.name}\n` +
        `**Price:** $${(productInfo.price_cents / 100).toFixed(2)}${productInfo.interval !== "one_time" ? "/" + productInfo.interval : ""}\n\n` +
        (session.simulated ? "⚠️ *Simulation mode — set STRIPE_SECRET_KEY for live payments*\n" : "") +
        "Click the button below to complete your payment."
      );
      await i.reply({ embeds: [e], components: [row], ephemeral: true });

    } else if (cmd === "pay-split") {
      const e = payEmbed().setTitle("📊 Revenue Distribution — IMMUTABLE");
      e.setDescription("The revenue split is **hardcoded and immutable**. 30% Founder Royalty can NEVER be changed.");
      const splits = [
        { label: "Founder Royalty (IMMUTABLE)", pct: 30, icon: "👑" },
        { label: "AI Validators", pct: 40, icon: "🤖" },
        { label: "Hardware Hosts", pct: 10, icon: "🖥️" },
        { label: "Ecosystem Fund", pct: 18, icon: "🌍" },
        { label: "Zakat Distribution", pct: 2, icon: "🕌" },
      ];
      for (const s of splits) {
        const bar = "█".repeat(Math.round(s.pct / 5)) + "░".repeat(20 - Math.round(s.pct / 5));
        e.addFields({ name: `${s.icon} ${s.label}`, value: `\`${bar}\` **${s.pct}%**`, inline: false });
      }
      await i.reply({ embeds: [e] });

    } else if (cmd === "pay-gastoll") {
      const e = payEmbed().setTitle("⛽ Gas Toll Highway");
      e.setDescription(`**${GAS_TOLL_CHAINS.length} blockchain networks** monitored\n**Toll Rate:** 0.1% per transaction\n**Founder Royalty:** 30% of all gas toll revenue`);
      const col1 = GAS_TOLL_CHAINS.slice(0, 16);
      const col2 = GAS_TOLL_CHAINS.slice(16, 32);
      const col3 = GAS_TOLL_CHAINS.slice(32);
      e.addFields(
        { name: "Chains 1-16", value: col1.map(c => `⛓️ ${c}`).join("\n"), inline: true },
        { name: "Chains 17-32", value: col2.map(c => `⛓️ ${c}`).join("\n"), inline: true },
        { name: `Chains 33-${GAS_TOLL_CHAINS.length}`, value: col3.map(c => `⛓️ ${c}`).join("\n"), inline: true },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "pay-subscriptions") {
      const tiers = onboardingEngine.SUBSCRIPTION_TIERS;
      const e = payEmbed().setTitle("📊 Subscription Tiers");
      for (const [key, tier] of Object.entries(tiers)) {
        if (key === "custom") continue;
        const price = tier.price === 0 ? "Free" : `$${(tier.price / 100).toFixed(2)}/mo`;
        e.addFields({ name: `💎 ${tier.name} — ${price}`, value: tier.features.join(", "), inline: false });
      }
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("onboard_start").setLabel("🚀 Get Started").setStyle(ButtonStyle.Success),
      );
      await i.reply({ embeds: [e], components: [row] });

    } else if (cmd === "pay-enterprise") {
      const e = payEmbed().setTitle("🏢 Enterprise Services");
      e.setDescription("B2B enterprise cloud with compliance, SLA guarantees, and dedicated support.");
      e.addFields(
        { name: "Startup", value: "$499/mo — 50 AI agents, 10K mesh nodes, email support", inline: false },
        { name: "Business", value: "$1,999/mo — 200 AI agents, 50K mesh nodes, phone support, SLA 99.9%", inline: false },
        { name: "Enterprise", value: "Custom — Unlimited, white-label, 24/7 dedicated team, SLA 99.99%", inline: false },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "pay-contracts") {
      await i.deferReply();
      const data = await apiFetch("/api/contracts");
      const e = payEmbed().setTitle("📄 Revenue-Generating Contracts");
      if (data?.success && data.contracts?.length) {
        const top10 = data.contracts.sort((a, b) => (b.monthly_fee || 0) - (a.monthly_fee || 0)).slice(0, 10);
        for (const c of top10) {
          e.addFields({ name: c.contract_name || c.name, value: `$${(c.monthly_fee || 0).toLocaleString()}/mo`, inline: true });
        }
        const allTotal = data.contracts.reduce((s, c) => s + (c.monthly_fee || 0), 0);
        e.setDescription(`**${data.contracts.length} contracts** · **$${allTotal.toLocaleString()}/mo** total\n30% Founder Royalty = **$${Math.round(allTotal * 0.3).toLocaleString()}/mo**`);
      }
      await i.editReply({ embeds: [e] });

    } else if (cmd === "pay-zakat") {
      const report = stripeIntegration.getRevenueReport();
      const e = payEmbed().setTitle("🕌 Zakat Distribution (2%)");
      e.setDescription(
        "2% of ALL revenue is automatically allocated to zakat.\n\n" +
        `**Current Zakat Fund:** ${report.splits.zakat}\n\n` +
        "**Recipients (8 Quranic Categories):**\n" +
        "1. Al-Fuqara (Poor)\n2. Al-Masakin (Needy)\n3. Amil Zakat (Collectors)\n" +
        "4. Muallaf (New Muslims)\n5. Riqab (Freeing captives)\n6. Gharimin (Debtors)\n" +
        "7. Fi Sabilillah (Cause of Allah)\n8. Ibn Sabil (Travelers)"
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "pay-help") {
      const e = payEmbed().setTitle("💰 DarPay Bot Commands");
      e.setDescription([
        "`/pay-dashboard` — Revenue dashboard with live stats",
        "`/pay-checkout` — Start a Stripe payment checkout",
        "`/pay-split` — Revenue distribution breakdown (immutable)",
        "`/pay-gastoll` — Gas toll highway (47 chains)",
        "`/pay-subscriptions` — SaaS subscription tiers",
        "`/pay-enterprise` — Enterprise service pricing",
        "`/pay-contracts` — Revenue-generating contracts",
        "`/pay-zakat` — 2% zakat distribution details",
        "`/onboard` — Start member onboarding",
        "`/dashboard` — View your member dashboard",
        "`/subscribe` — Subscribe to a plan",
        "`/pay-help` — This help message",
      ].join("\n"));
      await i.reply({ embeds: [e] });
    } else if (cmd === "setup") {
      await i.deferReply();
      const autoSetup = require("../shared/auto-setup");
      const onboardingDb = require("../shared/onboarding-db");
      onboardingDb.getOrCreateMember(i.user.id, i.user.tag || i.user.username);
      const results = autoSetup.setupAllServices(i.user.id, i.user.tag || i.user.username);
      const { embed, row } = autoSetup.createSetupCompleteEmbed(i.user.tag || i.user.username, results);
      await i.editReply({ embeds: [embed], components: row ? [row] : [] });

    } else if (cmd === "my-services") {
      await i.deferReply();
      const autoSetup = require("../shared/auto-setup");
      const embed = autoSetup.createServiceStatusEmbed(i.user.id, i.user.tag || i.user.username);
      await i.editReply({ embeds: [embed] });

    } else if (cmd === "upgrade") {
      await i.deferReply();
      const stripeIntegration = require("../shared/stripe-integration");
      const plan = i.options.getString("plan");
      try {
        const session = await stripeIntegration.createCheckoutSession(i.user.id, plan);
        const { EmbedBuilder } = require("discord.js");
        const embed = new EmbedBuilder().setColor(0x00D4AA).setTitle("⬆️ Upgrade Plan").setDescription("Click below to upgrade:\n\n[🔗 Secure Checkout](" + session.url + ")");
        await i.editReply({ embeds: [embed] });
      } catch (err) {
        await i.editReply({ content: "❌ " + err.message });
      }
    } else if (cmd === "ai-ask") {
      await i.deferReply();
      const usageCheck = discordPremium.checkUsageLimit(i, "ai-ask");
      if (!usageCheck.allowed) { const upsell = discordPremium.createUpsellEmbed(usageCheck, "ai-ask"); await i.editReply(upsell); return; }
      discordPremium.trackUsage(i.user.id, "ai-ask");
      const question = i.options.getString("question");
      const agent = i.options.getString("agent") || null;
      const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant("darpay-bot");
      const result = await openaiAgents.askAssistant(question, assistantId, "darpay-bot", { userId: i.user.id });
      const { EmbedBuilder: AiEmbed } = require("discord.js");
      const aiEmbed = new AiEmbed().setColor(result.success ? 0x10B981 : 0xEF4444).setTitle(`🤖 ${result.assistant || "AI"}`).setDescription(result.success ? result.answer : `❌ ${result.error}`).setFooter({ text: result.success ? `${result.model} • ${result.tokens} tokens` : "OpenAI" }).setTimestamp();
      await i.editReply({ embeds: [aiEmbed] });
    } else if (cmd === "premium") {
      await i.deferReply();
      const embed = discordPremium.createPremiumStatusEmbed(i);
      const tier = discordPremium.getUserTier(i);
      if (tier !== "empire") { const c = discordPremium.createComparisonEmbed(); await i.editReply({ embeds: [embed, ...c.embeds], components: c.components }); }
      else { await i.editReply({ embeds: [embed] }); }
    } else if (cmd === "shop") {
      await i.deferReply();
      const shopData = discordPremium.createShopEmbed(i);
      await i.editReply(shopData);
    }
  } catch (err) {
    log("ERROR", `Command /${cmd}: ${err.message}`);
    const reply = { content: `❌ Error: ${err.message}`, ephemeral: true };
    i.deferred || i.replied ? await i.editReply(reply) : await i.reply(reply);
  }
});

// Discord Premium entitlement events
client.on("entitlementCreate", e => { discordPremium.handleEntitlementCreate(e); console.log(`[PREMIUM] New sub: ${e.userId}`); });
client.on("entitlementUpdate", (o, n) => { discordPremium.handleEntitlementUpdate(o, n); });
client.on("entitlementDelete", e => { discordPremium.handleEntitlementDelete(e); console.log(`[PREMIUM] Cancelled: ${e.userId}`); });

process.on("SIGINT", () => { log("INFO", "Shutting down..."); client.destroy(); process.exit(0); });
process.on("SIGTERM", () => { log("INFO", "Shutting down..."); client.destroy(); process.exit(0); });
client.login(TOKEN);
