import { Hono } from "hono";

const telecomRouter = new Hono<{ Bindings: Env }>();

// ISP Plans
const ISP_PLANS: Record<string, any> = {
  starter: { name: "DarTelecom Starter", price: 19.99, data_gb: 10, speed_mbps: 50, sms: 100, voice_min: 500 },
  pro: { name: "DarTelecom Pro", price: 39.99, data_gb: 50, speed_mbps: 200, sms: 500, voice_min: -1 },
  unlimited: { name: "DarTelecom Unlimited", price: 59.99, data_gb: -1, speed_mbps: 500, sms: -1, voice_min: -1 },
  business: { name: "DarTelecom Business", price: 99.99, data_gb: -1, speed_mbps: 1000, sms: -1, voice_min: -1 },
  mesh_node: { name: "MeshTalk Node Operator", price: 0, data_gb: -1, speed_mbps: -1, sms: 0, voice_min: 0 },
};

// GET /telecom/plans
telecomRouter.get("/plans", (c) => {
  return c.json({ success: true, plans: ISP_PLANS });
});

// GET /telecom/dashboard — ISP overview
telecomRouter.get("/dashboard", async (c) => {
  const db = c.env.DB;
  const [subs, sims, nodes, invoices] = await Promise.all([
    db.prepare("SELECT status, COUNT(*) as count FROM telecom_subscribers GROUP BY status").all(),
    db.prepare("SELECT COUNT(*) as count FROM sim_cards WHERE status = 'active'").first(),
    db.prepare("SELECT COUNT(*) as count FROM isp_mesh_nodes WHERE status = 'online'").first(),
    db.prepare("SELECT COUNT(*) as count FROM telecom_invoices WHERE status = 'pending'").first(),
  ]);

  const subCounts: Record<string, number> = {};
  let totalActive = 0;
  for (const row of (subs.results || [])) {
    subCounts[row.status as string] = row.count as number;
    if (row.status === "active") totalActive = row.count as number;
  }

  // Calculate MRR from active subscribers
  const activeSubs = await db.prepare("SELECT plan FROM telecom_subscribers WHERE status = 'active'").all();
  let mrr = 0;
  for (const sub of (activeSubs.results || [])) {
    const plan = ISP_PLANS[sub.plan as string];
    if (plan) mrr += plan.price;
  }

  return c.json({
    success: true,
    isp: {
      name: "DarTelecom™ by DarCloud",
      network: "MeshTalk 5G",
      plmn: "99970",
      core: "Open5GS 2.7.2",
      status: "operational",
    },
    subscribers: subCounts,
    sims_active: (sims as any)?.count || 0,
    mesh_nodes_online: (nodes as any)?.count || 0,
    pending_invoices: (invoices as any)?.count || 0,
    mrr: `$${mrr.toFixed(2)}`,
    arr: `$${(mrr * 12).toFixed(2)}`,
    revenue_split: {
      founder_30: `$${(mrr * 0.30).toFixed(2)}`,
      ai_validators_40: `$${(mrr * 0.40).toFixed(2)}`,
      hardware_hosts_10: `$${(mrr * 0.10).toFixed(2)}`,
      ecosystem_18: `$${(mrr * 0.18).toFixed(2)}`,
      zakat_2: `$${(mrr * 0.02).toFixed(2)}`,
    },
  });
});

