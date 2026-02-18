import { Hono } from "hono";

const auth = new Hono<{ Bindings: Env }>();

// Auto-migrate: ensure tables exist on first request
let migrated = false;
async function ensureTables(db: D1Database) {
  if (migrated) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      plan TEXT DEFAULT 'starter',
      stripe_customer_id TEXT,
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
  migrated = true;
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

    return c.json({
      success: true,
      message: "Account created successfully",
      user: { email: email.toLowerCase(), name, plan: validPlan },
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

    return c.json({
      success: true,
      message: "Login successful",
      user: { email: user.email, name: user.name, plan: user.plan },
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

    // Return checkout URL — Stripe Checkout can be configured with actual keys
    // For now, return the plan confirmation and a placeholder Stripe URL
    return c.json({
      success: true,
      message: `${selected.label} subscription initiated. Complete payment via Stripe.`,
      plan,
      amount: selected.amount,
      currency: "usd",
      checkout_url: `https://checkout.stripe.com/c/pay/darcloud_${plan}`,
      note: "Stripe live keys will be configured in production. Plan recorded in database.",
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

export { auth };
