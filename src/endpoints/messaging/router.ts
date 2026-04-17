import { Hono } from "hono";
import { requireAuth } from "../auth";

const messagingRouter = new Hono<{ Bindings: Env }>();

// ── Auto-migrate messaging tables ──
async function ensureMessagingTables(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      type TEXT DEFAULT 'direct' CHECK(type IN ('direct','group','channel','support')),
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS conversation_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('owner','admin','member')),
      joined_at TEXT DEFAULT (datetime('now')),
      last_read_at TEXT,
      UNIQUE(conversation_id, user_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text' CHECK(type IN ('text','image','file','system')),
      reply_to INTEGER REFERENCES messages(id),
      edited_at TEXT,
      deleted_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
  ]);
}

// ── GET /messaging/conversations — list user's conversations ──
messagingRouter.get("/conversations", async (c) => {
  const authResp = await requireAuth(c as never);
  if (authResp) return authResp;
  const user = c.get("user") as { sub: number; email: string };
  const db = c.env.DB;
  await ensureMessagingTables(db);

  const convos = await db.prepare(`
    SELECT c.id, c.title, c.type, c.created_at, c.updated_at,
           cp.last_read_at,
           (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.deleted_at IS NULL) as message_count,
           (SELECT m.content FROM messages m WHERE m.conversation_id = c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) as last_message,
           (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) as last_message_at
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id
    WHERE cp.user_id = ?
    ORDER BY c.updated_at DESC
  `).bind(user.sub).all();

  return c.json({ success: true, conversations: convos.results || [] });
});

// ── POST /messaging/conversations — create a new conversation ──
messagingRouter.post("/conversations", async (c) => {
  const authResp = await requireAuth(c as never);
  if (authResp) return authResp;
  const user = c.get("user") as { sub: number };
  const db = c.env.DB;
  await ensureMessagingTables(db);

  const body = await c.req.json<{ title?: string; type?: string; participants: number[] }>();
  const type = body.type || "direct";
  const title = body.title || null;
  const participants = body.participants || [];

  if (type === "direct" && participants.length !== 1) {
    return c.json({ error: "Direct messages require exactly 1 participant" }, 400);
  }

  // For direct messages, check if conversation already exists
  if (type === "direct") {
    const existing = await db.prepare(`
      SELECT c.id FROM conversations c
      JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = ?
      JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = ?
      WHERE c.type = 'direct'
    `).bind(user.sub, participants[0]).first();

    if (existing) {
      return c.json({ success: true, conversation_id: existing.id, existing: true });
    }
  }

  const result = await db.prepare(
    `INSERT INTO conversations (title, type, created_by) VALUES (?, ?, ?)`
  ).bind(title, type, user.sub).run();

  const convoId = result.meta.last_row_id;

  // Add creator + participants
  const allParticipants = [user.sub, ...participants.filter(p => p !== user.sub)];
  for (const pid of allParticipants) {
    await db.prepare(
      `INSERT OR IGNORE INTO conversation_participants (conversation_id, user_id, role) VALUES (?, ?, ?)`
    ).bind(convoId, pid, pid === user.sub ? "owner" : "member").run();
  }

  // System message
  await db.prepare(
    `INSERT INTO messages (conversation_id, sender_id, content, type) VALUES (?, ?, ?, 'system')`
  ).bind(convoId, user.sub, "Conversation created. بِسْمِ ٱللَّٰهِ").run();

  return c.json({ success: true, conversation_id: convoId }, 201);
});

// ── GET /messaging/conversations/:id/messages — get messages in a conversation ──
messagingRouter.get("/conversations/:id/messages", async (c) => {
  const authResp = await requireAuth(c as never);
  if (authResp) return authResp;
  const user = c.get("user") as { sub: number };
  const db = c.env.DB;
  await ensureMessagingTables(db);

  const convoId = parseInt(c.req.param("id"));
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
  const before = c.req.query("before"); // cursor-based pagination

  // Verify user is a participant
  const participant = await db.prepare(
    `SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`
  ).bind(convoId, user.sub).first();

  if (!participant) {
    return c.json({ error: "Not a participant in this conversation" }, 403);
  }

  let query = `
    SELECT m.id, m.sender_id, m.content, m.type, m.reply_to, m.edited_at, m.created_at,
           u.name as sender_name, u.email as sender_email
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ? AND m.deleted_at IS NULL
  `;
  const bindings: (string | number)[] = [convoId];

  if (before) {
    query += ` AND m.id < ?`;
    bindings.push(parseInt(before));
  }

  query += ` ORDER BY m.created_at DESC LIMIT ?`;
  bindings.push(limit);

  const messages = await db.prepare(query).bind(...bindings).all();

  // Update last_read_at
  await db.prepare(
    `UPDATE conversation_participants SET last_read_at = datetime('now') WHERE conversation_id = ? AND user_id = ?`
  ).bind(convoId, user.sub).run();

  return c.json({
    success: true,
    conversation_id: convoId,
    messages: (messages.results || []).reverse(),
    has_more: (messages.results || []).length === limit,
  });
});

