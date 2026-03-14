-- Privacy request tracking table
CREATE TABLE IF NOT EXISTS privacy_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL,
  details TEXT DEFAULT '',
  reference TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);
