import { Hono } from "hono";

const mediaRouter = new Hono<{ Bindings: Env }>();

// ── DarMedia™ Network Data ──
const MEDIA_NETWORK = {
  broadcast: {
    channels: 7,
    quranReciters: 120,
    languages: 15,
    live: true,
    quality: "4K HDR",
    storage: "QuranChain immutable",
  },
  radio: {
    stations: 24,
    genres: [
      "Quran Recitation",
      "Islamic Nasheeds",
      "News & Talk",
      "Education",
      "Youth",
      "Arabic Pop (Halal)",
    ],
    podcasts: 180,
    listeners: "2.4M monthly",
  },
  streaming: {
    library: 15000,
    categories: [
      "Documentaries",
      "Nasheeds",
      "Islamic History",
      "Quran Learning",
      "Kids",
      "Family Films",
    ],
    quality: "4K UHD",
    offline: true,
  },
  tv: {
    channels: 12,
    live: true,
    coverage: "Global",
    satellites: ["Arabsat", "Nilesat", "Turksat", "Astra"],
    iptv: true,
  },
  news: {
    bureaus: 22,
    reporters: 180,
    languages: 8,
    updates: "24/7",
    focus: "Islamic world affairs, halal economy, tech",
  },
  studios: {
    locations: 5,
    capacity: [
      "Film Studio",
      "Sound Stage",
      "Recording Studio",
      "Post-Production",
      "VFX Lab",
      "Motion Capture",
    ],
    staff: 340,
  },
};

const MEDIA_PLANS: Record<string, { name: string; price: number; features: string[] }> = {
  viewer: {
    name: "DarMedia Viewer",
    price: 0,
    features: ["Basic streaming", "News feed", "Community content"],
  },
  creator: {
    name: "DarMedia Creator",
    price: 14.99,
    features: [
      "Unlimited streaming",
      "Podcast hosting",
      "Content tools",
      "Monetization",
    ],
  },
  studio: {
    name: "DarMedia Studio",
    price: 199,
    features: [
      "Multi-channel",
      "AI production",
      "Analytics",
      "White-label",
    ],
  },
};

// ── GET /media/dashboard — Full network overview ──
mediaRouter.get("/dashboard", async (c) => {
  const db = c.env.DB;

  const [channels, content, podcasts, news, uploads] = await Promise.all([
    db.prepare("SELECT type, COUNT(*) as count FROM media_channels WHERE status = 'active' GROUP BY type").all(),
    db.prepare("SELECT category, COUNT(*) as count FROM media_content WHERE status = 'published' GROUP BY category").all(),
    db.prepare("SELECT COUNT(*) as count FROM media_podcasts WHERE status = 'active'").first(),
    db.prepare("SELECT COUNT(*) as count FROM media_news WHERE status = 'published'").first(),
    db.prepare("SELECT COUNT(*) as count FROM media_uploads").first(),
  ]);

  const channelCounts: Record<string, number> = {};
  for (const row of channels.results || []) {
    channelCounts[row.type as string] = row.count as number;
  }

  const contentCounts: Record<string, number> = {};
  for (const row of content.results || []) {
    contentCounts[row.category as string] = row.count as number;
  }

  return c.json({
    success: true,
    network: MEDIA_NETWORK,
    db_stats: {
      channels: channelCounts,
      content_by_category: contentCounts,
      podcasts_active: (podcasts as any)?.count || 0,
      news_published: (news as any)?.count || 0,
      creator_uploads: (uploads as any)?.count || 0,
    },
  });
});

// ── GET /media/plans — Pricing tiers ──
mediaRouter.get("/plans", (c) => {
  return c.json({ success: true, plans: MEDIA_PLANS });
});

// ── GET /media/channels — List all channels ──
mediaRouter.get("/channels", async (c) => {
  const db = c.env.DB;
  const type = c.req.query("type");
  const status = c.req.query("status") || "active";

  let sql = "SELECT * FROM media_channels WHERE status = ?";
  const params: string[] = [status];

  if (type) {
    sql += " AND type = ?";
    params.push(type);
  }

  sql += " ORDER BY created_at DESC";
  const result = await db.prepare(sql).bind(...params).all();

  return c.json({ success: true, channels: result.results || [] });
});

// ── POST /media/channels — Add a channel ──
mediaRouter.post("/channels", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { name, type, category, language, quality, description } = body;

  if (!name || !type) {
    return c.json({ success: false, error: "name and type required" }, 400);
  }

  const channelId = `ch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db
    .prepare(
      "INSERT INTO media_channels (channel_id, name, type, category, language, quality, description) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      channelId,
      name,
      type,
      category || "general",
      language || "en",
      quality || "1080p",
      description || ""
    )
    .run();

  return c.json({ success: true, channel_id: channelId }, 201);
});

// ── GET /media/content — Streaming library ──
mediaRouter.get("/content", async (c) => {
  const db = c.env.DB;
  const category = c.req.query("category");
  const type = c.req.query("type");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
  const offset = parseInt(c.req.query("offset") || "0");

  let sql = "SELECT * FROM media_content WHERE status = 'published'";
  const params: (string | number)[] = [];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (type) {
    sql += " AND type = ?";
    params.push(type);
  }

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await db.prepare(sql).bind(...params).all();

  return c.json({
    success: true,
    content: result.results || [],
    pagination: { limit, offset },
  });
});

// ── POST /media/content — Publish content ──
mediaRouter.post("/content", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { title, type, category, duration_seconds, quality, language, description, tags, creator_id } = body;

  if (!title) {
    return c.json({ success: false, error: "title required" }, 400);
  }

  const contentId = `mc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db
    .prepare(
      "INSERT INTO media_content (content_id, title, type, category, duration_seconds, quality, language, description, tags, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      contentId,
      title,
      type || "video",
      category || "documentaries",
      duration_seconds || 0,
      quality || "1080p",
      language || "en",
      description || "",
      tags || "",
      creator_id || ""
    )
    .run();

  return c.json({ success: true, content_id: contentId }, 201);
});