// POST /telecom/subscribers — Provision new subscriber
telecomRouter.post("/subscribers", async (c) => {
  const db = c.env.DB;
  const { name, email, discord_id, plan } = await c.req.json();

  if (!name || !email || !plan) {
    return c.json({ success: false, error: "name, email, and plan required" }, 400);
  }
  if (!ISP_PLANS[plan]) {
    return c.json({ success: false, error: `Invalid plan: ${plan}` }, 400);
  }

  const subscriber_id = crypto.randomUUID();
  const msin = String(Math.floor(Math.random() * 10000000000)).padStart(10, "0");
  const imsi = `99970${msin}`;
  const iccid_base = "8901070" + String(Math.floor(Math.random() * 1000000000000)).padStart(12, "0");
  const iccid = iccid_base.slice(0, 19); // 19 digits + check
  const sim_id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO telecom_subscribers (subscriber_id, imsi, name, email, discord_id, plan, status, created_at, activated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`
  ).bind(subscriber_id, imsi, name, email, discord_id || null, plan).run();

  await db.prepare(
    `INSERT INTO sim_cards (sim_id, iccid, imsi, subscriber_id, status, type, created_at)
     VALUES (?, ?, ?, ?, 'active', 'eSIM', datetime('now'))`
  ).bind(sim_id, iccid, imsi, subscriber_id).run();

  return c.json({
    success: true,
    subscriber: { subscriber_id, imsi, plan: ISP_PLANS[plan].name, status: "active" },
    sim: { iccid, type: "eSIM" },
    network: "DarTelecom MeshTalk 5G",
    esim_activation: `LPA:1$smdp.dartelecom.darcloud.host$${iccid}`,
  });
});

// GET /telecom/subscribers — List subscribers
telecomRouter.get("/subscribers", async (c) => {
  const db = c.env.DB;
  const { status, plan, limit = "50" } = c.req.query();

  let query = "SELECT * FROM telecom_subscribers";
  const conditions: string[] = [];
  const binds: any[] = [];

  if (status) { conditions.push("status = ?"); binds.push(status); }
  if (plan) { conditions.push("plan = ?"); binds.push(plan); }
  if (conditions.length) query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY created_at DESC LIMIT ?";
  binds.push(Number(limit));

  const stmt = db.prepare(query);
  const result = await stmt.bind(...binds).all();

  return c.json({ success: true, subscribers: result.results, total: result.results?.length || 0 });
});

// GET /telecom/subscribers/:id
telecomRouter.get("/subscribers/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  const sub = await db.prepare("SELECT * FROM telecom_subscribers WHERE subscriber_id = ?").bind(id).first();
  if (!sub) return c.json({ success: false, error: "Not found" }, 404);

  const sim = await db.prepare("SELECT sim_id, iccid, imsi, status, type, created_at FROM sim_cards WHERE subscriber_id = ?").bind(id).first();

  return c.json({ success: true, subscriber: sub, sim });
});

// PATCH /telecom/subscribers/:id — Update plan or status
telecomRouter.patch("/subscribers/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const { plan, status } = await c.req.json();

  const sets: string[] = [];
  const binds: any[] = [];

  if (plan && ISP_PLANS[plan]) { sets.push("plan = ?"); binds.push(plan); }
  if (status && ["active", "suspended", "terminated"].includes(status)) { sets.push("status = ?"); binds.push(status); }

  if (!sets.length) return c.json({ success: false, error: "Nothing to update" }, 400);

  sets.push("updated_at = datetime('now')");
  binds.push(id);

  await db.prepare(`UPDATE telecom_subscribers SET ${sets.join(", ")} WHERE subscriber_id = ?`).bind(...binds).run();
  return c.json({ success: true, message: "Subscriber updated" });
});

// DELETE /telecom/subscribers/:id
telecomRouter.delete("/subscribers/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  await db.prepare("UPDATE telecom_subscribers SET status = 'terminated', updated_at = datetime('now') WHERE subscriber_id = ?").bind(id).run();
  await db.prepare("UPDATE sim_cards SET status = 'deactivated' WHERE subscriber_id = ?").bind(id).run();

  return c.json({ success: true, message: "Subscriber terminated" });
});

// GET /telecom/sims — List SIMs
telecomRouter.get("/sims", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT sim_id, iccid, imsi, subscriber_id, status, type, created_at FROM sim_cards ORDER BY created_at DESC").all();
  return c.json({ success: true, sims: result.results });
});

// GET /telecom/network/status — Full network status
telecomRouter.get("/network/status", async (c) => {
  const db = c.env.DB;
  const [subCount, simCount, nodeCount] = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM telecom_subscribers WHERE status = 'active'").first(),
    db.prepare("SELECT COUNT(*) as count FROM sim_cards WHERE status = 'active'").first(),
    db.prepare("SELECT COUNT(*) as count FROM isp_mesh_nodes WHERE status = 'online'").first(),
  ]);

  return c.json({
    success: true,
    network: {
      name: "DarTelecom MeshTalk 5G",
      plmn: "99970",
      mcc: "999",
      mnc: "70",
      status: "operational",
      core: "5G SA + 4G EPC (Open5GS 2.7.2)",
      functions: {
        "5G": ["NRF", "SCP", "AMF", "SMF", "UPF", "AUSF", "UDM", "UDR", "PCF", "NSSF", "BSF"],
        "4G": ["HSS", "MME", "SGWC", "SGWU"],
        "RAN": ["gNodeB", "eNodeB"],
      },
    },
    subscribers_active: (subCount as any)?.count || 0,
    sims_active: (simCount as any)?.count || 0,
    mesh_nodes_online: (nodeCount as any)?.count || 0,
    capabilities: {
      "5g_sa": true,
      "4g_lte": true,
      network_slicing: true,
      esim: true,
      wifi_calling: true,
      mesh_relay: true,
      quantum_encryption: true,
    },
  });
});

// POST /telecom/network/event — Log network event
telecomRouter.post("/network/event", async (c) => {
  const db = c.env.DB;
  const { node_id, type, severity, message, metadata } = await c.req.json();
  const event_id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO network_events (event_id, node_id, type, severity, message, metadata, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(event_id, node_id || "core", type || "info", severity || "info", message || "", JSON.stringify(metadata || {})).run();

  return c.json({ success: true, event_id });
});

// GET /telecom/network/events — Recent events
telecomRouter.get("/network/events", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM network_events ORDER BY timestamp DESC LIMIT 50").all();
  return c.json({ success: true, events: result.results });
});

// POST /telecom/mesh/register — Register ISP mesh node
telecomRouter.post("/mesh/register", async (c) => {
  const db = c.env.DB;
  const { node_id, hardware, region, public_ip, wireguard_pubkey } = await c.req.json();
  if (!node_id) return c.json({ success: false, error: "node_id required" }, 400);

  await db.prepare(
    `INSERT OR REPLACE INTO isp_mesh_nodes (node_id, hardware, region, public_ip, wireguard_pubkey, status, registered_at, last_heartbeat)
     VALUES (?, ?, ?, ?, ?, 'online', datetime('now'), datetime('now'))`
  ).bind(node_id, hardware || "unknown", region || "auto", public_ip || null, wireguard_pubkey || null).run();

  return c.json({ success: true, node_id, message: "Mesh node registered as ISP relay" });
});

// POST /telecom/mesh/heartbeat — ISP mesh node heartbeat
telecomRouter.post("/mesh/heartbeat", async (c) => {
  const db = c.env.DB;
  const { node_id, traffic_bytes, uptime } = await c.req.json();
  if (!node_id) return c.json({ success: false, error: "node_id required" }, 400);

  await db.prepare(
    `UPDATE isp_mesh_nodes SET
       last_heartbeat = datetime('now'),
       status = 'online',
       traffic_forwarded_bytes = traffic_forwarded_bytes + ?,
       uptime_seconds = uptime_seconds + ?
     WHERE node_id = ?`
  ).bind(traffic_bytes || 0, uptime || 30, node_id).run();

  return c.json({ success: true });
});

// GET /telecom/mesh/nodes — List ISP mesh nodes
telecomRouter.get("/mesh/nodes", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM isp_mesh_nodes ORDER BY last_heartbeat DESC").all();
  return c.json({ success: true, nodes: result.results, total: result.results?.length || 0 });
});

// GET /telecom/esim/:subscriber_id — eSIM activation profile
telecomRouter.get("/esim/:subscriber_id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("subscriber_id");

  const sub = await db.prepare("SELECT * FROM telecom_subscribers WHERE subscriber_id = ?").bind(id).first();
  if (!sub) return c.json({ success: false, error: "Not found" }, 404);

  const sim = await db.prepare("SELECT * FROM sim_cards WHERE subscriber_id = ?").bind(id).first();
  if (!sim) return c.json({ success: false, error: "No SIM found" }, 404);

  return c.json({
    success: true,
    esim: {
      activation_code: `1$smdp.dartelecom.darcloud.host$${sim.iccid}`,
      iccid: sim.iccid,
      imsi: sim.imsi,
      network: "DarTelecom",
      plmn: "99970",
      apn: "internet",
      type: "eSIM",
      qr_data: `LPA:1$smdp.dartelecom.darcloud.host$${sim.iccid}`,
      instructions: [
        "Go to Settings → Cellular → Add eSIM",
        "Scan QR code or enter activation code manually",
        `Activation Code: 1$smdp.dartelecom.darcloud.host$${sim.iccid}`,
        "Select DarTelecom as carrier",
        "Enable the eSIM line",
      ],
    },
  });
});

// GET /telecom/billing/summary — Revenue summary
telecomRouter.get("/billing/summary", async (c) => {
  const db = c.env.DB;

  const activeSubs = await db.prepare("SELECT plan FROM telecom_subscribers WHERE status = 'active'").all();
  let mrr = 0;
  const planBreakdown: Record<string, number> = {};
  for (const sub of (activeSubs.results || [])) {
    const plan = ISP_PLANS[sub.plan as string];
    if (plan) {
      mrr += plan.price;
      planBreakdown[sub.plan as string] = (planBreakdown[sub.plan as string] || 0) + 1;
    }
  }

  return c.json({
    success: true,
    mrr: mrr.toFixed(2),
    arr: (mrr * 12).toFixed(2),
    active_subscribers: activeSubs.results?.length || 0,
    plan_breakdown: planBreakdown,
    revenue_split: {
      founder: (mrr * 0.30).toFixed(2),
      ai_validators: (mrr * 0.40).toFixed(2),
      hardware_hosts: (mrr * 0.10).toFixed(2),
      ecosystem: (mrr * 0.18).toFixed(2),
      zakat: (mrr * 0.02).toFixed(2),
    },
  });
});

export { telecomRouter };
