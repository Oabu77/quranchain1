import app from "./index";

/**
 * Temporary fail-closed edge containment for security issue #69.
 *
 * The legacy /api/stripe/portal handler accepts a caller-supplied Stripe
 * customer_id without binding it to an authenticated application user. Until
 * a server-derived ownership mapping is implemented and staged, do not allow
 * any request to reach that provider-backed handler.
 */
const STRIPE_PORTAL_PATH = "/api/stripe/portal";

function securityHeaders(): HeadersInit {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === STRIPE_PORTAL_PATH) {
      return new Response(
        JSON.stringify({
          error: "Billing portal temporarily unavailable while customer ownership binding is enforced",
        }),
        { status: 503, headers: securityHeaders() },
      );
    }

    return app.fetch(request, env, ctx);
  },
};
