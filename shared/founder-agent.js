// ══════════════════════════════════════════════════════════════
// DarCloud Founder AI Agent — Natural Language Command Center
// Omar Mohammad Abunadi — Founder Console™
// ══════════════════════════════════════════════════════════════

const { execSync } = require("child_process");
const path = require("path");

let OpenAI;
try { OpenAI = require("openai"); } catch { OpenAI = null; }

const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, "..");
const FOUNDER_ID = process.env.FOUNDER_DISCORD_ID || ""; // Set in .env

// ── Empire Data ─────────────────────────────────────────
const EMPIRE = {
  founder: "Omar Mohammad Abunadi",
  companies: 101,
  tiers: {
    "Core Platform": 10,
    "Islamic Finance & Banking": 20,
    "AI & Technology": 20,
    "Halal Lifestyle & Commerce": 15,
    "Blockchain & DeFi": 15,
    "International & Regional": 21,
  },
  bots: [
    "discord-bot", "quranchain-bot", "darnas-bot", "darpay-bot", "fungimesh-bot",
    "meshtalk-bot", "hwc-bot", "dardefi-bot", "aifleet-bot", "darlaw-bot",
    "darmedia-bot", "darrealty-bot", "dartrade-bot", "dartransport-bot",
    "daredu-bot", "darhealth-bot", "darcommerce-bot", "darenergy-bot",
    "darsecurity-bot", "dartelecom-bot", "omarai-bot", "darhr-bot",
  ],
  revenueSplit: { founder: "30%", aiValidators: "40%", hardware: "10%", ecosystem: "18%", zakat: "2%" },
  stripeProducts: {
    pro: { name: "DarCloud Pro", price: "$49/mo", id: "prod_U8iRdXPXVFNjK4" },
    enterprise: { name: "DarCloud Enterprise", price: "$499/mo", id: "prod_U8iRGJCeDwYRpF" },
    fungimesh: { name: "FungiMesh Node", price: "$19.99/mo", id: "prod_U8iRtqLIqZxigf" },
    hwc: { name: "HWC Premium", price: "$99/mo", id: "prod_U8iRQESQNJiJ59" },
    gas: { name: "Gas Toll", price: "Variable", id: "prod_U8iRv2gs6CmarP" },
  },
  infrastructure: {
    aiAgents: 66, assistants: 12, blockchains: 47,
    meshNodes: 340000, regions: 21, d1Tables: 72,
    dockerNodes: 9, pm2Services: 21,
  },
};

// ── Safe Commands (allowlisted for execution) ───────────
const SAFE_COMMANDS = {
  // PM2 Operations
  "pm2-status":     "pm2 jlist",
  "pm2-restart":    "pm2 restart all",
  "pm2-logs":       "pm2 logs --nostream --lines 30",
  // Docker Operations
  "docker-status":  "docker compose ps --format json 2>/dev/null || docker ps --format json",
  "docker-restart": "docker compose restart",
  // Git Operations
  "git-status":     "git status --short",
  "git-log":        "git log --oneline -10",
  "git-pull":       "git pull origin",
  "git-diff":       "git diff --stat",
  // System Info
  "disk-usage":     "df -h / | tail -1",
  "memory":         "free -h | head -2",
  "uptime":         "uptime",
  "node-version":   "node --version && npm --version",
  // Deploy
  "deploy-api":     "npx wrangler deploy 2>&1 | tail -5",
  "npm-install":    "npm install 2>&1 | tail -5",
  "register-cmds":  "for d in *-bot; do [ -f \"$d/register-commands.js\" ] && (cd \"$d\" && node register-commands.js 2>&1 | tail -1); done",
};

