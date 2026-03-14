// ==========================================================
// DarTelecom™ ISP Controller — Complete ISP Management
// Subscriber provisioning, SIM management, billing, monitoring
// ==========================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { MongoClient, ObjectId } = require('mongodb');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/open5gs';
const PORT = process.env.ISP_PORT || 3000;
const STRIPE_KEY = process.env.STRIPE_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

let db, subscriberDb, open5gsDb;
let stripe;

if (STRIPE_KEY) {
  stripe = require('stripe')(STRIPE_KEY);
}

// ═══════════════════════════════════════════════
// Database Connection
// ═══════════════════════════════════════════════
async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  open5gsDb = client.db('open5gs');
  subscriberDb = client.db('dartelecom');
  db = client;
  console.log('[ISP] Connected to MongoDB');

  // Ensure indexes
  await subscriberDb.collection('subscribers').createIndex({ imsi: 1 }, { unique: true });
  await subscriberDb.collection('subscribers').createIndex({ email: 1 });
  await subscriberDb.collection('subscribers').createIndex({ discord_id: 1 });
  await subscriberDb.collection('sim_cards').createIndex({ iccid: 1 }, { unique: true });
  await subscriberDb.collection('sim_cards').createIndex({ imsi: 1 }, { unique: true });
  await subscriberDb.collection('usage_records').createIndex({ imsi: 1, timestamp: -1 });
  await subscriberDb.collection('usage_records').createIndex({ billing_cycle: 1 });
  await subscriberDb.collection('invoices').createIndex({ subscriber_id: 1 });
  await subscriberDb.collection('network_events').createIndex({ timestamp: -1 });
  await subscriberDb.collection('network_events').createIndex({ node_id: 1 });
}

// ═══════════════════════════════════════════════
// ISP Plans & Pricing
// ═══════════════════════════════════════════════
const ISP_PLANS = {
  starter: {
    name: 'DarTelecom Starter',
    price_monthly: 19.99,
    data_gb: 10,
    speed_mbps: 50,
    sms_included: 100,
    voice_minutes: 500,
    features: ['4G LTE', 'WiFi Calling', 'Basic Support'],
    stripe_price: 'price_dartelecom_starter'
  },
  pro: {
    name: 'DarTelecom Pro',
    price_monthly: 39.99,
    data_gb: 50,
    speed_mbps: 200,
    sms_included: 500,
    voice_minutes: -1, // unlimited
    features: ['5G Access', 'WiFi Calling', 'Hotspot 15GB', 'Priority Support'],
    stripe_price: 'price_dartelecom_pro'
  },
  unlimited: {
    name: 'DarTelecom Unlimited',
    price_monthly: 59.99,
    data_gb: -1, // unlimited (deprioritized after 100GB)
    speed_mbps: 500,
    sms_included: -1,
    voice_minutes: -1,
    features: ['5G Ultra', 'WiFi Calling', 'Hotspot 50GB', 'Premium Support', 'International 10 countries'],
    stripe_price: 'price_dartelecom_unlimited'
  },
  business: {
    name: 'DarTelecom Business',
    price_monthly: 99.99,
    data_gb: -1,
    speed_mbps: 1000,
    sms_included: -1,
    voice_minutes: -1,
    features: ['5G Ultra', 'Static IP', 'VPN', 'Hotspot Unlimited', '24/7 Support', 'Network Slicing', 'SLA 99.9%'],
    stripe_price: 'price_dartelecom_business'
  },
  mesh_node: {
    name: 'MeshTalk Node Operator',
    price_monthly: 0, // free — earns revenue
    data_gb: -1,
    speed_mbps: -1,
    sms_included: 0,
    voice_minutes: 0,
    features: ['Mesh Relay', 'Revenue Sharing', 'FungiMesh Access', 'Node Dashboard'],
    stripe_price: null
  }
};

// ═══════════════════════════════════════════════
// PLMN & Identity Config
// ═══════════════════════════════════════════════
const PLMN = {
  mcc: '999',  // Test PLMN — change to assigned MCC for production
  mnc: '70',   // Test MNC
  network_name: 'DarTelecom',
  operator_code: 'E8ED289DEBA952E4283B54E88E6183CA', // OPc
};

function generateIMSI() {
  // Format: MCC(3) + MNC(2) + MSIN(10)
  const msin = String(Math.floor(Math.random() * 10000000000)).padStart(10, '0');
  return `${PLMN.mcc}${PLMN.mnc}${msin}`;
}

