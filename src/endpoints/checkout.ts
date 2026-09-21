// Checkout creates a payment session, never a payment or a paid entitlement.
const CHECKOUT_PLANS: Record<string, { amount: number; label: string; price_id: string }> = {
  pro: { amount: 4900, label: "DarCloud Professional", price_id: "price_1TAR0SAqs2ifkfkqOKa2Rzq3" },
  enterprise: { amount: 49900, label: "DarCloud Enterprise", price_id: "price_1TAR0TAqs2ifkfkqdtr8kWEf" },
  startup: { amount: 49900, label: "DarCloud Enterprise", price_id: "price_1TAR0TAqs2ifkfkqdtr8kWEf" },
  fungimesh: { amount: 1999, label: "FungiMesh Node", price_id: "price_1TAR0TAqs2ifkfkqqrjzoLdm" },
  hwc: { amount: 9900, label: "HWC Premium", price_id: "price_1TAR0TAqs2ifkfkqKFPTW7hM" },
};

export class CheckoutError extends Error {
  constructor(message: string, readonly status: 400 | 401 | 409 | 502 | 503) { super(message); }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function stripeRequest(key: string, path: string, params?: URLSearchParams, idempotencyKey?: string): Promise<Record<string, unknown>> {
  try {
    const result = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: params ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: params?.toString(),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!result.ok) throw new Error("Unsuccessful billing response");
    const value: unknown = await result.json();
    if (!record(value) || value.error) throw new Error("Invalid billing response");
    return value;
  } catch {
    // Stripe errors can contain request details. Never return them to clients.
    throw new CheckoutError("Billing provider unavailable. Please try again later.", 502);
  }
}

function ownsCustomer(customer: Record<string, unknown>, userId: number): boolean {
  return customer.object === "customer" && customer.deleted !== true &&
    typeof customer.id === "string" && /^cus_[A-Za-z0-9]+$/.test(customer.id) &&
    record(customer.metadata) && customer.metadata.darcloud_user_id === String(userId) &&
    customer.metadata.darcloud_application === "quranchain1";
}

async function ownedCustomerId(db: D1Database, key: string, user: { id: number; darpay_customer_id: string | null }): Promise<string> {
  if (user.darpay_customer_id) {
    const id = user.darpay_customer_id;
    if (!/^cus_[A-Za-z0-9]+$/.test(id)) throw new CheckoutError("Billing account ownership requires verification. Contact support.", 409);
    const otherOwner = await db.prepare("SELECT id FROM users WHERE darpay_customer_id = ? AND id <> ? LIMIT 1").bind(id, user.id).first();
    if (otherOwner) throw new CheckoutError("Billing account ownership requires verification. Contact support.", 409);
    const customer = await stripeRequest(key, `customers/${id}`);
    if (customer.id !== id || !ownsCustomer(customer, user.id)) {
      throw new CheckoutError("Billing account ownership requires verification. Contact support.", 409);
    }
    return id;
  }

  // Stable, server-owned parameters let concurrent/retried requests share a
  // Stripe idempotency key. Email is deliberately not an ownership identifier.
  const params = new URLSearchParams({
    "metadata[darcloud_user_id]": String(user.id),
    "metadata[darcloud_application]": "quranchain1",
  });
  const customer = await stripeRequest(key, "customers", params, `quranchain1:user:${user.id}:customer:v1`);
  if (!ownsCustomer(customer, user.id)) throw new CheckoutError("Billing provider returned an invalid customer.", 502);
  const id = customer.id as string;

  // D1 executes this condition atomically. Never overwrite an existing mapping,
  // and never attach a customer already mapped to a different database user.
  await db.prepare(`UPDATE users SET darpay_customer_id = ?, updated_at = datetime('now')
    WHERE id = ? AND (darpay_customer_id IS NULL OR darpay_customer_id = '')
    AND NOT EXISTS (SELECT 1 FROM users WHERE darpay_customer_id = ? AND id <> ?)`)
    .bind(id, user.id, id, user.id).run();
  const stored = await db.prepare("SELECT darpay_customer_id FROM users WHERE id = ?")
    .bind(user.id).first<{ darpay_customer_id: string | null }>();
  if (stored?.darpay_customer_id !== id) {
    throw new CheckoutError("Billing account changed during checkout. Please try again.", 409);
  }
  return id;
}

export async function createOwnedCheckout(env: Env, identity: Record<string, unknown>, body: unknown) {
  const subject = String(identity.sub ?? "");
  if (!/^[1-9]\d*$/.test(subject) || !Number.isSafeInteger(Number(subject)) ||
      (identity.userId !== undefined && String(identity.userId) !== subject)) {
    throw new CheckoutError("Invalid account identity. Please sign in again.", 401);
  }
  const user = await env.DB.prepare("SELECT id, darpay_customer_id FROM users WHERE id = ?")
    .bind(Number(subject)).first<{ id: number; darpay_customer_id: string | null }>();
  if (!user) throw new CheckoutError("Account not found. Please sign in again.", 401);
  if (!record(body) || typeof body.plan !== "string" || !Object.hasOwn(CHECKOUT_PLANS, body.plan)) {
    throw new CheckoutError("Select an available checkout plan.", 400);
  }
  const selected = CHECKOUT_PLANS[body.plan];
  if (!env.STRIPE_SECRET_KEY?.trim()) throw new CheckoutError("Billing is temporarily unavailable.", 503);
  const customerId = await ownedCustomerId(env.DB, env.STRIPE_SECRET_KEY, user);
  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": selected.price_id,
    "line_items[0][quantity]": "1",
    customer: customerId,
    client_reference_id: String(user.id),
    success_url: "https://darcloud.host/checkout/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://darcloud.host/checkout/cancel",
    "metadata[product]": body.plan,
    "metadata[darcloud_user_id]": String(user.id),
    "metadata[darcloud_application]": "quranchain1",
    "subscription_data[metadata][product]": body.plan,
    "subscription_data[metadata][darcloud_user_id]": String(user.id),
    "subscription_data[metadata][darcloud_application]": "quranchain1",
  });
  const session = await stripeRequest(env.STRIPE_SECRET_KEY, "checkout/sessions", params);
  let checkoutUrl: URL | null = null;
  try { if (typeof session.url === "string") checkoutUrl = new URL(session.url); } catch { /* handled below */ }
  if (session.object !== "checkout.session" || typeof session.id !== "string" || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(session.id) ||
      session.customer !== customerId || session.client_reference_id !== String(user.id) || session.mode !== "subscription" ||
      session.status !== "open" || checkoutUrl?.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com" ||
      checkoutUrl.username || checkoutUrl.password || checkoutUrl.port) {
    throw new CheckoutError("Billing provider returned an invalid checkout session.", 502);
  }
  return {
    success: true,
    session_id: session.id,
    checkout_url: checkoutUrl.href,
    plan: selected.label,
    amount: selected.amount,
    currency: "usd",
    payment_processor: "DarPay™ × Stripe",
    payment_status: "not_verified",
  };
}
