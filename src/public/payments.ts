import type { Context } from "hono";
import { requireAuth } from "../endpoints/auth";
import type { PublicAppEnv } from "./types";

const STRIPE_API = "https://api.stripe.com/v1";
const MAX_JSON_BYTES = 64 * 1024;
const MAX_WEBHOOK_BYTES = 1024 * 1024;
const WEBHOOK_TOLERANCE_SECONDS = 300;

const PLANS = {
  pro: {
    label: "DarCloud Professional",
    priceId: "price_1TAR0SAqs2ifkfkqOKa2Rzq3",
    amount: 4900,
  },
  enterprise: {
    label: "DarCloud Enterprise",
    priceId: "price_1TAR0TAqs2ifkfkqdtr8kWEf",
    amount: 49900,
  },
  startup: {
    label: "DarCloud Enterprise",
    priceId: "price_1TAR0TAqs2ifkfkqdtr8kWEf",
    amount: 49900,
  },
  fungimesh: {
    label: "FungiMesh Node",
    priceId: "price_1TAR0TAqs2ifkfkqqrjzoLdm",
    amount: 1999,
  },
  hwc: {
    label: "HWC Premium",
    priceId: "price_1TAR0TAqs2ifkfkqKFPTW7hM",
    amount: 9900,
  },
} as const;

type PlanKey = keyof typeof PLANS;

type StripeCheckoutSession = {
  id?: string;
  url?: string;
  customer?: string;
  customer_details?: { email?: string };
  payment_status?: string;
  amount_total?: number;
  subscription?: string;
  payment_intent?: string;
  metadata?: Record<string, string | undefined>;
};

type StripeSubscription = {
  id?: string;
  status?: string;
  metadata?: Record<string, string | undefined>;
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: StripeCheckoutSession & StripeSubscription };
};

function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function readJsonBody(c: Context<PublicAppEnv>): Promise<Record<string, unknown> | null> {
  const declaredLength = Number(c.req.header("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BYTES) return null;

  try {
    const text = await c.req.text();
    if (new TextEncoder().encode(text).byteLength > MAX_JSON_BYTES) return null;
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function stripeAuthorization(secret: string): HeadersInit {
  return {
    authorization: `Bearer ${secret}`,
    "content-type": "application/x-www-form-urlencoded",
  };
}

export async function createCheckoutSession(c: Context<PublicAppEnv>): Promise<Response> {
  const body = await readJsonBody(c);
  if (!body) return c.json({ error: "Invalid or oversized request" }, 400);

  const plan = cleanText(body.plan, 32) as PlanKey;
  const email = cleanText(body.email, 254).toLowerCase();
  const name = cleanText(body.name, 120);
  const discordId = cleanText(body.discord_id, 80);
  const selected = PLANS[plan];

  if (!selected || !isEmail(email)) {
    return c.json({ error: "A valid email and supported plan are required" }, 400);
  }

  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json({ error: "Secure checkout is temporarily unavailable" }, 503);
  }

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("line_items[0][price]", selected.priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("customer_email", email);
  params.set("success_url", "https://darcloud.host/checkout/success?session_id={CHECKOUT_SESSION_ID}");
  params.set("cancel_url", "https://darcloud.host/checkout/cancel");
  params.set("metadata[product]", plan);
  params.set("metadata[account_email]", email);
  params.set("subscription_data[metadata][product]", plan);
  params.set("subscription_data[metadata][account_email]", email);
  if (name) params.set("metadata[account_name]", name);
  if (discordId) {
    params.set("metadata[discord_id]", discordId);
    params.set("subscription_data[metadata][discord_id]", discordId);
  }

  try {
    const stripeResponse = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: stripeAuthorization(stripeKey),
      body: params.toString(),
    });
    const session = (await stripeResponse.json()) as StripeCheckoutSession & {
      error?: { message?: string };
    };

    if (!stripeResponse.ok || !session.id || !session.url) {
      return c.json({ error: "Secure checkout could not be created" }, 502);
    }

    return c.json({
      success: true,
      session_id: session.id,
      checkout_url: session.url,
      plan: selected.label,
      amount: selected.amount,
      currency: "usd",
      payment_processor: "Stripe",
    });
  } catch {
    return c.json({ error: "Secure checkout could not be created" }, 502);
  }
}

export async function createCustomerPortal(c: Context<PublicAppEnv>): Promise<Response> {
  const authResponse = await requireAuth(c as never);
  if (authResponse) return authResponse;

  const user = c.get("user");
  const email = cleanText(user?.email, 254).toLowerCase();
  if (!isEmail(email)) return c.json({ error: "Authenticated account is invalid" }, 401);

  const customer = await c.env.DB.prepare(
    "SELECT darpay_customer_id FROM users WHERE email = ?",
  )
    .bind(email)
    .first<{ darpay_customer_id?: string | null }>();

  if (!customer?.darpay_customer_id) {
    return c.json({ error: "Billing profile not found" }, 404);
  }

  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return c.json({ error: "Billing portal is temporarily unavailable" }, 503);

  const params = new URLSearchParams();
  params.set("customer", customer.darpay_customer_id);
  params.set("return_url", "https://darcloud.host/dashboard");

  try {
    const response = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
      method: "POST",
      headers: stripeAuthorization(stripeKey),
      body: params.toString(),
    });
    const data = (await response.json()) as { url?: string };
    if (!response.ok || !data.url) {
      return c.json({ error: "Billing portal could not be created" }, 502);
    }
    return c.json({ success: true, url: data.url });
  } catch {
    return c.json({ error: "Billing portal could not be created" }, 502);
  }
}

