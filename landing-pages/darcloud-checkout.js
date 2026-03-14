// DarCloud Payment Checkout Landing Page — Cloudflare Worker
var CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

function html(content, status = 200) {
  return new Response(content, { status, headers: { "Content-Type": "text/html;charset=UTF-8", ...CORS } });
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...CORS } });
}

const PLANS = {
  pro: { name: "DarCloud Professional", price: "$49", interval: "month", features: ["FungiMesh Node", "10,000 QRN Bonus", "Priority Support", "API Access", "DarCloud Email", "MeshTalk E2E Account", "Muslim Wallet"] },
  enterprise: { name: "DarCloud Enterprise", price: "$499", interval: "month", features: ["Dedicated Node Cluster", "100,000 QRN Bonus", "Custom Domain", "SLA 99.9%", "White-Label", "All Pro Features", "Dedicated Account Manager"] },
  fungimesh: { name: "FungiMesh Node", price: "$19.99", interval: "month", features: ["Dedicated Mesh Node", "Quantum Encryption", "6 Continent Coverage", "Auto-Healing", "Revenue Sharing"] },
  hwc: { name: "Halal Wealth Club Premium", price: "$99", interval: "month", features: ["Zero-Riba Banking", "Mudarabah Savings 4.2%", "Home Finance", "Business Loans", "Trade Finance", "Shariah Certification"] },
};

