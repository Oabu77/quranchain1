// Public checkout aliases lead to the existing authenticated application.
// Payment APIs are handled by Hono; this module never creates payment sessions.
const HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function redirect(path) {
  return new Response(null, {
    status: 302,
    headers: { ...HEADERS, Location: `https://darcloud.host${path}` },
  });
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return Response.json({ error: "method_not_allowed" }, {
        status: 405,
        headers: { ...HEADERS, Allow: "GET" },
      });
    }

    const { pathname } = new URL(request.url);
    if (pathname === "/") return redirect("/checkout/pro");
    if (/^\/checkout\/(pro|enterprise|fungimesh|hwc)$/.test(pathname)) {
      return redirect(pathname);
    }
    if (pathname === "/success" || pathname === "/checkout/success") {
      return redirect("/checkout/success");
    }
    if (pathname === "/cancel" || pathname === "/checkout/cancel") {
      return redirect("/checkout/cancel");
    }

    return Response.json({ error: "not_found" }, { status: 404, headers: HEADERS });
  },
};
