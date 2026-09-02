const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>DarCloud Affiliate Program | Referral Partnerships</title>
  <meta name="description" content="Join the DarCloud affiliate and referral partnership program.">
  <style>
    :root{color-scheme:dark;background:#060912;color:#edf4ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 20% 10%,#15304b 0,transparent 36%),linear-gradient(180deg,#07101c,#060912)}
    a{color:inherit}.shell{width:min(1120px,calc(100% - 2rem));margin:auto}.nav{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 0;border-bottom:1px solid #24344d}
    .brand{font-weight:900;letter-spacing:.04em}.navlinks{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}.navlinks a{text-decoration:none;color:#b8c6d9}
    .hero{padding:6rem 0 4rem;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);gap:2rem;align-items:center}.eyebrow{color:#67e8f9;text-transform:uppercase;letter-spacing:.16em;font-weight:800;font-size:.78rem}
    h1{font-size:clamp(2.6rem,7vw,5.6rem);line-height:.96;margin:.8rem 0 1.2rem}.lead{font-size:1.15rem;line-height:1.75;color:#b7c4d6;max-width:720px}.actions{display:flex;gap:.8rem;flex-wrap:wrap;margin-top:2rem}
    .button{display:inline-flex;padding:.85rem 1.15rem;border-radius:11px;text-decoration:none;font-weight:800;border:1px solid #2f4765}.button.primary{background:#67e8f9;color:#04111a;border-color:#67e8f9}
    .card,.step{background:rgba(12,24,39,.88);border:1px solid #2b3f59;border-radius:18px;padding:1.4rem;box-shadow:0 20px 60px rgba(0,0,0,.22)}.card h2,.step h2{margin-top:0}.metric{display:flex;justify-content:space-between;gap:1rem;padding:.9rem 0;border-bottom:1px solid #25354b}.metric:last-child{border:0}
    .steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;padding:0 0 5rem}.num{display:inline-grid;place-items:center;width:2.2rem;height:2.2rem;border-radius:50%;background:#173753;color:#67e8f9;font-weight:900}.step p,.fine{color:#9eafc5;line-height:1.65}
    footer{border-top:1px solid #24344d;padding:2rem 0;color:#8495aa;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}
    @media(max-width:760px){.hero{grid-template-columns:1fr;padding-top:3.5rem}.steps{grid-template-columns:1fr}.nav{align-items:flex-start;gap:1rem}.navlinks{justify-content:flex-end}}
  </style>
</head>
<body>
  <div class="shell">
    <nav class="nav" aria-label="Primary navigation">
      <a class="brand" href="https://www.darcloud.host/">DarCloud</a>
      <div class="navlinks">
        <a href="https://www.darcloud.host/#services">Services</a>
        <a href="https://darcloud.host/terms">Terms</a>
        <a href="https://darcloud.host/login">Sign In</a>
      </div>
    </nav>

    <main>
      <section class="hero">
        <div>
          <div class="eyebrow">Affiliate · Referral Partnerships</div>
          <h1>Grow with the DarCloud ecosystem.</h1>
          <p class="lead">Refer qualified customers to DarCloud services through an approved partnership. Commission eligibility, attribution windows, payment timing, and campaign restrictions are governed by the terms shown in your approved affiliate agreement.</p>
          <div class="actions">
            <a class="button primary" href="https://darcloud.host/signup">Create a DarCloud account</a>
            <a class="button" href="https://www.darcloud.host/#contact">Contact partnerships</a>
          </div>
        </div>
        <aside class="card" aria-label="Affiliate program overview">
          <h2>Partner safeguards</h2>
          <div class="metric"><span>Attribution</span><strong>Server recorded</strong></div>
          <div class="metric"><span>Commission</span><strong>Per approved terms</strong></div>
          <div class="metric"><span>Payments</span><strong>Verified conversions only</strong></div>
          <div class="metric"><span>Prohibited</span><strong>Spam or misleading claims</strong></div>
        </aside>
      </section>

      <section class="steps" aria-label="How the affiliate program works">
        <article class="step"><span class="num">1</span><h2>Apply</h2><p>Create an account and contact the DarCloud partnerships team with your audience, channel, and intended campaign.</p></article>
        <article class="step"><span class="num">2</span><h2>Receive approval</h2><p>Use only the referral materials, claims, destination links, and commission terms approved for your partnership.</p></article>
        <article class="step"><span class="num">3</span><h2>Earn on verified conversions</h2><p>Eligible commission is calculated only after the customer action and payment status are verified by DarCloud systems.</p></article>
      </section>
      <p class="fine">This page does not promise a specific commission rate or payout. Final terms are established in the approved partner agreement.</p>
    </main>

    <footer>
      <span>© 2026 DarCloud</span>
      <span><a href="https://darcloud.host/privacy">Privacy</a> · <a href="https://darcloud.host/terms">Terms</a></span>
    </footer>
  </div>
</body>
</html>`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json;charset=UTF-8", "cache-control": "no-store" },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ error: "Method not allowed" }, 405);
    }
    if (url.pathname === "/health") {
      return json({ status: "healthy", service: "darcloud-referral" });
    }
    if (url.pathname !== "/") return json({ error: "Not found" }, 404);
    return new Response(request.method === "HEAD" ? null : PAGE, {
      headers: { "content-type": "text/html;charset=UTF-8", "cache-control": "public, max-age=300" },
    });
  },
};
