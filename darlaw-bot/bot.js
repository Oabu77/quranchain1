// ==========================================================
// DarLaw™ Bot — Legal AI with 11 Specialized Agents
// IP protection · Trademark · Patent · Compliance · Shariah
// ==========================================================
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { readFileSync, appendFileSync } = require("fs");
const { resolve } = require("path");
const botIpc = require('../shared/bot-ipc');
const { MeshRouter } = require('../shared/mesh-router');
const openaiAgents = require('../shared/openai-agents');
const discordPremium = require('../shared/discord-premium');
const stripeIntegration = require('../shared/stripe-integration');

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

// ── DarLaw Real Data ────────────────────────────────────────
const LEGAL_AGENTS = [
  { id: 1, name: "Corporate Filing Agent", icon: "🏢", desc: "LLC/Corp formation, EIN applications, state filings, annual reports" },
  { id: 2, name: "Trademark Agent", icon: "™️", desc: "USPTO trademark search, filing, opposition defense, portfolio management" },
  { id: 3, name: "Patent Agent", icon: "📜", desc: "Patent search, provisional/utility filing, prosecution, maintenance" },
  { id: 4, name: "Copyright Agent", icon: "©️", desc: "Copyright registration, DMCA enforcement, licensing agreements" },
  { id: 5, name: "Trade Secret Agent", icon: "🔒", desc: "Trade secret identification, NDA drafting, misappropriation defense" },
  { id: 6, name: "International IP Agent", icon: "🌍", desc: "PCT/Madrid Protocol filings, multi-jurisdiction IP protection" },
  { id: 7, name: "Contract Drafter", icon: "📝", desc: "AI-powered contract generation, clause library, risk analysis" },
  { id: 8, name: "Compliance Reviewer", icon: "✅", desc: "Regulatory compliance scanning, risk assessment, remediation plans" },
  { id: 9, name: "Dispute Resolution", icon: "⚖️", desc: "Mediation, arbitration strategy, litigation support" },
  { id: 10, name: "Regulatory Monitor", icon: "📡", desc: "Real-time regulatory change tracking across 50 jurisdictions" },
  { id: 11, name: "Sharia Law Advisor", icon: "☪️", desc: "Islamic jurisprudence, fatwa research, halal certification compliance" },
];

const IP_TYPES = ["Trademarks", "Patents", "Copyrights", "Trade Secrets"];

function lawEmbed() {
  return new EmbedBuilder().setColor(0x1e3a5f).setFooter({ text: "DarLaw™ · AI-Powered Legal Protection" }).setTimestamp();
}

