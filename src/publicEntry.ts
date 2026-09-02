import publicSite from "./publicSite";
import { auth } from "./endpoints/auth";
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
const authWorker = auth as unknown as PublicWorker;
const MAX_SIGNUP_BYTES = 64 * 1024;

function normalizeHostingPlan(plan: string): "pro" | "enterprise" | null {
  if (plan === "pro") return "pro";
  if (plan === "enterprise" || plan === "startup") return "enterprise";
  return null;
}

function cleanEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
}

function isAllowedOrigin(origin: string): boolean {
  return /^https:\/\/([a-z0-9-]+\.)?darcloud\.(host|net)$/i.test(origin);
}

function appendVary(headers: Headers, value: string): void {
  const values = (headers.get("vary") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) values.push(value);
  if (values.length > 0) headers.set("Vary", values.join(", "));
}

function secureSignupResponse(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("origin") || "";
  for (const name of [
    "access-control-allow-origin",
    "access-control-allow-credentials",
    "access-control-allow-methods",
    "access-control-allow-headers",
  ]) {
    headers.delete(name);
  }
  if (origin) appendVary(headers, "Origin");
  if (isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  headers.set("Cache-Control", "no-store");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function secureJson(request: Request, data: unknown, status: number): Response {
  return secureSignupResponse(
    new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json;charset=UTF-8" },
    }),
    request,
  );
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

function rebuiltAuthRequest(request: Request, body: string): Request {
  const target = new URL(request.url);
  target.pathname = "/auth/signup";
  target.search = "";
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  return new Request(target.toString(), {
    method: "POST",
    headers,
    body,
    redirect: request.redirect,
  });
}

async function reconcileEntitlement(
  env: PublicBindings,
  email: string,
  entitlement: VerifiedEntitlement & { hostingPlan: "pro" | "enterprise" },
): Promise<void> {
  const user = await env.DB.prepare(
    "SELECT id FROM users WHERE lower(email) = ? LIMIT 1",
  )
    .bind(email)
    .first<{ id: number }>();
  const userId = Number(user?.id || 0);
  if (!Number.isInteger(userId) || userId <= 0) return;

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
}

async function handleSignup(
  request: Request,
  env: PublicBindings,
  ctx: ExecutionContext,
): Promise<Response> {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_SIGNUP_BYTES) {
    return secureJson(request, { error: "Request body is too large" }, 413);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_SIGNUP_BYTES) {
    return secureJson(request, { error: "Request body is too large" }, 413);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return secureJson(request, { error: "Invalid JSON body" }, 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return secureJson(request, { error: "Invalid JSON body" }, 400);
  }

  const email = cleanEmail(body.email);
  const entitlement = await findVerifiedEntitlement(env, email);
  const response = await authWorker.fetch(
    rebuiltAuthRequest(
      request,
      JSON.stringify({
        ...body,
        plan: entitlement?.hostingPlan || "starter",
      }),
    ),
    env,
    ctx,
  );

  if (response.ok && entitlement) {
    try {
      await reconcileEntitlement(env, email, entitlement);
    } catch {
      // Account creation remains successful. The verified subscription can be
      // reconciled again by a later webhook or administrative repair pass.
    }
  }

  return secureSignupResponse(response, request);
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
