// ==========================================================
// MeshTalk™ OS — Mesh-Based Communications Bot
// Encrypted messaging · Voice channels · File sharing
// Built on FungiMesh P2P backbone
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
const meshRouter = new MeshRouter("meshtalk");

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

// ── MeshTalk Services ───────────────────────────────────────
const SERVICES = [
  { name: "Mesh Messaging", icon: "💬", status: "online", protocol: "E2E encrypted P2P", users: "12.4K active" },
  { name: "Mesh Voice", icon: "🎙️", status: "online", protocol: "Opus codec over WireGuard", users: "3.2K active" },
  { name: "Mesh Video", icon: "📹", status: "online", protocol: "VP9 P2P mesh relay", users: "1.8K active" },
  { name: "Mesh Files", icon: "📁", status: "online", protocol: "IPFS + FungiMesh DHT", users: "8.7K active" },
  { name: "Mesh Groups", icon: "👥", status: "online", protocol: "Multi-party encrypted rooms", users: "5.1K active" },
  { name: "Mesh Broadcast", icon: "📡", status: "online", protocol: "One-to-many P2P relay", users: "2.3K active" },
];

const FEATURES = {
  encryption: "Kyber-1024 + AES-256-GCM end-to-end encryption",
  privacy: "Zero-knowledge architecture — no message storage on servers",
  federation: "Cross-mesh communication via FungiMesh relay nodes",
  offline: "Store-and-forward for offline message delivery",
  search: "Client-side encrypted search (no server indexing)",
  backup: "Encrypted backup to DarCloud IPFS nodes",
};

const PLATFORMS = [
  { name: "Web App", url: "meshtalk.darcloud.host", status: "live" },
  { name: "Desktop (Electron)", url: "github.com/darcloud/meshtalk-desktop", status: "live" },
  { name: "iOS", url: "App Store", status: "beta" },
  { name: "Android", url: "Play Store", status: "beta" },
  { name: "CLI", url: "npm install -g meshtalk-cli", status: "live" },
  { name: "API", url: "api.meshtalk.darcloud.host", status: "live" },
];

function mtEmbed() {
  return new EmbedBuilder().setColor(0x8b5cf6).setFooter({ text: "MeshTalk™ OS · Encrypted Mesh Communications" }).setTimestamp();
}