async function apiFetch(path) {
  try { const r = await fetch(`${API}${path}`); return r.ok ? await r.json() : null; } catch { return null; }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const meshRouter = new MeshRouter('darlaw');

client.on("ready", () => {
  log("INFO", "╔═══════════════════════════════════════════╗");
  log("INFO", "║       DarLaw™ Legal AI Bot — ONLINE       ║");
  log("INFO", "╚═══════════════════════════════════════════╝");
  log("INFO", `✓ Logged in as ${client.user.tag}`);
  log("INFO", `✓ ${LEGAL_AGENTS.length} legal AI agents active`);
  log("INFO", `✓ API: ${API}`);
  log("INFO", `✓ Guilds: ${client.guilds.cache.size}`);
  setInterval(() => log("HEARTBEAT", `Legal Agents: ${LEGAL_AGENTS.length} | IP Types: ${IP_TYPES.length}`), 120_000);
  botIpc.startIpcServer('darlaw', meshRouter.getIpcHandlers());
  meshRouter.start().then(() => log("INFO", `✓ MESH ROUTER ONLINE — ${meshRouter.nodeId}`)).catch(() => {});
});

client.on("interactionCreate", async (i) => {
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
  try {
    if (cmd === "law-agents") {
      const e = lawEmbed().setTitle("⚖️ DarLaw™ Legal AI Agents");
      e.setDescription(`**${LEGAL_AGENTS.length} specialized legal AI agents** protecting the DarCloud ecosystem.`);
      for (const a of LEGAL_AGENTS) {
        e.addFields({ name: `${a.icon} ${a.name}`, value: a.desc, inline: true });
      }
      await i.reply({ embeds: [e] });

    } else if (cmd === "law-ip") {
      const data = await apiFetch("/api/ip");
      const e = lawEmbed().setTitle("🛡️ IP Portfolio");
      if (data?.success) {
        e.setDescription(`**${data.total || 0} IP protections** across the DarCloud portfolio.`);
        if (data.portfolio) {
          for (const item of data.portfolio.slice(0, 15)) {
            e.addFields({ name: `${item.type === "trademark" ? "™️" : item.type === "patent" ? "📜" : "©️"} ${item.name}`, value: `**Type:** ${item.type}\n**Status:** ${item.status}\n**Filed:** ${item.date || "N/A"}`, inline: true });
          }
        }
      } else {
        e.setDescription("IP portfolio data available via API.\nTypes: Trademarks, Patents, Copyrights, Trade Secrets");
        for (const t of IP_TYPES) {
          e.addFields({ name: t, value: "Protected under DarLaw™ AI monitoring", inline: true });
        }
      }
      await i.reply({ embeds: [e] });

    } else if (cmd === "law-filings") {
      const data = await apiFetch("/api/legal-filings");
      const e = lawEmbed().setTitle("📋 Legal Filings");
      if (data?.success && data.filings?.length) {
        e.setDescription(`**${data.total || data.filings.length} legal entities** filed.`);
        for (const f of data.filings.slice(0, 15)) {
          e.addFields({ name: `🏛️ ${f.entity_name}`, value: `**Type:** ${f.entity_type}\n**State:** ${f.state}\n**Status:** ${f.status}`, inline: true });
        }
      } else {
        e.setDescription("Legal filings tracked through the DarCloud API.\nCovers all 101 DarCloud entities across multiple jurisdictions.");
      }
      await i.reply({ embeds: [e] });

    } else if (cmd === "law-contracts") {
      const data = await apiFetch("/api/contracts");
      const e = lawEmbed().setTitle("📄 Contract Registry");
      if (data?.success && data.contracts?.length) {
        e.setDescription(`**${data.total || data.contracts.length} active contracts** in the ecosystem.`);
        let totalFees = 0;
        for (const c of data.contracts.slice(0, 10)) {
          totalFees += c.monthly_fee || 0;
          e.addFields({ name: `📋 ${c.contract_name || c.name}`, value: `**Parties:** ${c.party_a} ↔ ${c.party_b}\n**Fee:** $${(c.monthly_fee || 0).toLocaleString()}/mo`, inline: true });
        }
        if (data.contracts.length > 10) {
          e.addFields({ name: "...", value: `+${data.contracts.length - 10} more contracts`, inline: false });
        }
      } else {
        e.setDescription("Contract registry available via DarCloud API.");
      }
      await i.reply({ embeds: [e] });

    } else if (cmd === "law-trademark") {
      const agent = LEGAL_AGENTS[1];
      const e = lawEmbed().setTitle(`${agent.icon} ${agent.name}`);
      e.setDescription(agent.desc);
      e.addFields(
        { name: "Services", value: "• USPTO trademark search\n• Application filing (TEAS)\n• Office action responses\n• Opposition proceedings\n• Portfolio management\n• International (Madrid Protocol)", inline: false },
        { name: "AI Capabilities", value: "• Conflict search across 90M+ marks\n• Classification suggestion (Nice system)\n• Specimen review\n• Monitoring & renewal alerts", inline: false },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "law-patent") {
      const agent = LEGAL_AGENTS[2];
      const e = lawEmbed().setTitle(`${agent.icon} ${agent.name}`);
      e.setDescription(agent.desc);
      e.addFields(
        { name: "Services", value: "• Prior art search (USPTO + WIPO)\n• Provisional application drafting\n• Utility patent filing\n• Claims construction\n• Office action prosecution\n• Maintenance fee tracking", inline: false },
        { name: "AI Capabilities", value: "• Patent landscape analysis\n• Claim mapping to prior art\n• Freedom-to-operate opinions\n• Portfolio valuation", inline: false },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "law-compliance") {
      const agent = LEGAL_AGENTS[7];
      const e = lawEmbed().setTitle(`${agent.icon} ${agent.name}`);
      e.setDescription(agent.desc);
      e.addFields(
        { name: "Regulatory Frameworks", value: "• SEC/FINRA (Securities)\n• AML/KYC (Anti-Money Laundering)\n• GDPR/CCPA (Privacy)\n• OFAC (Sanctions)\n• AAOIFI (Islamic Finance)\n• OIC Fiqh Academy", inline: true },
        { name: "Monitoring", value: "• 50 jurisdiction tracking\n• Real-time alert system\n• Quarterly audit reports\n• Remediation workflows", inline: true },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "law-shariah") {
      const agent = LEGAL_AGENTS[10];
      const e = lawEmbed().setTitle(`${agent.icon} ${agent.name}`);
      e.setDescription(agent.desc);
      e.addFields(
        { name: "Expertise", value: "• Fiqh al-Muamalat (commercial law)\n• Halal/Haram classification\n• Fatwa research & citation\n• Contract Shariah review\n• Sukuk structuring\n• Takaful compliance\n• Waqf administration", inline: false },
        { name: "Standards", value: "AAOIFI · OIC Fiqh Academy · IFSB", inline: true },
        { name: "Certifications", value: "DarShariah™ seal of approval", inline: true },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "law-help") {
      const e = lawEmbed().setTitle("⚖️ DarLaw Bot Commands");
      e.setDescription([
        "`/law-agents` — All 11 legal AI agents",
        "`/law-ip` — IP portfolio (trademarks, patents, copyrights)",
        "`/law-filings` — Legal entity filings",
        "`/law-contracts` — Contract registry",
        "`/law-trademark` — Trademark agent details",
        "`/law-patent` — Patent agent details",
        "`/law-compliance` — Compliance & regulatory info",
        "`/law-shariah` — Sharia Law Advisor details",
        "`/law-help` — This help message",
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
      const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant("darlaw-bot");
      const result = await openaiAgents.askAssistant(question, assistantId, "darlaw-bot", { userId: i.user.id });
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
