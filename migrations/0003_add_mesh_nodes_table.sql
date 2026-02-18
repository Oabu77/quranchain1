-- Migration number: 0003 	 2026-02-18T00:00:00.000Z
-- Mesh nodes registration table for FungiMesh connectivity
CREATE TABLE IF NOT EXISTS mesh_nodes (
    node_id TEXT PRIMARY KEY NOT NULL,
    hardware TEXT NOT NULL DEFAULT 'standard',
    region TEXT NOT NULL DEFAULT 'auto-detect',
    status TEXT NOT NULL DEFAULT 'disconnected',
    connected_at DATETIME,
    last_heartbeat DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mesh_nodes_hardware ON mesh_nodes(hardware);
CREATE INDEX IF NOT EXISTS idx_mesh_nodes_status ON mesh_nodes(status);
