-- ==========================================================
-- DarTelecom™ ISP Tables — Telecom Subscriber Management
-- (Renumbered from 0007 to 0011 to fix duplicate migration conflict)
-- ==========================================================

-- Telecom subscribers (mirrors MongoDB for edge queries)
CREATE TABLE IF NOT EXISTS telecom_subscribers (
    subscriber_id TEXT PRIMARY KEY,
    imsi TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    discord_id TEXT,
    plan TEXT NOT NULL DEFAULT 'starter',
    status TEXT NOT NULL DEFAULT 'active',
    data_used_mb REAL DEFAULT 0,
    sms_used INTEGER DEFAULT 0,
    voice_used_minutes REAL DEFAULT 0,
    stripe_customer_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- SIM card inventory
CREATE TABLE IF NOT EXISTS sim_cards (
    sim_id TEXT PRIMARY KEY,
    iccid TEXT UNIQUE NOT NULL,
    imsi TEXT UNIQUE NOT NULL,
    subscriber_id TEXT,
    status TEXT NOT NULL DEFAULT 'available',
    type TEXT DEFAULT 'eSIM',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscriber_id) REFERENCES telecom_subscribers(subscriber_id)
);

-- Telecom invoices
CREATE TABLE IF NOT EXISTS telecom_invoices (
    invoice_id TEXT PRIMARY KEY,
    subscriber_id TEXT NOT NULL,
    billing_cycle TEXT NOT NULL,
    plan TEXT NOT NULL,
    base_amount REAL NOT NULL,
    overage_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_invoice_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    FOREIGN KEY (subscriber_id) REFERENCES telecom_subscribers(subscriber_id)
);

-- Network events log
CREATE TABLE IF NOT EXISTS network_events (
    event_id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    severity TEXT NOT NULL DEFAULT 'info',
    message TEXT,
    metadata TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ISP mesh nodes (extends existing mesh_nodes)
CREATE TABLE IF NOT EXISTS isp_mesh_nodes (
    node_id TEXT PRIMARY KEY,
    hardware TEXT,
    region TEXT,
    public_ip TEXT,
    wireguard_pubkey TEXT,
    role TEXT DEFAULT 'mesh_relay',
    isp_enabled INTEGER DEFAULT 1,
    traffic_forwarded_bytes INTEGER DEFAULT 0,
    subscribers_served INTEGER DEFAULT 0,
    uptime_seconds INTEGER DEFAULT 0,
    revenue_earned REAL DEFAULT 0,
    status TEXT DEFAULT 'offline',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat DATETIME
);
