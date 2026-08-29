import { Hono } from "hono";

const auth = new Hono<{ Bindings: Env }>();

const accountUnavailable = (c: any) => c.json(
  {
    error: "DarCloud account access is unavailable during pre-release remediation.",
    accounts_enabled: false,
    registration_enabled: false,
    authentication_enabled: false,
  },
  410,
  { Allow: "GET, HEAD, OPTIONS" },
);

// The main DarCloud account system is fully retired for this release candidate.
// Reopening it requires verified-email onboarding, durable account/IP abuse
// controls, self-service deletion, a staffed privacy workflow, and a separate
// security review. These wildcard handlers deliberately cover every method.
auth.all("/auth", accountUnavailable);
auth.all("/auth/*", accountUnavailable);

auth.all("/checkout/session", (c) => c.json(
  {
    error: "Checkout is disabled.",
    mode: "non-transactional-preview",
    payments: false,
    subscriptions: false,
  },
  410,
  { Allow: "GET, HEAD, OPTIONS" },
));

auth.all("/contact", (c) => c.json(
  { error: "Contact form collection is unavailable.", stored: false },
  410,
  { Allow: "GET, HEAD, OPTIONS" },
));

auth.all("/hwc/apply", (c) => c.json(
  {
    error: "This enrollment route is retired.",
    mode: "research-only",
    waitlist_enabled: false,
    preview_url: "https://wallet.darcloud.host/",
  },
  410,
  { Allow: "GET, HEAD, OPTIONS" },
));

auth.all("/admin/*", (c) => c.json(
  { error: "Admin access is unavailable.", admin_role_configured: false },
  410,
  { Allow: "GET, HEAD, OPTIONS" },
));

auth.all("/lookup", (c) => c.json(
  { error: "User lookup is unavailable.", user_lookup_enabled: false },
  410,
  { Allow: "GET, HEAD, OPTIONS" },
));

// Retired legacy messaging routers still import this guard. Always deny before
// they can inspect a token or touch D1.
async function requireAuth(c: {
  json: (data: unknown, status?: number) => Response;
}): Promise<Response> {
  return c.json(
    {
      error: "DarCloud account authentication is unavailable.",
      authentication_enabled: false,
    },
    410,
  );
}

export { auth, requireAuth };
