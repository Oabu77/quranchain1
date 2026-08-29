// DarCloud public catalog — truthful pre-release surface.

const HEADERS = {
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-DarCloud-No-SSO": "1",
  "Cache-Control": "no-store",
};

function html(status = 200) {
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DarCloud software previews</title><meta name="description" content="DarCloud pre-release software catalog.">
<style>:root{color-scheme:dark;--bg:#07101c;--panel:#0e1b2b;--line:#28425f;--text:#edf7ff;--muted:#adc1d6;--accent:#43ddbd}*{box-sizing:border-box}body{margin:0;background:linear-gradient(150deg,#07101c,#0a2330);color:var(--text);font:16px/1.6 system-ui,sans-serif}main{width:min(980px,calc(100% - 2rem));margin:0 auto;padding:4rem 0}header{max-width:760px}.eyebrow{color:var(--accent);font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.78rem}h1{font-size:clamp(2.2rem,6vw,4.2rem);line-height:1.05;margin:.6rem 0 1rem}p{color:var(--muted)}.notice,.card{background:rgba(14,27,43,.96);border:1px solid var(--line);border-radius:16px;padding:1.25rem}.notice{margin:2rem 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem}.card h2{margin:.1rem 0 .5rem;font-size:1.15rem}.status{display:inline-block;border:1px solid var(--line);border-radius:99px;padding:.18rem .55rem;color:var(--accent);font-size:.75rem;font-weight:700}a{color:var(--accent)}footer{margin-top:2rem;padding-top:1rem;border-top:1px solid var(--line);color:var(--muted);font-size:.88rem}</style></head>
<body><main><header><div class="eyebrow">DarCloud LLC</div><h1>Software previews with clear boundaries</h1><p>DarCloud is validating its products one capability at a time. A page marked research or internal preview is not a live commercial, financial, logistics, telecom, blockchain, or regulated service.</p></header>
<section class="notice"><strong>Payments and financial products are disabled.</strong><p>No checkout, bank account, deposit, transfer, card, credit, insurance, token sale, staking, mining reward, or investment product is available from this catalog.</p></section>
<section class="grid" aria-label="Current software">
  <article class="card"><span class="status">Public beta candidate</span><h2>MeshTalk</h2><p>Username-based direct and group text messaging with blocking, reporting, and account deletion. Version 1 has no calls, media, location, payments, push, or end-to-end encryption.</p><a href="https://darcloud.host/meshtalk">Open MeshTalk</a></article>
  <article class="card"><span class="status">Research only</span><h2>Wallet concept</h2><p>A non-transactional learning and budgeting concept. It does not create a financial account or provide money services.</p><a href="https://wallet.darcloud.host/">View research preview</a></article>
  <article class="card"><span class="status">Internal test</span><h2>Dar Logistics</h2><p>A workflow preview using fictional records. It has no booking, dispatch, fleet, live GPS, payment, shipment, or fulfillment service.</p><a href="https://logistics.darcloud.host/">View internal preview</a></article>
</section>
<footer><a href="https://darcloud.host/privacy">Privacy</a> · <a href="https://darcloud.host/terms">Terms</a> · <a href="mailto:omarabunadi@darcloud.net">Support</a><p>Do not rely on a preview for emergencies, financial decisions, legal advice, transportation, deliveries, telecommunications, or regulated activity.</p></footer></main></body></html>`;
  return new Response(body, { status, headers: { ...HEADERS, "Content-Type": "text/html; charset=UTF-8" } });
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...HEADERS, "Content-Type": "application/json; charset=UTF-8", ...extra } });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    if (method === "OPTIONS") return new Response(null, { status: 204, headers: { ...HEADERS, Allow: "GET, HEAD, OPTIONS" } });
    if (method !== "GET" && method !== "HEAD") {
      return json({ error: "This public catalog is read-only." }, 405, { Allow: "GET, HEAD, OPTIONS" });
    }
    if (url.pathname === "/health") {
      return json({
        status: "preview",
        service: "darcloud-public-catalog",
        mode: "read-only",
        checkout: false,
        payments: false,
        financial_services: false,
      });
    }
    if (url.pathname === "/") return html();
    if (url.pathname === "/login" || url.pathname === "/signup" || /^\/checkout(?:\/|$)/i.test(url.pathname)) return html(410);
    return html(404);
  },
};
