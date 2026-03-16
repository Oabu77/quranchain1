 // ==========================================================
// QuranChain™ / DarCloud™ Discord Bot
// Full system integration — 18 slash commands
// Autonomous mode: auto-reconnect, heartbeat, crash recovery
// ==========================================================
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { readFileSync, appendFileSync } = require("fs");
const { resolve } = require("path");
const { execSync } = require("child_process");

// ── DarCloud Empire Shared Modules ──────────────────────────
const onboardingEngine = require("../shared/onboarding-engine");
const onboardingDb = require("../shared/onboarding-db");
const stripeIntegration = require("../shared/stripe-integration");
const botIpc = require("../shared/bot-ipc");
const masjidFinder = require("../shared/masjid-finder");
const autoSetup = require("../shared/auto-setup");
const { MeshRouter } = require("../shared/mesh-router");
const openaiAgents = require("../shared/openai-agents");
const founderAgent = require("../shared/founder-agent");
const discordPremium = require("../shared/discord-premium");

// ── Mesh Router (this bot = mesh relay node) ────────────────
const meshRouter = new MeshRouter("darcloud");

// Load .env
try {
  const env = readFileSync(resolve(__dirname, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const API_BASE = process.env.API_BASE || "http://localhost:8787";
const HEARTBEAT_INTERVAL = 60_000; // 60s
const API_HEALTH_INTERVAL = 120_000; // 2min
const MAX_RECONNECT_ATTEMPTS = 50;

if (!DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN in environment");
  process.exit(1);
}

// ── Logging ─────────────────────────────────────────────────
function log(level, msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level}] ${msg}`;
  console.log(line);
  try {
    appendFileSync(resolve(__dirname, "bot.log"), line + "\n");
  } catch {}
}

// ── Client with auto-reconnect ──────────────────────────────
let reconnectAttempts = 0;
let isShuttingDown = false;
let heartbeatTimer = null;
let apiHealthTimer = null;
let lastHeartbeat = Date.now();
let apiOnline = true;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
  // Discord.js handles reconnection internally, but we add extra resilience
});

// ── API Helper ──────────────────────────────────────────────
let botToken = null;

async function ensureBotToken() {
  if (botToken) return botToken;
  const email = "darcloud-bot@darcloud.net";
  const password = "DarCloudBot!2025#Secure";
  const name = "DarCloud Bot";
  // Try login first, then signup
  try {
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (loginRes.ok) {
      const data = await loginRes.json();
      botToken = data.token;
      return botToken;
    }
  } catch {}
  try {
    const signupRes = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, plan: "enterprise" }),
    });
    if (signupRes.ok) {
      const data = await signupRes.json();
      botToken = data.token;
      return botToken;
    }
  } catch {}
  return null;
}

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function apiAuth(path) {
  const token = await ensureBotToken();
  if (!token) throw new Error("Could not authenticate bot service account");
  return api(path, { headers: { Authorization: `Bearer ${token}` } });
}

// ── Shell Exec Helper (safe, allowlisted) ───────────────────
const WORKSPACE = "/workspaces/quranchain1";
const ALLOWED_PM2_SERVICES = ["darcloud-api", "darcloud-bot", "darcloud-watchdog"];
const ALLOWED_DOCKER_SERVICES = ["relay1", "relay2", "compute1", "backup1", "gateway1", "darcloud-discord-bot"];

function safeExec(cmd, timeout = 15000) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout, cwd: WORKSPACE, maxBuffer: 1024 * 512 }).trim();
  } catch (err) {
    return (err.stderr || err.stdout || err.message || "Command failed").trim();
  }
}

// ── Embed Helpers ───────────────────────────────────────────
function darEmbed(title) {
  return new EmbedBuilder()
    .setColor(0x1a7f37)
    .setTitle(title)
    .setFooter({ text: "QuranChain™ DarCloud • Live Data" })
    .setTimestamp();
}

function truncate(str, max = 1024) {
  if (!str) return "—";
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

function tableField(items, formatter, max = 20) {
  if (!items || items.length === 0) return "No data found.";
  const lines = items.slice(0, max).map(formatter);
  const suffix = items.length > max ? `\n… and ${items.length - max} more` : "";
  return truncate(lines.join("\n") + suffix);
}

// ── Command Handlers ────────────────────────────────────────
const handlers = {
  // ─── System ────────────────────────────────
  async health(interaction) {
    const data = await api("/health");
    const embed = darEmbed("🏥 DarCloud System Health")
      .addFields(
        { name: "Status", value: data.status || "unknown", inline: true },
        { name: "Version", value: data.version || "—", inline: true },
        { name: "Region", value: data.uptime_info?.worker_region || "—", inline: true }
      );
    if (data.components) {
      const c = data.components;
      embed.addFields(
        { name: "Database", value: `${c.database?.status || "—"} (${c.database?.tables || 0} tables, ${c.database?.response_ms || 0}ms)`, inline: true },
        { name: "AI Fleet", value: `${c.ai_fleet?.status || "—"} (${c.ai_fleet?.response_ms || 0}ms)`, inline: true },
        { name: "Mesh Network", value: `${c.mesh_network?.status || "—"} (${c.mesh_network?.response_ms || 0}ms)`, inline: true }
      );
    }
    embed.addFields({ name: "Execution", value: `${data.execution_ms || 0}ms`, inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  async stats(interaction) {
    const data = await apiAuth("/api/admin/stats");
    const s = data.stats || {};
    const embed = darEmbed("📊 Admin Dashboard Stats")
      .addFields(
        { name: "Users", value: String(s.users ?? 0), inline: true },
        { name: "Companies", value: String(s.companies ?? 0), inline: true },
        { name: "Contracts", value: String(s.contracts ?? 0), inline: true },
        { name: "Legal Filings", value: String(s.legal_filings ?? 0), inline: true },
        { name: "IP Protections", value: String(s.ip_protections ?? 0), inline: true },
        { name: "Contact Forms", value: String(s.contact_submissions ?? 0), inline: true },
        { name: "HWC Apps", value: String(s.hwc_applications ?? 0), inline: true }
      );
    if (data.plan_breakdown && data.plan_breakdown.length > 0) {
      const plans = data.plan_breakdown.map((p) => `**${p.plan}**: ${p.count}`).join(" | ");
      embed.addFields({ name: "Plans", value: plans });
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── AI Fleet ──────────────────────────────
  async "ai-fleet"(interaction) {
    const data = await api("/ai/fleet");
    const embed = darEmbed("🤖 AI Agent Fleet");

    if (data.fleet && Array.isArray(data.fleet)) {
      const byPlatform = {};
      for (const agent of data.fleet) {
        const p = agent.platform || "unknown";
        if (!byPlatform[p]) byPlatform[p] = [];
        byPlatform[p].push(agent);
      }
      for (const [platform, agents] of Object.entries(byPlatform)) {
        const list = agents.slice(0, 15).map((a) => `${a.status === "deployed" ? "🟢" : "🔴"} ${a.name}`).join("\n");
        embed.addFields({ name: `${platform} (${agents.length})`, value: truncate(list) });
      }
    }
    embed.addFields(
      { name: "Total", value: String(data.total || 0), inline: true },
      { name: "Active", value: String(data.active || 0), inline: true }
    );
    return interaction.editReply({ embeds: [embed] });
  },

  async "ai-assistants"(interaction) {
    const data = await api("/ai/assistants");
    const embed = darEmbed("🧠 GPT-4o Assistants");

    if (data.assistants && Array.isArray(data.assistants)) {
      const list = data.assistants.map((a) => `**${a.name}** — ${a.description || "—"}`).join("\n");
      embed.setDescription(truncate(list, 2000));
      embed.addFields(
        { name: "Total", value: String(data.total || data.assistants.length), inline: true },
        { name: "Model", value: data.models_used || "GPT-4o", inline: true }
      );
    }
    return interaction.editReply({ embeds: [embed] });
  },

  async "ai-benchmark"(interaction) {
    const data = await api("/ai/benchmark");
    const b = data.benchmark || {};
    const embed = darEmbed("⚡ AI Fleet Benchmark");
    if (b.overall) {
      embed.addFields(
        { name: "Score", value: String(b.overall.score ?? "—"), inline: true },
        { name: "Grade", value: b.overall.grade || "—", inline: true },
        { name: "Total AI Entities", value: String(b.overall.total_ai_entities ?? "—"), inline: true }
      );
      if (b.overall.verdict) embed.addFields({ name: "Verdict", value: b.overall.verdict });
    }
    if (b.ai_fleet) embed.addFields({ name: "Fleet", value: `${b.ai_fleet.deployed || 0} deployed / ${b.ai_fleet.total_agents || 0} total`, inline: true });
    if (b.mesh) embed.addFields({ name: "Mesh", value: `L1: ${b.mesh.layer1 || "—"} | L2: ${b.mesh.layer2 || "—"} | ${b.mesh.total_nodes || 0} nodes`, inline: true });
    if (b.infrastructure) embed.addFields({ name: "Infrastructure", value: `${b.infrastructure.domains_online || 0}/${b.infrastructure.domains_checked || 0} domains (${b.infrastructure.uptime_pct || 0}%)`, inline: true });
    embed.addFields({ name: "Execution", value: `${data.execution_ms || 0}ms`, inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Mesh Network ─────────────────────────
  async "mesh-status"(interaction) {
    const data = await api("/mesh/status");
    const mesh = data.mesh || {};
    const embed = darEmbed("🍄 FungiMesh Network Status")
      .addFields(
        { name: "Service", value: mesh.service || "FungiMesh™", inline: false },
        { name: "Layer 1 (Node.js)", value: `Status: ${mesh.layer1_nodejs?.status || "—"}\nNodes: ${mesh.layer1_nodejs?.nodes ?? 0}`, inline: true },
        { name: "Layer 2 (Python)", value: `Status: ${mesh.layer2_python?.status || "—"}\nNodes: ${mesh.layer2_python?.nodes ?? 0}`, inline: true }
      );
    if (mesh.summary) {
      embed.addFields(
        { name: "Total Nodes", value: String(mesh.summary.total_nodes ?? 0), inline: true },
        { name: "Active", value: String(mesh.summary.active_nodes ?? 0), inline: true },
        { name: "Encryption", value: mesh.summary.encryption || "—", inline: true },
        { name: "Continents", value: String(mesh.summary.continents ?? 0), inline: true }
      );
    }
    return interaction.editReply({ embeds: [embed] });
  },

  async "mesh-nodes"(interaction) {
    const data = await api("/mesh/nodes");
    const embed = darEmbed("🌐 Mesh Nodes by Region");

    if (data.regions && Array.isArray(data.regions)) {
      const list = data.regions.map((r) => {
        const icon = r.status === "online" ? "🟢" : r.status === "degraded" ? "🟡" : r.status === "empty" ? "⚪" : "🔴";
        return `${icon} **${r.name}** — ${r.nodes} node(s) — ${r.status}`;
      }).join("\n");
      embed.setDescription(truncate(list, 2000));
      embed.addFields(
        { name: "Total Nodes", value: String(data.total ?? 0), inline: true },
        { name: "Encryption", value: data.encryption || "—", inline: true }
      );
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Tasks ─────────────────────────────────
  async tasks(interaction) {
    const search = interaction.options.getString("search");
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const data = await api(`/tasks${query}`);
    const tasks = data.data || [];
    const embed = darEmbed("📋 Infrastructure Tasks");

    if (tasks.length > 0) {
      const list = tableField(tasks, (t) =>
        `${t.completed ? "✅" : "⬜"} **${t.name}** — ${t.description || "—"}${t.due_date ? ` (due: ${new Date(t.due_date).toLocaleDateString()})` : ""}`
      );
      embed.setDescription(list);
    } else {
      embed.setDescription("No tasks found.");
    }
    embed.addFields({ name: "Total", value: String(data.pagination?.total ?? tasks.length), inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  async "task-create"(interaction) {
    const name = interaction.options.getString("name");
    const slug = interaction.options.getString("slug");
    const description = interaction.options.getString("description") || "";

    const data = await api("/tasks", {
      method: "POST",
      body: JSON.stringify({ name, slug, description, completed: false }),
    });
    const task = data.result || data;
    const embed = darEmbed("✅ Task Created")
      .addFields(
        { name: "Name", value: task.name || name, inline: true },
        { name: "Slug", value: task.slug || slug, inline: true },
        { name: "ID", value: String(task.id || "—"), inline: true }
      );
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Contracts ─────────────────────────────
  async contracts(interaction) {
    const data = await api("/api/contracts");
    const contracts = data.contracts || [];
    const embed = darEmbed("📜 Inter-Company Contracts");

    if (contracts.length > 0) {
      const list = tableField(contracts, (c) =>
        `**${c.title}** — $${Number(c.monthly_fee || 0).toLocaleString()}/mo — ${c.shariah_compliant ? "☪️" : ""} ${c.status}`
      , 15);
      embed.setDescription(list);
    } else {
      embed.setDescription("No contracts found.");
    }
    embed.addFields({ name: "Total", value: String(data.total ?? contracts.length), inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  async companies(interaction) {
    const data = await api("/api/contracts/companies");
    const companies = data.companies || [];
    const embed = darEmbed("🏢 DarCloud Companies");

    if (companies.length > 0) {
      const list = tableField(companies, (c) =>
        `**${c.name}** (${c.type}) — ${c.sector} — ${c.jurisdiction}`
      , 25);
      embed.setDescription(list);
    } else {
      embed.setDescription("No companies found.");
    }
    embed.addFields({ name: "Total", value: String(data.total ?? companies.length), inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── IP Portfolio ──────────────────────────
  async ip(interaction) {
    const type = interaction.options.getString("type");
    const data = await api("/api/contracts/legal/ip");
    const allIP = data.ip_protections || [];
    const typeMap = { trademarks: "trademark", patents: "patent", copyrights: "copyright", "trade-secrets": "trade_secret" };
    const filtered = allIP.filter((i) => i.ip_type === typeMap[type]);
    const titleMap = {
      trademarks: "™ Trademarks",
      patents: "📐 Patents",
      copyrights: "©️ Copyrights",
      "trade-secrets": "🔒 Trade Secrets",
    };
    const embed = darEmbed(titleMap[type] || "IP Portfolio");

    if (filtered.length > 0) {
      const list = tableField(filtered, (i) =>
        `**${i.title}** — ${i.jurisdiction || "Global"} — ${i.status}`
      );
      embed.setDescription(list);
    } else {
      embed.setDescription("No IP records of this type found.");
    }
    embed.addFields(
      { name: "Owner", value: data.owner || "—", inline: true },
      { name: `${type} Count`, value: String(filtered.length), inline: true },
      { name: "Total IP Assets", value: String(data.total ?? allIP.length), inline: true }
    );
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Backups ───────────────────────────────
  async backups(interaction) {
    const data = await api("/backups");
    const backups = data.data || [];
    const embed = darEmbed("💾 Backup Registry");

    if (backups.length > 0) {
      const list = tableField(backups, (b) => {
        const size = b.size_bytes ? `${(b.size_bytes / 1024 / 1024).toFixed(1)}MB` : "—";
        return `**${b.filename}** — ${b.status} — ${size} — ${b.mesh_node_id || "local"}`;
      });
      embed.setDescription(list);
    } else {
      embed.setDescription("No backups registered.");
    }
    embed.addFields({ name: "Total", value: String(data.pagination?.total ?? backups.length), inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Minecraft ─────────────────────────────
  async minecraft(interaction) {
    const data = await api("/minecraft/servers");
    const servers = data.servers || [];
    const embed = darEmbed("⛏️ Minecraft Servers");

    if (servers.length > 0) {
      for (const s of servers.slice(0, 5)) {
        const online = s.status === "online" || s.players_online > 0;
        embed.addFields({
          name: `${online ? "🟢" : "🔴"} ${s.name || s.id}`,
          value: [
            `Players: **${s.players_online ?? 0}**/${s.max_players ?? 0}`,
            `Version: ${s.version || "—"}`,
            `Host: \`${s.host || "—"}:${s.port || "—"}\``,
            `Hardware: ${s.hardware || "—"}`,
          ].join("\n"),
          inline: true,
        });
      }
    } else {
      embed.setDescription("No Minecraft servers found.");
    }
    embed.addFields({ name: "Total Servers", value: String(data.total ?? servers.length), inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Multipass VMs ─────────────────────────
  async vms(interaction) {
    const data = await api("/multipass/vms");
    const vms = data.vms || [];
    const embed = darEmbed("💻 Multipass VM Fleet");

    if (vms.length > 0) {
      const list = tableField(vms, (v) => {
        const icon = v.status === "running" ? "🟢" : v.status === "stopped" ? "🔴" : "🟡";
        return `${icon} **${v.name}** — ${v.role || "—"} — ${v.status} — ${v.cpus}cpu/${v.memory_mb}MB/${v.disk_gb}GB${v.ip_address ? " — " + v.ip_address : ""}`;
      });
      embed.setDescription(list);
    } else {
      embed.setDescription("No VMs found.");
    }
    embed.addFields({ name: "Total", value: String(data.total ?? vms.length), inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  async "fleet-health"(interaction) {
    const data = await api("/multipass/fleet/health");
    const fleet = data.fleet || {};
    const embed = darEmbed("🏥 VM Fleet Health")
      .addFields(
        { name: "Total VMs", value: String(fleet.total ?? 0), inline: true },
        { name: "Mesh Connected", value: `${fleet.mesh_connected ?? 0} (${fleet.mesh_connected_pct ?? 0}%)`, inline: true }
      );
    if (fleet.by_status) {
      const statuses = Object.entries(fleet.by_status).map(([k, v]) => `**${k}**: ${v}`).join(" | ");
      embed.addFields({ name: "By Status", value: statuses });
    }
    if (fleet.by_role) {
      const roles = Object.entries(fleet.by_role).map(([k, v]) => `**${k}**: ${v}`).join(" | ");
      embed.addFields({ name: "By Role", value: roles });
    }
    if (fleet.resources) {
      embed.addFields({ name: "Resources", value: `CPUs: ${fleet.resources.total_cpus ?? 0} | Memory: ${fleet.resources.total_memory_human || (fleet.resources.total_memory_mb + "MB")} | Disk: ${fleet.resources.total_disk_gb ?? 0}GB` });
    }
    if (data.nodes && data.nodes.length > 0) {
      const nodeList = data.nodes.slice(0, 10).map((n) => {
        const icon = n.status === "running" ? "🟢" : n.status === "stopped" ? "🔴" : "🟡";
        return `${icon} **${n.name}** (${n.role}) — ${n.cpus}cpu/${n.memory_mb}MB`;
      }).join("\n");
      embed.addFields({ name: "Nodes", value: truncate(nodeList) });
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Legal ─────────────────────────────────
  async "legal-filings"(interaction) {
    const data = await api("/api/contracts/legal/filings");
    const filings = data.filings || [];
    const embed = darEmbed("⚖️ Legal Filings");

    if (filings.length > 0) {
      const list = tableField(filings, (f) =>
        `**${f.title}** — ${f.filing_type} — ${f.entity || "—"} — ${f.jurisdiction || "—"} — ${f.status}`
      );
      embed.setDescription(list);
    } else {
      embed.setDescription("No legal filings found.");
    }
    embed.addFields({ name: "Total", value: String(data.total ?? filings.length), inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Service Management (PM2) ───────────────
  async service(interaction) {
    const action = interaction.options.getString("action");
    const name = interaction.options.getString("name");

    if (name && !ALLOWED_PM2_SERVICES.includes(name)) {
      return interaction.editReply({ embeds: [darEmbed("❌ Invalid Service").setColor(0xdc3545).setDescription(`Unknown service \`${name}\`. Valid: ${ALLOWED_PM2_SERVICES.join(", ")}`)] });
    }

    const embed = darEmbed("⚙️ Service Manager");

    switch (action) {
      case "status": {
        const out = safeExec("pm2 jlist");
        try {
          const procs = JSON.parse(out);
          for (const p of procs) {
            const mem = p.monit?.memory ? `${(p.monit.memory / 1024 / 1024).toFixed(1)}MB` : "—";
            const cpu = p.monit?.cpu != null ? `${p.monit.cpu}%` : "—";
            const uptime = p.pm2_env?.pm_uptime ? formatUptime(Date.now() - p.pm2_env.pm_uptime) : "—";
            const restarts = p.pm2_env?.restart_time ?? 0;
            const icon = p.pm2_env?.status === "online" ? "🟢" : "🔴";
            embed.addFields({
              name: `${icon} ${p.name}`,
              value: `Status: **${p.pm2_env?.status}**\nUptime: ${uptime}\nCPU: ${cpu} | Mem: ${mem}\nRestarts: ${restarts}`,
              inline: true,
            });
          }
        } catch { embed.setDescription("```\n" + out.slice(0, 1800) + "\n```"); }
        break;
      }
      case "start":
      case "stop":
      case "restart": {
        const target = name || "all";
        const out = safeExec(`pm2 ${action} ${target}`);
        embed.setDescription(`**${action.toUpperCase()}** → \`${target}\`\n\`\`\`\n${out.slice(0, 1500)}\n\`\`\``);
        // Refresh status
        const status = safeExec("pm2 jlist");
        try {
          const procs = JSON.parse(status);
          const summary = procs.map(p => `${p.pm2_env?.status === "online" ? "🟢" : "🔴"} ${p.name}`).join(" | ");
          embed.addFields({ name: "Current Status", value: summary });
        } catch {}
        break;
      }
      case "logs": {
        const target = name || "all";
        const out = safeExec(`pm2 logs ${target} --nostream --lines 20`);
        embed.setDescription(`**Logs** → \`${target}\`\n\`\`\`\n${out.slice(0, 1800)}\n\`\`\``);
        break;
      }
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Docker Management ─────────────────────
  async docker(interaction) {
    const action = interaction.options.getString("action");
    const name = interaction.options.getString("container");

    if (name && !ALLOWED_DOCKER_SERVICES.includes(name)) {
      return interaction.editReply({ embeds: [darEmbed("❌ Invalid Container").setColor(0xdc3545).setDescription(`Unknown container \`${name}\`. Valid: ${ALLOWED_DOCKER_SERVICES.join(", ")}`)] });
    }

    const embed = darEmbed("🐳 Docker Manager");

    switch (action) {
      case "status": {
        const out = safeExec("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}' 2>&1");
        const stopped = safeExec("docker ps -a --filter 'status=exited' --format '{{.Names}}: {{.Status}}' 2>&1");
        embed.setDescription(`\`\`\`\n${out.slice(0, 1200)}\n\`\`\``);
        if (stopped && !stopped.includes("Cannot connect")) {
          embed.addFields({ name: "Stopped Containers", value: `\`\`\`\n${stopped.slice(0, 500) || "None"}\n\`\`\`` });
        }
        break;
      }
      case "start": {
        const out = name
          ? safeExec(`docker compose up -d ${name} 2>&1`, 30000)
          : safeExec("docker compose up -d 2>&1", 60000);
        embed.setDescription(`**START** → \`${name || "all"}\`\n\`\`\`\n${out.slice(0, 1500)}\n\`\`\``);
        break;
      }
      case "stop": {
        const out = name
          ? safeExec(`docker compose stop ${name} 2>&1`, 30000)
          : safeExec("docker compose stop 2>&1", 30000);
        embed.setDescription(`**STOP** → \`${name || "all"}\`\n\`\`\`\n${out.slice(0, 1500)}\n\`\`\``);
        break;
      }
      case "restart": {
        const out = name
          ? safeExec(`docker compose restart ${name} 2>&1`, 30000)
          : safeExec("docker compose restart 2>&1", 60000);
        embed.setDescription(`**RESTART** → \`${name || "all"}\`\n\`\`\`\n${out.slice(0, 1500)}\n\`\`\``);
        break;
      }
      case "logs": {
        const target = name || "";
        const out = safeExec(`docker compose logs --tail=25 ${target} 2>&1`, 15000);
        embed.setDescription(`**Logs** → \`${name || "all"}\`\n\`\`\`\n${out.slice(0, 1800)}\n\`\`\``);
        break;
      }
      case "build": {
        const out = name
          ? safeExec(`docker compose up -d --build ${name} 2>&1`, 120000)
          : safeExec("docker compose up -d --build 2>&1", 120000);
        embed.setDescription(`**BUILD & DEPLOY** → \`${name || "all"}\`\n\`\`\`\n${out.slice(0, 1500)}\n\`\`\``);
        break;
      }
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── System Overview ───────────────────────
  async system(interaction) {
    const embed = darEmbed("🖥️ DarCloud Full System Overview");

    // PM2 Services
    try {
      const pm2Out = safeExec("pm2 jlist");
      const procs = JSON.parse(pm2Out);
      const pm2Summary = procs.map(p => {
        const icon = p.pm2_env?.status === "online" ? "🟢" : "🔴";
        const mem = p.monit?.memory ? `${(p.monit.memory / 1024 / 1024).toFixed(1)}MB` : "—";
        return `${icon} **${p.name}** — ${p.pm2_env?.status} — ${mem}`;
      }).join("\n");
      embed.addFields({ name: "PM2 Services", value: pm2Summary || "No services" });
    } catch { embed.addFields({ name: "PM2 Services", value: "Unable to query" }); }

    // Docker
    try {
      const dkOut = safeExec("docker ps --format '{{.Names}}: {{.Status}}' 2>&1");
      if (dkOut && !dkOut.includes("Cannot connect")) {
        const lines = dkOut.split("\n").map(l => {
          const running = l.includes("Up");
          return `${running ? "🟢" : "🔴"} ${l}`;
        }).join("\n");
        embed.addFields({ name: "Docker Containers", value: truncate(lines) || "None running" });
      } else {
        embed.addFields({ name: "Docker Containers", value: "Docker not available" });
      }
    } catch { embed.addFields({ name: "Docker Containers", value: "Unable to query" }); }

    // API Health
    try {
      const data = await api("/health");
      embed.addFields({ name: "API Health", value: `${data.status === "healthy" ? "🟢" : "🔴"} ${data.status} — v${data.version} — ${data.execution_ms}ms`, inline: true });
    } catch (err) { embed.addFields({ name: "API Health", value: `🔴 ${err.message}`, inline: true }); }

    // Discord Bot
    const wsState = ["READY", "CONNECTING", "RECONNECTING", "IDLE", "NEARLY", "DISCONNECTED"];
    const state = wsState[client.ws?.status] || "UNKNOWN";
    embed.addFields({ name: "Discord Bot", value: `${state === "READY" ? "🟢" : "🔴"} ${state} — Ping: ${client.ws?.ping ?? -1}ms — Uptime: ${formatUptime(client.uptime)}`, inline: true });

    // System Resources
    try {
      const disk = safeExec("df -h / | tail -1 | awk '{print $3\"/\"$2\" (\"$5\" used)\"}'");
      const mem = safeExec("free -h | grep Mem | awk '{print $3\"/\"$2\" (\"$7\" avail)\"}'");
      const loadavg = safeExec("cat /proc/loadavg | awk '{print $1, $2, $3}'");
      embed.addFields(
        { name: "Memory", value: mem || "—", inline: true },
        { name: "Disk", value: disk || "—", inline: true },
        { name: "Load Average", value: loadavg || "—", inline: true }
      );
    } catch {}

    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Deploy / Redeploy ─────────────────────
  async deploy(interaction) {
    const target = interaction.options.getString("target");
    const embed = darEmbed("🚀 Deploy");

    switch (target) {
      case "api": {
        const out = safeExec("pm2 restart darcloud-api", 15000);
        embed.setDescription(`**API Redeployed**\n\`\`\`\n${out.slice(0, 1500)}\n\`\`\``);
        break;
      }
      case "bot": {
        embed.setDescription("**Bot restarting...** The bot will be back online in ~5 seconds.");
        await interaction.editReply({ embeds: [embed] });
        setTimeout(() => safeExec("pm2 restart darcloud-bot"), 1000);
        return;
      }
      case "docker": {
        const out = safeExec("docker compose up -d --build 2>&1", 120000);
        embed.setDescription(`**Docker Fleet Redeployed**\n\`\`\`\n${out.slice(0, 1500)}\n\`\`\``);
        break;
      }
      case "all": {
        const steps = [];
        steps.push("1. Rebuilding Docker fleet...");
        const dk = safeExec("docker compose up -d --build 2>&1", 120000);
        steps.push(`   ✓ Docker: ${dk.includes("Started") || dk.includes("Running") ? "OK" : dk.slice(0, 100)}`);
        steps.push("2. Restarting API...");
        safeExec("pm2 restart darcloud-api");
        steps.push("   ✓ API restarted");
        steps.push("3. Restarting watchdog...");
        safeExec("pm2 restart darcloud-watchdog");
        steps.push("   ✓ Watchdog restarted");
        steps.push("4. Database bootstrap check...");
        try {
          const bRes = await fetch(`${API_BASE}/api/contracts/companies`);
          const bData = await bRes.json();
          if (!bData.total || bData.total === 0) {
            await fetch(`${API_BASE}/api/contracts/bootstrap`, { method: "POST" });
            steps.push("   ✓ Database seeded");
          } else {
            steps.push(`   ✓ Database OK (${bData.total} companies)`);
          }
        } catch { steps.push("   ⚠ DB check failed (API still starting)"); }
        steps.push("5. Bot restart scheduled (5s)...");
        embed.setDescription(steps.join("\n"));
        await interaction.editReply({ embeds: [embed] });
        setTimeout(() => safeExec("pm2 restart darcloud-bot"), 5000);
        return;
      }
      case "git-pull": {
        const pull = safeExec("git pull --ff-only 2>&1", 30000);
        const install = safeExec("npm install 2>&1", 30000);
        embed.setDescription(`**Git Pull & Install**\n\`\`\`\n${pull}\n\n${install.slice(0, 800)}\n\`\`\``);
        break;
      }
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Logs Viewer ───────────────────────────
  async logs(interaction) {
    const source = interaction.options.getString("source");
    const lines = interaction.options.getInteger("lines") || 25;
    const clampedLines = Math.min(Math.max(lines, 5), 50);
    const embed = darEmbed("📜 Log Viewer");
    let out = "";

    switch (source) {
      case "api":
        out = safeExec(`pm2 logs darcloud-api --nostream --lines ${clampedLines}`);
        break;
      case "bot":
        out = safeExec(`pm2 logs darcloud-bot --nostream --lines ${clampedLines}`);
        break;
      case "watchdog":
        out = safeExec(`pm2 logs darcloud-watchdog --nostream --lines ${clampedLines}`);
        break;
      case "docker":
        out = safeExec(`docker compose logs --tail=${clampedLines} 2>&1`, 15000);
        break;
      case "all":
        out = safeExec(`pm2 logs --nostream --lines ${clampedLines}`);
        break;
    }
    embed.setDescription(`**${source}** (last ${clampedLines} lines)\n\`\`\`\n${out.slice(0, 1800)}\n\`\`\``);
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── AI Agent (shell executor w/ allowlist) ─
  async agent(interaction) {
    const task = interaction.options.getString("task");
    const embed = darEmbed("🤖 DarCloud AI Agent");

    // Parse natural language to safe operations
    const taskLower = task.toLowerCase();
    const results = [];

    // System status intents
    if (taskLower.match(/status|overview|health|check|how.*(things|system|everything)/)) {
      results.push({ action: "System Status Check", output: "" });
      try {
        const healthData = await api("/health");
        results.push({ action: "API Health", output: `${healthData.status} — v${healthData.version} — ${healthData.execution_ms}ms` });
      } catch (e) { results.push({ action: "API Health", output: `ERROR: ${e.message}` }); }

      const pm2 = safeExec("pm2 jlist");
      try {
        const procs = JSON.parse(pm2);
        const summary = procs.map(p => `${p.pm2_env?.status === "online" ? "✓" : "✗"} ${p.name} (${p.pm2_env?.status})`).join(", ");
        results.push({ action: "PM2 Services", output: summary });
      } catch { results.push({ action: "PM2 Services", output: pm2.slice(0, 200) }); }

      const dk = safeExec("docker ps --format '{{.Names}}: {{.Status}}' 2>&1");
      results.push({ action: "Docker", output: dk.slice(0, 300) });
    }

    // Restart intents
    else if (taskLower.match(/restart|reboot|reload/)) {
      const targets = [];
      if (taskLower.includes("api") || taskLower.includes("server") || taskLower.includes("wrangler")) targets.push("darcloud-api");
      if (taskLower.includes("bot") || taskLower.includes("discord")) targets.push("darcloud-bot");
      if (taskLower.includes("watch") || taskLower.includes("monitor")) targets.push("darcloud-watchdog");
      if (taskLower.includes("docker") || taskLower.includes("mesh") || taskLower.includes("container")) {
        const out = safeExec("docker compose restart 2>&1", 60000);
        results.push({ action: "Docker Restart", output: out.slice(0, 500) });
      }
      if (taskLower.includes("all") || taskLower.includes("everything") || targets.length === 0) {
        targets.push("darcloud-api", "darcloud-watchdog");
        const out = safeExec("docker compose restart 2>&1", 60000);
        results.push({ action: "Docker Restart", output: out.slice(0, 300) });
      }
      for (const t of [...new Set(targets)]) {
        const out = safeExec(`pm2 restart ${t}`);
        results.push({ action: `Restart ${t}`, output: out.slice(0, 200) });
      }
      if (taskLower.includes("bot") || taskLower.includes("all") || taskLower.includes("everything")) {
        results.push({ action: "Bot Restart", output: "Scheduled in 3s..." });
        setTimeout(() => safeExec("pm2 restart darcloud-bot"), 3000);
      }
    }

    // Start/stop intents
    else if (taskLower.match(/^(start|stop|kill|shut)/)) {
      const isStop = taskLower.match(/stop|kill|shut/);
      const action = isStop ? "stop" : "start";
      if (taskLower.includes("docker") || taskLower.includes("mesh") || taskLower.includes("container")) {
        const out = safeExec(`docker compose ${action === "stop" ? "stop" : "up -d"} 2>&1`, 60000);
        results.push({ action: `Docker ${action}`, output: out.slice(0, 500) });
      }
      if (taskLower.includes("api") || taskLower.includes("server")) {
        results.push({ action: `PM2 ${action} API`, output: safeExec(`pm2 ${action} darcloud-api`).slice(0, 200) });
      }
      if (taskLower.includes("bot")) {
        results.push({ action: `PM2 ${action} Bot`, output: safeExec(`pm2 ${action} darcloud-bot`).slice(0, 200) });
      }
      if (taskLower.includes("all") || taskLower.includes("everything")) {
        results.push({ action: `PM2 ${action} all`, output: safeExec(`pm2 ${action} all`).slice(0, 200) });
        const out = safeExec(`docker compose ${action === "stop" ? "stop" : "up -d"} 2>&1`, 60000);
        results.push({ action: `Docker ${action}`, output: out.slice(0, 300) });
      }
    }

    // Deploy intents
    else if (taskLower.match(/deploy|build|update|pull|upgrade/)) {
      if (taskLower.includes("git") || taskLower.includes("pull") || taskLower.includes("update")) {
        const pull = safeExec("git pull --ff-only 2>&1", 30000);
        results.push({ action: "Git Pull", output: pull.slice(0, 300) });
        const install = safeExec("npm install 2>&1", 30000);
        results.push({ action: "NPM Install", output: install.slice(-200) });
      }
      if (taskLower.includes("docker") || taskLower.includes("build") || taskLower.includes("mesh")) {
        const out = safeExec("docker compose up -d --build 2>&1", 120000);
        results.push({ action: "Docker Build & Deploy", output: out.slice(0, 500) });
      }
      if (taskLower.includes("api") || taskLower.includes("all")) {
        results.push({ action: "API Redeploy", output: safeExec("pm2 restart darcloud-api").slice(0, 200) });
      }
    }

    // Logs intents
    else if (taskLower.match(/log|error|debug|what.*(wrong|happen)/)) {
      let target = "all";
      if (taskLower.includes("api") || taskLower.includes("server")) target = "darcloud-api";
      else if (taskLower.includes("bot") || taskLower.includes("discord")) target = "darcloud-bot";
      else if (taskLower.includes("watch") || taskLower.includes("monitor")) target = "darcloud-watchdog";
      else if (taskLower.includes("docker") || taskLower.includes("mesh")) {
        const out = safeExec("docker compose logs --tail=20 2>&1", 15000);
        results.push({ action: "Docker Logs", output: out.slice(0, 1000) });
        target = null;
      }
      if (target) {
        const out = safeExec(`pm2 logs ${target} --nostream --lines 20`);
        results.push({ action: `PM2 Logs (${target})`, output: out.slice(0, 1000) });
      }
    }

    // Database / seed intents
    else if (taskLower.match(/seed|bootstrap|database|db|init/)) {
      try {
        const bRes = await fetch(`${API_BASE}/api/contracts/bootstrap`, { method: "POST" });
        const bData = await bRes.json();
        const r = bData.results || {};
        results.push({ action: "Bootstrap", output: `${r.companies_registered} companies, ${r.contracts_signed} contracts, ${r.legal_filings} filings, ${r.ip_protections} IP — ${r.total_monthly_revenue}/mo` });
      } catch (e) { results.push({ action: "Bootstrap", output: `ERROR: ${e.message}` }); }
    }

    // Test intents
    else if (taskLower.match(/test|verify|validate/)) {
      const out = safeExec("cd /workspaces/quranchain1 && npx vitest run 2>&1", 60000);
      const lastLines = out.split("\n").slice(-10).join("\n");
      results.push({ action: "Test Suite", output: lastLines });
    }

    // Disk/memory/resources intents
    else if (taskLower.match(/disk|memory|cpu|resource|space|storage/)) {
      results.push({ action: "Memory", output: safeExec("free -h | head -2") });
      results.push({ action: "Disk", output: safeExec("df -h / | tail -1") });
      results.push({ action: "CPU Load", output: safeExec("cat /proc/loadavg") });
      results.push({ action: "Top Processes", output: safeExec("ps aux --sort=-%mem | head -6") });
    }

    // Fallback
    else {
      results.push({ action: "🤔 Unrecognized", output: `I don't know how to: "${task}"\n\nTry: status, restart all, check logs, deploy docker, run tests, seed database, check resources` });
    }

    // Format results
    const output = results.map(r => `**${r.action}**\n\`\`\`\n${r.output || "OK"}\n\`\`\``).join("\n");
    embed.setDescription(truncate(output, 3800));
    embed.addFields({ name: "Task", value: truncate(task, 256) });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Git Operations ────────────────────────
  async git(interaction) {
    const action = interaction.options.getString("action");
    const embed = darEmbed("📦 Git Operations");

    switch (action) {
      case "status": {
        const status = safeExec("git status --short 2>&1");
        const branch = safeExec("git branch --show-current 2>&1");
        const lastCommit = safeExec("git log --oneline -5 2>&1");
        embed.addFields(
          { name: "Branch", value: `\`${branch}\``, inline: true },
          { name: "Changed Files", value: `\`\`\`\n${status || "Clean"}\n\`\`\`` },
          { name: "Recent Commits", value: `\`\`\`\n${lastCommit}\n\`\`\`` }
        );
        break;
      }
      case "pull": {
        const out = safeExec("git pull --ff-only 2>&1", 30000);
        embed.setDescription(`\`\`\`\n${out}\n\`\`\``);
        break;
      }
      case "diff": {
        const out = safeExec("git diff --stat 2>&1");
        embed.setDescription(`\`\`\`\n${out || "No changes"}\n\`\`\``);
        break;
      }
      case "log": {
        const out = safeExec("git log --oneline --graph -15 2>&1");
        embed.setDescription(`\`\`\`\n${out}\n\`\`\``);
        break;
      }
    }
    return interaction.editReply({ embeds: [embed] });
  },

  async bootstrap(interaction) {
    const data = await api("/api/contracts/bootstrap", { method: "POST" });
    const r = data.results || {};
    const embed = darEmbed("🏦 DarCloud Ecosystem Bootstrap")
      .setDescription(data.message || "Bootstrap complete")
      .addFields(
        { name: "Companies", value: String(r.companies_registered ?? 0), inline: true },
        { name: "Contracts", value: String(r.contracts_signed ?? 0), inline: true },
        { name: "Legal Filings", value: String(r.legal_filings ?? 0), inline: true },
        { name: "IP Protections", value: String(r.ip_protections ?? 0), inline: true },
        { name: "Monthly Revenue", value: r.total_monthly_revenue || "—", inline: true },
        { name: "Annual Revenue", value: r.total_annual_revenue || "—", inline: true },
        { name: "Founder Royalty", value: r.founder_royalty_monthly || "—", inline: true },
        { name: "Zakat", value: r.zakat_monthly || "—", inline: true }
      );
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Masjid Finder ─────────────────────────
  async masjid(interaction) {
    const location = interaction.options.getString("location");
    const radius = interaction.options.getInteger("radius") || 10;
    const geo = await masjidFinder.geocode(location);
    if (!geo) return interaction.editReply({ embeds: [darEmbed("❌ Location Not Found").setColor(0xef4444).setDescription(`Could not find "${location}". Try a city name like "Houston TX".`)] });
    const mosques = await masjidFinder.findMosquesNearby(geo.lat, geo.lon, radius, 10);
    const qibla = masjidFinder.getQiblaDirection(geo.lat, geo.lon);
    const embed = darEmbed(`🕌 Mosques Near ${location}`)
      .setColor(0x22c55e)
      .setDescription(`**${mosques.length}** mosques within ${radius}km\n🧭 **Qibla:** ${qibla.bearing}° ${qibla.compass} | ${qibla.distToKaaba} km to Makkah\n\n` + masjidFinder.formatMosqueList(mosques) + masjidFinder.getSignupCTA())
      .setFooter({ text: "DarCloud™ Masjid Finder — Data: OpenStreetMap" });
    return interaction.editReply({ embeds: [embed] });
  },

  async prayer(interaction) {
    const location = interaction.options.getString("location");
    const geo = await masjidFinder.geocode(location);
    if (!geo) return interaction.editReply({ embeds: [darEmbed("❌ Location Not Found").setColor(0xef4444).setDescription(`Could not find "${location}".`)] });
    const times = await masjidFinder.getPrayerTimes(geo.lat, geo.lon);
    const qibla = masjidFinder.getQiblaDirection(geo.lat, geo.lon);
    const embed = darEmbed(`🕐 Prayer Times — ${location}`)
      .setColor(0x3b82f6)
      .setDescription(`📅 **${times.date}** | 🌙 **${times.hijri}**\n🧭 Qibla: **${qibla.bearing}° ${qibla.compass}**`)
      .addFields(
        { name: "🌅 Fajr", value: times.fajr, inline: true }, { name: "☀️ Sunrise", value: times.sunrise, inline: true },
        { name: "🕐 Dhuhr", value: times.dhuhr, inline: true }, { name: "🌤️ Asr", value: times.asr, inline: true },
        { name: "🌅 Maghrib", value: times.maghrib, inline: true }, { name: "🌙 Isha", value: times.isha, inline: true },
      )
      .setFooter({ text: `Method: ${times.method} | DarCloud™ Empire` });
    return interaction.editReply({ embeds: [embed] });
  },

  async qibla(interaction) {
    const location = interaction.options.getString("location");
    const geo = await masjidFinder.geocode(location);
    if (!geo) return interaction.editReply({ embeds: [darEmbed("❌ Location Not Found").setColor(0xef4444).setDescription(`Could not find "${location}".`)] });
    const qibla = masjidFinder.getQiblaDirection(geo.lat, geo.lon);
    const embed = darEmbed(`🧭 Qibla Direction — ${location}`)
      .setColor(0xf59e0b)
      .setDescription(`📍 From: ${geo.displayName.split(",").slice(0,3).join(",")}\n🕋 To: Al-Masjid al-Haram, Makkah\n\n🧭 **Direction: ${qibla.bearing}° ${qibla.compass}**\n📏 **Distance: ${qibla.distToKaaba.toLocaleString()} km**`);
    return interaction.editReply({ embeds: [embed] });
  },

  // ── Auto-Setup Commands ─────────────────────────────────────
  async setup(interaction) {
    const member = onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
    const results = autoSetup.setupAllServices(interaction.user.id, interaction.user.tag || interaction.user.username);
    const { embed, row } = autoSetup.createSetupCompleteEmbed(interaction.user.tag || interaction.user.username, results);
    await interaction.editReply({ embeds: [embed], components: row ? [row] : [] });
  },

  "my-services": async (interaction) => {
    const embed = autoSetup.createServiceStatusEmbed(interaction.user.id, interaction.user.tag || interaction.user.username);
    await interaction.editReply({ embeds: [embed] });
  },

  async upgrade(interaction) {
    const plan = interaction.options.getString("plan");
    try {
      const session = await stripeIntegration.createCheckoutSession(interaction.user.id, plan);
      const embed = darEmbed("⬆️ Upgrade Plan")
        .setColor(0x00D4AA)
        .setDescription(`Click below to upgrade your DarCloud plan:\n\n[🔗 Secure Checkout](${session.url})`);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: "❌ " + err.message });
    }
  },

  // ─── Join (One-Click Auto-Onboard) ─────────
  async join(interaction) {
    const userId = interaction.user.id;
    const userTag = interaction.user.tag || interaction.user.username;

    // Create member if not exists
    const member = onboardingDb.getOrCreateMember(userId, userTag);

    // Check if already onboarded
    if (member.onboard_complete) {
      const dashboard = onboardingDb.getMemberDashboard(userId);
      const embed = darEmbed("✅ Already a Member!")
        .setColor(0x00FF88)
        .setDescription(
          `Welcome back **${userTag}**! You're already part of the DarCloud Empire.\n\n` +
          `📧 **Email:** ${member.darcloud_email || "Not set"}\n` +
          `💰 **Wallet:** \`${member.wallet_address ? member.wallet_address.slice(0, 16) + "..." : "—"}\`\n` +
          `💬 **MeshTalk:** ${member.meshtalk_id || "—"}\n` +
          `🏷️ **Plan:** ${member.hwc_tier || "free"}\n` +
          `📋 **Services:** ${dashboard?.services?.length || 0} active\n\n` +
          `Use \`/membership\` to upgrade or \`/billing\` to manage payments.`
        );
      return interaction.editReply({ embeds: [embed] });
    }

    // Auto-provision ALL free services
    const progressEmbed = autoSetup.createSetupProgressEmbed(userTag);
    await interaction.editReply({ embeds: [progressEmbed] });

    const results = autoSetup.setupAllServices(userId, userTag);
    const { embed, row } = autoSetup.createSetupCompleteEmbed(userTag, results);

    // Add membership upgrade buttons
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
    const membershipRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("membership_pro").setLabel("⚡ Go Pro — $49/mo").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("membership_enterprise").setLabel("🏢 Enterprise — $499/mo").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("view_dashboard").setLabel("📊 Dashboard").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setLabel("🌐 DarCloud Portal").setStyle(ButtonStyle.Link).setURL("https://darcloud.host/dashboard"),
    );

    await interaction.editReply({ embeds: [embed], components: [row, membershipRow].filter(Boolean) });
    onboardingDb.stmts.logEvent.run(userId, "auto_join_completed", JSON.stringify({ services: results.success.length }), "darcloud");
  },

  // ─── Membership (View & Upgrade) ───────────
  async membership(interaction) {
    const userId = interaction.user.id;
    const userTag = interaction.user.tag || interaction.user.username;
    const member = onboardingDb.getOrCreateMember(userId, userTag);
    const currentPlan = member.hwc_tier || "free";
    const products = stripeIntegration.STRIPE_PRODUCTS;

    const planDetails = {
      free:       { name: "Starter (Free)",       icon: "🆓", price: "$0/mo",      color: 0x6B7280 },
      pro:        { name: "Professional",         icon: "⚡", price: "$49/mo",     color: 0x3B82F6 },
      enterprise: { name: "Enterprise",           icon: "🏢", price: "$499/mo",    color: 0xF59E0B },
    };
    const current = planDetails[currentPlan] || planDetails.free;

    let desc = `**Current Plan:** ${current.icon} ${current.name} (${current.price})\n\n`;
    desc += "**── Available Plans ──**\n\n";
    desc += "🆓 **Starter (Free)**\n";
    desc += "• QRN Wallet (100 QRN) • DarCloud Email • MeshTalk\n• FungiMesh Node • Community Access\n\n";
    desc += "⚡ **Professional — $49/mo**\n";
    desc += "• All Starter + 10,000 QRN Bonus • Priority Support\n• API Access • Advanced Analytics\n\n";
    desc += "🏢 **Enterprise — $499/mo**\n";
    desc += "• All Pro + Dedicated Node Cluster • 100K QRN\n• Custom Domain • SLA 99.9% • White-Label\n\n";
    desc += "🌿 **FungiMesh Node — $19.99/mo**\n";
    desc += "• Standalone mesh node subscription\n\n";
    desc += "🏦 **HWC Premium — $99/mo**\n";
    desc += "• Premium Halal Wealth Club banking\n\n";

    if (currentPlan !== "enterprise") {
      desc += "💳 **Ready to upgrade?** Click a button below to start your subscription!";
    } else {
      desc += "👑 **You're on the highest tier!** Thank you for your support.";
    }

    const embed = darEmbed(`📋 DarCloud Membership — ${userTag}`)
      .setColor(current.color)
      .setDescription(desc)
      .addFields(
        { name: "💰 Revenue Split", value: "30% Founder • 40% AI Validators\n10% Hardware • 18% Ecosystem • 2% Zakat", inline: false },
      );

    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
    const components = [];
    if (currentPlan !== "enterprise") {
      const row = new ActionRowBuilder();
      if (currentPlan === "free") {
        row.addComponents(
          new ButtonBuilder().setCustomId("membership_pro").setLabel("⚡ Go Pro — $49/mo").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("membership_enterprise").setLabel("🏢 Enterprise — $499/mo").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("membership_fungimesh").setLabel("🌿 FungiMesh — $19.99/mo").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("membership_hwc").setLabel("🏦 HWC — $99/mo").setStyle(ButtonStyle.Secondary),
        );
      } else {
        row.addComponents(
          new ButtonBuilder().setCustomId("membership_enterprise").setLabel("🏢 Upgrade to Enterprise — $499/mo").setStyle(ButtonStyle.Success),
        );
      }
      components.push(row);
    }

    await interaction.editReply({ embeds: [embed], components });
  },

  // ─── Billing (Payment History + Portal) ────
  async billing(interaction) {
    const userId = interaction.user.id;
    const userTag = interaction.user.tag || interaction.user.username;
    const member = onboardingDb.getOrCreateMember(userId, userTag);
    const payments = onboardingDb.stmts.getUserPayments.all(userId);
    const currentPlan = member.hwc_tier || "free";

    let desc = `**Plan:** ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}\n`;
    desc += `**Stripe Customer:** ${member.stripe_customer || "Not linked"}\n\n`;

    if (payments.length > 0) {
      desc += "**── Recent Transactions ──**\n";
      for (const p of payments.slice(0, 10)) {
        const icon = p.status === "paid" ? "✅" : p.status === "pending" ? "⏳" : "❌";
        desc += `${icon} **$${(p.amount / 100).toFixed(2)}** — ${p.product} — ${p.status} — ${p.created_at}\n`;
      }
      const totalPaid = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
      desc += `\n**Total Spent:** $${(totalPaid / 100).toFixed(2)}`;
    } else {
      desc += "**No payment history yet.**\nUpgrade your plan with `/membership` to start your subscription.";
    }

    desc += "\n\n💳 **Manage your subscription:**\nhttps://darcloud.host/api/stripe/portal";

    const embed = darEmbed(`💳 Billing — ${userTag}`)
      .setColor(0x6366F1)
      .setDescription(desc);

    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("📊 Stripe Portal").setStyle(ButtonStyle.Link).setURL("https://darcloud.host/api/stripe/portal"),
      new ButtonBuilder().setCustomId("membership_pro").setLabel("⚡ Upgrade").setStyle(ButtonStyle.Primary),
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },

  // ─── Revenue (Admin Revenue Report) ────────
  async revenue(interaction) {
    const report = stripeIntegration.getRevenueReport();

    const embed = darEmbed("💰 DarCloud Revenue Report")
      .setColor(0x10B981)
      .setDescription(
        `**Total Revenue:** ${report.total_revenue_display}\n\n` +
        "**── Revenue Split ──**\n" +
        `👑 Founder (30%): ${report.splits.founder}\n` +
        `🤖 AI Validators (40%): ${report.splits.validators}\n` +
        `🖥️ Hardware Hosts (10%): ${report.splits.hardware}\n` +
        `🌐 Ecosystem Fund (18%): ${report.splits.ecosystem}\n` +
        `☪️ Zakat (2%): ${report.splits.zakat}\n\n` +
        "**── Members ──**\n" +
        `Total Members: ${report.members.total}\n` +
        `Onboarded: ${report.members.onboarded}\n` +
        `Conversion Rate: ${report.members.conversion_rate}\n\n` +
        `**Gas Toll Chains:** ${report.gas_toll_chains}`
      );

    await interaction.editReply({ embeds: [embed] });
  },

  // ─── Invite (Referral Link Generator) ──────
  async invite(interaction) {
    const userId = interaction.user.id;
    const userTag = interaction.user.tag || interaction.user.username;
    const member = onboardingDb.getOrCreateMember(userId, userTag);
    const referrals = onboardingDb.db.prepare("SELECT COUNT(*) as count FROM members WHERE referred_by = ?").get(member.referral_code);

    const embed = darEmbed("🎉 Invite & Earn")
      .setColor(0x8B5CF6)
      .setDescription(
        `**Your Referral Code:** \`${member.referral_code}\`\n\n` +
        `🔗 **Invite Link:**\nhttps://darcloud.host/join?ref=${member.referral_code}\n\n` +
        `**── Referral Stats ──**\n` +
        `👥 Total Referrals: **${referrals.count}**\n` +
        `💰 QRN Earned: **${referrals.count * 500} QRN**\n\n` +
        "**── Rewards ──**\n" +
        "• **500 QRN** per referral signup\n" +
        "• **1,000 QRN** bonus when referral upgrades to Pro\n" +
        "• **5,000 QRN** bonus when referral upgrades to Enterprise\n\n" +
        "Share your code and grow the DarCloud Empire! 🚀"
      );

    await interaction.editReply({ embeds: [embed] });
  },

  // ─── Premium Status ─────────────────────────
  async premium(interaction) {
    const embed = discordPremium.createPremiumStatusEmbed(interaction);
    const tier = discordPremium.getUserTier(interaction);
    if (tier !== "empire") {
      const comparison = discordPremium.createComparisonEmbed();
      return interaction.editReply({ embeds: [embed, ...comparison.embeds], components: comparison.components });
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Shop ──────────────────────────────────
  async shop(interaction) {
    const shopData = discordPremium.createShopEmbed(interaction);
    await interaction.editReply(shopData);
  },

  // ─── AI Ask (OpenAI GPT-4o) ────────────────
  async "ai-ask"(interaction) {
    // Premium usage limit check
    const usageCheck = discordPremium.checkUsageLimit(interaction, "ai-ask");
    if (!usageCheck.allowed) {
      const upsell = discordPremium.createUpsellEmbed(usageCheck, "ai-ask");
      return interaction.editReply(upsell);
    }
    discordPremium.trackUsage(interaction.user.id, "ai-ask");

    const question = interaction.options.getString("question");
    const agent = interaction.options.getString("agent") || null;
    const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant("discord-bot");
    const result = await openaiAgents.askAssistant(question, assistantId, "discord-bot", { userId: interaction.user.id });
    const embed = darEmbed(`🤖 ${result.assistant || "AI"}`)
      .setColor(result.success ? 0x10B981 : 0xEF4444)
      .setDescription(result.success ? result.answer : `❌ ${result.error}`)
      .setFooter({ text: result.success ? `${result.model} • ${result.tokens} tokens` : "OpenAI" })
      .setTimestamp();
    if (usageCheck.tier === "free" && usageCheck.remaining <= 1) {
      embed.addFields({ name: "⚠️ Usage", value: `${usageCheck.current + 1}/${usageCheck.limit} free AI questions today. Upgrade for unlimited!` });
    }
    await interaction.editReply({ embeds: [embed] });
  },

  // ─── Founder Console (Natural Language AI) ────────
  async "founder"(interaction) {
    const premiumCheck = discordPremium.checkPremiumAccess(interaction, "empire");
    if (!premiumCheck.allowed) {
      const upsell = discordPremium.createUpsellEmbed(premiumCheck, "founder");
      return interaction.editReply(upsell);
    }
    const command = interaction.options.getString("command");
    if (!founderAgent.isFounder(interaction.user.id)) {
      return interaction.editReply({ embeds: [darEmbed("⛔ Access Denied").setColor(0xDC3545).setDescription("Founder-only command.")] });
    }
    const result = await founderAgent.executeNL(command, interaction.user.id);
    const embed = darEmbed("👑 Founder Console™");

    if (result.action === "ai" && result.success) {
      embed.setDescription(result.answer).setFooter({ text: `${result.model} • ${result.tokens} tokens` });
    } else if (result.action === "exec") {
      embed.setDescription(`**Command:** \`${result.command}\`\n\`\`\`\n${result.output}\n\`\`\``);
    } else if (result.action === "status") {
      const d = result.data;
      embed.addFields(
        { name: "PM2 Services", value: d.pm2, inline: true },
        { name: "Disk", value: d.disk, inline: true },
        { name: "Last Commit", value: d.lastCommit, inline: true },
      ).setDescription(`**Docker:**\n\`\`\`\n${d.docker}\n\`\`\`\n**Memory:**\n\`\`\`\n${d.memory}\n\`\`\``);
    } else if (result.action === "deploy") {
      embed.setDescription(`🚀 **Deploy: ${result.target}**\n\n${result.steps}`);
    } else if (result.action === "dashboard") {
      const d = result.data;
      embed.setDescription(`**Founder:** ${d.founder}`)
        .addFields(
          { name: "🏢 Companies", value: String(d.companies), inline: true },
          { name: "🤖 Bots", value: d.bots, inline: true },
          { name: "⚙️ PM2", value: d.pm2, inline: true },
          { name: "🧠 AI", value: d.ai, inline: true },
          { name: "🌐 Mesh", value: d.mesh, inline: true },
          { name: "⛓️ Blockchain", value: d.blockchain, inline: true },
          { name: "🌍 Regions", value: d.regions, inline: true },
          { name: "💰 Revenue Split", value: d.revenue, inline: false },
          { name: "💳 Stripe Products", value: d.stripe, inline: false },
        );
    } else if (result.action === "revenue") {
      const d = result.data;
      embed.addFields(
        { name: "💳 Products", value: d.products, inline: false },
        { name: "📊 Revenue Split", value: d.split, inline: false },
      ).setDescription(d.note);
    } else if (result.action === "companies") {
      embed.setDescription(`**${result.data.total} Companies**\n\n${result.data.tiers}`);
    } else if (result.action === "bots") {
      embed.setDescription(`**${result.data.total} Discord Bots**\n\n${result.data.list}`);
    } else {
      embed.setColor(0xEF4444).setDescription(result.message || "Unknown command. Try: 'status', 'deploy all', 'revenue report', 'restart bots'");
    }
    await interaction.editReply({ embeds: [embed] });
  },

  async "founder-dashboard"(interaction) {
    if (!founderAgent.isFounder(interaction.user.id)) {
      return interaction.editReply({ embeds: [darEmbed("⛔ Access Denied").setColor(0xDC3545).setDescription("Founder-only command.")] });
    }
    const result = founderAgent.getFounderDashboard();
    const d = result.data;
    const embed = darEmbed("👑 Founder Dashboard™")
      .setDescription(`**${d.founder}** — DarCloud Empire`)
      .addFields(
        { name: "🏢 Companies", value: String(d.companies), inline: true },
        { name: "🤖 Discord Bots", value: d.bots, inline: true },
        { name: "⚙️ PM2 Services", value: d.pm2, inline: true },
        { name: "🧠 AI Fleet", value: d.ai, inline: true },
        { name: "🌐 Mesh Network", value: d.mesh, inline: true },
        { name: "⛓️ Blockchains", value: d.blockchain, inline: true },
        { name: "🌍 Regions", value: d.regions, inline: true },
        { name: "💽 Disk", value: d.disk || "N/A", inline: true },
        { name: "⏱️ Uptime", value: d.uptime || "N/A", inline: true },
        { name: "📊 Tiers", value: d.tiers, inline: false },
        { name: "💰 Revenue", value: d.revenue, inline: false },
        { name: "💳 Stripe", value: d.stripe, inline: false },
      );
    await interaction.editReply({ embeds: [embed] });
  },

  async "founder-deploy"(interaction) {
    if (!founderAgent.isFounder(interaction.user.id)) {
      return interaction.editReply({ embeds: [darEmbed("⛔ Access Denied").setColor(0xDC3545).setDescription("Founder-only command.")] });
    }
    const target = interaction.options.getString("target").toLowerCase();
    let deployTarget = "all";
    if (/api|worker|wrangler/.test(target)) deployTarget = "api";
    else if (/bot|discord/.test(target)) deployTarget = "bots";
    else if (/docker|mesh|container/.test(target)) deployTarget = "docker";

    const result = await founderAgent.executeDeploy(deployTarget);
    const embed = darEmbed("🚀 Founder Deploy™")
      .setDescription(`**Target:** ${deployTarget}\n\n${result.steps}`);
    await interaction.editReply({ embeds: [embed] });
  },

  async "founder-exec"(interaction) {
    if (!founderAgent.isFounder(interaction.user.id)) {
      return interaction.editReply({ embeds: [darEmbed("⛔ Access Denied").setColor(0xDC3545).setDescription("Founder-only command.")] });
    }
    const task = interaction.options.getString("task");
    const result = await founderAgent.executeNL(task, interaction.user.id);

    const embed = darEmbed("⚡ Founder Exec™");
    if (result.action === "exec" && result.success) {
      embed.setDescription(`**Command:** \`${result.command}\`\n\`\`\`\n${result.output}\n\`\`\``);
    } else if (result.action === "ai" && result.success) {
      embed.setDescription(result.answer);
    } else {
      embed.setColor(0xEF4444).setDescription(result.message || "Could not execute. Try: 'restart all', 'check logs', 'deploy api'");
    }
    await interaction.editReply({ embeds: [embed] });
  },
};

// ── guildMemberAdd — Auto-Onboarding ────────────────────────
client.on("guildMemberAdd", async (member) => {
  log("INFO", `New member joined: ${member.user.tag} (${member.id})`);

  // Create member record in QuranChain database
  const dbMember = onboardingDb.getOrCreateMember(member.id, member.user.tag);

  // Notify all bots via IPC
  botIpc.notifyMemberJoined(member.id, member.user.tag);

  // Assign welcome role if it exists
  try {
    const welcomeRole = member.guild.roles.cache.find(r => r.name === "Community Member");
    if (welcomeRole) await member.roles.add(welcomeRole);
  } catch (err) {
    log("WARN", `Could not assign role: ${err.message}`);
  }

  // Send welcome DM with onboarding flow
  try {
    const embed = onboardingEngine.createWelcomeEmbed(member);
    const buttons = onboardingEngine.createOnboardingButtons();
    await member.send({ embeds: [embed], components: [buttons] });
    log("INFO", `Welcome DM sent to ${member.user.tag}`);
  } catch (err) {
    log("WARN", `Could not DM ${member.user.tag}: ${err.message}`);
    // Try sending to a system channel instead
    const channel = member.guild.systemChannel;
    if (channel) {
      const embed = onboardingEngine.createWelcomeEmbed(member);
      const buttons = onboardingEngine.createOnboardingButtons();
      await channel.send({ content: `Welcome <@${member.id}>!`, embeds: [embed], components: [buttons] }).catch(() => {});
    }
  }
});

// ── Interaction Handler ─────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  // Handle premium tier comparison button
  if (interaction.isButton() && interaction.customId === "premium_compare") {
    try {
      await interaction.deferReply({ ephemeral: true });
      const comparison = discordPremium.createComparisonEmbed();
      await interaction.editReply(comparison);
      return;
    } catch (err) {
      log("ERROR", `Premium compare error: ${err.message}`);
      return;
    }
  }

  // Handle shop buy buttons
  if (interaction.isButton() && interaction.customId.startsWith("shop_buy_")) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const result = discordPremium.handleShopButton(interaction.customId);
      if (result.handled && result.plan) {
        const session = await stripeIntegration.createCheckoutSession(interaction.user.id, result.plan);
        const embed = darEmbed("💳 Checkout")
          .setColor(0xFFD700)
          .setDescription(`🔗 **[Complete Checkout Here](${session.url})**\n\n${session.simulated ? "⚠️ *Simulation mode*" : "🔒 *Secured by Stripe*"}`)
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
      }
      return;
    } catch (err) {
      if (!interaction.replied) await interaction.editReply({ content: `❌ ${err.message}` }).catch(() => {});
      return;
    }
  }

  // Handle membership subscription buttons
  if (interaction.isButton() && interaction.customId.startsWith("membership_")) {
    try {
      const planMap = {
        membership_pro: "pro",
        membership_enterprise: "enterprise",
        membership_fungimesh: "fungimesh_node",
        membership_hwc: "hwc_premium",
      };
      const plan = planMap[interaction.customId];
      if (!plan) return;

      await interaction.deferReply({ ephemeral: true });
      const userId = interaction.user.id;
      const userTag = interaction.user.tag || interaction.user.username;
      onboardingDb.getOrCreateMember(userId, userTag);

      const session = await stripeIntegration.createCheckoutSession(userId, plan);
      const product = stripeIntegration.STRIPE_PRODUCTS[plan];

      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`💳 Subscribe to ${product.name}`)
        .setDescription(
          `**Price:** $${(product.price_cents / 100).toFixed(2)}/${product.interval === "one_time" ? "one-time" : "mo"}\n\n` +
          (product.features ? `**Features:**\n${product.features.map(f => `✅ ${f}`).join("\n")}\n\n` : "") +
          `🔗 **[Complete Checkout Here](${session.url})**\n\n` +
          (session.simulated ? "⚠️ *Simulation mode — Stripe key not configured*" : "🔒 *Secured by Stripe — PCI DSS compliant*")
        )
        .setFooter({ text: "DarCloud Empire • Revenue Split: 30-40-10-18-2%" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      onboardingDb.stmts.logEvent.run(userId, "checkout_started", JSON.stringify({ plan, session_id: session.id }), "darcloud");
      return;
    } catch (err) {
      log("ERROR", `Membership button error: ${err.message}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {});
      } else {
        await interaction.editReply({ content: `❌ ${err.message}` }).catch(() => {});
      }
      return;
    }
  }

  // Handle onboarding button/modal/select interactions
  if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
    try {
      const handled = await onboardingEngine.handleOnboardingInteraction(interaction, "darcloud");
      if (handled) return;
    } catch (err) {
      log("ERROR", `Onboarding interaction error: ${err.message}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Something went wrong. Please try again.", ephemeral: true }).catch(() => {});
      }
      return;
    }
  }

  if (!interaction.isChatInputCommand()) return;

  // Handle onboarding slash commands
  const onboardCmds = ["onboard", "dashboard", "referral", "services", "subscribe"];
  if (onboardCmds.includes(interaction.commandName)) {
    try {
      await onboardingEngine.handleOnboardingCommand(interaction, "darcloud");
    } catch (err) {
      log("ERROR", `[${interaction.commandName}] ${err.message}`);
      if (!interaction.replied) {
        await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  const handler = handlers[interaction.commandName];
  if (!handler) {
    return interaction.reply({ content: "Unknown command.", ephemeral: true });
  }

  await interaction.deferReply();

  try {
    await handler(interaction);
  } catch (err) {
    log("ERROR", `[${interaction.commandName}] ${err.message}`);
    const embed = darEmbed("❌ Error")
      .setColor(0xdc3545)
      .setDescription(`\`\`\`${err.message.slice(0, 500)}\`\`\``);
    await interaction.editReply({ embeds: [embed] }).catch(() => {});
  }
});

// ── Connection Lifecycle ────────────────────────────────────
client.once("ready", () => {
  reconnectAttempts = 0;
  log("INFO", "╔══════════════════════════════════════════════════╗");
  log("INFO", "║  QuranChain™ DarCloud Discord Bot — AUTONOMOUS  ║");
  log("INFO", "╚══════════════════════════════════════════════════╝");
  log("INFO", `✓ Logged in as ${client.user.tag}`);
  log("INFO", `✓ API Base: ${API_BASE}`);
  log("INFO", `✓ Guilds: ${client.guilds.cache.size}`);
  log("INFO", `✓ ${Object.keys(handlers).length} commands ready`);
  log("INFO", `✓ Heartbeat: every ${HEARTBEAT_INTERVAL / 1000}s`);
  log("INFO", `✓ API health check: every ${API_HEALTH_INTERVAL / 1000}s`);
  log("INFO", "✓ Auto-reconnect: ENABLED");
  log("INFO", "✓ Process recovery: ENABLED");

  startHeartbeat();
  startAPIHealthCheck();
  autoBootstrap();

  // Start IPC server for cross-bot communication + mesh routing
  const meshHandlers = meshRouter.getIpcHandlers();
  botIpc.startIpcServer("darcloud", {
    "/onboard": async (req, body) => {
      const { discord_id, discord_tag } = body;
      return onboardingDb.getOrCreateMember(discord_id, discord_tag);
    },
    "/member-dashboard": async (req, body) => {
      return onboardingDb.getMemberDashboard(body.discord_id);
    },
    "/revenue": async () => {
      return stripeIntegration.getRevenueReport();
    },
    ...meshHandlers,
  });
  log("INFO", "✓ IPC server started on port 9001");

  // Start mesh router — registers this bot as a network relay node
  meshRouter.start().then(() => {
    const status = meshRouter.getStatusData();
    log("INFO", `✓ MESH ROUTER ONLINE — Node: ${status.nodeId} | IP: ${status.meshIp} | Peers: ${status.peersConnected}`);
  }).catch(err => log("WARN", `Mesh router start: ${err.message}`));
});

// ── Auto-bootstrap on first start ───────────────────────────
async function autoBootstrap() {
  try {
    const res = await fetch(`${API_BASE}/api/contracts/companies`);
    const data = await res.json();
    if (!data.total || data.total === 0) {
      log("INFO", "Database empty — running auto-bootstrap...");
      const bRes = await fetch(`${API_BASE}/api/contracts/bootstrap`, { method: "POST" });
      const bData = await bRes.json();
      log("INFO", `Bootstrap complete: ${bData.results?.companies_registered || 0} companies, ${bData.results?.contracts_signed || 0} contracts`);
    } else {
      log("INFO", `Database healthy: ${data.total} companies loaded`);
    }
  } catch (err) {
    log("WARN", `Auto-bootstrap check failed: ${err.message}`);
  }
}

// ── Discord Premium Entitlement Events ──────────────────────
client.on("entitlementCreate", (entitlement) => {
  discordPremium.handleEntitlementCreate(entitlement);
  log("INFO", `[PREMIUM] New subscription: ${entitlement.userId} → SKU ${entitlement.skuId}`);
});
client.on("entitlementUpdate", (oldEnt, newEnt) => {
  discordPremium.handleEntitlementUpdate(oldEnt, newEnt);
  log("INFO", `[PREMIUM] Subscription updated: ${newEnt.userId} → SKU ${newEnt.skuId}`);
});
client.on("entitlementDelete", (entitlement) => {
  discordPremium.handleEntitlementDelete(entitlement);
  log("INFO", `[PREMIUM] Subscription cancelled: ${entitlement.userId} → SKU ${entitlement.skuId}`);
});

// ── Heartbeat Monitor ───────────────────────────────────────
function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    lastHeartbeat = Date.now();
    const wsState = ["READY", "CONNECTING", "RECONNECTING", "IDLE", "NEARLY", "DISCONNECTED", "WAITING_FOR_GUILDS", "IDENTIFYING", "RESUMING"];
    const state = wsState[client.ws?.status] || `UNKNOWN(${client.ws?.status})`;
    const ping = client.ws?.ping ?? -1;
    log("HEARTBEAT", `Discord: ${state} | Ping: ${ping}ms | API: ${apiOnline ? "UP" : "DOWN"} | Guilds: ${client.guilds.cache.size} | Uptime: ${formatUptime(client.uptime)}`);
  }, HEARTBEAT_INTERVAL);
}

// ── API Health Check ────────────────────────────────────────
function startAPIHealthCheck() {
  if (apiHealthTimer) clearInterval(apiHealthTimer);
  apiHealthTimer = setInterval(async () => {
    try {
      const start = Date.now();
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      const latency = Date.now() - start;
      apiOnline = data.status === "healthy";
      log("HEALTH", `API: ${data.status} | Latency: ${latency}ms | Components: ${Object.keys(data.components || {}).join(", ")}`);
    } catch (err) {
      apiOnline = false;
      log("WARN", `API health check failed: ${err.message}`);
    }
  }, API_HEALTH_INTERVAL);
}

function formatUptime(ms) {
  if (!ms) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ── Discord Reconnection Events ─────────────────────────────
client.on("shardDisconnect", (event, shardId) => {
  log("WARN", `Shard ${shardId} disconnected (code: ${event.code}). Auto-reconnecting...`);
});

client.on("shardReconnecting", (shardId) => {
  reconnectAttempts++;
  log("INFO", `Shard ${shardId} reconnecting (attempt ${reconnectAttempts})...`);
});

client.on("shardResume", (shardId, replayedEvents) => {
  reconnectAttempts = 0;
  log("INFO", `Shard ${shardId} resumed. Replayed ${replayedEvents} events.`);
});

client.on("shardError", (error, shardId) => {
  log("ERROR", `Shard ${shardId} error: ${error.message}`);
});

client.on("error", (error) => {
  log("ERROR", `Client error: ${error.message}`);
});

client.on("warn", (msg) => {
  log("WARN", `Client warning: ${msg}`);
});

// ── Graceful Shutdown ───────────────────────────────────────
async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log("INFO", `Received ${signal} — shutting down gracefully...`);
  clearInterval(heartbeatTimer);
  clearInterval(apiHealthTimer);
  try {
    client.destroy();
    log("INFO", "Discord client destroyed.");
  } catch {}
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Crash Recovery ──────────────────────────────────────────
process.on("uncaughtException", (err) => {
  log("FATAL", `Uncaught exception: ${err.message}\n${err.stack}`);
  // Don't exit — let pm2 handle restart if needed
  // But if Discord client is dead, try to re-login
  if (!client.isReady() && !isShuttingDown) {
    log("INFO", "Attempting re-login after crash...");
    setTimeout(() => {
      client.login(DISCORD_TOKEN).catch((e) => {
        log("FATAL", `Re-login failed: ${e.message}. Exiting for pm2 restart.`);
        process.exit(1);
      });
    }, 5000);
  }
});

process.on("unhandledRejection", (reason) => {
  log("ERROR", `Unhandled rejection: ${reason?.message || reason}`);
});

// ── Start ───────────────────────────────────────────────────
log("INFO", "Starting DarCloud Discord Bot (Autonomous Mode)...");
client.login(DISCORD_TOKEN).catch((err) => {
  log("FATAL", `Initial login failed: ${err.message}`);
  process.exit(1);
});
