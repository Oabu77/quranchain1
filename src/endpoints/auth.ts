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
// JWT_SECRET MUST be set as a Cloudflare Worker secret: wrangler secret put JWT_SECRET

function getJwtSecret(env: { JWT_SECRET?: string }): string {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not configured");
  }
  return env.JWT_SECRET;
}

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

// ── SSO Cookie helpers — shared across all *.darcloud.host subdomains ──
const SSO_COOKIE_NAME = "darcloud_session";
const SSO_COOKIE_DOMAIN = ".darcloud.host";
const SSO_MAX_AGE = 86400; // 24 hours

function setSessionCookie(token: string): string {
  return `${SSO_COOKIE_NAME}=${token}; Domain=${SSO_COOKIE_DOMAIN}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SSO_MAX_AGE}`;
}

function clearSessionCookie(): string {
  return `${SSO_COOKIE_NAME}=; Domain=${SSO_COOKIE_DOMAIN}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function getCookieToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SSO_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

// Auth middleware for protected routes — reads Bearer token OR SSO cookie
async function requireAuth(c: { req: { header: (name: string) => string | undefined }; env: { JWT_SECRET?: string }; json: (data: unknown, status?: number) => Response; set: (key: string, value: unknown) => void }): Promise<Response | null> {
  const secret = getJwtSecret(c.env);
  let token: string | null = null;

  // 1. Try Authorization header
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // 2. Fall back to SSO cookie
  if (!token) {
    token = getCookieToken(c.req.header("Cookie"));
  }

  if (!token) {
    return c.json({ error: "Authorization required (Bearer token or session cookie)" }, 401);
  }

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

// Password hashing using Web Crypto PBKDF2 (100K iterations)
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const hashBuf = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const hashHex = [...new Uint8Array(hashBuf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  if (stored.startsWith("pbkdf2:")) {
    // New PBKDF2 format: pbkdf2:saltHex:hashHex
    const [, saltHex, hash] = stored.split(":");
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const hashBuf = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial, 256
    );
    const computedHex = [...new Uint8Array(hashBuf)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return computedHex === hash;
  }
  // Legacy SHA-256 format: saltHex:hashHex
  const [salt, hash] = stored.split(":");
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
    const secret = getJwtSecret(c.env);
    const token = await signJWT({ email: email.toLowerCase(), name, plan: validPlan, role: "user" }, secret);

    const response = c.json({
      success: true,
      message: "Account created successfully",
      user: { email: email.toLowerCase(), name, plan: validPlan },
      token,
      execution_ms: Date.now() - start,
    });
    // Set SSO cookie for cross-subdomain auth
    c.header("Set-Cookie", setSessionCookie(token));
    return response;
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
    const secret = getJwtSecret(c.env);
    const token = await signJWT(
      { email: user.email, name: user.name, plan: user.plan, role: "user", userId: user.id },
      secret
    );

    const response = c.json({
      success: true,
      message: "Login successful",
      user: { email: user.email, name: user.name, plan: user.plan },
      token,
      execution_ms: Date.now() - start,
    });
    // Set SSO cookie for cross-subdomain auth
    c.header("Set-Cookie", setSessionCookie(token));
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return c.json({ error: message, execution_ms: Date.now() - start }, 500);
  }
});

// POST /api/checkout/session — Create a real Stripe checkout session
auth.post("/checkout/session", async (c) => {
  const start = Date.now();
  try {
    const db = c.env.DB;
    await ensureTables(db);
    const body = await c.req.json<{
      email?: string;
      name?: string;
      plan?: string;
      discord_id?: string;
    }>();
    const { email, name, plan, discord_id } = body;

    if (!email || !plan) {
      return c.json({ error: "Email and plan are required" }, 400);
    }

    const plans: Record<string, { amount: number; label: string; price_id: string; mode: string }> = {
      pro: { amount: 4900, label: "DarCloud Professional", price_id: "price_1TAR0SAqs2ifkfkqOKa2Rzq3", mode: "subscription" },
      enterprise: { amount: 49900, label: "DarCloud Enterprise", price_id: "price_1TAR0TAqs2ifkfkqdtr8kWEf", mode: "subscription" },
      startup: { amount: 49900, label: "DarCloud Enterprise", price_id: "price_1TAR0TAqs2ifkfkqdtr8kWEf", mode: "subscription" },
      fungimesh: { amount: 1999, label: "FungiMesh Node", price_id: "price_1TAR0TAqs2ifkfkqqrjzoLdm", mode: "subscription" },
      hwc: { amount: 9900, label: "HWC Premium", price_id: "price_1TAR0TAqs2ifkfkqKFPTW7hM", mode: "subscription" },
    };

    const selected = plans[plan];
    if (!selected) {
      return c.json({
        message: `Plan "${plan}" registered. Our team will contact you for custom pricing.`,
        plan, email,
      }, 200);
    }

    // Record the checkout intent in D1
    await db.prepare(
      "UPDATE users SET plan = ?, updated_at = datetime('now') WHERE email = ?",
    ).bind(plan, email.toLowerCase()).run();

    // Create real Stripe Checkout Session
    const stripeKey = c.env.STRIPE_SECRET_KEY;
    if (stripeKey) {
      const params = new URLSearchParams();
      params.append("mode", selected.mode);
      params.append("line_items[0][price]", selected.price_id);
      params.append("line_items[0][quantity]", "1");
      params.append("customer_email", email);
      params.append("success_url", "https://darcloud.host/checkout/success?session_id={CHECKOUT_SESSION_ID}");
      params.append("cancel_url", "https://darcloud.host/checkout/cancel");
      params.append("metadata[product]", plan);
      if (discord_id) params.append("metadata[discord_id]", discord_id);

      const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      const session = await stripeRes.json() as any;
      if (!session.error && session.url) {
        return c.json({
          success: true,
          session_id: session.id,
          checkout_url: session.url,
          plan: selected.label,
          amount: selected.amount,
          currency: "usd",
          payment_processor: "DarPay™ × Stripe",
          execution_ms: Date.now() - start,
        });
      }
    }

    // Fallback if Stripe not configured
    return c.json({
      success: true,
      message: `${selected.label} subscription initiated via DarPay™.`,
      plan, amount: selected.amount, currency: "usd",
      payment_processor: "DarPay™",
      checkout_url: `https://darcloud.host/checkout/${plan}`,
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
  const secret = getJwtSecret(c.env);
  let token: string | null = null;
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }
  if (!token) {
    token = getCookieToken(c.req.header("Cookie"));
  }
  if (!token) return c.json({ error: "Authorization required" }, 401);
  const payload = await verifyJWT(token, secret);
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

// POST /api/auth/logout — Clear SSO cookie
auth.post("/auth/logout", (c) => {
  c.header("Set-Cookie", clearSessionCookie());
  return c.json({ success: true, message: "Logged out" });
});

// GET /api/auth/session — Check SSO session from cookie (no auth header needed)
auth.get("/auth/session", async (c) => {
  const secret = getJwtSecret(c.env);
  const token = getCookieToken(c.req.header("Cookie"));
  if (!token) {
    return c.json({ authenticated: false });
  }
  const payload = await verifyJWT(token, secret);
  if (!payload) {
    // Cookie exists but is invalid/expired — clear it
    c.header("Set-Cookie", clearSessionCookie());
    return c.json({ authenticated: false });
  }
  return c.json({
    authenticated: true,
    user: { name: payload.name, email: payload.email, plan: payload.plan },
  });
});

export { auth, requireAuth, verifyJWT, getJwtSecret };