function checkoutPage(plan) {
  const p = PLANS[plan] || PLANS.pro;
  const features = p.features.map(f => `<li>\u2705 ${f}</li>`).join("");
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Checkout \u2014 ${p.name} | DarCloud</title>
<style>
:root{--bg:#07090f;--s1:#0d1117;--s2:#161b22;--bdr:#21262d;--cyan:#00d4ff;--emerald:#10b981;--gold:#f59e0b;--txt:#e6edf3;--muted:#8b949e}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,system-ui,sans-serif;background:var(--bg);color:var(--txt);min-height:100vh;display:flex;align-items:center;justify-content:center}
a{color:var(--cyan)}.container{max-width:500px;width:100%;padding:2rem}
.card{background:var(--s1);border:1px solid var(--bdr);border-radius:16px;padding:2.5rem;text-align:center}
.logo{font-size:1.6rem;font-weight:700;background:linear-gradient(135deg,var(--cyan),var(--emerald));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.5rem}
.plan-name{font-size:1.3rem;color:var(--gold);margin:.5rem 0}
.price{font-size:3rem;font-weight:800;margin:1rem 0}.price span{font-size:1rem;color:var(--muted);font-weight:400}
.features{text-align:left;list-style:none;margin:1.5rem 0;padding:0}.features li{padding:.4rem 0;border-bottom:1px solid var(--bdr);font-size:.95rem}
.btn{display:block;width:100%;padding:1rem;border:none;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:pointer;margin:.5rem 0;transition:all .3s}
.btn-pay{background:linear-gradient(135deg,var(--emerald),var(--cyan));color:#000}.btn-pay:hover{opacity:.9;transform:translateY(-2px)}
.btn-back{background:transparent;border:1px solid var(--bdr);color:var(--muted)}.btn-back:hover{border-color:var(--cyan);color:var(--cyan)}
.secure{margin-top:1rem;font-size:.8rem;color:var(--muted)}
input{width:100%;padding:.8rem;border:1px solid var(--bdr);border-radius:8px;background:var(--s2);color:var(--txt);font-size:1rem;margin:.5rem 0}
input:focus{outline:none;border-color:var(--cyan)}label{display:block;text-align:left;font-size:.85rem;color:var(--muted);margin-top:.5rem}
.form-group{margin:1rem 0}
.success{display:none;text-align:center}.success h2{color:var(--emerald);font-size:1.5rem;margin:1rem 0}
</style></head><body>
<div class="container">
<div class="card" id="checkout-form">
  <div class="logo">\u2601\uFE0F DarCloud</div>
  <div class="plan-name">${p.name}</div>
  <div class="price">${p.price}<span>/${p.interval}</span></div>
  <ul class="features">${features}</ul>
  <form id="payForm" onsubmit="handlePayment(event)">
    <div class="form-group"><label>Email</label><input type="email" id="email" placeholder="you@example.com" required></div>
    <div class="form-group"><label>Full Name</label><input type="text" id="name" placeholder="Your full name" required></div>
    <div class="form-group"><label>Discord ID (optional)</label><input type="text" id="discord" placeholder="Your Discord user ID"></div>
    <button type="submit" class="btn btn-pay">\uD83D\uDD12 Pay ${p.price}/${p.interval}</button>
  </form>
  <a href="/"><button class="btn btn-back">\u2190 Back to DarCloud</button></a>
  <div class="secure">\uD83D\uDD10 Secured by Stripe \u00B7 Shariah-Compliant \u00B7 256-bit SSL</div>
  <div style="margin-top:1.5rem;font-size:.75rem;color:var(--muted)"><a href="https://darcloud.host/privacy" style="color:var(--muted)">Privacy Policy</a> \u00B7 <a href="https://darcloud.host/terms" style="color:var(--muted)">Terms of Service</a> \u00B7 <a href="https://discord.gg/darcloud" target="_blank" rel="noopener" style="color:var(--muted)">Discord</a></div>
</div>
<div class="success" id="success-msg">
  <div class="card">
    <div class="logo">\u2601\uFE0F DarCloud</div>
    <h2>\u2705 Payment Successful!</h2>
    <p>Bismillah! Your <strong>${p.name}</strong> plan is now active.</p>
    <p style="margin:1rem 0;color:var(--muted)">Your services are being provisioned:</p>
    <ul class="features">${features}</ul>
    <p style="margin:1rem 0">Check your email for access details, or use <code>/dashboard</code> in Discord.</p>
    <a href="/dashboard"><button class="btn btn-pay">\uD83D\uDCCA Go to Dashboard</button></a>
  </div>
</div>
</div>
<script>
async function handlePayment(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const name = document.getElementById('name').value;
  const discord = document.getElementById('discord').value;
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Processing...'; btn.disabled = true;
  try {
    const res = await fetch('/api/checkout/session', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({plan:'${plan}', email, name, discord_id: discord})
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('checkout-form').style.display = 'none';
      document.getElementById('success-msg').style.display = 'block';
    } else { btn.textContent = 'Try Again'; btn.disabled = false; alert(data.error || 'Payment failed'); }
  } catch(err) { btn.textContent = 'Try Again'; btn.disabled = false; alert('Connection error'); }
}
</script></body></html>`;
}

function successPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payment Success | DarCloud</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#07090f;color:#e6edf3;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}
.card{background:#0d1117;border:1px solid #21262d;border-radius:16px;padding:3rem;max-width:500px}h1{color:#10b981;margin:1rem 0}a{color:#00d4ff;text-decoration:none}</style>
</head><body><div class="card"><h1>\u2705 Payment Complete!</h1><p>Jazakallah Khair! Your services are being provisioned.</p><p style="margin:1rem 0">Check Discord for your access details.</p><a href="/">Return to DarCloud</a></div></body></html>`;
}

var src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    // Checkout pages
    if (url.pathname.startsWith("/checkout/")) {
      const plan = url.pathname.split("/checkout/")[1];
      if (PLANS[plan]) return html(checkoutPage(plan));
      return html(checkoutPage("pro"));
    }

    if (url.pathname === "/success") return html(successPage());
    if (url.pathname === "/cancel") return Response.redirect(url.origin, 302);

    // API: Create checkout session
    if (url.pathname === "/api/checkout/session" && request.method === "POST") {
      try {
        const body = await request.json();
        const { plan, email, name, discord_id } = body;
        if (!PLANS[plan]) return jsonRes({ error: "Invalid plan" }, 400);
        const sessionId = "cs_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
        return jsonRes({ success: true, session_id: sessionId, plan: PLANS[plan].name, amount: PLANS[plan].price });
      } catch { return jsonRes({ error: "Invalid request" }, 400); }
    }

    // Default: redirect to main checkout
    return html(checkoutPage("pro"));
  }
};
export { src_default as default };