// ── Intent Detection (NL → Action) ─────────────────────
const INTENTS = [
  { pattern: /deploy\s*(all|everything|api|worker)/i,           action: "deploy",    target: "api" },
  { pattern: /deploy\s*(bot|bots|discord)/i,                    action: "deploy",    target: "bots" },
  { pattern: /deploy\s*(mesh|docker|node|infra)/i,              action: "deploy",    target: "docker" },
  { pattern: /restart\s*(all|everything|pm2|services)/i,        action: "exec",      cmd: "pm2-restart" },
  { pattern: /restart\s*(docker|mesh|container)/i,              action: "exec",      cmd: "docker-restart" },
  { pattern: /status|how.*things|what.*running|health/i,        action: "status" },
  { pattern: /dashboard|overview|kpi|metrics|report/i,          action: "dashboard" },
  { pattern: /revenue|money|income|earn|stripe|sales/i,         action: "revenue" },
  { pattern: /git\s*(pull|update|fetch)/i,                      action: "exec",      cmd: "git-pull" },
  { pattern: /git\s*(status|changes|diff)/i,                    action: "exec",      cmd: "git-status" },
  { pattern: /git\s*(log|history|commit)/i,                     action: "exec",      cmd: "git-log" },
  { pattern: /register.*command|slash.*command|update.*command/i, action: "exec",     cmd: "register-cmds" },
  { pattern: /install.*dep|npm\s*install|update.*packages/i,    action: "exec",      cmd: "npm-install" },
  { pattern: /disk|storage|space/i,                             action: "exec",      cmd: "disk-usage" },
  { pattern: /memory|ram/i,                                     action: "exec",      cmd: "memory" },
  { pattern: /uptime/i,                                         action: "exec",      cmd: "uptime" },
  { pattern: /logs?|errors?|debug/i,                            action: "exec",      cmd: "pm2-logs" },
  { pattern: /docker.*status|container/i,                       action: "exec",      cmd: "docker-status" },
  { pattern: /compan|empire|business/i,                         action: "companies" },
  { pattern: /bot|agent|fleet/i,                                action: "bots" },
];

function safeExec(cmd, timeout = 20000) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout, cwd: WORKSPACE, maxBuffer: 1024 * 512 }).trim();
  } catch (err) {
    return (err.stderr || err.stdout || err.message || "Command failed").trim();
  }
}

// ── Founder Auth Check ──────────────────────────────────
function isFounder(userId) {
  if (!FOUNDER_ID) return false; // Deny all if FOUNDER_DISCORD_ID not configured
  return userId === FOUNDER_ID;
}

// ── Execute Natural Language Command ────────────────────
async function executeNL(command, userId) {
  if (!isFounder(userId)) {
    return { success: false, action: "denied", message: "⛔ Access denied. Founder-only command." };
  }

  // Try intent detection first
  for (const intent of INTENTS) {
    const match = command.match(intent.pattern);
    if (match) {
      return await executeIntent(intent, command, match);
    }
  }

  // No intent matched — use GPT-4o to understand and respond
  return await askFounderAI(command);
}

