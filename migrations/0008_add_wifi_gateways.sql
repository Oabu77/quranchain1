-- DarCloud FungiMesh WiFi Gateway Tables
-- Migration: Add wifi_gateways and wifi_clients tables

-- WiFi gateway nodes (B.A.T.M.A.N. + hostapd + WireGuard)
CREATE TABLE IF NOT EXISTS wifi_gateways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id TEXT NOT NULL UNIQUE,
    hostname TEXT,
    hardware TEXT DEFAULT 'unknown',
    region TEXT DEFAULT 'auto',
    
    -- WiFi AP config
    ap_ssid TEXT,
    ap_channel INTEGER DEFAULT 6,
    wifi_mode TEXT DEFAULT 'single-radio',
    
    -- B.A.T.M.A.N. mesh
    batman_gw_mode TEXT DEFAULT 'client',
    batman_neighbors INTEGER DEFAULT 0,
    mesh_ssid TEXT DEFAULT 'FungiMesh-Backhaul',
    
    -- WireGuard
    wireguard_pubkey TEXT,
    wireguard_ip TEXT,
    
    -- Network
    public_ip TEXT,
    gateway_ip TEXT DEFAULT '10.78.0.1',
    client_subnet TEXT DEFAULT '10.78.0.0/24',
    
    -- Status
    status TEXT DEFAULT 'offline',
    uptime_seconds INTEGER DEFAULT 0,
    wifi_clients INTEGER DEFAULT 0,
    dhcp_leases INTEGER DEFAULT 0,
    bytes_forwarded INTEGER DEFAULT 0,
    
    -- Revenue
    revenue_earned REAL DEFAULT 0.0,
    free_tier_usage_mb REAL DEFAULT 0.0,
    paid_subscribers INTEGER DEFAULT 0,
    
    -- Timestamps
    registered_at TEXT DEFAULT (datetime('now')),
    last_heartbeat TEXT DEFAULT (datetime('now'))
);

-- WiFi client sessions
CREATE TABLE IF NOT EXISTS wifi_clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gateway_node_id TEXT NOT NULL,
    client_mac TEXT NOT NULL,
    client_ip TEXT,
    hostname TEXT,
    
    -- Plan
    plan TEXT DEFAULT 'free',
    
    -- Usage
    bytes_up INTEGER DEFAULT 0,
    bytes_down INTEGER DEFAULT 0,
    session_start TEXT DEFAULT (datetime('now')),
    session_end TEXT,
    
    -- Status
    status TEXT DEFAULT 'connected',
    
    FOREIGN KEY (gateway_node_id) REFERENCES wifi_gateways(node_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wifi_gateways_status ON wifi_gateways(status);
CREATE INDEX IF NOT EXISTS idx_wifi_gateways_region ON wifi_gateways(region);
CREATE INDEX IF NOT EXISTS idx_wifi_clients_gateway ON wifi_clients(gateway_node_id);
CREATE INDEX IF NOT EXISTS idx_wifi_clients_status ON wifi_clients(status);
CREATE INDEX IF NOT EXISTS idx_wifi_clients_mac ON wifi_clients(client_mac);