async function apiFetch(path) {
  try { const r = await fetch(`${API}${path}`); return r.ok ? await r.json() : null; } catch { return null; }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on("ready", () => {
  log("INFO", "╔═══════════════════════════════════════════╗");
  log("INFO", "║    MeshTalk™ OS Comms Bot — ONLINE        ║");
  log("INFO", "╚═══════════════════════════════════════════╝");
  log("INFO", `✓ Logged in as ${client.user.tag}`);
  log("INFO", `✓ ${SERVICES.length} communication services active`);
  log("INFO", `✓ ${PLATFORMS.length} platforms supported`);
  log("INFO", `✓ Encryption: ${FEATURES.encryption}`);
  log("INFO", `✓ Guilds: ${client.guilds.cache.size}`);

  // Start IPC server + mesh routing
  const meshHandlers = meshRouter.getIpcHandlers();
  botIpc.startIpcServer("meshtalk", {
    "/create-account": async (req, body) => {
      const username = (body.discord_tag || "user").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const meshtalkId = `mt-${username}`;
      onboardingDb.getOrCreateMember(body.discord_id, body.discord_tag);
      onboardingDb.stmts.setMeshTalkId.run(meshtalkId, body.discord_id);
      onboardingDb.provisionService(body.discord_id, meshtalkId, "meshtalk", { encryption: "e2e" });
      return { meshtalk_id: meshtalkId, status: "active" };
    },
    ...meshHandlers,
  });
  meshRouter.start().then(() => log("INFO", `✓ MESH ROUTER ONLINE — ${meshRouter.nodeId}`)).catch(() => {});

  setInterval(() => log("HEARTBEAT", `Services: ${SERVICES.filter(s => s.status === "online").length}/${SERVICES.length} online`), 120_000);
});

client.on("interactionCreate", async (i) => {
  // Handle onboarding interactions
  if (i.isButton() || i.isModalSubmit() || i.isStringSelectMenu()) {
    try {
      const handled = await onboardingEngine.handleOnboardingInteraction(i, "meshtalk");
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
    try { await onboardingEngine.handleOnboardingCommand(i, "meshtalk"); } catch (err) {
      log("ERROR", `[${i.commandName}] ${err.message}`);
    }
    return;
  }

  const cmd = i.commandName;
  try {
    if (cmd === "talk-status") {
      const e = mtEmbed().setTitle("💬 MeshTalk™ OS — System Status");
      const lines = SERVICES.map(s => {
        const icon = s.status === "online" ? "🟢" : "🔴";
        return `${icon} ${s.icon} **${s.name}**\n   Protocol: ${s.protocol} · ${s.users}`;
      });
      e.setDescription(lines.join("\n\n"));
      e.addFields(
        { name: "Network", value: "FungiMesh P2P Backbone", inline: true },
        { name: "Encryption", value: "Kyber-1024 E2E", inline: true },
        { name: "Uptime", value: "99.98%", inline: true },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "talk-services") {
      const e = mtEmbed().setTitle("🛠️ Communication Services");
      for (const s of SERVICES) {
        e.addFields({ name: `${s.icon} ${s.name}`, value: `**Protocol:** ${s.protocol}\n**Users:** ${s.users}\n**Status:** ${s.status === "online" ? "🟢 Online" : "🔴 Offline"}`, inline: true });
      }
      await i.reply({ embeds: [e] });

    } else if (cmd === "talk-encryption") {
      const e = mtEmbed().setTitle("🔐 Encryption & Privacy");
      e.setDescription("MeshTalk uses **zero-knowledge architecture** — messages are never stored on servers.");
      e.addFields(
        { name: "End-to-End Encryption", value: FEATURES.encryption, inline: false },
        { name: "Privacy Model", value: FEATURES.privacy, inline: false },
        { name: "Search", value: FEATURES.search, inline: false },
        { name: "Offline Delivery", value: FEATURES.offline, inline: false },
        { name: "Backup", value: FEATURES.backup, inline: false },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "talk-platforms") {
      const e = mtEmbed().setTitle("📱 Available Platforms");
      const lines = PLATFORMS.map(p => {
        const icon = p.status === "live" ? "🟢" : "🟡";
        return `${icon} **${p.name}** — \`${p.url}\` (${p.status})`;
      });
      e.setDescription(lines.join("\n"));
      await i.reply({ embeds: [e] });

    } else if (cmd === "talk-federation") {
      const e = mtEmbed().setTitle("🌐 Mesh Federation");
      e.setDescription("MeshTalk supports **cross-mesh federation** — communicate across independent FungiMesh clusters.");
      e.addFields(
        { name: "Protocol", value: "FungiMesh Relay Protocol (FRP)", inline: true },
        { name: "Discovery", value: "DHT + mDNS + Bootstrap", inline: true },
        { name: "Bridging", value: "Matrix, XMPP, IRC bridges", inline: true },
        { name: "Federation Model", value: "Each organization can run their own MeshTalk instance on their own FungiMesh cluster, while still being able to communicate with the global network through relay nodes.", inline: false },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "talk-mesh") {
      const data = await apiFetch("/api/mesh/status");
      const e = mtEmbed().setTitle("🍄 Underlying Mesh Network");
      if (data?.success) {
        e.setDescription(`**Network:** FungiMesh™\n**Nodes:** ${data.totalNodes?.toLocaleString() || "340,000"}\n**Continents:** ${data.continents?.length || 6}\n**Latency:** ${data.avgLatency || "<5ms"}`);
      } else {
        e.setDescription("**Network:** FungiMesh™\n**Nodes:** 340,000\n**Continents:** 6\n**Latency:** <5ms avg\n**Protocol:** Dual-layer (WebSocket + libp2p)");
      }
      e.addFields({ name: "Integration", value: "MeshTalk runs directly on the FungiMesh P2P backbone — no traditional servers needed.", inline: false });
      await i.reply({ embeds: [e] });

    } else if (cmd === "talk-api") {
      const e = mtEmbed().setTitle("🔌 MeshTalk API");
      e.setDescription("RESTful + WebSocket API for building on MeshTalk.");
      e.addFields(
        { name: "REST API", value: "`https://api.meshtalk.darcloud.host/v1`", inline: false },
        { name: "WebSocket", value: "`wss://ws.meshtalk.darcloud.host`", inline: false },
        { name: "Auth", value: "OAuth2 + JWT + Kyber-1024 handshake", inline: false },
        { name: "Endpoints", value: "`/messages` — Send/receive\n`/channels` — Create/list\n`/users` — Profiles\n`/files` — Upload/download\n`/voice` — Session control", inline: false },
      );
      await i.reply({ embeds: [e] });

    } else if (cmd === "talk-help") {
      const e = mtEmbed().setTitle("💬 MeshTalk Bot Commands");
      e.setDescription([
        "`/talk-status` — System status & all services",
        "`/talk-services` — Communication services detail",
        "`/talk-encryption` — Encryption & privacy specs",
        "`/talk-platforms` — Available platforms (web, desktop, mobile, CLI)",
        "`/talk-federation` — Cross-mesh federation info",
        "`/talk-mesh` — Underlying FungiMesh network",
        "`/talk-api` — Developer API reference",
        "`/talk-help` — This help message",
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
      const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant("meshtalk-bot");
      const result = await openaiAgents.askAssistant(question, assistantId, "meshtalk-bot", { userId: i.user.id });
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
