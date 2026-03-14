// ══════════════════════════════════════════════════════════════
// DarCloud Empire — Cross-Bot Communication Layer
// REST + SQLite event bus for all 22 bots to coordinate
// ══════════════════════════════════════════════════════════════
const http = require("http");
const onboardingDb = require("./onboarding-db");

const BOT_REGISTRY = {
  darcloud:    { port: 9001, name: "DarCloud",      role: "orchestrator" },
  quranchain:  { port: 9002, name: "QuranChain",    role: "blockchain"   },
  darpay:      { port: 9003, name: "DarPay",        role: "payments"     },
  fungimesh:   { port: 9004, name: "FungiMesh",     role: "mesh"         },
  meshtalk:    { port: 9005, name: "MeshTalk",      role: "comms"        },
  darnas:      { port: 9006, name: "Dar Al-Nas",    role: "banking"      },
  hwc:         { port: 9007, name: "HWC",           role: "banking"      },
  darhealth:   { port: 9008, name: "DarHealth",     role: "health"       },
  darmedia:    { port: 9009, name: "DarMedia",       role: "media"        },
  darrealty:   { port: 9010, name: "DarRealty",      role: "realty"       },
  darcommerce: { port: 9011, name: "DarCommerce",   role: "commerce"     },
  dartrade:    { port: 9012, name: "DarTrade",       role: "trade"        },
  daredu:      { port: 9013, name: "DarEdu",         role: "education"    },
  darenergy:   { port: 9014, name: "DarEnergy",      role: "energy"       },
  darsecurity: { port: 9015, name: "DarSecurity",    role: "security"     },
  dartransport:{ port: 9016, name: "DarTransport",   role: "transport"    },
  dartelecom:  { port: 9017, name: "DarTelecom",     role: "telecom"      },
  omarai:      { port: 9018, name: "OmarAI",         role: "ai"           },
  dardefi:     { port: 9019, name: "DarDeFi",        role: "defi"         },
  darhr:       { port: 9020, name: "DarHR",           role: "hr"           },
  aifleet:     { port: 9021, name: "AIFleet",         role: "ai"           },
  darlaw:      { port: 9022, name: "DarLaw",          role: "legal"        },
};

// ── Event Bus (SQLite-backed) ─────────────────────────────
onboardingDb.db.exec(`
  CREATE TABLE IF NOT EXISTS bot_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source_bot  TEXT NOT NULL,
    target_bot  TEXT,
    event_type  TEXT NOT NULL,
    payload     TEXT DEFAULT '{}',
    processed   INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_bot_events_target ON bot_events(target_bot, processed);
`);

const eventStmts = {
  publish: onboardingDb.db.prepare("INSERT INTO bot_events (source_bot, target_bot, event_type, payload) VALUES (?, ?, ?, ?)"),
  consume: onboardingDb.db.prepare("SELECT * FROM bot_events WHERE target_bot = ? AND processed = 0 ORDER BY id ASC LIMIT 50"),
  markProcessed: onboardingDb.db.prepare("UPDATE bot_events SET processed = 1 WHERE id = ?"),
  broadcast: onboardingDb.db.prepare("INSERT INTO bot_events (source_bot, target_bot, event_type, payload) VALUES (?, NULL, ?, ?)"),
  consumeBroadcast: onboardingDb.db.prepare("SELECT * FROM bot_events WHERE target_bot IS NULL AND processed = 0 AND source_bot != ? ORDER BY id ASC LIMIT 50"),
};

// ── Publish / Consume ─────────────────────────────────────
function publishEvent(sourceBot, targetBot, eventType, payload = {}) {
  eventStmts.publish.run(sourceBot, targetBot, eventType, JSON.stringify(payload));
}

function broadcastEvent(sourceBot, eventType, payload = {}) {
  eventStmts.broadcast.run(sourceBot, eventType, JSON.stringify(payload));
}

function consumeEvents(botName) {
  const direct = eventStmts.consume.all(botName);
  const broadcasts = eventStmts.consumeBroadcast.all(botName);
  const events = [...direct, ...broadcasts];
  events.forEach(e => eventStmts.markProcessed.run(e.id));
  return events.map(e => ({ ...e, payload: JSON.parse(e.payload) }));
}

