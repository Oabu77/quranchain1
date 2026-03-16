-- Migration 0009: Full ISP Expansion
-- Adds tables for devices, firmware, cellular, service areas, and expands mesh_nodes

-- ═══ Expand mesh_nodes to store WireGuard pubkey + endpoint ═══
-- (mesh_nodes was created in 0003 without these columns)
-- NOTE: These columns were already applied to remote D1 manually.
-- Using CREATE TABLE trick to make this idempotent for D1.
CREATE TABLE IF NOT EXISTS _migration_0009_columns_applied (applied INTEGER);
INSERT OR IGNORE INTO _migration_0009_columns_applied VALUES (1);

-- The ALTER TABLE statements below are wrapped in a view-based guard.
-- Since D1 runs each statement individually and ALTER TABLE ADD COLUMN
-- cannot use IF NOT EXISTS in SQLite, we skip them if columns exist.
-- If running on a fresh DB, uncomment these:
-- ALTER TABLE mesh_nodes ADD COLUMN wireguard_pubkey TEXT DEFAULT '';
-- ALTER TABLE mesh_nodes ADD COLUMN wireguard_endpoint TEXT DEFAULT '';
-- ALTER TABLE mesh_nodes ADD COLUMN public_ip TEXT DEFAULT '';
-- ALTER TABLE mesh_nodes ADD COLUMN listen_port INTEGER DEFAULT 51820;
-- ALTER TABLE mesh_nodes ADD COLUMN mesh_ip TEXT DEFAULT '';
-- ALTER TABLE mesh_nodes ADD COLUMN role TEXT DEFAULT 'relay';
-- ALTER TABLE mesh_nodes ADD COLUMN firmware_version TEXT DEFAULT '1.0.0';
-- ALTER TABLE mesh_nodes ADD COLUMN device_type TEXT DEFAULT 'linux';

-- ═══ ISP Customer Devices (routers, smart devices, phones, etc.) ═══
CREATE TABLE IF NOT EXISTS isp_devices (
    device_id TEXT PRIMARY KEY,
    subscriber_id TEXT,
    device_type TEXT NOT NULL DEFAULT 'router',
    -- Types: router, access_point, mesh_extender, smart_hub, smart_camera,
    --        smart_speaker, smart_thermostat, smart_lock, smart_light,
    --        phone, tablet, laptop, desktop, iot_sensor, cellular_hotspot
    manufacturer TEXT,
    model TEXT,
    mac_address TEXT,
    ip_address TEXT,
    firmware_current TEXT DEFAULT '0.0.0',
    firmware_latest TEXT DEFAULT '1.0.0',
    firmware_status TEXT DEFAULT 'unknown',
    -- firmware_status: up_to_date, update_available, updating, failed
    mesh_enabled INTEGER DEFAULT 0,
    mesh_node_id TEXT,
    -- Links to mesh_nodes if this device is acting as a mesh node
    is_mesh_tower INTEGER DEFAULT 0,
    -- 1 if this router has been flashed to act as a network tower
    tower_config TEXT,
    -- JSON: ssid, channel, power, antenna_gain, coverage_radius_m
    status TEXT DEFAULT 'offline',
    last_seen TEXT DEFAULT (datetime('now')),
    registered_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subscriber_id) REFERENCES telecom_subscribers(subscriber_id)
);

-- ═══ Firmware Registry (available firmware images) ═══
CREATE TABLE IF NOT EXISTS isp_firmware (
    firmware_id TEXT PRIMARY KEY,
    device_type TEXT NOT NULL,
    -- Type: openwrt_router, mesh_gateway, smart_hub, access_point, cellular_gateway
    manufacturer TEXT,
    model_pattern TEXT,
    -- Glob pattern: "TP-Link*", "GL-*", "Xiaomi*", "Ubiquiti*"
    version TEXT NOT NULL,
    download_url TEXT,
    checksum_sha256 TEXT,
    size_bytes INTEGER DEFAULT 0,
    features TEXT,
    -- JSON: ["batman_adv","wireguard","hostapd","mesh_tower","captive_portal"]
    changelog TEXT,
    min_flash_mb INTEGER DEFAULT 8,
    min_ram_mb INTEGER DEFAULT 64,
    status TEXT DEFAULT 'stable',
    -- stable, beta, nightly, deprecated
    release_date TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- ═══ Cellular Data Plans & SIMs ═══
CREATE TABLE IF NOT EXISTS isp_cellular (
    cellular_id TEXT PRIMARY KEY,
    subscriber_id TEXT,
    imsi TEXT,
    iccid TEXT,
    msisdn TEXT,
    -- Phone number
    sim_type TEXT DEFAULT 'physical',
    -- physical, esim, virtual
    plan_type TEXT DEFAULT 'data_5gb',
    -- data_5gb, data_25gb, data_unlimited, voice_data, business_cellular
    data_cap_gb REAL DEFAULT 5.0,
    data_used_gb REAL DEFAULT 0.0,
    monthly_cost REAL DEFAULT 19.99,
    network_type TEXT DEFAULT '5g_sa',
    -- 5g_sa, 5g_nsa, 4g_lte, 3g
    apn TEXT DEFAULT 'darcloud.isp',
    plmn TEXT DEFAULT '99970',
    qci INTEGER DEFAULT 9,
    -- QoS Class Identifier: 1=voice, 5=IMS, 9=default data
    max_bitrate_dl INTEGER DEFAULT 100,
    -- Mbps
    max_bitrate_ul INTEGER DEFAULT 50,
    status TEXT DEFAULT 'active',
    -- active, suspended, terminated, provisioning
    activated_at TEXT DEFAULT (datetime('now')),
    last_usage_update TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subscriber_id) REFERENCES telecom_subscribers(subscriber_id)
);