// ── GET /media/podcasts — Podcast directory ──
mediaRouter.get("/podcasts", async (c) => {
  const db = c.env.DB;
  const genre = c.req.query("genre");

  let sql = "SELECT * FROM media_podcasts WHERE status = 'active'";
  const params: string[] = [];

  if (genre) {
    sql += " AND genre = ?";
    params.push(genre);
  }

  sql += " ORDER BY subscribers DESC";
  const result = await db.prepare(sql).bind(...params).all();

  return c.json({ success: true, podcasts: result.results || [] });
});

// ── POST /media/podcasts — Register a podcast ──
mediaRouter.post("/podcasts", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { title, host, genre, description, rss_url, creator_id } = body;

  if (!title) {
    return c.json({ success: false, error: "title required" }, 400);
  }

  const podcastId = `pod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db
    .prepare(
      "INSERT INTO media_podcasts (podcast_id, title, host, genre, description, rss_url, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      podcastId,
      title,
      host || "",
      genre || "education",
      description || "",
      rss_url || "",
      creator_id || ""
    )
    .run();

  return c.json({ success: true, podcast_id: podcastId }, 201);
});

// ── GET /media/news — News feed ──
mediaRouter.get("/news", async (c) => {
  const db = c.env.DB;
  const category = c.req.query("category");
  const limit = Math.min(parseInt(c.req.query("limit") || "25"), 100);
  const offset = parseInt(c.req.query("offset") || "0");

  let sql = "SELECT * FROM media_news WHERE status = 'published'";
  const params: (string | number)[] = [];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }

  sql += " ORDER BY published_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await db.prepare(sql).bind(...params).all();

  return c.json({
    success: true,
    articles: result.results || [],
    pagination: { limit, offset },
  });
});

// ── POST /media/news — Publish a news article ──
mediaRouter.post("/news", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { title, body: articleBody, category, author, language, source, tags } = body;

  if (!title || !articleBody) {
    return c.json({ success: false, error: "title and body required" }, 400);
  }

  const articleId = `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db
    .prepare(
      "INSERT INTO media_news (article_id, title, body, category, author, language, source, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      articleId,
      title,
      articleBody,
      category || "world",
      author || "DarNews Staff",
      language || "en",
      source || "",
      tags || ""
    )
    .run();

  return c.json({ success: true, article_id: articleId }, 201);
});

// ── GET /media/uploads — Creator uploads ──
mediaRouter.get("/uploads", async (c) => {
  const db = c.env.DB;
  const creatorId = c.req.query("creator_id");
  const status = c.req.query("status");

  let sql = "SELECT * FROM media_uploads WHERE 1=1";
  const params: string[] = [];

  if (creatorId) {
    sql += " AND creator_id = ?";
    params.push(creatorId);
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }

  sql += " ORDER BY created_at DESC";
  const result = await db.prepare(sql).bind(...params).all();

  return c.json({ success: true, uploads: result.results || [] });
});

// ── POST /media/uploads — Submit content for review ──
mediaRouter.post("/uploads", async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  const { creator_id, title, type, file_url, thumbnail_url, duration_seconds, file_size_bytes } = body;

  if (!creator_id || !title) {
    return c.json({ success: false, error: "creator_id and title required" }, 400);
  }

  const uploadId = `upl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db
    .prepare(
      "INSERT INTO media_uploads (upload_id, creator_id, title, type, file_url, thumbnail_url, duration_seconds, file_size_bytes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      uploadId,
      creator_id,
      title,
      type || "video",
      file_url || "",
      thumbnail_url || "",
      duration_seconds || 0,
      file_size_bytes || 0
    )
    .run();

  return c.json({ success: true, upload_id: uploadId }, 201);
});

// ── GET /media/studios — Studio locations ──
mediaRouter.get("/studios", (c) => {
  return c.json({ success: true, studios: MEDIA_NETWORK.studios });
});

// ── GET /media/broadcast — Broadcast network info ──
mediaRouter.get("/broadcast", (c) => {
  return c.json({ success: true, broadcast: MEDIA_NETWORK.broadcast });
});

// ── GET /media/radio — Radio network info ──
mediaRouter.get("/radio", (c) => {
  return c.json({ success: true, radio: MEDIA_NETWORK.radio });
});

export { mediaRouter };