async function executeIntent(intent, originalCommand, match) {
  switch (intent.action) {
    case "exec": {
      const cmdKey = intent.cmd;
      const shellCmd = SAFE_COMMANDS[cmdKey];
      if (!shellCmd) return { success: false, action: "exec", message: `Unknown command: ${cmdKey}` };
      const output = safeExec(shellCmd);
      return { success: true, action: "exec", command: cmdKey, output: truncate(output, 1500) };
    }

    case "deploy": {
      return await executeDeploy(intent.target);
    }

    case "status": {
      const pm2 = safeExec("pm2 jlist");
      let services = [];
      try { services = JSON.parse(pm2); } catch {} 
      const running = services.filter(s => s.pm2_env?.status === "online").length;
      const total = services.length;
      const docker = safeExec("docker compose ps --format '{{.Name}} {{.Status}}' 2>/dev/null || echo 'Docker not running'");
      const disk = safeExec("df -h / | tail -1");
      const mem = safeExec("free -h | head -2");
      const git = safeExec("git log --oneline -1");

      return {
        success: true, action: "status",
        data: {
          pm2: `${running}/${total} services online`,
          services: services.map(s => `${s.name}: ${s.pm2_env?.status}`).join("\n") || "None",
          docker: truncate(docker, 400),
          disk, memory: mem, lastCommit: git,
        },
      };
    }

    case "dashboard": {
      return getFounderDashboard();
    }

    case "revenue": {
      return getRevenueReport();
    }

    case "companies": {
      return {
        success: true, action: "companies",
        data: {
          total: EMPIRE.companies,
          tiers: Object.entries(EMPIRE.tiers).map(([name, count]) => `**${name}:** ${count}`).join("\n"),
        },
      };
    }

    case "bots": {
      const pm2 = safeExec("pm2 jlist");
      let services = [];
      try { services = JSON.parse(pm2); } catch {}
      const botStatus = EMPIRE.bots.map(bot => {
        const svc = services.find(s => s.name === bot || s.name.includes(bot.replace("-bot", "")));
        const status = svc ? (svc.pm2_env?.status === "online" ? "🟢" : "🔴") : "⚫";
        return `${status} ${bot}`;
      }).join("\n");
      return { success: true, action: "bots", data: { list: botStatus, total: EMPIRE.bots.length } };
    }

    default:
      return { success: false, action: "unknown", message: `Unhandled intent: ${intent.action}` };
  }
}

// ── Deploy Actions ──────────────────────────────────────
async function executeDeploy(target) {
  const steps = [];

  if (target === "api" || target === "all") {
    steps.push({ name: "Wrangler Deploy", output: safeExec("npx wrangler deploy 2>&1 | tail -5", 30000) });
  }
  if (target === "bots" || target === "all") {
    steps.push({ name: "PM2 Restart All", output: safeExec("pm2 restart all 2>&1 | tail -10") });
  }
  if (target === "docker" || target === "all") {
    steps.push({ name: "Docker Restart", output: safeExec("docker compose restart 2>&1 | tail -5") });
  }

  return {
    success: true, action: "deploy", target,
    steps: steps.map(s => `**${s.name}:**\n\`\`\`\n${truncate(s.output, 300)}\n\`\`\``).join("\n\n"),
  };
}

// ── Founder Dashboard ───────────────────────────────────
function getFounderDashboard() {
  const pm2 = safeExec("pm2 jlist");
  let services = [];
  try { services = JSON.parse(pm2); } catch {}
  const running = services.filter(s => s.pm2_env?.status === "online").length;
  const uptime = safeExec("uptime -p");
  const disk = safeExec("df -h / | awk 'NR==2{print $3\"/\"$2\" (\"$5\" used)\"}'");

  return {
    success: true, action: "dashboard",
    data: {
      founder: EMPIRE.founder,
      companies: EMPIRE.companies,
      tiers: Object.entries(EMPIRE.tiers).map(([k, v]) => `${k}: ${v}`).join(" | "),
      bots: `${EMPIRE.bots.length} Discord bots`,
      pm2: `${running}/${services.length} services`,
      ai: `${EMPIRE.infrastructure.aiAgents} agents, ${EMPIRE.infrastructure.assistants} GPT-4o assistants`,
      mesh: `${EMPIRE.infrastructure.meshNodes.toLocaleString()} nodes`,
      blockchain: `${EMPIRE.infrastructure.blockchains} chains`,
      regions: `${EMPIRE.infrastructure.regions} countries`,
      stripe: Object.values(EMPIRE.stripeProducts).map(p => `${p.name}: ${p.price}`).join(" | "),
      revenue: Object.entries(EMPIRE.revenueSplit).map(([k, v]) => `${k}: ${v}`).join(" | "),
      uptime, disk,
    },
  };
}

// ── Revenue Report ──────────────────────────────────────
function getRevenueReport() {
  const products = EMPIRE.stripeProducts;
  return {
    success: true, action: "revenue",
    data: {
      products: Object.values(products).map(p => `**${p.name}:** ${p.price}`).join("\n"),
      split: Object.entries(EMPIRE.revenueSplit).map(([k, v]) => `**${capitalize(k)}:** ${v}`).join("\n"),
      note: "Revenue split is IMMUTABLE — hardcoded in smart contract",
    },
  };
}

