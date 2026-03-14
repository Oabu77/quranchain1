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

let apiFailures = 0;
let botFailures = 0;
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

// ── Check Bot Process ───────────────────────────────────────
function checkBot() {
  try {
    const pm2List = execSync("pm2 jlist 2>/dev/null", { encoding: "utf8" });
    const processes = JSON.parse(pm2List);
    const bot = processes.find((p) => p.name === "darcloud-bot");

    if (!bot) {
      botFailures++;
      return { ok: false, status: "not found in pm2" };
    }

    if (bot.pm2_env.status === "online") {
      if (botFailures > 0) {
        log("INFO", `Bot recovered after ${botFailures} failures`);
      }
      botFailures = 0;
      return {
        ok: true,
        status: bot.pm2_env.status,
        uptime: bot.pm2_env.pm_uptime ? Date.now() - bot.pm2_env.pm_uptime : 0,
        restarts: bot.pm2_env.restart_time || 0,
        memory: bot.monit?.memory || 0,
        cpu: bot.monit?.cpu || 0,
      };
    } else {
      botFailures++;
      return { ok: false, status: bot.pm2_env.status, restarts: bot.pm2_env.restart_time || 0 };
    }
  } catch (err) {
    botFailures++;
    return { ok: false, status: err.message };
  }
}

// ── Auto-Heal ───────────────────────────────────────────────
async function autoHeal(component) {
  log("WARN", `Auto-healing ${component}...`);
  try {
    if (component === "api") {
      execSync("pm2 restart darcloud-api", { encoding: "utf8" });
      log("INFO", "API restarted via pm2");
      await alert("API Auto-Healed", "Wrangler dev server was restarted automatically.", 0xffa500);
    } else if (component === "bot") {
      execSync("pm2 restart darcloud-bot", { encoding: "utf8" });
      log("INFO", "Bot restarted via pm2");
      await alert("Bot Auto-Healed", "Discord bot was restarted automatically.", 0xffa500);
    }
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

  // Check Bot
  const botResult = checkBot();

  // Log status
  if (checksRun % 10 === 0) {
    // Detailed log every ~15 minutes
    log("STATUS", [
      `Check #${checksRun}`,
      `Watchdog uptime: ${Math.floor(uptime / 3600)}h${Math.floor((uptime % 3600) / 60)}m`,
      `API: ${apiResult.ok ? "UP" : "DOWN"} (${apiResult.latency}ms)`,
      `Bot: ${botResult.ok ? "UP" : "DOWN"} (${botResult.status})`,
      botResult.memory ? `Mem: ${(botResult.memory / 1024 / 1024).toFixed(1)}MB` : "",
      botResult.restarts !== undefined ? `Restarts: ${botResult.restarts}` : "",
    ].filter(Boolean).join(" | "));
  }

  // Auto-heal if too many consecutive failures
  if (apiFailures >= MAX_CONSECUTIVE_FAILURES) {
    await autoHeal("api");
    apiFailures = 0;
  }
  if (botFailures >= MAX_CONSECUTIVE_FAILURES) {
    await autoHeal("bot");
    botFailures = 0;
  }
}

// ── Start ───────────────────────────────────────────────────
log("INFO", "╔══════════════════════════════════════════════════╗");
log("INFO", "║  DarCloud™ Autonomous Watchdog                  ║");
log("INFO", "╚══════════════════════════════════════════════════╝");
log("INFO", `✓ Monitoring API at ${API_BASE}`);
log("INFO", `✓ Check interval: ${CHECK_INTERVAL / 1000}s`);
log("INFO", `✓ Auto-heal after ${MAX_CONSECUTIVE_FAILURES} failures`);
log("INFO", `✓ Webhook alerts: ${WEBHOOK_URL ? "ENABLED" : "DISABLED (set DISCORD_WEBHOOK_URL)"}`);

// Initial check after 30s (let services start)
setTimeout(runChecks, 30000);
setInterval(runChecks, CHECK_INTERVAL);

// Keep alive
process.on("SIGINT", () => { log("INFO", "Watchdog shutting down."); process.exit(0); });
process.on("SIGTERM", () => { log("INFO", "Watchdog shutting down."); process.exit(0); });