// ── Standard Events ───────────────────────────────────────
const EVENT_TYPES = {
  MEMBER_JOINED:       "member.joined",
  MEMBER_ONBOARDED:    "member.onboarded",
  WALLET_CREATED:      "wallet.created",
  PAYMENT_COMPLETED:   "payment.completed",
  SERVICE_PROVISIONED: "service.provisioned",
  NODE_DEPLOYED:       "node.deployed",
  SUBSCRIPTION_ACTIVE: "subscription.active",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  KYC_VERIFIED:        "kyc.verified",
};

// ── HTTP IPC Server for Each Bot ──────────────────────────
function startIpcServer(botName, handlers = {}) {
  const config = BOT_REGISTRY[botName];
  if (!config) {
    console.error(`[IPC] Unknown bot: ${botName}`);
    return null;
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${config.port}`);
    res.setHeader("Content-Type", "application/json");

    // Health check
    if (url.pathname === "/health") {
      res.end(JSON.stringify({ status: "ok", bot: botName, name: config.name }));
      return;
    }

    // Publish event
    if (req.method === "POST" && url.pathname === "/event") {
      let body = "";
      req.on("data", c => body += c);
      req.on("end", () => {
        try {
          const { target, type, payload } = JSON.parse(body);
          if (target) {
            publishEvent(botName, target, type, payload);
          } else {
            broadcastEvent(botName, type, payload);
          }
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // Consume events
    if (req.method === "GET" && url.pathname === "/events") {
      const events = consumeEvents(botName);
      res.end(JSON.stringify({ events }));
      return;
    }

    // Member lookup
    if (req.method === "GET" && url.pathname === "/member") {
      const discordId = url.searchParams.get("id");
      if (!discordId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Missing id parameter" }));
        return;
      }
      const dashboard = onboardingDb.getMemberDashboard(discordId);
      res.end(JSON.stringify(dashboard || { error: "Not found" }));
      return;
    }

    // Stats
    if (url.pathname === "/stats") {
      const stats = {
        members: onboardingDb.stmts.memberCount.get().count,
        onboarded: onboardingDb.stmts.onboardedCount.get().count,
        revenue: onboardingDb.stmts.totalRevenue.get().total,
      };
      res.end(JSON.stringify(stats));
      return;
    }

    // Custom handler
    if (handlers[url.pathname]) {
      try {
        let body = "";
        if (req.method === "POST") {
          await new Promise(resolve => { req.on("data", c => body += c); req.on("end", resolve); });
        }
        const result = await handlers[url.pathname](req, body ? JSON.parse(body) : {}, url.searchParams);
        res.end(JSON.stringify(result || { ok: true }));
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.listen(config.port, "127.0.0.1", () => {
    console.log(`[IPC] ${config.name} listening on port ${config.port}`);
  });

  return server;
}

// ── HTTP Client for Bot-to-Bot Calls ──────────────────────
function callBot(targetBot, path, data = null) {
  const config = BOT_REGISTRY[targetBot];
  if (!config) return Promise.reject(new Error(`Unknown bot: ${targetBot}`));

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: config.port,
      path,
      method: data ? "POST" : "GET",
      headers: data ? { "Content-Type": "application/json" } : {},
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch { resolve(body); }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// ── Notify all bots about a new member ────────────────────
function notifyMemberJoined(discordId, discordTag) {
  broadcastEvent("system", EVENT_TYPES.MEMBER_JOINED, { discord_id: discordId, discord_tag: discordTag });
}

function notifyMemberOnboarded(discordId, plan, services) {
  broadcastEvent("system", EVENT_TYPES.MEMBER_ONBOARDED, { discord_id: discordId, plan, services });
}

function notifyPaymentCompleted(discordId, amount, product) {
  broadcastEvent("system", EVENT_TYPES.PAYMENT_COMPLETED, { discord_id: discordId, amount, product });
}

module.exports = {
  BOT_REGISTRY,
  EVENT_TYPES,
  publishEvent,
  broadcastEvent,
  consumeEvents,
  startIpcServer,
  callBot,
  notifyMemberJoined,
  notifyMemberOnboarded,
  notifyPaymentCompleted,
};
