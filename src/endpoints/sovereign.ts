import { Hono } from "hono";
import { requireAuth } from "./auth";

const sovereign = new Hono<{ Bindings: Env }>();

// ── GET /sovereign/status — Omar AI sovereign node status ──
sovereign.get("/status", async (c) => {
  const authError = await requireAuth(c as any);
  if (authError) return authError;

  const db = c.env.DB;
  try {
    // Get sovereign node from mesh
    const node = await db.prepare(
      "SELECT * FROM mesh_nodes WHERE role = 'sovereign-controller' ORDER BY last_heartbeat DESC LIMIT 1"
    ).first();

    // Get all active services
    const services = await db.prepare(
      "SELECT * FROM mesh_nodes WHERE type = 'mobile-supernode' ORDER BY last_heartbeat DESC"
    ).all();

    // Get active subscriptions count
    const subs = await db.prepare(
      "SELECT COUNT(*) as count, SUM(amount_cents) as mrr FROM active_subscriptions WHERE status = 'active'"
    ).first() as any;

    // Get revenue totals
    const revenue = await db.prepare(
      "SELECT SUM(gross_amount) as total, COUNT(*) as transactions FROM revenue_ledger WHERE status = 'confirmed'"
    ).first() as any;

    // Get treasury balances
    const treasury = await db.prepare(
      "SELECT * FROM treasury_accounts ORDER BY account_type"
    ).all();

    return c.json({
      success: true,
      sovereign: {
        node: node || null,
        online: !!node,
        role: "AMĀN Control Plane",
        agent: "omar-ai",
      },
      empire: {
        companies: 101,
        tiers: 6,
        bots: 22,
        ai_agents: 66,
        assistants: 12,
      },
      revenue: {
        total_cents: revenue?.total || 0,
        total_display: `$${((revenue?.total || 0) / 100).toFixed(2)}`,
        transactions: revenue?.transactions || 0,
        active_subscriptions: subs?.count || 0,
        mrr_cents: subs?.mrr || 0,
        mrr_display: `$${((subs?.mrr || 0) / 100).toFixed(2)}`,
      },
      treasury: treasury.results,
      mobile_nodes: services.results,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ── POST /sovereign/command — Execute command on DarCloud ecosystem ──
sovereign.post("/command", async (c) => {
  const authError = await requireAuth(c as any);
  if (authError) return authError;

  const { command, target, node_id } = await c.req.json();
  if (!command) {
    return c.json({ error: "command is required" }, 400);
  }

  // Allowlisted commands — security first
  const ALLOWED_COMMANDS = [
    "status", "health", "metrics", "services",
    "mesh-status", "mesh-nodes", "mesh-topology",
    "revenue", "treasury", "subscriptions",
    "bots-status", "api-status",
  ];

  if (!ALLOWED_COMMANDS.includes(command)) {
    return c.json({ error: `Command not allowed: ${command}` }, 403);
  }

  const db = c.env.DB;

  try {
    let result: any = {};

    switch (command) {
      case "status":
      case "health": {
        const tables = await db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'").first() as any;
        const nodes = await db.prepare("SELECT COUNT(*) as count FROM mesh_nodes").first() as any;
        result = {
          api: "online",
          database: { tables: tables?.count || 0 },
          mesh_nodes: nodes?.count || 0,
        };
        break;
      }
      case "metrics": {
        const subs = await db.prepare("SELECT COUNT(*) as active FROM active_subscriptions WHERE status='active'").first() as any;
        const users = await db.prepare("SELECT COUNT(*) as total FROM users").first() as any;
        const revenue = await db.prepare("SELECT SUM(gross_amount) as total FROM revenue_ledger WHERE status='confirmed'").first() as any;
        result = {
          users: users?.total || 0,
          active_subscriptions: subs?.active || 0,
          total_revenue_cents: revenue?.total || 0,
        };
        break;
      }
      case "mesh-status": {
        const nodes = await db.prepare("SELECT node_id, type, role, last_heartbeat FROM mesh_nodes ORDER BY last_heartbeat DESC LIMIT 50").all();
        result = { nodes: nodes.results, count: nodes.results.length };
        break;
      }
      case "mesh-nodes": {
        const nodes = await db.prepare("SELECT * FROM mesh_nodes ORDER BY last_heartbeat DESC").all();
        result = { nodes: nodes.results };
        break;
      }
      case "revenue": {
        const rev = await db.prepare("SELECT period, SUM(gross_amount) as revenue, COUNT(*) as tx FROM revenue_ledger WHERE status='confirmed' GROUP BY period ORDER BY period DESC LIMIT 12").all();
        result = { monthly: rev.results };
        break;
      }
      case "treasury": {
        const treasury = await db.prepare("SELECT * FROM treasury_accounts ORDER BY account_type").all();
        result = { accounts: treasury.results };
        break;
      }
      case "subscriptions": {
        const subs = await db.prepare("SELECT product, status, COUNT(*) as count, SUM(amount_cents) as total FROM active_subscriptions GROUP BY product, status").all();
        result = { subscriptions: subs.results };
        break;
      }
      case "bots-status": {
        result = {
          bots: [
            "aifleet", "darcommerce", "dardefi", "daredu", "darenergy",
            "darhealth", "darhr", "darlaw", "darmedia", "darnas",
            "darpay", "darrealty", "darsecurity", "dartelecom", "dartrade",
            "dartransport", "discord", "fungimesh", "hwc", "meshtalk",
            "omarai", "quranchain"
          ],
          count: 22,
          note: "Bot status available via PM2 on host machine",
        };
        break;
      }
      case "api-status": {
        const tables = await db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'").first() as any;
        result = {
          api: "darcloud.host",
          runtime: "Cloudflare Workers",
          database: "D1 SQLite",
          tables: tables?.count || 0,
          version: "6.0.0",
        };
        break;
      }
    }

    // Store command execution in event log
    try {
      await db.prepare(
        "INSERT INTO onboarding_events (discord_id, event_type, event_data, bot_source) VALUES (?, ?, ?, ?)"
      ).bind(
        node_id || "sovereign",
        `sovereign:${command}`,
        JSON.stringify({ command, target, result: "executed" }),
        "omarai-mobile"
      ).run();
    } catch { /* non-critical */ }

    return c.json({
      success: true,
      command,
      target: target || "ecosystem",
      result,
      executed_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ── POST /sovereign/queue-command — Queue a command for a mobile node ──
sovereign.post("/queue-command", async (c) => {
  const authError = await requireAuth(c as any);
  if (authError) return authError;

  const { node_id, command } = await c.req.json();
  if (!node_id || !command) {
    return c.json({ error: "node_id and command are required" }, 400);
  }

  const ALLOWED = ["status", "restart", "start", "stop", "heal", "metrics", "services", "mesh-status", "wifi-status", "battery", "5g-signal", "peers", "logs"];
  if (!ALLOWED.includes(command)) {
    return c.json({ error: `Command not allowed: ${command}` }, 403);
  }

  const db = c.env.DB;
  try {
    await db.prepare(
      "INSERT INTO onboarding_events (discord_id, event_type, event_data, bot_source) VALUES (?, ?, ?, ?)"
    ).bind(
      node_id,
      "sovereign:remote-command",
      JSON.stringify({ command, queued_at: new Date().toISOString() }),
      "omarai-sovereign"
    ).run();

    return c.json({ success: true, node_id, command, status: "queued" });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ── GET /sovereign/commands — Fetch queued commands for a node (polled by phone) ──
sovereign.get("/commands", async (c) => {
  const nodeId = c.req.query("node_id");
  if (!nodeId) {
    return c.json({ error: "node_id query parameter required" }, 400);
  }

  const db = c.env.DB;
  try {
    const cmds = await db.prepare(
      "SELECT id, event_data, created_at FROM onboarding_events WHERE discord_id = ? AND event_type = 'sovereign:remote-command' AND bot_source = 'omarai-sovereign' ORDER BY created_at DESC LIMIT 10"
    ).bind(nodeId).all();

    // Delete processed commands
    if (cmds.results.length > 0) {
      const ids = cmds.results.map((r: any) => r.id);
      for (const id of ids) {
        await db.prepare("DELETE FROM onboarding_events WHERE id = ?").bind(id).run();
      }
    }

    const commands = cmds.results.map((r: any) => {
      try { return JSON.parse(r.event_data as string); } catch { return null; }
    }).filter(Boolean);

    return c.json({ success: true, commands, count: commands.length });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export { sovereign };