function hexToBytes(value: string): Uint8Array | null {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < value.length; i += 2) {
    bytes[i / 2] = Number.parseInt(value.slice(i, i + 2), 16);
  }
  return bytes;
}

async function verifyStripeSignature(
  body: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const values = signatureHeader.split(",").map((part) => part.trim());
  const timestampValue = values.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = values
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  const timestamp = Number(timestampValue);
  if (!Number.isInteger(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > WEBHOOK_TOLERANCE_SECONDS) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const payload = encoder.encode(`${timestamp}.${body}`);

  for (const signature of signatures) {
    const bytes = hexToBytes(signature);
    if (bytes && (await crypto.subtle.verify("HMAC", key, bytes, payload))) return true;
  }
  return false;
}

async function ensureWebhookEventTable(db: D1Database): Promise<void> {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS stripe_webhook_events (
      event_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'processing',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      processed_at TEXT
    )`,
  ).run();
}

async function claimWebhookEvent(
  db: D1Database,
  eventId: string,
  eventType: string,
): Promise<boolean> {
  await ensureWebhookEventTable(db);
  const result = await db
    .prepare(
      "INSERT OR IGNORE INTO stripe_webhook_events (event_id, event_type, status) VALUES (?, ?, 'processing')",
    )
    .bind(eventId, eventType)
    .run();
  return Number(result.meta.changes || 0) === 1;
}

async function processCheckoutCompleted(
  db: D1Database,
  session: StripeCheckoutSession,
): Promise<void> {
  const plan = cleanText(session.metadata?.product, 32) as PlanKey;
  const selected = PLANS[plan];
  const amount = Number(session.amount_total || 0);
  const email = cleanText(
    session.customer_details?.email || session.metadata?.account_email,
    254,
  ).toLowerCase();

  if (
    !selected ||
    session.payment_status !== "paid" ||
    amount !== selected.amount ||
    !isEmail(email)
  ) {
    return;
  }

  const user = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  const userId = user?.id || null;
  const customerId = cleanText(session.customer, 128);
  const subscriptionId = cleanText(session.subscription, 128);
  const discordId = cleanText(session.metadata?.discord_id, 80);
  const paymentId = cleanText(session.payment_intent || session.id, 128);
  const sessionId = cleanText(session.id, 128);
  if (!paymentId || !sessionId) throw new Error("Stripe checkout event is missing identifiers");

  const splits = {
    founder: Math.floor(amount * 0.3),
    validators: Math.floor(amount * 0.4),
    hardware: Math.floor(amount * 0.1),
    ecosystem: Math.floor(amount * 0.18),
    zakat: Math.floor(amount * 0.02),
  };
  const net = Object.values(splits).reduce((sum, value) => sum + value, 0);
  const period = new Date().toISOString().slice(0, 7);

  const statements = [
    db
      .prepare(
        `INSERT INTO revenue_ledger (
          payment_id, stripe_session_id, discord_id, product, gross_amount,
          founder_amount, validators_amount, hardware_amount, ecosystem_amount,
          zakat_amount, discord_cut, net_amount, source, status, period
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'stripe', 'confirmed', ?)`,
      )
      .bind(
        paymentId,
        sessionId,
        discordId,
        plan,
        amount,
        splits.founder,
        splits.validators,
        splits.hardware,
        splits.ecosystem,
        splits.zakat,
        amount - net,
        net,
        period,
      ),
    db
      .prepare(
        "UPDATE users SET plan = ?, darpay_customer_id = ?, updated_at = datetime('now') WHERE email = ?",
      )
      .bind(plan === "startup" ? "enterprise" : plan, customerId || null, email),
  ];

  for (const [account, value] of Object.entries(splits)) {
    statements.push(
      db
        .prepare(
          `UPDATE treasury_accounts
           SET balance_cents = balance_cents + ?,
               total_received_cents = total_received_cents + ?,
               updated_at = datetime('now')
           WHERE account_type = ?`,
        )
        .bind(value, value, account),
    );
  }

  if (subscriptionId) {
    statements.push(
      db
        .prepare(
          `INSERT OR REPLACE INTO active_subscriptions (
            discord_id, user_id, stripe_subscription_id, stripe_customer_id,
            product, plan, amount_cents, status, current_period_start
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`,
        )
        .bind(
          discordId || email,
          userId,
          subscriptionId,
          customerId,
          plan,
          plan === "startup" ? "enterprise" : plan,
          amount,
        ),
    );
  }

  await db.batch(statements);
}

async function processSubscriptionLifecycle(
  db: D1Database,
  eventType: string,
  subscription: StripeSubscription,
): Promise<void> {
  const id = cleanText(subscription.id, 128);
  if (!id) return;
  const status = eventType === "customer.subscription.deleted"
    ? "canceled"
    : cleanText(subscription.status, 32) || "unknown";
  await db
    .prepare(
      "UPDATE active_subscriptions SET status = ?, updated_at = datetime('now') WHERE stripe_subscription_id = ?",
    )
    .bind(status, id)
    .run();
}

export async function handleStripeWebhook(c: Context<PublicAppEnv>): Promise<Response> {
  const secret = c.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return c.json({ error: "Webhook verification is not configured" }, 503);

  const declaredLength = Number(c.req.header("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BYTES) {
    return c.json({ error: "Webhook payload is too large" }, 413);
  }

  const body = await c.req.text();
  if (new TextEncoder().encode(body).byteLength > MAX_WEBHOOK_BYTES) {
    return c.json({ error: "Webhook payload is too large" }, 413);
  }

  const signature = c.req.header("stripe-signature") || "";
  if (!signature || !(await verifyStripeSignature(body, signature, secret))) {
    return c.json({ error: "Invalid webhook signature" }, 400);
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(body) as StripeEvent;
  } catch {
    return c.json({ error: "Invalid webhook payload" }, 400);
  }

  const eventId = cleanText(event.id, 255);
  const eventType = cleanText(event.type, 128);
  if (!eventId || !eventType) return c.json({ error: "Webhook event is incomplete" }, 400);

  const db = c.env.DB;
  const claimed = await claimWebhookEvent(db, eventId, eventType);
  if (!claimed) return c.json({ received: true, duplicate: true });

  try {
    const object = event.data?.object || {};
    if (eventType === "checkout.session.completed") {
      await processCheckoutCompleted(db, object);
    } else if (
      eventType === "customer.subscription.updated" ||
      eventType === "customer.subscription.deleted"
    ) {
      await processSubscriptionLifecycle(db, eventType, object);
    }

    await db
      .prepare(
        "UPDATE stripe_webhook_events SET status = 'processed', processed_at = datetime('now') WHERE event_id = ?",
      )
      .bind(eventId)
      .run();
    return c.json({ received: true });
  } catch {
    await db
      .prepare("DELETE FROM stripe_webhook_events WHERE event_id = ?")
      .bind(eventId)
      .run()
      .catch(() => undefined);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
}
