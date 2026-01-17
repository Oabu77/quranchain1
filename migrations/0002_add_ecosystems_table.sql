-- Migration number: 0002 	 2026-01-17T06:06:00.000Z
CREATE TABLE IF NOT EXISTS ecosystems (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at DATETIME NOT NULL
);
