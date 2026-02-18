-- Migration number: 0004 	 2026-02-18T00:00:00.000Z
-- Minecraft servers table for Qcmesh1/Qcmesh2 tracking
CREATE TABLE IF NOT EXISTS minecraft_servers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    host TEXT,
    port INTEGER NOT NULL DEFAULT 25565,
    version TEXT DEFAULT 'latest',
    status TEXT NOT NULL DEFAULT 'offline',
    players_online INTEGER NOT NULL DEFAULT 0,
    max_players INTEGER NOT NULL DEFAULT 20,
    mesh_node_id TEXT,
    hardware TEXT DEFAULT 'leopard',
    last_heartbeat DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Minecraft backups table
CREATE TABLE IF NOT EXISTS minecraft_backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    server_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    world_name TEXT DEFAULT 'world',
    size_bytes INTEGER NOT NULL DEFAULT 0,
    backup_type TEXT NOT NULL DEFAULT 'full',
    label TEXT NOT NULL DEFAULT 'quranchain',
    hardware TEXT NOT NULL DEFAULT 'leopard',
    file_hash TEXT,
    storage_path TEXT,
    mesh_replicated INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (server_id) REFERENCES minecraft_servers(id)
);

CREATE INDEX IF NOT EXISTS idx_mc_backups_server ON minecraft_backups(server_id);
CREATE INDEX IF NOT EXISTS idx_mc_backups_label ON minecraft_backups(label);
CREATE INDEX IF NOT EXISTS idx_mc_backups_created ON minecraft_backups(created_at);
CREATE INDEX IF NOT EXISTS idx_mc_backups_hardware ON minecraft_backups(hardware);

-- Seed the two Qcmesh servers
INSERT OR IGNORE INTO minecraft_servers (id, name, host, port, version, status, max_players, hardware)
VALUES
    ('qcmesh1', 'Qcmesh1 — QuranChain Survival', 'qcmesh1.darcloud.host', 25565, '1.21.4', 'registered', 50, 'leopard'),
    ('qcmesh2', 'Qcmesh2 — QuranChain Creative', 'qcmesh2.darcloud.host', 25566, '1.21.4', 'registered', 50, 'leopard');

-- Seed example backup entries (yesterday's date)
INSERT OR IGNORE INTO minecraft_backups (server_id, filename, world_name, size_bytes, backup_type, label, hardware, storage_path, status, created_at)
VALUES
    ('qcmesh1', 'qcmesh1-world-2026-02-17.tar.gz', 'world', 524288000, 'full', 'quranchain', 'leopard', '/backups/minecraft/qcmesh1/2026-02-17/', 'completed', '2026-02-17T03:00:00Z'),
    ('qcmesh1', 'qcmesh1-nether-2026-02-17.tar.gz', 'world_nether', 134217728, 'full', 'quranchain', 'leopard', '/backups/minecraft/qcmesh1/2026-02-17/', 'completed', '2026-02-17T03:05:00Z'),
    ('qcmesh1', 'qcmesh1-end-2026-02-17.tar.gz', 'world_the_end', 67108864, 'full', 'quranchain', 'leopard', '/backups/minecraft/qcmesh1/2026-02-17/', 'completed', '2026-02-17T03:10:00Z'),
    ('qcmesh1', 'qcmesh1-plugins-2026-02-17.tar.gz', 'plugins', 209715200, 'config', 'quranchain', 'leopard', '/backups/minecraft/qcmesh1/2026-02-17/', 'completed', '2026-02-17T03:15:00Z'),
    ('qcmesh2', 'qcmesh2-world-2026-02-17.tar.gz', 'world', 419430400, 'full', 'quranchain', 'leopard', '/backups/minecraft/qcmesh2/2026-02-17/', 'completed', '2026-02-17T03:00:00Z'),
    ('qcmesh2', 'qcmesh2-nether-2026-02-17.tar.gz', 'world_nether', 104857600, 'full', 'quranchain', 'leopard', '/backups/minecraft/qcmesh2/2026-02-17/', 'completed', '2026-02-17T03:05:00Z'),
    ('qcmesh2', 'qcmesh2-end-2026-02-17.tar.gz', 'world_the_end', 52428800, 'full', 'quranchain', 'leopard', '/backups/minecraft/qcmesh2/2026-02-17/', 'completed', '2026-02-17T03:10:00Z'),
    ('qcmesh2', 'qcmesh2-config-2026-02-17.tar.gz', 'server-config', 83886080, 'config', 'quranchain', 'leopard', '/backups/minecraft/qcmesh2/2026-02-17/', 'completed', '2026-02-17T03:15:00Z');
