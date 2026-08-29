// Canonical MeshTalk service lives at darcloud.host/meshtalk.

const HEADERS = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

const POLICY_PATHS = new Map([
  ["/privacy", "/meshtalk/privacy"],
  ["/terms", "/meshtalk/terms"],
  ["/child-safety", "/meshtalk/child-safety"],
  ["/delete-account", "/meshtalk/delete-account"],
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    if (method === "OPTIONS") return new Response(null, { status: 204, headers: { ...HEADERS, Allow: "GET, HEAD, OPTIONS" } });
    if (method !== "GET" && method !== "HEAD") {
      return new Response(JSON.stringify({ error: "Use the canonical MeshTalk service." }), {
        status: 405,
        headers: { ...HEADERS, "Content-Type": "application/json; charset=UTF-8", Allow: "GET, HEAD, OPTIONS" },
      });
    }
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "redirect",
        service: "MeshTalk",
        canonical_url: "https://darcloud.host/meshtalk",
        end_to_end_encryption: false,
      }), { headers: { ...HEADERS, "Content-Type": "application/json; charset=UTF-8" } });
    }
    const destination = POLICY_PATHS.get(url.pathname) || "/meshtalk";
    return Response.redirect(`https://darcloud.host${destination}`, 308);
  },
};
