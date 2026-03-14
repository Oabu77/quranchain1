// DarEdu — DarCloud Empire Landing Page (Cloudflare Worker)
var src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    if (url.pathname === "/health") return new Response(JSON.stringify({ status: "healthy", service: "DarEdu", platform: "Cloudflare Workers" }), { headers: { "Content-Type": "application/json" } });
    return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DarEdu | Islamic Education & E-Learning | DarCloud Empire</title>
<meta name="description" content="World-class Islamic education platform with Quran studies, Arabic language, and modern skills training.">
<style>
:root{--bg:#07090f;--s1:#0d1117;--s2:#161b22;--bdr:#21262d;--cyan:#00d4ff;--emerald:#10b981;--gold:#f59e0b;--txt:#e6edf3;--muted:#8b949e}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:var(--bg);color:var(--txt);line-height:1.6}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
.nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;border-bottom:1px solid var(--bdr);background:var(--s1)}
.nav-brand{font-size:1.3rem;font-weight:700;background:linear-gradient(135deg,var(--cyan),var(--emerald));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links a{margin-left:1.5rem;color:var(--muted);font-size:.9rem}.nav-links a:hover{color:var(--cyan)}
.hero{text-align:center;padding:5rem 2rem 3rem;background:linear-gradient(180deg,var(--s1) 0%,var(--bg) 100%)}
.hero h1{font-size:2.8rem;font-weight:800;margin-bottom:1rem}.hero h1 span{background:linear-gradient(135deg,var(--cyan),var(--emerald));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:var(--muted);font-size:1.15rem;max-width:700px;margin:0 auto 2rem}
.btn{display:inline-block;padding:.75rem 2rem;border-radius:12px;font-weight:600;font-size:1rem;transition:all .3s;cursor:pointer;border:none}
.btn-primary{background:linear-gradient(135deg,var(--emerald),var(--cyan));color:#000}.btn-primary:hover{opacity:.9;transform:translateY(-2px)}
.btn-outline{border:1px solid var(--bdr);color:var(--muted);background:transparent}.btn-outline:hover{border-color:var(--cyan);color:var(--cyan)}
.hero-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;padding:3rem 2rem;max-width:1200px;margin:0 auto}
.card{background:var(--s1);border:1px solid var(--bdr);border-radius:16px;padding:2rem;transition:all .3s}.card:hover{border-color:var(--cyan);transform:translateY(-4px)}
.card h3{font-size:1.2rem;margin-bottom:.5rem}.card p{color:var(--muted);font-size:.9rem}
.card .icon{font-size:2rem;margin-bottom:1rem}
.section{padding:3rem 2rem;max-width:1200px;margin:0 auto}.section h2{font-size:2rem;text-align:center;margin-bottom:.5rem}.section .sub{text-align:center;color:var(--muted);margin-bottom:2rem}
.stats{display:flex;justify-content:center;gap:3rem;flex-wrap:wrap;padding:2rem}.stat{text-align:center}.stat .val{font-size:2.5rem;font-weight:800;color:var(--cyan)}.stat .label{color:var(--muted);font-size:.85rem}
.pricing{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;padding:2rem;max-width:900px;margin:0 auto}
.price-card{background:var(--s1);border:1px solid var(--bdr);border-radius:16px;padding:2rem;text-align:center}
.price-card.featured{border-color:var(--gold)}.price-card h3{margin-bottom:.5rem}.price-card .amount{font-size:2.5rem;font-weight:800;margin:1rem 0}.price-card .amount span{font-size:.9rem;color:var(--muted);font-weight:400}
.price-card ul{list-style:none;text-align:left;margin:1rem 0}.price-card li{padding:.3rem 0;font-size:.9rem;color:var(--muted)}.price-card li::before{content:"\u2713 ";color:var(--emerald)}
footer{text-align:center;padding:2rem;border-top:1px solid var(--bdr);color:var(--muted);font-size:.8rem;margin-top:3rem}
footer a{color:var(--muted);margin:0 .5rem}
</style>
</head><body>
<nav class="nav"><a href="/" class="nav-brand">\u2601\uFE0F u</a><div class="nav-links"><a href="https://darcloud.host">DarCloud</a><a href="https://darcloud.net">Pricing</a><a href="https://ai.darcloud.host">AI</a><a href="https://mesh.darcloud.host">Mesh</a><a href="https://api.darcloud.host/api">API</a><a href="https://discord.gg/darcloud" target="_blank" rel="noopener">Discord</a><a href="https://darcloud.host/login">Sign In</a><a href="https://darcloud.host/checkout/pro" style="background:linear-gradient(135deg,var(--emerald),var(--cyan));color:#000;padding:.4rem 1rem;border-radius:8px;font-weight:600">Get Started</a></div></nav>
<section class="hero">
  <p style="color:#a855f7;font-weight:600;margin-bottom:.5rem">Islamic Education & E-Learning</p>
  <h1><span>DarEdu</span></h1>
  <p>World-class Islamic education platform with Quran studies, Arabic language, and modern skills training.</p>
  <div class="hero-btns">
    <a class="btn btn-primary" href="https://darcloud.host/checkout/pro">Get Started</a>
    <a class="btn btn-outline" href="https://darcloud.host">Back to DarCloud</a>
  </div>
</section>
<div class="stats"><div class="stat"><div class="val">1000+</div><div class="label">Courses</div></div><div class="stat"><div class="val">50+</div><div class="label">Languages</div></div><div class="stat"><div class="val">AI</div><div class="label">Tutoring</div></div><div class="stat"><div class="val">Certified</div><div class="label">Programs</div></div></div>
<section class="section">
  <h2>Features</h2>
  <p class="sub">Everything you need, built on Islamic principles</p>
  <div class="grid"><div class="card"><div class="icon">\uD83D\uDCD6</div><h3>Quran Academy</h3><p>Interactive Quran learning with tajweed, memorization tools, and certified instructors</p></div><div class="card"><div class="icon">\uD83D\uDD4B</div><h3>Arabic Mastery</h3><p>Modern Standard & Classical Arabic courses from beginner to advanced</p></div><div class="card"><div class="icon">\uD83C\uDF93</div><h3>Skills Training</h3><p>Tech, business, and entrepreneurship courses aligned with Islamic values</p></div><div class="card"><div class="icon">\uD83E\uDD16</div><h3>AI Tutor</h3><p>Personalized AI tutoring that adapts to your learning pace and style</p></div><div class="card"><div class="icon">\uD83D\uDC68\u200D\uD83D\uDCBB</div><h3>Live Classes</h3><p>Live virtual classrooms with scholars and industry professionals</p></div><div class="card"><div class="icon">\uD83C\uDFC6</div><h3>Certifications</h3><p>Accredited certificates recognized by Islamic universities and employers</p></div></div>
</section>
<section class="section">
  <h2>Pricing</h2>
  <p class="sub">Transparent, Shariah-compliant pricing</p>
  <div class="pricing"><div class="price-card"><h3>Learner</h3><div class="amount">Free</div><ul><li>Basic Quran courses</li><li>Community forums</li><li>Mobile app</li></ul><a class="btn btn-primary" href="https://darcloud.host/checkout/pro" style="display:block;margin-top:1rem">Get Started</a></div><div class="price-card featured"><h3>Scholar</h3><div class="amount">$19<span>/mo</span></div><ul><li>All courses</li><li>AI tutor</li><li>Certificates</li><li>Live classes</li></ul><a class="btn btn-primary" href="https://darcloud.host/checkout/pro" style="display:block;margin-top:1rem">Subscribe</a></div><div class="price-card"><h3>Institution</h3><div class="amount">$299<span>/mo</span></div><ul><li>LMS platform</li><li>Custom courses</li><li>Analytics</li><li>API access</li></ul><a class="btn btn-primary" href="https://darcloud.host/checkout/pro" style="display:block;margin-top:1rem">Subscribe</a></div></div>
</section>
<footer><div style="max-width:1000px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;gap:1.5rem;padding:1rem 0;text-align:left;font-size:.8rem"><div><strong style="color:var(--txt)">Platform</strong><br><a href="https://darcloud.host">Home</a> \u00B7 <a href="https://darcloud.host/dashboard">Dashboard</a> \u00B7 <a href="https://darcloud.host/docs">API Docs</a> \u00B7 <a href="https://darcloud.net">Pricing</a></div><div><strong style="color:var(--txt)">Ecosystem</strong><br><a href="https://ai.darcloud.host">AI Fleet</a> \u00B7 <a href="https://mesh.darcloud.host">FungiMesh</a> \u00B7 <a href="https://blockchain.darcloud.host">Blockchain</a> \u00B7 <a href="https://enterprise.darcloud.host">Enterprise</a></div><div><strong style="color:var(--txt)">Community</strong><br><a href="https://discord.gg/darcloud" target="_blank" rel="noopener">Discord</a> \u00B7 <a href="https://halalwealthclub.darcloud.host">HWC</a> \u00B7 <a href="https://realestate.darcloud.host">Real Estate</a></div><div><strong style="color:var(--txt)">Legal</strong><br><a href="https://darcloud.host/privacy">Privacy</a> \u00B7 <a href="https://darcloud.host/terms">Terms</a></div></div><p style="margin-top:1rem">\u00A9 2026 DarCloud Empire. All rights reserved.</p><p style="margin-top:.3rem;font-size:.75rem">Shariah-Compliant \u00B7 Zero-Riba \u00B7 Revenue Split: 30/40/10/18/2 \u00B7 \u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650</p></footer>
</body></html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
export { src_default as default };
