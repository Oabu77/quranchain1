// ══════════════════════════════════════════════════════════════
// DarCloud™ Autonomous Watchdog
// Monitors API + Discord Bot, auto-heals, reports to Discord
// ══════════════════════════════════════════════════════════════
const { readFileSync } = require("fs");
const { resolve } = require("path");
const { execSync } = require("child_process");

// Load .env
try {
  const env = readFileSync(resolve(__dirname, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}

const API_BASE = process.env.API_BASE || "http://localhost:8787";
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || null;
const CHECK_INTERVAL = 90_000; // 90 seconds
const MAX_CONSECUTIVE_FAILURES = 3;

// ── All PM2 services to monitor ─────────────────────────────
const MONITORED_SERVICES = [
  "darcloud-api", "darcloud-bot", "quranchain-bot", "darcloud-watchdog",
  "fungimesh-bot", "meshtalk-bot", "aifleet-bot", "hwc-bot", "darlaw-bot",
  "darpay-bot", "darnas-bot", "darhealth-bot", "darmedia-bot", "darrealty-bot",
  "darcommerce-bot", "dartrade-bot", "daredu-bot", "darenergy-bot",
  "darsecurity-bot", "dartransport-bot", "dartelecom-bot", "omarai-bot",
  "dardefi-bot", "darhr-bot",
];

// ── IPC ports for health checks ─────────────────────────────
const IPC_PORTS = {
  darcloud: 9001, quranchain: 9002, darpay: 9003, fungimesh: 9004,
  meshtalk: 9005, darnas: 9006, hwc: 9007, darhealth: 9008,
  darmedia: 9009, darrealty: 9010, darcommerce: 9011, dartrade: 9012,
  daredu: 9013, darenergy: 9014, darsecurity: 9015, dartransport: 9016,
  dartelecom: 9017, omarai: 9018, dardefi: 9019, darhr: 9020,
  aifleet: 9021, darlaw: 9022,
};

let apiFailures = 0;
let botFailures = {};
let startTime = Date.now();
let checksRun = 0;
let lastAlertTime = 0;

function log(level, msg) {
  console.log(`[${new Date().toISOString()}] [WATCHDOG] [${level}] ${msg}`);
}

// ── Discord Webhook Alert ───────────────────────────────────
async function alert(title, message, color = 0xff0000) {
  log("ALERT", `${title}: ${message}`);

  // Rate limit alerts (max 1 per 5 minutes)
  if (Date.now() - lastAlertTime < 300_000) return;
  lastAlertTime = Date.now();

  if (!WEBHOOK_URL) return;

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: `🚨 ${title}`,
          description: message,
          color,
          timestamp: new Date().toISOString(),
          footer: { text: "DarCloud Watchdog • Autonomous Monitor" },
        }],
      }),
    });
  } catch (err) {
    log("ERROR", `Webhook alert failed: ${err.message}`);
  }
}

// ── Check API Health ────────────────────────────────────────
async function checkAPI() {
  try {
    const start = Date.now();
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    const latency = Date.now() - start;

    if (data.status === "healthy") {
      if (apiFailures > 0) {
        log("INFO", `API recovered after ${apiFailures} failures (${latency}ms)`);
        await alert("API Recovered", `API is back online. Latency: ${latency}ms`, 0x00ff00);
      }
      apiFailures = 0;
      return { ok: true, latency, status: data.status };
    } else {
      apiFailures++;
      log("WARN", `API unhealthy: ${data.status} (failure ${apiFailures})`);
      return { ok: false, latency, status: data.status };
    }
  } catch (err) {
    apiFailures++;
    log("ERROR", `API check failed (failure ${apiFailures}): ${err.message}`);
    return { ok: false, latency: -1, status: err.message };
  }
}

