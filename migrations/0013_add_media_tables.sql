-- Migration 0013: DarMedia™ tables
-- Media content catalog, channels, podcasts, news, creator uploads

-- Broadcast & TV channels
CREATE TABLE IF NOT EXISTS media_channels (
  channel_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'tv',
  category TEXT NOT NULL DEFAULT 'general',
  language TEXT NOT NULL DEFAULT 'en',
  quality TEXT NOT NULL DEFAULT '1080p',
  is_live INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_channels_type ON media_channels(type);
CREATE INDEX IF NOT EXISTS idx_channels_status ON media_channels(status);

-- Streaming content library
CREATE TABLE IF NOT EXISTS media_content (
  content_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video',
  category TEXT NOT NULL DEFAULT 'documentaries',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  quality TEXT NOT NULL DEFAULT '1080p',
  language TEXT NOT NULL DEFAULT 'en',
  description TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  creator_id TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_content_type ON media_content(type);
CREATE INDEX IF NOT EXISTS idx_content_category ON media_content(category);
CREATE INDEX IF NOT EXISTS idx_content_status ON media_content(status);
CREATE INDEX IF NOT EXISTS idx_content_creator ON media_content(creator_id);

-- Podcasts
CREATE TABLE IF NOT EXISTS media_podcasts (
  podcast_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  host TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL DEFAULT 'education',
  episodes INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'en',
  description TEXT DEFAULT '',
  rss_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  subscribers INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  creator_id TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_podcasts_genre ON media_podcasts(genre);
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON media_podcasts(status);

-- News articles
CREATE TABLE IF NOT EXISTS media_news (
  article_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'world',
  author TEXT NOT NULL DEFAULT 'DarNews Staff',
  language TEXT NOT NULL DEFAULT 'en',
  source TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  views INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_news_category ON media_news(category);
CREATE INDEX IF NOT EXISTS idx_news_status ON media_news(status);
CREATE INDEX IF NOT EXISTS idx_news_published ON media_news(published_at);

-- Creator uploads (user-generated content)
CREATE TABLE IF NOT EXISTS media_uploads (
  upload_id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video',
  file_url TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  views INTEGER NOT NULL DEFAULT 0,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_uploads_creator ON media_uploads(creator_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON media_uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_type ON media_uploads(type);
