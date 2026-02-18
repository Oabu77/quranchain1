-- Migration number: 0005 	 2026-02-18T00:15:00.000Z
-- Multipass VM tracking for FungiMesh node fleet
CREATE TABLE IF NOT EXISTS multipass_vms (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    cpus INTEGER NOT NULL DEFAULT 2,
    memory_mb INTEGER NOT NULL DEFAULT 2048,
    disk_gb INTEGER NOT NULL DEFAULT 10,
    image TEXT NOT NULL DEFAULT 'ubuntu-24.04',
    ip_address TEXT,
    wireguard_pubkey TEXT,
    mesh_node_id TEXT,
    role TEXT NOT NULL DEFAULT 'relay',
    status TEXT NOT NULL DEFAULT 'pending',
    hardware TEXT NOT NULL DEFAULT 'leopard',
    health_endpoint TEXT,
    last_heartbeat DATETIME,
    cloud_init_done INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mp_vms_status ON multipass_vms(status);
CREATE INDEX IF NOT EXISTS idx_mp_vms_role ON multipass_vms(role);
CREATE INDEX IF NOT EXISTS idx_mp_vms_hardware ON multipass_vms(hardware);

-- Seed the fleet - 5 planned nodes
INSERT OR IGNORE INTO multipass_vms (id, name, cpus, memory_mb, disk_gb, role, status, hardware, health_endpoint)
VALUES
    ('fungimesh-relay1',   'fungimesh-relay1',   2, 2048,  10, 'relay',   'planned', 'leopard', 'http://fungimesh-relay1.local:8080/health'),
    ('fungimesh-relay2',   'fungimesh-relay2',   2, 2048,  10, 'relay',   'planned', 'leopard', 'http://fungimesh-relay2.local:8080/health'),
    ('fungimesh-compute1', 'fungimesh-compute1', 4, 4096,  20, 'compute', 'planned', 'leopard', 'http://fungimesh-compute1.local:8080/health'),
    ('fungimesh-backup1',  'fungimesh-backup1',  2, 2048,  30, 'backup',  'planned', 'leopard', 'http://fungimesh-backup1.local:8080/health'),
    ('fungimesh-gateway1', 'fungimesh-gateway1', 2, 2048,  10, 'gateway', 'planned', 'leopard', 'http://fungimesh-gateway1.local:8080/health');