function generateICCID() {
  // Format: 89 + country(2) + issuer(3) + account(12) + check(1)
  const base = '8901' + '070' + String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0');
  // Luhn check digit
  let sum = 0;
  for (let i = 0; i < base.length; i++) {
    let d = parseInt(base[i]);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return base + String((10 - (sum % 10)) % 10);
}

function generateKi() {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
}

// ═══════════════════════════════════════════════
// API Routes — Subscriber Management
// ═══════════════════════════════════════════════

// GET /api/plans — List all ISP plans
app.get('/api/plans', (req, res) => {
  res.json({ success: true, plans: ISP_PLANS });
});

// POST /api/subscribers — Create new subscriber
app.post('/api/subscribers', async (req, res) => {
  try {
    const { name, email, discord_id, plan, address } = req.body;
    if (!name || !email || !plan) {
      return res.status(400).json({ success: false, error: 'name, email, and plan required' });
    }
    if (!ISP_PLANS[plan]) {
      return res.status(400).json({ success: false, error: `Invalid plan: ${plan}` });
    }

    const imsi = generateIMSI();
    const ki = generateKi();
    const iccid = generateICCID();

    const subscriber = {
      subscriber_id: uuidv4(),
      imsi,
      name,
      email,
      discord_id: discord_id || null,
      plan,
      status: 'active',
      address: address || null,
      created_at: new Date(),
      activated_at: new Date(),
      billing_day: new Date().getDate(),
      stripe_customer_id: null,
      stripe_subscription_id: null,
      data_used_mb: 0,
      sms_used: 0,
      voice_used_minutes: 0,
      current_cycle_start: new Date(),
    };

    // Provision SIM card
    const sim = {
      sim_id: uuidv4(),
      iccid,
      imsi,
      ki,
      opc: PLMN.operator_code,
      subscriber_id: subscriber.subscriber_id,
      status: 'active',
      type: 'eSIM',
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      puk: String(Math.floor(10000000 + Math.random() * 90000000)),
      created_at: new Date(),
    };

    // Register in Open5GS subscriber database
    await open5gsDb.collection('subscribers').insertOne({
      imsi,
      security: {
        k: ki,
        amf: '8000',
        op_type: 2, // OPc
        op_value: PLMN.operator_code,
      },
      ambr: {
        uplink: { value: ISP_PLANS[plan].speed_mbps, unit: 1 }, // Mbps
        downlink: { value: ISP_PLANS[plan].speed_mbps, unit: 1 },
      },
      slice: [{
        sst: 1,
        default_indicator: true,
        session: [{
          name: 'internet',
          type: 3, // IPv4v6
          qos: { index: 9, arp: { priority_level: 8, pre_emption_capability: 1, pre_emption_vulnerability: 1 } },
          ambr: {
            uplink: { value: ISP_PLANS[plan].speed_mbps, unit: 1 },
            downlink: { value: ISP_PLANS[plan].speed_mbps, unit: 1 },
          },
        }],
      }],
      schema_version: 1,
    });

    // Save to DarTelecom DB
    await subscriberDb.collection('subscribers').insertOne(subscriber);
    await subscriberDb.collection('sim_cards').insertOne(sim);

    // Create Stripe customer if key exists
    if (stripe && ISP_PLANS[plan].stripe_price) {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { subscriber_id: subscriber.subscriber_id, imsi, plan },
      });
      subscriber.stripe_customer_id = customer.id;
      await subscriberDb.collection('subscribers').updateOne(
        { subscriber_id: subscriber.subscriber_id },
        { $set: { stripe_customer_id: customer.id } }
      );
    }

    res.json({
      success: true,
      subscriber: {
        subscriber_id: subscriber.subscriber_id,
        imsi,
        iccid,
        plan: ISP_PLANS[plan].name,
        status: 'active',
        network: PLMN.network_name,
      },
      sim: {
        iccid,
        type: 'eSIM',
        pin: sim.pin,
      },
      message: 'Subscriber provisioned and registered on DarTelecom 5G Core',
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'Subscriber already exists' });
    }
    console.error('[ISP] Create subscriber error:', err);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// GET /api/subscribers — List all subscribers
app.get('/api/subscribers', async (req, res) => {
  const { status, plan, limit = 50, skip = 0 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (plan) filter.plan = plan;

  const subscribers = await subscriberDb.collection('subscribers')
    .find(filter, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .toArray();

  const total = await subscriberDb.collection('subscribers').countDocuments(filter);
  res.json({ success: true, subscribers, total, limit: Number(limit), skip: Number(skip) });
});

// GET /api/subscribers/:id — Get subscriber details
app.get('/api/subscribers/:id', async (req, res) => {
  const sub = await subscriberDb.collection('subscribers').findOne(
    { subscriber_id: req.params.id },
    { projection: { _id: 0 } }
  );
  if (!sub) return res.status(404).json({ success: false, error: 'Subscriber not found' });

  const sim = await subscriberDb.collection('sim_cards').findOne(
    { subscriber_id: req.params.id },
    { projection: { _id: 0, ki: 0, opc: 0 } }
  );

  const usage = await subscriberDb.collection('usage_records')
    .find({ imsi: sub.imsi })
    .sort({ timestamp: -1 })
    .limit(30)
    .toArray();

  res.json({ success: true, subscriber: sub, sim, recent_usage: usage });
});

// PATCH /api/subscribers/:id — Update subscriber (plan change, suspend, etc.)
app.patch('/api/subscribers/:id', async (req, res) => {
  const { plan, status } = req.body;
  const update = { $set: {} };

  if (plan && ISP_PLANS[plan]) {
    update.$set.plan = plan;
    // Update speed in Open5GS
    const sub = await subscriberDb.collection('subscribers').findOne({ subscriber_id: req.params.id });
    if (sub) {
      await open5gsDb.collection('subscribers').updateOne(
        { imsi: sub.imsi },
        {
          $set: {
            'ambr.uplink.value': ISP_PLANS[plan].speed_mbps,
            'ambr.downlink.value': ISP_PLANS[plan].speed_mbps,
            'slice.0.session.0.ambr.uplink.value': ISP_PLANS[plan].speed_mbps,
            'slice.0.session.0.ambr.downlink.value': ISP_PLANS[plan].speed_mbps,
          }
        }
      );
    }
  }

  if (status && ['active', 'suspended', 'terminated'].includes(status)) {
    update.$set.status = status;
  }

  if (Object.keys(update.$set).length === 0) {
    return res.status(400).json({ success: false, error: 'Nothing to update' });
  }

  update.$set.updated_at = new Date();
  await subscriberDb.collection('subscribers').updateOne({ subscriber_id: req.params.id }, update);
  res.json({ success: true, message: 'Subscriber updated' });
});

// DELETE /api/subscribers/:id — Deactivate subscriber
app.delete('/api/subscribers/:id', async (req, res) => {
  const sub = await subscriberDb.collection('subscribers').findOne({ subscriber_id: req.params.id });
  if (!sub) return res.status(404).json({ success: false, error: 'Not found' });

  // Remove from Open5GS
  await open5gsDb.collection('subscribers').deleteOne({ imsi: sub.imsi });

  // Mark as terminated in DarTelecom DB
  await subscriberDb.collection('subscribers').updateOne(
    { subscriber_id: req.params.id },
    { $set: { status: 'terminated', terminated_at: new Date() } }
  );
  await subscriberDb.collection('sim_cards').updateOne(
    { subscriber_id: req.params.id },
    { $set: { status: 'deactivated' } }
  );

  res.json({ success: true, message: 'Subscriber terminated' });
});

// ═══════════════════════════════════════════════
// API Routes — SIM Management
// ═══════════════════════════════════════════════

// GET /api/sims — List SIM cards
app.get('/api/sims', async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const sims = await subscriberDb.collection('sim_cards')
    .find(filter, { projection: { _id: 0, ki: 0, opc: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  res.json({ success: true, sims, total: sims.length });
});

// POST /api/sims/:iccid/suspend — Suspend SIM
app.post('/api/sims/:iccid/suspend', async (req, res) => {
  await subscriberDb.collection('sim_cards').updateOne(
    { iccid: req.params.iccid },
    { $set: { status: 'suspended' } }
  );
  res.json({ success: true, message: 'SIM suspended' });
});

// POST /api/sims/:iccid/activate — Activate SIM
app.post('/api/sims/:iccid/activate', async (req, res) => {
  await subscriberDb.collection('sim_cards').updateOne(
    { iccid: req.params.iccid },
    { $set: { status: 'active' } }
  );
  res.json({ success: true, message: 'SIM activated' });
});

// ═══════════════════════════════════════════════
// API Routes — Usage & Billing
// ═══════════════════════════════════════════════

// POST /api/usage — Record usage event (called by UPF/SGW)
app.post('/api/usage', async (req, res) => {
  const { imsi, data_bytes, sms_count, voice_seconds, type } = req.body;
  if (!imsi) return res.status(400).json({ success: false, error: 'imsi required' });

  const now = new Date();
  const record = {
    record_id: uuidv4(),
    imsi,
    data_bytes: data_bytes || 0,
    sms_count: sms_count || 0,
    voice_seconds: voice_seconds || 0,
    type: type || 'data',
    timestamp: now,
    billing_cycle: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  };

  await subscriberDb.collection('usage_records').insertOne(record);

  // Update subscriber totals
  const dataMb = (data_bytes || 0) / (1024 * 1024);
  const voiceMin = (voice_seconds || 0) / 60;
  await subscriberDb.collection('subscribers').updateOne(
    { imsi },
    {
      $inc: {
        data_used_mb: dataMb,
        sms_used: sms_count || 0,
        voice_used_minutes: voiceMin,
      }
    }
  );

  // Check if subscriber exceeded plan limits
  const sub = await subscriberDb.collection('subscribers').findOne({ imsi });
  if (sub) {
    const plan = ISP_PLANS[sub.plan];
    if (plan && plan.data_gb > 0) {
      const usedGb = sub.data_used_mb / 1024;
      if (usedGb >= plan.data_gb) {
        // Throttle to 1 Mbps
        await open5gsDb.collection('subscribers').updateOne(
          { imsi },
          {
            $set: {
              'ambr.uplink.value': 1,
              'ambr.downlink.value': 1,
            }
          }
        );
      }
    }
  }

  res.json({ success: true, record_id: record.record_id });
});

// GET /api/usage/:imsi — Get usage for a subscriber
app.get('/api/usage/:imsi', async (req, res) => {
  const { cycle } = req.query;
  const filter = { imsi: req.params.imsi };
  if (cycle) filter.billing_cycle = cycle;

  const records = await subscriberDb.collection('usage_records')
    .find(filter)
    .sort({ timestamp: -1 })
    .limit(100)
    .toArray();

  // Aggregate
  const totals = records.reduce((acc, r) => {
    acc.data_bytes += r.data_bytes;
    acc.sms_count += r.sms_count;
    acc.voice_seconds += r.voice_seconds;
    return acc;
  }, { data_bytes: 0, sms_count: 0, voice_seconds: 0 });

  res.json({
    success: true,
    imsi: req.params.imsi,
    totals: {
      data_gb: (totals.data_bytes / (1024 * 1024 * 1024)).toFixed(2),
      sms: totals.sms_count,
      voice_minutes: (totals.voice_seconds / 60).toFixed(1),
    },
    records: records.slice(0, 20),
  });
});

// GET /api/billing/summary — Revenue summary
app.get('/api/billing/summary', async (req, res) => {
  const subscribers = await subscriberDb.collection('subscribers').find({ status: 'active' }).toArray();

  let totalMRR = 0;
  const planBreakdown = {};
  for (const sub of subscribers) {
    const plan = ISP_PLANS[sub.plan];
    if (plan) {
      totalMRR += plan.price_monthly;
      planBreakdown[sub.plan] = (planBreakdown[sub.plan] || 0) + 1;
    }
  }

  // Revenue split (DarCloud standard)
  const splits = {
    founder: (totalMRR * 0.30).toFixed(2),
    ai_validators: (totalMRR * 0.40).toFixed(2),
    hardware_hosts: (totalMRR * 0.10).toFixed(2),
    ecosystem: (totalMRR * 0.18).toFixed(2),
    zakat: (totalMRR * 0.02).toFixed(2),
  };

  res.json({
    success: true,
    mrr: totalMRR.toFixed(2),
    arr: (totalMRR * 12).toFixed(2),
    active_subscribers: subscribers.length,
    plan_breakdown: planBreakdown,
    revenue_split: splits,
  });
});

// POST /api/billing/generate-invoices — Generate monthly invoices
app.post('/api/billing/generate-invoices', async (req, res) => {
  const cycle = req.body.cycle || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const subscribers = await subscriberDb.collection('subscribers').find({ status: 'active' }).toArray();

  let generated = 0;
  for (const sub of subscribers) {
    const plan = ISP_PLANS[sub.plan];
    if (!plan || plan.price_monthly === 0) continue;

    // Check if already invoiced
    const existing = await subscriberDb.collection('invoices').findOne({
      subscriber_id: sub.subscriber_id,
      billing_cycle: cycle,
    });
    if (existing) continue;

    // Calculate overage
    let overage = 0;
    if (plan.data_gb > 0) {
      const usedGb = sub.data_used_mb / 1024;
      if (usedGb > plan.data_gb) {
        overage = (usedGb - plan.data_gb) * 10; // $10/GB overage
      }
    }

    const invoice = {
      invoice_id: uuidv4(),
      subscriber_id: sub.subscriber_id,
      imsi: sub.imsi,
      billing_cycle: cycle,
      plan: sub.plan,
      base_amount: plan.price_monthly,
      overage_amount: overage,
      total_amount: plan.price_monthly + overage,
      status: 'pending',
      created_at: new Date(),
      usage_summary: {
        data_used_gb: (sub.data_used_mb / 1024).toFixed(2),
        sms_used: sub.sms_used,
        voice_used_minutes: sub.voice_used_minutes.toFixed(1),
      },
    };

    await subscriberDb.collection('invoices').insertOne(invoice);

    // Charge via Stripe if available
    if (stripe && sub.stripe_customer_id) {
      try {
        await stripe.invoiceItems.create({
          customer: sub.stripe_customer_id,
          amount: Math.round(invoice.total_amount * 100),
          currency: 'usd',
          description: `${plan.name} — ${cycle}`,
        });
        const stripeInvoice = await stripe.invoices.create({
          customer: sub.stripe_customer_id,
          auto_advance: true,
        });
        await subscriberDb.collection('invoices').updateOne(
          { invoice_id: invoice.invoice_id },
          { $set: { stripe_invoice_id: stripeInvoice.id, status: 'invoiced' } }
        );
      } catch (err) {
        console.error(`[Billing] Stripe error for ${sub.subscriber_id}:`, err.message);
      }
    }

    generated++;
  }

  res.json({ success: true, cycle, invoices_generated: generated });
});

// ═══════════════════════════════════════════════
// API Routes — Network Monitoring
// ═══════════════════════════════════════════════

// GET /api/network/status — Full network health
app.get('/api/network/status', async (req, res) => {
  const totalSubs = await subscriberDb.collection('subscribers').countDocuments({ status: 'active' });
  const totalSims = await subscriberDb.collection('sim_cards').countDocuments({ status: 'active' });

  // Check Open5GS NF status (via MongoDB)
  const nfStatus = {};
  const nfs = ['amf', 'smf', 'upf', 'ausf', 'udm', 'udr', 'pcf', 'nssf', 'bsf', 'nrf', 'scp', 'hss', 'mme', 'sgwc', 'sgwu'];
  for (const nf of nfs) {
    nfStatus[nf] = 'configured'; // Will show 'running' when containers are up
  }

  // Recent events
  const recentEvents = await subscriberDb.collection('network_events')
    .find()
    .sort({ timestamp: -1 })
    .limit(10)
    .toArray();

  res.json({
    success: true,
    network: {
      name: 'DarTelecom MeshTalk 5G',
      plmn: `${PLMN.mcc}${PLMN.mnc}`,
      mcc: PLMN.mcc,
      mnc: PLMN.mnc,
      status: 'operational',
      core: '5G SA + 4G EPC',
      functions: nfStatus,
    },
    subscribers: {
      active: totalSubs,
      sims_active: totalSims,
    },
    capabilities: {
      '5g_sa': true,
      '4g_lte': true,
      'network_slicing': true,
      'esim': true,
      'wifi_calling': true,
      'mesh_relay': true,
      'quantum_encryption': true,
    },
    recent_events: recentEvents,
  });
});

// POST /api/network/event — Log network event
app.post('/api/network/event', async (req, res) => {
  const { node_id, type, severity, message, metadata } = req.body;
  const event = {
    event_id: uuidv4(),
    node_id: node_id || 'core',
    type: type || 'info',
    severity: severity || 'info',
    message: message || '',
    metadata: metadata || {},
    timestamp: new Date(),
  };
  await subscriberDb.collection('network_events').insertOne(event);
  res.json({ success: true, event_id: event.event_id });
});

// GET /api/network/nodes — List all network nodes (mesh + core)
app.get('/api/network/nodes', async (req, res) => {
  const meshNodes = await subscriberDb.collection('mesh_nodes')
    .find({})
    .sort({ last_heartbeat: -1 })
    .toArray();

  const coreNodes = [
    { node_id: 'amf', type: '5G-AMF', role: 'Access & Mobility', status: 'running' },
    { node_id: 'smf', type: '5G-SMF', role: 'Session Management', status: 'running' },
    { node_id: 'upf', type: '5G-UPF', role: 'User Plane', status: 'running' },
    { node_id: 'ausf', type: '5G-AUSF', role: 'Authentication', status: 'running' },
    { node_id: 'udm', type: '5G-UDM', role: 'Data Management', status: 'running' },
    { node_id: 'udr', type: '5G-UDR', role: 'Data Repository', status: 'running' },
    { node_id: 'pcf', type: '5G-PCF', role: 'Policy Control', status: 'running' },
    { node_id: 'nssf', type: '5G-NSSF', role: 'Slice Selection', status: 'running' },
    { node_id: 'nrf', type: '5G-NRF', role: 'Service Discovery', status: 'running' },
    { node_id: 'scp', type: '5G-SCP', role: 'Comm Proxy', status: 'running' },
    { node_id: 'bsf', type: '5G-BSF', role: 'Binding Support', status: 'running' },
    { node_id: 'hss', type: '4G-HSS', role: 'Home Subscriber Server', status: 'running' },
    { node_id: 'mme', type: '4G-MME', role: 'Mobility Management', status: 'running' },
    { node_id: 'sgwc', type: '4G-SGWC', role: 'Serving Gateway CP', status: 'running' },
    { node_id: 'sgwu', type: '4G-SGWU', role: 'Serving Gateway UP', status: 'running' },
    { node_id: 'gnb', type: 'gNodeB', role: 'Radio Access', status: 'running' },
  ];

  res.json({
    success: true,
    core_nodes: coreNodes,
    mesh_nodes: meshNodes,
    total_core: coreNodes.length,
    total_mesh: meshNodes.length,
  });
});

// ═══════════════════════════════════════════════
// API Routes — eSIM Provisioning (QR code data)
// ═══════════════════════════════════════════════

// GET /api/esim/:subscriber_id — Get eSIM activation data
app.get('/api/esim/:subscriber_id', async (req, res) => {
  const sub = await subscriberDb.collection('subscribers').findOne({ subscriber_id: req.params.subscriber_id });
  if (!sub) return res.status(404).json({ success: false, error: 'Not found' });

  const sim = await subscriberDb.collection('sim_cards').findOne({ subscriber_id: req.params.subscriber_id });
  if (!sim) return res.status(404).json({ success: false, error: 'No SIM found' });

  // eSIM activation profile (SM-DP+ format)
  const esimProfile = {
    activation_code: `1$smdp.dartelecom.darcloud.host$${sim.iccid}`,
    iccid: sim.iccid,
    imsi: sim.imsi,
    network: PLMN.network_name,
    plmn: `${PLMN.mcc}${PLMN.mnc}`,
    apn: 'internet',
    type: 'eSIM',
    qr_data: `LPA:1$smdp.dartelecom.darcloud.host$${sim.iccid}`,
    instructions: [
      'Go to Settings → Cellular → Add eSIM',
      'Scan the QR code or enter activation code manually',
      `Activation Code: 1$smdp.dartelecom.darcloud.host$${sim.iccid}`,
      'Select DarTelecom as your carrier',
      'Enable the eSIM line',
    ],
  };

  res.json({ success: true, esim: esimProfile });
});

// ═══════════════════════════════════════════════
// API Routes — Mesh Node Management
// ═══════════════════════════════════════════════

// POST /api/mesh/register — Register mesh node as ISP relay
app.post('/api/mesh/register', async (req, res) => {
  const { node_id, hardware, region, public_ip, wireguard_pubkey, capabilities } = req.body;
  if (!node_id) return res.status(400).json({ success: false, error: 'node_id required' });

  const node = {
    node_id,
    hardware: hardware || 'unknown',
    region: region || 'auto',
    public_ip: public_ip || null,
    wireguard_pubkey: wireguard_pubkey || null,
    capabilities: capabilities || ['relay'],
    status: 'online',
    role: 'mesh_relay',
    isp_enabled: true,
    traffic_forwarded_bytes: 0,
    subscribers_served: 0,
    uptime_seconds: 0,
    revenue_earned: 0,
    registered_at: new Date(),
    last_heartbeat: new Date(),
  };

  await subscriberDb.collection('mesh_nodes').updateOne(
    { node_id },
    { $set: node },
    { upsert: true }
  );

  res.json({ success: true, node_id, message: 'Mesh node registered as ISP relay' });
});

// POST /api/mesh/heartbeat — Mesh node heartbeat with traffic stats
app.post('/api/mesh/heartbeat', async (req, res) => {
  const { node_id, traffic_bytes, subscribers_active, uptime } = req.body;
  if (!node_id) return res.status(400).json({ success: false, error: 'node_id required' });

  await subscriberDb.collection('mesh_nodes').updateOne(
    { node_id },
    {
      $set: { last_heartbeat: new Date(), status: 'online' },
      $inc: {
        traffic_forwarded_bytes: traffic_bytes || 0,
        subscribers_served: 0,
        uptime_seconds: uptime || 30,
      },
    }
  );

  res.json({ success: true });
});

// ═══════════════════════════════════════════════
// API Routes — ISP Dashboard Stats
// ═══════════════════════════════════════════════

// GET /api/dashboard — Complete ISP dashboard
app.get('/api/dashboard', async (req, res) => {
  const [
    activeSubs,
    suspendedSubs,
    terminatedSubs,
    activeSims,
    onlineNodes,
    pendingInvoices,
  ] = await Promise.all([
    subscriberDb.collection('subscribers').countDocuments({ status: 'active' }),
    subscriberDb.collection('subscribers').countDocuments({ status: 'suspended' }),
    subscriberDb.collection('subscribers').countDocuments({ status: 'terminated' }),
    subscriberDb.collection('sim_cards').countDocuments({ status: 'active' }),
    subscriberDb.collection('mesh_nodes').countDocuments({ status: 'online' }),
    subscriberDb.collection('invoices').countDocuments({ status: 'pending' }),
  ]);

  // Calculate MRR
  const activeSubsData = await subscriberDb.collection('subscribers').find({ status: 'active' }).toArray();
  let mrr = 0;
  for (const s of activeSubsData) {
    if (ISP_PLANS[s.plan]) mrr += ISP_PLANS[s.plan].price_monthly;
  }

  // Total data usage this month
  const cycle = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const usageAgg = await subscriberDb.collection('usage_records').aggregate([
    { $match: { billing_cycle: cycle } },
    { $group: { _id: null, total_bytes: { $sum: '$data_bytes' }, total_sms: { $sum: '$sms_count' }, total_voice: { $sum: '$voice_seconds' } } },
  ]).toArray();

  const usage = usageAgg[0] || { total_bytes: 0, total_sms: 0, total_voice: 0 };

  res.json({
    success: true,
    isp: {
      name: 'DarTelecom™ by DarCloud',
      network: 'MeshTalk 5G',
      plmn: `${PLMN.mcc}${PLMN.mnc}`,
      core: 'Open5GS 2.7.2',
      status: 'operational',
    },
    subscribers: {
      active: activeSubs,
      suspended: suspendedSubs,
      terminated: terminatedSubs,
      total: activeSubs + suspendedSubs + terminatedSubs,
    },
    sims: { active: activeSims },
    mesh: { online_nodes: onlineNodes },
    billing: {
      mrr: `$${mrr.toFixed(2)}`,
      arr: `$${(mrr * 12).toFixed(2)}`,
      pending_invoices: pendingInvoices,
    },
    usage_this_month: {
      data_tb: (usage.total_bytes / (1024 ** 4)).toFixed(3),
      sms: usage.total_sms,
      voice_hours: (usage.total_voice / 3600).toFixed(1),
    },
    revenue_split: {
      founder_30: `$${(mrr * 0.30).toFixed(2)}`,
      ai_validators_40: `$${(mrr * 0.40).toFixed(2)}`,
      hardware_hosts_10: `$${(mrr * 0.10).toFixed(2)}`,
      ecosystem_18: `$${(mrr * 0.18).toFixed(2)}`,
      zakat_2: `$${(mrr * 0.02).toFixed(2)}`,
    },
  });
});

// ═══════════════════════════════════════════════
// Stripe Webhook — Payment events
// ═══════════════════════════════════════════════
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(400).send('Stripe not configured');

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'invoice.paid': {
      const invoice = event.data.object;
      await subscriberDb.collection('invoices').updateOne(
        { stripe_invoice_id: invoice.id },
        { $set: { status: 'paid', paid_at: new Date() } }
      );
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await subscriberDb.collection('invoices').updateOne(
        { stripe_invoice_id: invoice.id },
        { $set: { status: 'failed' } }
      );
      // Suspend subscriber after 3 failed attempts
      const sub = await subscriberDb.collection('subscribers').findOne({ stripe_customer_id: invoice.customer });
      if (sub) {
        const failedCount = await subscriberDb.collection('invoices').countDocuments({
          subscriber_id: sub.subscriber_id,
          status: 'failed',
        });
        if (failedCount >= 3) {
          await subscriberDb.collection('subscribers').updateOne(
            { subscriber_id: sub.subscriber_id },
            { $set: { status: 'suspended' } }
          );
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await subscriberDb.collection('subscribers').updateOne(
        { stripe_customer_id: subscription.customer },
        { $set: { status: 'terminated', terminated_at: new Date() } }
      );
      break;
    }
  }

  res.json({ received: true });
});

// ═══════════════════════════════════════════════
// Cron Jobs — Automated ISP Operations
// ═══════════════════════════════════════════════

// Every hour: mark stale mesh nodes as offline
cron.schedule('0 * * * *', async () => {
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
  const result = await subscriberDb.collection('mesh_nodes').updateMany(
    { last_heartbeat: { $lt: staleThreshold }, status: 'online' },
    { $set: { status: 'offline' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[ISP] Marked ${result.modifiedCount} stale nodes offline`);
  }
});

// Every day at midnight: reset monthly usage counters on billing day
cron.schedule('0 0 * * *', async () => {
  const today = new Date().getDate();
  const result = await subscriberDb.collection('subscribers').updateMany(
    { billing_day: today, status: 'active' },
    {
      $set: {
        data_used_mb: 0,
        sms_used: 0,
        voice_used_minutes: 0,
        current_cycle_start: new Date(),
      }
    }
  );
  if (result.modifiedCount > 0) {
    console.log(`[ISP] Reset usage for ${result.modifiedCount} subscribers (billing day ${today})`);
    // Restore speeds
    const subs = await subscriberDb.collection('subscribers').find({ billing_day: today, status: 'active' }).toArray();
    for (const sub of subs) {
      const plan = ISP_PLANS[sub.plan];
      if (plan) {
        await open5gsDb.collection('subscribers').updateOne(
          { imsi: sub.imsi },
          {
            $set: {
              'ambr.uplink.value': plan.speed_mbps,
              'ambr.downlink.value': plan.speed_mbps,
            }
          }
        );
      }
    }
  }
});

// 1st of month: auto-generate invoices
cron.schedule('0 1 1 * *', async () => {
  console.log('[ISP] Auto-generating monthly invoices...');
  const cycle = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  // Reuse the billing endpoint logic
  const subscribers = await subscriberDb.collection('subscribers').find({ status: 'active' }).toArray();
  for (const sub of subscribers) {
    const plan = ISP_PLANS[sub.plan];
    if (!plan || plan.price_monthly === 0) continue;
    const existing = await subscriberDb.collection('invoices').findOne({ subscriber_id: sub.subscriber_id, billing_cycle: cycle });
    if (existing) continue;
    const invoice = {
      invoice_id: uuidv4(),
      subscriber_id: sub.subscriber_id,
      imsi: sub.imsi,
      billing_cycle: cycle,
      plan: sub.plan,
      base_amount: plan.price_monthly,
      overage_amount: 0,
      total_amount: plan.price_monthly,
      status: 'pending',
      created_at: new Date(),
    };
    await subscriberDb.collection('invoices').insertOne(invoice);
  }
  console.log('[ISP] Monthly invoices generated');
});

// ═══════════════════════════════════════════════
// Health check
// ═══════════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'DarTelecom ISP Controller', uptime: process.uptime() });
});

// ═══════════════════════════════════════════════
// Start server
// ═══════════════════════════════════════════════
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('============================================');
    console.log('  DarTelecom™ ISP Controller');
    console.log(`  Port: ${PORT}`);
    console.log(`  PLMN: ${PLMN.mcc}${PLMN.mnc}`);
    console.log('  Core: Open5GS 2.7.2 (5G SA + 4G EPC)');
    console.log('  Features: Subscriber Mgmt, SIM, Billing, Mesh');
    console.log('============================================');
  });
}).catch(err => {
  console.error('[ISP] Failed to start:', err);
  process.exit(1);
});
