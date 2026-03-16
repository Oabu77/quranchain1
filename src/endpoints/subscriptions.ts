import { Hono } from "hono";
import { requireAuth } from "./auth";

const subscriptions = new Hono<{ Bindings: Env }>();

// Available plans with real Stripe price IDs
const PLANS: Record<string, { name: string; price_cents: number; price_id: string; description: string }> = {
  starter: { name: "DarCloud Starter", price_cents: 499, price_id: "price_1TAR0SAqs2ifkfkqOKa2Rzq3", description: "Individual DarCloud access — AI, dashboards, community" },
  pro: { name: "DarCloud Professional", price_cents: 999, price_id: "price_1TAR0TAqs2ifkfkqdtr8kWEf", description: "Full DarCloud access — unlimited AI, NFTs, priority support" },
  enterprise: { name: "DarCloud Enterprise", price_cents: 2999, price_id: "price_1TAR0TAqs2ifkfkqqrjzoLdm", description: "Enterprise-grade DarCloud with SLA and white-label" },
  fungimesh: { name: "FungiMesh Node", price_cents: 499, price_id: "price_1TAR0TAqs2ifkfkqKFPTW7hM", description: "FungiMesh encrypted network node — earn QRN rewards" },
  hwc: { name: "HWC Premium", price_cents: 1499, price_id: "price_1TAR0UAqs2ifkfkqLNw6DvpC", description: "Premium Islamic banking & investment tools" },
};

// Helper: call Stripe REST API
async function stripeAPI(
  method: string,
  path: string,
  key: string,
  params?: URLSearchParams
): Promise<any> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params?.toString(),
  });
  return res.json();
}

// ── GET /subscriptions/plans — Public list of available plans ──
subscriptions.get("/plans", (c) => {
  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    price_display: `$${(plan.price_cents / 100).toFixed(2)}/mo`,
    price_cents: plan.price_cents,
    interval: "month",
    description: plan.description,
  }));
  return c.json({ success: true, plans });
});