// ── Check Bot Processes (ALL services) ──────────────────────
function checkBots() {
  const results = {};
  try {
    const pm2List = execSync("pm2 jlist 2>/dev/null", { encoding: "utf8" });
    const processes = JSON.parse(pm2List);

    for (const svc of MONITORED_SERVICES) {
      const proc = processes.find((p) => p.name === svc);
      if (!proc) {
        botFailures[svc] = (botFailures[svc] || 0) + 1;
        results[svc] = { ok: false, status: "not found in pm2" };
      } else if (proc.pm2_env.status === "online") {
        if (botFailures[svc] > 0) {
          log("INFO", `${svc} recovered after ${botFailures[svc]} failures`);
        }
        botFailures[svc] = 0;
        results[svc] = {
          ok: true,
          status: proc.pm2_env.status,
          uptime: proc.pm2_env.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
          restarts: proc.pm2_env.restart_time || 0,
          memory: proc.monit?.memory || 0,
          cpu: proc.monit?.cpu || 0,
        };
      } else {
        botFailures[svc] = (botFailures[svc] || 0) + 1;
        results[svc] = { ok: false, status: proc.pm2_env.status, restarts: proc.pm2_env.restart_time || 0 };
      }
    }
  } catch (err) {
    for (const svc of MONITORED_SERVICES) {
      botFailures[svc] = (botFailures[svc] || 0) + 1;
      results[svc] = { ok: false, status: err.message };
    }
  }
  return results;
}

// ── Auto-Heal ───────────────────────────────────────────────
async function autoHeal(component) {
  log("WARN", `Auto-healing ${component}...`);
  try {
    execSync(`pm2 restart ${component}`, { encoding: "utf8" });
    log("INFO", `${component} restarted via pm2`);
    await alert(`${component} Auto-Healed`, `${component} was restarted automatically.`, 0xffa500);
  } catch (err) {
    log("ERROR", `Auto-heal failed for ${component}: ${err.message}`);
    await alert("Auto-Heal Failed", `Could not restart ${component}: ${err.message}`);
  }
}

// ── Main Check Loop ─────────────────────────────────────────
async function runChecks() {
  checksRun++;
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  // Check API
  const apiResult = await checkAPI();

  // Check ALL Bots
  const botResults = checkBots();
  const online = Object.values(botResults).filter(r => r.ok).length;
  const offline = Object.values(botResults).filter(r => !r.ok).length;

  // Log status
  if (checksRun % 10 === 0) {
    const mainBot = botResults["darcloud-bot"] || {};
    log("STATUS", [
      `Check #${checksRun}`,
      `Watchdog uptime: ${Math.floor(uptime / 3600)}h${Math.floor((uptime % 3600) / 60)}m`,
      `API: ${apiResult.ok ? "UP" : "DOWN"} (${apiResult.latency}ms)`,
      `Bots: ${online}/${MONITORED_SERVICES.length} online`,
      mainBot.memory ? `MainBot Mem: ${(mainBot.memory / 1024 / 1024).toFixed(1)}MB` : "",
    ].filter(Boolean).join(" | "));

    // Report any offline bots
    if (offline > 0) {
      const offlineList = Object.entries(botResults)
        .filter(([, r]) => !r.ok)
        .map(([name, r]) => `${name}: ${r.status}`)
        .join(", ");
      log("WARN", `Offline services: ${offlineList}`);
    }
  }

  // Auto-heal if too many consecutive failures
  if (apiFailures >= MAX_CONSECUTIVE_FAILURES) {
    await autoHeal("darcloud-api");
    apiFailures = 0;
  }
  for (const svc of MONITORED_SERVICES) {
    if ((botFailures[svc] || 0) >= MAX_CONSECUTIVE_FAILURES) {
      await autoHeal(svc);
      botFailures[svc] = 0;
    }
  }
}

// ── Start ───────────────────────────────────────────────────
log("INFO", "╔══════════════════════════════════════════════════╗");
log("INFO", "║  DarCloud™ Autonomous Watchdog                  ║");
log("INFO", "╚══════════════════════════════════════════════════╝");
log("INFO", `✓ Monitoring API at ${API_BASE}`);
log("INFO", `✓ Monitoring ${MONITORED_SERVICES.length} PM2 services`);
log("INFO", `✓ Check interval: ${CHECK_INTERVAL / 1000}s`);
log("INFO", `✓ Auto-heal after ${MAX_CONSECUTIVE_FAILURES} failures`);
log("INFO", `✓ Webhook alerts: ${WEBHOOK_URL ? "ENABLED" : "DISABLED (set DISCORD_WEBHOOK_URL)"}`);
log("INFO", `✓ Services: ${MONITORED_SERVICES.join(", ")}`);
// Initial check after 30s (let services start)
setTimeout(runChecks, 30000);
setInterval(runChecks, CHECK_INTERVAL);

// Keep alive
process.on("SIGINT", () => { log("INFO", "Watchdog shutting down."); process.exit(0); });
process.on("SIGTERM", () => { log("INFO", "Watchdog shutting down."); process.exit(0); });
