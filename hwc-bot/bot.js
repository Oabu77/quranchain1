// ==========================================================
// Halal Wealth Club™ Bot — Islamic Banking & Finance
// Zero-riba · Shariah-compliant · 31 USA markets
// ==========================================================
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { readFileSync, appendFileSync } = require("fs");
const { resolve } = require("path");

// ── Shared modules ──────────────────────────────────────────
const onboardingDb = require("../shared/onboarding-db");
const onboardingEngine = require("../shared/onboarding-engine");
const botIpc = require("../shared/bot-ipc");
const { MeshRouter } = require("../shared/mesh-router");
const openaiAgents = require("../shared/openai-agents");
const discordPremium = require('../shared/discord-premium');
const stripeIntegration = require('../shared/stripe-integration');
const meshRouter = new MeshRouter("hwc");

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

// ── HWC Real Data ───────────────────────────────────────────
const BANKING_SERVICES = [
  { name: "HWC Checking", icon: "🏦", desc: "Zero-fee halal checking accounts", rate: "0% fees", status: "active" },
  { name: "HWC Savings", icon: "💰", desc: "Mudarabah profit-sharing savings", rate: "4.2% profit share", status: "active" },
  { name: "Home Finance", icon: "🏠", desc: "Zero-riba home purchase — $5K auto-approval", rate: "0% interest", status: "active" },
  { name: "Business Finance", icon: "🏢", desc: "Musharakah joint-venture business loans", rate: "Profit-sharing", status: "active" },
  { name: "Construction", icon: "🏗️", desc: "Istisna milestone-based construction finance", rate: "Project-based", status: "active" },
  { name: "Trade Finance", icon: "📦", desc: "Murabaha cost-plus trade financing", rate: "Cost + markup", status: "active" },
];

const FINANCE_PRODUCTS = [
  { name: "DarMurabaha™", type: "Trade Finance", desc: "Cost-plus trade financing with transparent markup" },
  { name: "DarMusharakah™", type: "Joint Venture", desc: "Equity-based partnership financing" },
  { name: "DarMudarabah™", type: "Investment", desc: "Profit-sharing investment with capital provider" },
  { name: "DarIjarah™", type: "Leasing", desc: "Lease-to-own asset financing" },
  { name: "DarIstisna™", type: "Construction", desc: "Manufacturing/construction milestone payments" },
  { name: "DarWakala™", type: "Agency", desc: "Agent-based investment management" },
  { name: "DarTakaful™", type: "Insurance", desc: "Cooperative Islamic insurance" },
  { name: "DarSukuk™", type: "Bonds", desc: "Shariah-compliant bond issuance" },
];

const USA_MARKETS = [
  "Dearborn MI", "Houston TX", "Dallas TX", "Chicago IL", "New York NY",
  "Los Angeles CA", "San Diego CA", "San Francisco CA", "Seattle WA", "Portland OR",
  "Minneapolis MN", "Columbus OH", "Indianapolis IN", "Nashville TN", "Atlanta GA",
  "Miami FL", "Tampa FL", "Orlando FL", "Charlotte NC", "Raleigh NC",
  "Philadelphia PA", "Newark NJ", "Patterson NJ", "Detroit MI", "Milwaukee WI",
  "Phoenix AZ", "Denver CO", "Las Vegas NV", "Austin TX", "San Antonio TX",
  "Washington DC",
];

const COMPLIANCE = {
  board: "DarShariah™ Compliance Board",
  standard: "AAOIFI + OIC Fiqh Academy",
  audit: "Quarterly independent Shariah audit",
  zakat: "Auto-calculated 2% annual zakat",
  prohibited: "No riba, gharar, maysir, or haram investments",
};