// ── GET /subscriptions — List user's active subscriptions (auth required) ──
subscriptions.get("/", async (c) => {
  const authError = await requireAuth(c as any);
  if (authError) return authError;

  const db = c.env.DB;
  const user = (c as any).get("user");
  const discordId = user?.discord_id || user?.email;

  if (!discordId) {
    return c.json({ error: "User identity not found" }, 400);
  }

  try {
    const subs = await db.prepare(
      `SELECT id, discord_id, stripe_subscription_id, stripe_customer_id, product, plan, amount_cents, interval, status, current_period_start, current_period_end, cancel_at, created_at, updated_at
       FROM active_subscriptions WHERE discord_id = ? ORDER BY created_at DESC`
    ).bind(discordId).all();

    return c.json({
      success: true,
      subscriptions: subs.results,
      count: subs.results.length,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ── GET /subscriptions/:id — Get subscription details from Stripe ──
subscriptions.get("/:id", async (c) => {
  const authError = await requireAuth(c as any);
  if (authError) return authError;

  const subId = c.req.param("id");
  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json({ error: "Payment system not configured" }, 500);
  }

  // Verify user owns this subscription
  const db = c.env.DB;
  const user = (c as any).get("user");
  const discordId = user?.discord_id || user?.email;

  const local = await db.prepare(
    "SELECT * FROM active_subscriptions WHERE stripe_subscription_id = ? AND discord_id = ?"
  ).bind(subId, discordId).first();

  if (!local) {
    return c.json({ error: "Subscription not found" }, 404);
  }

  try {
    const stripeSub = await stripeAPI("GET", `/subscriptions/${encodeURIComponent(subId)}`, stripeKey);
    if (stripeSub.error) {
      return c.json({ error: stripeSub.error.message }, 400);
    }

    return c.json({
      success: true,
      subscription: {
        id: stripeSub.id,
        status: stripeSub.status,
        current_period_start: stripeSub.current_period_start,
        current_period_end: stripeSub.current_period_end,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
        cancel_at: stripeSub.cancel_at,
        canceled_at: stripeSub.canceled_at,
        plan: stripeSub.items?.data?.[0]?.price?.id,
        amount: stripeSub.items?.data?.[0]?.price?.unit_amount,
        interval: stripeSub.items?.data?.[0]?.price?.recurring?.interval,
        customer: stripeSub.customer,
        created: stripeSub.created,
        local_record: local,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ── POST /subscriptions/cancel — Cancel a subscription ──
subscriptions.post("/cancel", async (c) => {
  const authError = await requireAuth(c as any);
  if (authError) return authError;

  const { subscription_id, cancel_immediately } = await c.req.json();
  if (!subscription_id) {
    return c.json({ error: "subscription_id is required" }, 400);
  }

  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json({ error: "Payment system not configured" }, 500);
  }

  // Verify user owns this subscription
  const db = c.env.DB;
  const user = (c as any).get("user");
  const discordId = user?.discord_id || user?.email;

  const local = await db.prepare(
    "SELECT * FROM active_subscriptions WHERE stripe_subscription_id = ? AND discord_id = ?"
  ).bind(subscription_id, discordId).first();

  if (!local) {
    return c.json({ error: "Subscription not found" }, 404);
  }

  try {
    let stripeSub: any;

    if (cancel_immediately) {
      // Immediately cancel — DELETE the subscription
      stripeSub = await stripeAPI("DELETE", `/subscriptions/${encodeURIComponent(subscription_id)}`, stripeKey);
    } else {
      // Cancel at period end (default, best practice)
      const params = new URLSearchParams();
      params.append("cancel_at_period_end", "true");
      stripeSub = await stripeAPI("POST", `/subscriptions/${encodeURIComponent(subscription_id)}`, stripeKey, params);
    }

    if (stripeSub.error) {
      return c.json({ error: stripeSub.error.message }, 400);
    }

    // Update local record
    const newStatus = cancel_immediately ? "cancelled" : "cancelling";
    await db.prepare(
      `UPDATE active_subscriptions SET status = ?, cancel_at = ?, updated_at = datetime('now') WHERE stripe_subscription_id = ?`
    ).bind(
      newStatus,
      stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000).toISOString() : null,
      subscription_id
    ).run();

    // Downgrade user plan if immediate cancellation
    if (cancel_immediately) {
      await db.prepare(
        `UPDATE users SET plan = 'starter', updated_at = datetime('now') WHERE email = ?`
      ).bind(discordId).run().catch(() => {});
    }

    return c.json({
      success: true,
      status: newStatus,
      cancel_at_period_end: stripeSub.cancel_at_period_end,
      current_period_end: stripeSub.current_period_end
        ? new Date(stripeSub.current_period_end * 1000).toISOString()
        : null,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ── POST /subscriptions/update — Change subscription plan (upgrade/downgrade) ──
subscriptions.post("/update", async (c) => {
  const authError = await requireAuth(c as any);
  if (authError) return authError;

  const { subscription_id, new_plan } = await c.req.json();
  if (!subscription_id || !new_plan) {
    return c.json({ error: "subscription_id and new_plan are required" }, 400);
  }

  const newPlanDef = PLANS[new_plan];
  if (!newPlanDef) {
    return c.json({ error: `Invalid plan: ${new_plan}. Valid plans: ${Object.keys(PLANS).join(", ")}` }, 400);
  }

  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json({ error: "Payment system not configured" }, 500);
  }

  // Verify user owns this subscription
  const db = c.env.DB;
  const user = (c as any).get("user");
  const discordId = user?.discord_id || user?.email;

  const local = await db.prepare(
    "SELECT * FROM active_subscriptions WHERE stripe_subscription_id = ? AND discord_id = ?"
  ).bind(subscription_id, discordId).first();

  if (!local) {
    return c.json({ error: "Subscription not found" }, 404);
  }

  try {
    // First, retrieve current subscription to get item ID
    const currentSub = await stripeAPI("GET", `/subscriptions/${encodeURIComponent(subscription_id)}`, stripeKey);
    if (currentSub.error) {
      return c.json({ error: currentSub.error.message }, 400);
    }

    const itemId = currentSub.items?.data?.[0]?.id;
    if (!itemId) {
      return c.json({ error: "Could not find subscription item to update" }, 400);
    }

    // Update subscription with new price, prorate by default
    const params = new URLSearchParams();
    params.append(`items[0][id]`, itemId);
    params.append(`items[0][price]`, newPlanDef.price_id);
    params.append("proration_behavior", "create_prorations");

    const updated = await stripeAPI("POST", `/subscriptions/${encodeURIComponent(subscription_id)}`, stripeKey, params);
    if (updated.error) {
      return c.json({ error: updated.error.message }, 400);
    }

    // Update local record
    await db.prepare(
      `UPDATE active_subscriptions SET product = ?, plan = ?, amount_cents = ?, updated_at = datetime('now') WHERE stripe_subscription_id = ?`
    ).bind(new_plan, new_plan, newPlanDef.price_cents, subscription_id).run();

    // Update user plan
    if (new_plan === "pro" || new_plan === "enterprise") {
      await db.prepare(
        `UPDATE users SET plan = ?, updated_at = datetime('now') WHERE email = ?`
      ).bind(new_plan, discordId).run().catch(() => {});
    }

    return c.json({
      success: true,
      subscription_id: updated.id,
      new_plan: new_plan,
      new_amount_display: `$${(newPlanDef.price_cents / 100).toFixed(2)}/mo`,
      status: updated.status,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ── GET /subscriptions/checkout-status — Check checkout session status ──
subscriptions.get("/checkout-status", async (c) => {
  const sessionId = c.req.query("session_id");
  if (!sessionId) {
    return c.json({ error: "session_id query parameter is required" }, 400);
  }

  const stripeKey = c.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return c.json({ error: "Payment system not configured" }, 500);
  }

  try {
    const session = await stripeAPI("GET", `/checkout/sessions/${encodeURIComponent(sessionId)}`, stripeKey);
    if (session.error) {
      return c.json({ error: session.error.message }, 400);
    }

    return c.json({
      success: true,
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      subscription_id: session.subscription,
      amount_total: session.amount_total,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export { subscriptions };