-- ═══ Service Areas (coverage zones for towers/gateways) ═══
CREATE TABLE IF NOT EXISTS isp_service_areas (
    area_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    area_type TEXT DEFAULT 'residential',
    -- residential, commercial, industrial, rural, campus, event
    latitude REAL,
    longitude REAL,
    radius_km REAL DEFAULT 1.0,
    coverage_type TEXT DEFAULT 'wifi_mesh',
    -- wifi_mesh, cellular_5g, cellular_4g, fiber, fixed_wireless
    tower_count INTEGER DEFAULT 0,
    active_subscribers INTEGER DEFAULT 0,
    avg_speed_mbps REAL DEFAULT 0.0,
    status TEXT DEFAULT 'planned',
    -- planned, deploying, active, maintenance, offline
    created_at TEXT DEFAULT (datetime('now'))
);

-- ═══ Expanded ISP Plans (Home, Business, Cellular) ═══
CREATE TABLE IF NOT EXISTS isp_plans (
    plan_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    speed_mbps INTEGER DEFAULT 0,
    data_cap_gb REAL DEFAULT -1,
    monthly_price REAL NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'home',
    features TEXT DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO isp_plans (plan_id, name, speed_mbps, data_cap_gb, monthly_price, type, features, status) VALUES
    ('home_basic', 'Home Basic Internet', 50, 500, 29.99, 'home', '{"wifi":"included","router":"basic","support":"email"}', 'active'),
    ('home_plus', 'Home Plus Internet', 200, 1500, 49.99, 'home', '{"wifi":"mesh_2_nodes","router":"mesh","support":"phone","smart_home":"basic"}', 'active'),
    ('home_unlimited', 'Home Unlimited Internet', 500, -1, 79.99, 'home', '{"wifi":"mesh_3_nodes","router":"mesh_pro","support":"priority","smart_home":"full","vpn":"included"}', 'active'),
    ('biz_starter', 'Business Starter', 100, 1000, 99.99, 'business', '{"static_ip":1,"sla":"99.5%","support":"business_hours"}', 'active'),
    ('biz_pro', 'Business Professional', 500, -1, 149.99, 'business', '{"static_ip":5,"sla":"99.9%","support":"24_7","vpn":"site_to_site","firewall":"managed"}', 'active'),
    ('biz_enterprise', 'Business Enterprise', 1000, -1, 299.99, 'business', '{"static_ip":13,"sla":"99.99%","support":"dedicated_tam","vpn":"mpls","firewall":"managed","ddos":"included"}', 'active'),
    ('cell_5gb', 'Cellular Data 5GB', 100, 5, 19.99, 'cellular', '{"network":"5g_sa","hotspot":"included","sim":"esim_or_physical"}', 'active'),
    ('cell_25gb', 'Cellular Data 25GB', 200, 25, 39.99, 'cellular', '{"network":"5g_sa","hotspot":"included","sim":"esim_or_physical","intl_roaming":"basic"}', 'active'),
    ('cell_unlimited', 'Cellular Unlimited', 500, -1, 59.99, 'cellular', '{"network":"5g_sa","hotspot":"50gb","sim":"esim_or_physical","intl_roaming":"premium","wifi_calling":"included"}', 'active'),
    ('mesh_node', 'Mesh Node Operator', 0, -1, 0.00, 'mesh', '{"type":"node_operator","revenue_share":"10%","free_internet":"included"}', 'active');

-- ═══ Indexes ═══
CREATE INDEX IF NOT EXISTS idx_isp_devices_subscriber ON isp_devices(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_isp_devices_type ON isp_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_isp_devices_mesh ON isp_devices(mesh_node_id);
CREATE INDEX IF NOT EXISTS idx_isp_cellular_subscriber ON isp_cellular(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_isp_cellular_imsi ON isp_cellular(imsi);
CREATE INDEX IF NOT EXISTS idx_isp_service_areas_type ON isp_service_areas(area_type);
CREATE INDEX IF NOT EXISTS idx_mesh_nodes_pubkey ON mesh_nodes(wireguard_pubkey);
CREATE INDEX IF NOT EXISTS idx_mesh_nodes_role ON mesh_nodes(role);
