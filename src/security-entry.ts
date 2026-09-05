import legacyApp from "./index";

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function hasPaidSignupPlan(request: Request): Promise<boolean> {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) return false;
    const body = await request.clone().json() as { plan?: unknown };
    if (typeof body.plan !== "string") return false;
    const plan = body.plan.trim().toLowerCase();
    return plan !== "" && plan !== "starter";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // Paid plans are server-controlled entitlements. Public signup may create
    // only a starter account; payment success must be the thing that upgrades it.
    if (method === "POST" && url.pathname === "/api/auth/signup") {
      if (await hasPaidSignupPlan(request)) {
        return json({ error: "Paid plans cannot be selected during signup" }, 403);
      }
    }

    // Temporary containment: the legacy checkout mutates users.plan before
    // Stripe confirms payment and accepts caller-supplied account identity.
    if (method === "POST" && url.pathname === "/api/checkout/session") {
      return json({ error: "Checkout is temporarily disabled pending entitlement hardening" }, 503);
    }

    // Temporary containment: the legacy portal endpoint accepts an arbitrary
    // Stripe customer_id without first binding it to the authenticated user.
    if (method === "POST" && url.pathname === "/api/stripe/portal") {
      return json({ error: "Billing portal is temporarily disabled pending account binding" }, 503);
    }

    // The legacy admin endpoint currently accepts any valid user JWT and
    // returns recent-user identity metadata. Fail closed until a distinct,
    // server-issued administrator role/claim is implemented.
    if (url.pathname === "/api/admin/stats") {
      return json({ error: "Administrator authorization required" }, 403);
    }

    return legacyApp.fetch(request, env, ctx);
  },
};