function hwcEmbed() {
  return new EmbedBuilder().setColor(0xd4af37).setFooter({ text: "Halal Wealth Club™ · 100% Shariah-Compliant" }).setTimestamp();
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on("ready", () => {
  log("INFO", "╔═══════════════════════════════════════════╗");
  log("INFO", "║   Halal Wealth Club™ Bot — ONLINE         ║");
  log("INFO", "╚═══════════════════════════════════════════╝");
  log("INFO", `✓ Logged in as ${client.user.tag}`);
  log("INFO", `✓ ${BANKING_SERVICES.length} banking services`);
  log("INFO", `✓ ${FINANCE_PRODUCTS.length} finance products`);
  log("INFO", `✓ ${USA_MARKETS.length} USA markets`);
  log("INFO", `✓ Guilds: ${client.guilds.cache.size}`);

  // Start IPC server + mesh routing
  const meshHandlers = meshRouter.getIpcHandlers();
  botIpc.startIpcServer("hwc", {
    "/apply": async (req, body) => {
      onboardingDb.getOrCreateMember(body.discord_id, body.discord_tag);
      onboardingDb.provisionService(body.discord_id, "HWC Banking", "banking", { tier: body.tier || "free" });
      return { success: true };
    },
    ...meshHandlers,
  });
  meshRouter.start().then(() => log("INFO", `✓ MESH ROUTER ONLINE — ${meshRouter.nodeId}`)).catch(() => {});

  setInterval(() => log("HEARTBEAT", `Services: ${BANKING_SERVICES.length} | Products: ${FINANCE_PRODUCTS.length} | Markets: ${USA_MARKETS.length}`), 120_000);
});

client.on("interactionCreate", async (i) => {
  // Handle onboarding interactions
  if (i.isButton() || i.isModalSubmit() || i.isStringSelectMenu()) {
    try {
      const handled = await onboardingEngine.handleOnboardingInteraction(i, "hwc");
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

  // Handle shared onboarding commands
  const onboardCmds = ["onboard", "dashboard", "referral", "services", "subscribe"];
  if (onboardCmds.includes(i.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(i, "hwc"); } catch (err) {
      log("ERROR", `[${i.commandName}] ${err.message}`);
    }
    return;
  }

  const cmd = i.commandName;
  try {
    if (cmd === "hwc-services") {
      const e = hwcEmbed().setTitle("🏦 Halal Wealth Club™ — Banking Services");
      e.setDescription("**Zero-riba banking** · 100% Shariah-compliant · Private membership");
      for (const s of BANKING_SERVICES) {
        e.addFields({ name: `${s.icon} ${s.name}`, value: `${s.desc}\n**Rate:** ${s.rate} · **Status:** 🟢 ${s.status}`, inline: true });
      }
      await i.reply({ embeds: [e] });

    } else if (cmd === "hwc-home") {
      const e = hwcEmbed().setTitle("🏠 Zero-Riba Home Finance");
      e.setDescription("**$5,000 down = Auto-approved** for full home purchase.\nZero interest. Zero riba. Smart contract secured on QuranChain.");
      e.addFields(
        { name: "Down Payment", value: "$5,000 (fixed)", inline: true },
        { name: "Interest Rate", value: "**0% — ZERO RIBA**", inline: true },
        { name: "Approval", value: "Auto-approved", inline: true },
        { name: "Contract", value: "QuranChain smart contract", inline: true },
        { name: "Markets", value: `${USA_MARKETS.length} USA cities`, inline: true },
        { name: "Properties", value: "Bank-owned inventory", inline: true },
        { name: "How It Works", value: "1. Apply with $5K deposit\n2. Auto-approved instantly\n3. Select property from bank-owned inventory\n4. Smart contract executes on QuranChain\n5. Move in — pay monthly cost-sharing (no interest)", inline: false },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "hwc-products") {
      const e = hwcEmbed().setTitle("📋 Islamic Finance Products");
      for (const p of FINANCE_PRODUCTS) {
        e.addFields({ name: `💎 ${p.name}`, value: `**Type:** ${p.type}\n${p.desc}`, inline: true });
      }
      await i.reply({ embeds: [e] });

    } else if (cmd === "hwc-markets") {
      const e = hwcEmbed().setTitle("🇺🇸 USA Markets — 31 Cities");
      e.setDescription("Halal Wealth Club operates in **31 major Muslim communities** across the United States.");
      const cols = [USA_MARKETS.slice(0, 11), USA_MARKETS.slice(11, 21), USA_MARKETS.slice(21)];
      cols.forEach((col, idx) => {
        e.addFields({ name: `Region ${idx + 1}`, value: col.map(c => `📍 ${c}`).join("\n"), inline: true });
      });
      await i.reply({ embeds: [e] });

    } else if (cmd === "hwc-compliance") {
      const e = hwcEmbed().setTitle("☪️ Shariah Compliance");
      e.setDescription("Every HWC product is certified by the **DarShariah™ Compliance Board**.");
      e.addFields(
        { name: "Compliance Board", value: COMPLIANCE.board, inline: false },
        { name: "Standards", value: COMPLIANCE.standard, inline: true },
        { name: "Audit", value: COMPLIANCE.audit, inline: true },
        { name: "Zakat", value: COMPLIANCE.zakat, inline: true },
        { name: "Prohibited Activities", value: COMPLIANCE.prohibited, inline: false },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "hwc-realestate") {
      const e = hwcEmbed().setTitle("🏘️ Dar Al Nas Real Estate™");
      e.setDescription("Zero-riba property acquisition. Bank-owned properties in 31 USA Muslim cities.");
      e.addFields(
        { name: "Model", value: "Buy bank-owned properties at cost", inline: true },
        { name: "Interest", value: "**ZERO — Halal only**", inline: true },
        { name: "Down Payment", value: "$5,000 auto-approval", inline: true },
        { name: "Contract", value: "QuranChain smart contract", inline: true },
        { name: "Cities", value: `${USA_MARKETS.length} USA markets`, inline: true },
        { name: "Shariah", value: "DarShariah™ certified", inline: true },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "hwc-zakat") {
      const e = hwcEmbed().setTitle("🕌 DarZakat™ — Auto Zakat");
      e.setDescription("Automatic 2% annual zakat calculation and distribution built into every HWC account.");
      e.addFields(
        { name: "Rate", value: "2.5% of qualifying wealth (nisab)", inline: true },
        { name: "Frequency", value: "Annual auto-calculation", inline: true },
        { name: "Distribution", value: "8 Quranic categories (Asnaf)", inline: true },
        { name: "How It Works", value: "1. Your qualifying assets are tracked in real-time\n2. Zakat is auto-calculated at nisab threshold\n3. You approve distribution categories\n4. Funds distributed to verified recipients\n5. Blockchain receipt on QuranChain", inline: false },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "hwc-apply") {
      const e = hwcEmbed().setTitle("📝 Apply for HWC Membership");
      e.setDescription("Join the **Halal Wealth Club** — private Islamic wealth management for the global Muslim community.");
      e.addFields(
        { name: "Step 1", value: "Visit `halalwealthclub.darcloud.host`", inline: false },
        { name: "Step 2", value: "Complete the membership application", inline: false },
        { name: "Step 3", value: "Upload valid ID + proof of income", inline: false },
        { name: "Step 4", value: "DarShariah™ compliance verification", inline: false },
        { name: "Step 5", value: "Account activated — start banking halal!", inline: false },
        { name: "Membership Tiers", value: "**Standard** — Free\n**Gold** — $49/mo\n**Platinum** — $199/mo\n **Diamond** — By invitation", inline: false },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "hwc-help") {
      const e = hwcEmbed().setTitle("🏦 HWC Bot Commands");
      e.setDescription([
        "`/hwc-services` — Banking services overview",
        "`/hwc-home` — Zero-riba home finance ($5K auto-approval)",
        "`/hwc-products` — 8 Islamic finance products",
        "`/hwc-markets` — 31 USA market cities",
        "`/hwc-compliance` — Shariah compliance details",
        "`/hwc-realestate` — Dar Al Nas Real Estate",
        "`/hwc-zakat` — Automatic zakat calculation",
        "`/hwc-apply` — Membership application info",
        "`/hwc-help` — This help message",
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
      const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant("hwc-bot");
      const result = await openaiAgents.askAssistant(question, assistantId, "hwc-bot", { userId: i.user.id });
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
