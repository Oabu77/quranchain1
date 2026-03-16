-- Migration 0012: Analytics pageviews + Lead capture for blog monetization

CREATE TABLE IF NOT EXISTS analytics_pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,
  referrer TEXT DEFAULT '',
  ip_hash TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  country TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pageviews_page ON analytics_pageviews(page);
CREATE INDEX IF NOT EXISTS idx_pageviews_created ON analytics_pageviews(created_at);
CREATE INDEX IF NOT EXISTS idx_pageviews_country ON analytics_pageviews(country);

CREATE TABLE IF NOT EXISTS leads (
  lead_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'blog',
  page TEXT DEFAULT '/',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