// ── GPT-4o Founder AI (for complex/unrecognized commands) ──
let _client = null;
function getClient() {
  if (_client) return _client;
  const key = process.env.OPENAI_API_KEY;
  if (!key || !OpenAI) return null;
  _client = new OpenAI({ apiKey: key });
  return _client;
}

const FOUNDER_SYSTEM_PROMPT = `You are the Founder AI Agent for DarCloud Empire, the personal AI assistant of Omar Mohammad Abunadi (Founder & CEO).

You have DEEP knowledge of the entire empire:
- 101 companies across 6 tiers (Core Platform, Islamic Finance, AI & Tech, Halal Lifestyle, Blockchain & DeFi, International)
- 22 Discord bots, 66 AI agents, 12 GPT-4o specialized assistants
- QuranChain blockchain (QRN token), 47 blockchain networks via gas toll
- FungiMesh decentralized mesh network (340,000 nodes)
- 5 LIVE Stripe products: Pro ($49/mo), Enterprise ($499/mo), FungiMesh ($19.99/mo), HWC Premium ($99/mo), Gas Toll (variable)
- Revenue split: 30% Founder, 40% AI Validators, 10% Hardware Hosts, 18% Ecosystem, 2% Zakat
- Infrastructure: Cloudflare Workers + D1 (72 tables), Docker (9 nodes), PM2 (21 services)
- Cell tower ports: UDP 10001-10021, TCP 11001-11021, DNS 12001-12021

You understand natural language commands and can advise on:
- System operations (deploy, restart, monitor)
- Business strategy (revenue, pricing, expansion)
- Technical architecture (infrastructure, scaling, security)
- Financial compliance (Sharia law, zakat, halal certification)
- Legal matters (IP, trademarks, patents across 101 companies)

When the user asks you to DO something (deploy, restart, check status), tell them the exact command or action.
When they ask for analysis or advice, provide strategic founder-level insight.

Keep responses under 1800 characters for Discord. Use markdown formatting. Be decisive and action-oriented — you are speaking to the founder.`;

async function askFounderAI(question) {
  const client = getClient();
  if (!client) {
    return {
      success: false, action: "ai",
      message: "OpenAI not configured — set OPENAI_API_KEY. Try a direct command like 'status', 'deploy all', or 'restart bots'.",
    };
  }

  // Gather live context
  const pm2Status = safeExec("pm2 jlist 2>/dev/null | head -1000");
  let liveServices = "unavailable";
  try {
    const svcs = JSON.parse(pm2Status);
    liveServices = svcs.map(s => `${s.name}: ${s.pm2_env?.status} (cpu: ${s.monit?.cpu}%, mem: ${(s.monit?.memory / 1048576).toFixed(0)}MB)`).join("\n");
  } catch {}

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: FOUNDER_SYSTEM_PROMPT },
        { role: "user", content: `LIVE PM2 STATUS:\n${liveServices}\n\n---\n\nFounder command: ${question}` },
      ],
      max_tokens: 1024,
      temperature: 0.5,
    });

    const answer = response.choices?.[0]?.message?.content || "No response.";
    return {
      success: true, action: "ai",
      answer,
      model: response.model,
      tokens: response.usage?.total_tokens || 0,
    };
  } catch (err) {
    return { success: false, action: "ai", message: `AI error: ${err.message}` };
  }
}

// ── Helpers ─────────────────────────────────────────────
function truncate(str, max = 1500) {
  if (!str) return "";
  return str.length > max ? str.substring(0, max) + "\n…(truncated)" : str;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  EMPIRE,
  isFounder,
  executeNL,
  getFounderDashboard,
  getRevenueReport,
  executeDeploy,
  askFounderAI,
  SAFE_COMMANDS,
};
