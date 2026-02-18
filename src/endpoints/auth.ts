import { Hono } from "hono";

const auth = new Hono<{ Bindings: Env }>();

// ── Rate limiter — IP-based in-memory throttle ──
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 attempts per window

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

// ── JWT helpers using Web Crypto HMAC-SHA256 ──
const JWT_SECRET_FALLBACK = "darcloud-jwt-secret-2026-quranchain";

function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlEncode(str: string): string {
  return base64url(new TextEncoder().encode(str));
}

async function signJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + 86400 }; // 24h expiry
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${base64url(new Uint8Array(sig))}`;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const signingInput = `${header}.${payload}`;

    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );

    // Decode base64url signature
    const sigStr = signature.replace(/-/g, "+").replace(/_/g, "/");
    const padded = sigStr + "=".repeat((4 - sigStr.length % 4) % 4);
    const sigBytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(signingInput));
    if (!valid) return null;

    const payloadStr = payload.replace(/-/g, "+").replace(/_/g, "/");
    const payloadPad = payloadStr + "=".repeat((4 - payloadStr.length % 4) % 4);
    const decoded = JSON.parse(atob(payloadPad));

    // Check expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

// Auth middleware for protected routes
async function requireAuth(c: { req: { header: (name: string) => string | undefined }; env: { JWT_SECRET?: string }; json: (data: unknown, status?: number) => Response; set: (key: string, value: unknown) => void }): Promise<Response | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Authorization header required (Bearer <token>)" }, 401);
  }
  const token = authHeader.substring(7);
  const secret = c.env.JWT_SECRET || JWT_SECRET_FALLBACK;
  const payload = await verifyJWT(token, secret);
  if (!payload) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
  c.set("user", payload);
  return null; // Continue
}

// Auto-migrate: ensure tables exist on first request
async function ensureTables(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      plan TEXT DEFAULT 'starter',
      darpay_customer_id TEXT,
      onboarded_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      message TEXT NOT NULL,
      source TEXT DEFAULT 'enterprise',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS hwc_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      city TEXT,
      interest TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
  ]);
}

// Simple password hashing using Web Crypto (SHA-256 + salt)
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashHex = [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const computed = await crypto.subtle.digest("SHA-256", data);
  const computedHex = [...new Uint8Array(computed)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computedHex === hash;
}

// POST /api/auth/signup
auth.post("/auth/signup", async (c) => {
  const start = Date.now();
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  const rl = checkRateLimit(`signup:${ip}`);
  if (!rl.allowed) {
    return c.json({ error: `Too many attempts. Retry after ${rl.retryAfter}s` }, 429);
  }
  try {
    const db = c.env.DB;
    await ensureTables(db);
    const body = await c.req.json<{
      name?: string;
      email?: string;
      password?: string;
      plan?: string;
    }>();
    const { name, email, password, plan } = body;

    if (!name || !email || !password) {
      return c.json(
        { error: "Name, email, and password are required" },
        400,
      );
    }
    if (password.length < 8) {
      return c.json(
        { error: "Password must be at least 8 characters" },
        400,
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: "Invalid email address" }, 400);
    }

    // Check if user exists
    const existing = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email.toLowerCase())
      .first();
    if (existing) {
      return c.json(
        { error: "An account with this email already exists" },
        409,
      );
    }

    const passwordHash = await hashPassword(password);
    const validPlan = ["starter", "pro", "enterprise"].includes(plan || "")
      ? plan
      : "starter";

    await db
      .prepare(
        "INSERT INTO users (email, name, password_hash, plan) VALUES (?, ?, ?, ?)",
      )
      .bind(email.toLowerCase(), name, passwordHash, validPlan)
      .run();

    // Generate JWT token
    const secret = c.env.JWT_SECRET || JWT_SECRET_FALLBACK;
    const token = await signJWT({ email: email.toLowerCase(), name, plan: validPlan, role: "user" }, secret);

    return c.json({
      success: true,
      message: "Account created successfully",
      user: { email: email.toLowerCase(), name, plan: validPlan },
      token,
      execution_ms: Date.now() - start,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return c.json({ error: message, execution_ms: Date.now() - start }, 500);
  }
});

// POST /api/auth/login
auth.post("/auth/login", async (c) => {
  const start = Date.now();
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  const rl = checkRateLimit(`login:${ip}`);
  if (!rl.allowed) {
    return c.json({ error: `Too many login attempts. Retry after ${rl.retryAfter}s` }, 429);
  }
  try {
    const db = c.env.DB;
    await ensureTables(db);
    const body = await c.req.json<{ email?: string; password?: string }>();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }
    const user = await db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(email.toLowerCase())
      .first<{
        id: number;
        email: string;
        name: string;
        password_hash: string;
        plan: string;
      }>();

    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Generate JWT token
    const secret = c.env.JWT_SECRET || JWT_SECRET_FALLBACK;
    const token = await signJWT(
      { email: user.email, name: user.name, plan: user.plan, role: "user", userId: user.id },
      secret
    );

    return c.json({
      success: true,
      message: "Login successful",
      user: { email: user.email, name: user.name, plan: user.plan },
      token,
      execution_ms: Date.now() - start,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return c.json({ error: message, execution_ms: Date.now() - start }, 500);
  }
});

// POST /api/checkout/session — Create a checkout session
auth.post("/checkout/session", async (c) => {
  const start = Date.now();
  try {
    const db = c.env.DB;
    await ensureTables(db);
    const body = await c.req.json<{
      email?: string;
      name?: string;
      plan?: string;
    }>();
    const { email, name, plan } = body;

    if (!email || !plan) {
      return c.json({ error: "Email and plan are required" }, 400);
    }

    const prices: Record<string, { amount: number; label: string }> = {
      pro: { amount: 4900, label: "DarCloud Professional" },
      startup: { amount: 49900, label: "DarCloud Enterprise Startup" },
      business: { amount: 199900, label: "DarCloud Enterprise Business" },
    };

    const selected = prices[plan];
    if (!selected) {
      return c.json(
        {
          message: `Plan "${plan}" registered. Our team will contact you for custom pricing.`,
          plan,
          email,
        },
        200,
      );
    }

    // Record the checkout intent in D1
    await db
      .prepare(
        "UPDATE users SET plan = ?, updated_at = datetime('now') WHERE email = ?",
      )
      .bind(plan, email.toLowerCase())
      .run();

    // DarPay™ white-label checkout — Stripe processes on backend, DarPay branding on frontend
    return c.json({
      success: true,
      message: `${selected.label} subscription initiated via DarPay™.`,
      plan,
      amount: selected.amount,
      currency: "usd",
      payment_processor: "DarPay™",
      checkout_url: `https://pay.darcloud.host/checkout/${plan}`,
      note: "DarPay™ — Halal payments powered by DarCloud. Plan recorded in database.",
      execution_ms: Date.now() - start,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return c.json({ error: message, execution_ms: Date.now() - start }, 500);
  }
});