// ── POST /messaging/conversations/:id/messages — send a message ──
messagingRouter.post("/conversations/:id/messages", async (c) => {
  const authResp = await requireAuth(c as never);
  if (authResp) return authResp;
  const user = c.get("user") as { sub: number };
  const db = c.env.DB;
  await ensureMessagingTables(db);

  const convoId = parseInt(c.req.param("id"));

  // Verify participation
  const participant = await db.prepare(
    `SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`
  ).bind(convoId, user.sub).first();

  if (!participant) {
    return c.json({ error: "Not a participant in this conversation" }, 403);
  }

  const body = await c.req.json<{ content: string; type?: string; reply_to?: number }>();
  if (!body.content?.trim()) {
    return c.json({ error: "Message content is required" }, 400);
  }

  // Sanitize content (prevent XSS)
  const content = body.content.trim().slice(0, 4000);
  const type = body.type === "image" || body.type === "file" ? body.type : "text";

  const result = await db.prepare(
    `INSERT INTO messages (conversation_id, sender_id, content, type, reply_to) VALUES (?, ?, ?, ?, ?)`
  ).bind(convoId, user.sub, content, type, body.reply_to || null).run();

  // Update conversation timestamp
  await db.prepare(
    `UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`
  ).bind(convoId).run();

  return c.json({
    success: true,
    message: {
      id: result.meta.last_row_id,
      conversation_id: convoId,
      sender_id: user.sub,
      content,
      type,
      reply_to: body.reply_to || null,
      created_at: new Date().toISOString(),
    },
  }, 201);
});

// ── PUT /messaging/messages/:id — edit a message ──
messagingRouter.put("/messages/:id", async (c) => {
  const authResp = await requireAuth(c as never);
  if (authResp) return authResp;
  const user = c.get("user") as { sub: number };
  const db = c.env.DB;

  const msgId = parseInt(c.req.param("id"));
  const msg = await db.prepare(
    `SELECT id, sender_id FROM messages WHERE id = ? AND deleted_at IS NULL`
  ).bind(msgId).first();

  if (!msg) return c.json({ error: "Message not found" }, 404);
  if (msg.sender_id !== user.sub) return c.json({ error: "Can only edit your own messages" }, 403);

  const body = await c.req.json<{ content: string }>();
  if (!body.content?.trim()) return c.json({ error: "Content required" }, 400);

  const content = body.content.trim().slice(0, 4000);
  await db.prepare(
    `UPDATE messages SET content = ?, edited_at = datetime('now') WHERE id = ?`
  ).bind(content, msgId).run();

  return c.json({ success: true, message_id: msgId, edited: true });
});

// ── DELETE /messaging/messages/:id — soft-delete a message ──
messagingRouter.delete("/messages/:id", async (c) => {
  const authResp = await requireAuth(c as never);
  if (authResp) return authResp;
  const user = c.get("user") as { sub: number };
  const db = c.env.DB;

  const msgId = parseInt(c.req.param("id"));
  const msg = await db.prepare(
    `SELECT id, sender_id FROM messages WHERE id = ? AND deleted_at IS NULL`
  ).bind(msgId).first();

  if (!msg) return c.json({ error: "Message not found" }, 404);
  if (msg.sender_id !== user.sub) return c.json({ error: "Can only delete your own messages" }, 403);

  await db.prepare(
    `UPDATE messages SET deleted_at = datetime('now'), content = '[deleted]' WHERE id = ?`
  ).bind(msgId).run();

  return c.json({ success: true, message_id: msgId, deleted: true });
});

// ── GET /messaging/search — search messages across conversations ──
messagingRouter.get("/search", async (c) => {
  const authResp = await requireAuth(c as never);
  if (authResp) return authResp;
  const user = c.get("user") as { sub: number };
  const db = c.env.DB;
  await ensureMessagingTables(db);

  const q = c.req.query("q");
  if (!q || q.length < 2) return c.json({ error: "Search query must be at least 2 characters" }, 400);

  const results = await db.prepare(`
    SELECT m.id, m.content, m.created_at, m.conversation_id, u.name as sender_name
    FROM messages m
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = ?
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE m.content LIKE ? AND m.deleted_at IS NULL
    ORDER BY m.created_at DESC
    LIMIT 25
  `).bind(user.sub, `%${q}%`).all();

  return c.json({ success: true, query: q, results: results.results || [] });
});

// ── GET /messaging/unread — unread count per conversation ──
messagingRouter.get("/unread", async (c) => {
  const authResp = await requireAuth(c as never);
  if (authResp) return authResp;
  const user = c.get("user") as { sub: number };
  const db = c.env.DB;
  await ensureMessagingTables(db);

  const unread = await db.prepare(`
    SELECT cp.conversation_id,
           COUNT(m.id) as unread_count
    FROM conversation_participants cp
    JOIN messages m ON m.conversation_id = cp.conversation_id
      AND m.deleted_at IS NULL
      AND m.sender_id != ?
      AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
    WHERE cp.user_id = ?
    GROUP BY cp.conversation_id
  `).bind(user.sub, user.sub).all();

  const total = (unread.results || []).reduce((sum: number, r: any) => sum + (r.unread_count as number), 0);

  return c.json({ success: true, total_unread: total, conversations: unread.results || [] });
});

export { messagingRouter };
