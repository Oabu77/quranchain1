-- Migration number: 0002 	 2026-02-18T00:00:00.000Z
-- Backups table for QuranChain backup file tracking
CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    filename TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT 'quranchain',
    hardware TEXT NOT NULL DEFAULT 'unknown',
    file_hash TEXT,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    mesh_node_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backups_label ON backups(label);
CREATE INDEX IF NOT EXISTS idx_backups_hardware ON backups(hardware);
CREATE INDEX IF NOT EXISTS idx_backups_created ON backups(created_at);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