// POST /api/contact — Contact form submission
auth.post("/contact", async (c) => {
  const start = Date.now();
  try {
    const db = c.env.DB;
    await ensureTables(db);
    const body = await c.req.json<{
      name?: string;
      email?: string;
      company?: string;
      message?: string;
      source?: string;
    }>();

    if (!body.name || !body.email || !body.message) {
      return c.json(
        { error: "Name, email, and message are required" },
        400,
      );
    }

    await db
      .prepare(
        "INSERT INTO contact_submissions (name, email, company, message, source) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(
        body.name,
        body.email.toLowerCase(),
        body.company || "",
        body.message,
        body.source || "enterprise",
      )
      .run();

    return c.json({
      success: true,
      message:
        "Thank you! Our team will review your inquiry and respond within 24 hours.",
      execution_ms: Date.now() - start,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Submission failed";
    return c.json({ error: message, execution_ms: Date.now() - start }, 500);
  }
});

// POST /api/hwc/apply — HWC membership application
auth.post("/hwc/apply", async (c) => {
  const start = Date.now();
  try {
    const db = c.env.DB;
    await ensureTables(db);
    const body = await c.req.json<{
      name?: string;
      email?: string;
      phone?: string;
      city?: string;
      interest?: string;
    }>();

    if (!body.name || !body.email) {
      return c.json({ error: "Name and email are required" }, 400);
    }

    await db
      .prepare(
        "INSERT INTO hwc_applications (name, email, phone, city, interest) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(
        body.name,
        body.email.toLowerCase(),
        body.phone || "",
        body.city || "",
        body.interest || "general",
      )
      .run();

    return c.json({
      success: true,
      message:
        "Application received! Welcome to the Halal Wealth Club. We'll send your membership details to your email within 24 hours.",
      execution_ms: Date.now() - start,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Application failed";
    return c.json({ error: message, execution_ms: Date.now() - start }, 500);
  }
});

// GET /api/auth/me — Get current user from JWT (protected)
auth.get("/auth/me", async (c) => {
  const start = Date.now();
  const authResponse = await requireAuth(c as never);
  if (authResponse) return authResponse;

  const user = (c as unknown as { var: { user: Record<string, unknown> } }).var;
  return c.json({
    success: true,
    user: (c as unknown as { get: (k: string) => Record<string, unknown> }).get("user"),
    execution_ms: Date.now() - start,
  });
});

// GET /api/admin/stats — Admin dashboard stats (protected)
auth.get("/admin/stats", async (c) => {
  const start = Date.now();
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Authorization required" }, 401);
  }
  const secret = c.env.JWT_SECRET || JWT_SECRET_FALLBACK;
  const payload = await verifyJWT(authHeader.substring(7), secret);
  if (!payload) return c.json({ error: "Invalid or expired token" }, 401);

  const db = c.env.DB;
  await ensureTables(db);

  // Core auth tables (always exist)
  const [users, contacts, hwcApps] = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM contact_submissions").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM hwc_applications").first<{ count: number }>(),
  ]);

  // Contracts tables (may not exist if contracts module hasn't been hit yet)
  let companies = { count: 0 }, contractsList = { count: 0 }, filings = { count: 0 }, ipList = { count: 0 };
  try {
    const [co, ct, fi, ip] = await Promise.all([
      db.prepare("SELECT COUNT(*) as count FROM companies").first<{ count: number }>(),
      db.prepare("SELECT COUNT(*) as count FROM contracts").first<{ count: number }>(),
      db.prepare("SELECT COUNT(*) as count FROM legal_filings").first<{ count: number }>(),
      db.prepare("SELECT COUNT(*) as count FROM ip_protections").first<{ count: number }>(),
    ]);
    companies = co || { count: 0 };
    contractsList = ct || { count: 0 };
    filings = fi || { count: 0 };
    ipList = ip || { count: 0 };
  } catch { /* contracts tables not yet initialized */ }

  const recentUsers = await db
    .prepare("SELECT email, name, plan, created_at FROM users ORDER BY created_at DESC LIMIT 10")
    .all();

  const planBreakdown = await db
    .prepare("SELECT plan, COUNT(*) as count FROM users GROUP BY plan")
    .all();

  return c.json({
    success: true,
    stats: {
      users: users?.count || 0,
      contact_submissions: contacts?.count || 0,
      hwc_applications: hwcApps?.count || 0,
      companies: companies?.count || 0,
      contracts: contractsList?.count || 0,
      legal_filings: filings?.count || 0,
      ip_protections: ipList?.count || 0,
    },
    recent_users: recentUsers.results,
    plan_breakdown: planBreakdown.results,
    execution_ms: Date.now() - start,
  });
});

export { auth, requireAuth, verifyJWT, JWT_SECRET_FALLBACK };
