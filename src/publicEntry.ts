import publicSite from "./publicSite";
import type { PublicBindings } from "./public/types";

type PublicWorker = {
  fetch(request: Request, env: PublicBindings, ctx: ExecutionContext): Response | Promise<Response>;
};

type VerifiedEntitlement = {
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
};

const worker = publicSite as unknown as PublicWorker;
const MAX_SIGNUP_BYTES = 64 * 1024;

function normalizeHostingPlan(plan: string): "pro" | "enterprise" | null {
  if (plan === "pro") return "pro";
  if (plan === "enterprise" || plan === "startup") return "enterprise";
  return null;
}

function cleanEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
}

async function findVerifiedEntitlement(
  env: PublicBindings,
  email: string,
): Promise<(VerifiedEntitlement & { hostingPlan: "pro" | "enterprise" }) | null> {
  if (!email) return null;

  try {
    const row = await env.DB.prepare(
      `SELECT plan, stripe_customer_id, stripe_subscription_id
       FROM active_subscriptions
       WHERE lower(discord_id) = ?
         AND status IN ('active', 'trialing')
       ORDER BY created_at DESC
       LIMIT 1`,
    )
      .bind(email)
      .first<VerifiedEntitlement>();

    if (!row?.stripe_subscription_id) return null;
    const hostingPlan = normalizeHostingPlan(row.plan);
    return hostingPlan ? { ...row, hostingPlan } : null;
  } catch {
    return null;
  }
}

function rebuiltRequest(request: Request, body: string): Request {
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  return new Request(request.url, {
    method: request.method,
    headers,
    body,
    redirect: request.redirect,
  });
}

async function handleSignup(
  request: Request,
  env: PublicBindings,
  ctx: ExecutionContext,
): Promise<Response> {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SIGNUP_BYTES) {
    return worker.fetch(rebuiltRequest(request, "{}"), env, ctx);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_SIGNUP_BYTES) {
    return worker.fetch(rebuiltRequest(request, "{}"), env, ctx);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return worker.fetch(rebuiltRequest(request, text), env, ctx);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return worker.fetch(rebuiltRequest(request, text), env, ctx);
  }

  const email = cleanEmail(body.email);
  const entitlement = await findVerifiedEntitlement(env, email);
  const response = await worker.fetch(
    rebuiltRequest(
      request,
      JSON.stringify({
        ...body,
        plan: entitlement?.hostingPlan || "starter",
      }),
    ),
    env,
    ctx,
  );

  if (!response.ok || !entitlement) return response;

  try {
    const payload = await response.clone().json<{ user?: { id?: number } }>();
    const userId = Number(payload.user?.id || 0);
    if (!Number.isInteger(userId) || userId <= 0) return response;

    await env.DB.batch([
      env.DB.prepare(
        `UPDATE users
         SET plan = ?, darpay_customer_id = ?, updated_at = datetime('now')
         WHERE id = ? AND lower(email) = ?`,
      ).bind(entitlement.hostingPlan, entitlement.stripe_customer_id, userId, email),
      env.DB.prepare(
        `UPDATE active_subscriptions
         SET user_id = ?, updated_at = datetime('now')
         WHERE stripe_subscription_id = ?`,
      ).bind(userId, entitlement.stripe_subscription_id),
    ]);
  } catch {
    // Account creation remains successful. The verified subscription can be
    // reconciled again by a later webhook or administrative repair pass.
  }

  return response;
}

export default {
  async fetch(request: Request, env: PublicBindings, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/api/auth/signup") {
      return handleSignup(request, env, ctx);
    }
    return worker.fetch(request, env, ctx);
  },
};
