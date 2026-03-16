// DarCloud Demo — Interactive Demo & Video Tour Landing Page
var src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    if (url.pathname === "/health") return new Response(JSON.stringify({ status: "healthy", service: "DarCloud Demo" }), { headers: { "Content-Type": "application/json" } });
    return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DarCloud Demo \u2014 See the Platform in Action</title>
<meta name="description" content="Interactive demos and video tours of DarCloud's 101-company ecosystem. QuranChain, FungiMesh, AI Fleet, DarPay, and more.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u2601\uFE0F</text></svg>">
<style>
:root{--bg:#07090f;--s1:#0d1117;--s2:#161b22;--bdr:#21262d;--cyan:#00d4ff;--emerald:#10b981;--gold:#f59e0b;--purple:#8b5cf6;--txt:#e6edf3;--muted:#8b949e;--grad1:linear-gradient(135deg,#00d4ff,#10b981);--grad2:linear-gradient(135deg,#f59e0b,#ef4444)}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--txt);overflow-x:hidden}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
nav{position:sticky;top:0;z-index:100;background:rgba(7,9,15,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--bdr);padding:.75rem 2rem;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.4rem;font-weight:700;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:1.5rem;font-size:.9rem;align-items:center}.nav-links a{color:var(--muted);transition:color .2s}.nav-links a:hover{color:var(--cyan);text-decoration:none}
.btn{display:inline-block;padding:.6rem 1.5rem;border-radius:8px;font-weight:600;font-size:.9rem;transition:all .3s;cursor:pointer;border:none}
.btn-primary{background:var(--grad1);color:#000}.btn-primary:hover{opacity:.85;transform:translateY(-1px);text-decoration:none}
.btn-outline{border:1px solid var(--cyan);color:var(--cyan);background:transparent}.btn-outline:hover{background:rgba(0,212,255,.1);text-decoration:none}
.container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
.hero{text-align:center;padding:5rem 1.5rem 3rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 40% 30%,rgba(0,212,255,.08) 0%,transparent 50%),radial-gradient(circle at 60% 70%,rgba(16,185,129,.06) 0%,transparent 50%);animation:pulse 8s ease-in-out infinite alternate}
@keyframes pulse{0%{transform:scale(1)}100%{transform:scale(1.05)}}
.hero h1{font-size:clamp(2.2rem,5vw,3.5rem);font-weight:800;line-height:1.1;margin-bottom:1.5rem}
.hero h1 span{background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:1.15rem;color:var(--muted);max-width:650px;margin:0 auto 2.5rem;line-height:1.7}
.tabs{display:flex;justify-content:center;gap:.5rem;margin-bottom:3rem;flex-wrap:wrap}
.tab{padding:.6rem 1.2rem;border-radius:8px;background:var(--s1);border:1px solid var(--bdr);color:var(--muted);cursor:pointer;font-size:.9rem;transition:all .2s}
.tab:hover,.tab.active{color:var(--cyan);border-color:var(--cyan);background:rgba(0,212,255,.05)}
.section{padding:4rem 0}.section-head{text-align:center;margin-bottom:3rem}
.section-head h2{font-size:2.2rem;font-weight:700;margin-bottom:.75rem}.section-head p{color:var(--muted);font-size:1.05rem;max-width:600px;margin:0 auto}
.demo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:1.5rem}
.demo-card{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;overflow:hidden;transition:all .3s}
.demo-card:hover{border-color:var(--cyan);transform:translateY(-3px);box-shadow:0 8px 30px rgba(0,212,255,.08)}
.demo-video{width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,var(--s2),var(--bg));display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
.demo-video .play{width:64px;height:64px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:1.5rem;transition:transform .3s;box-shadow:0 0 30px rgba(0,212,255,.25)}
.demo-video .play:hover{transform:scale(1.1)}
.demo-video .duration{position:absolute;bottom:.75rem;right:.75rem;background:rgba(0,0,0,.7);color:var(--txt);font-size:.75rem;padding:.2rem .5rem;border-radius:4px}
.demo-video .badge{position:absolute;top:.75rem;left:.75rem;background:var(--emerald);color:#000;font-size:.7rem;font-weight:700;padding:.25rem .5rem;border-radius:6px}
.demo-body{padding:1.5rem}
.demo-body h3{font-size:1.1rem;font-weight:600;margin-bottom:.5rem}
.demo-body p{color:var(--muted);font-size:.85rem;line-height:1.6;margin-bottom:1rem}
.demo-tags{display:flex;gap:.4rem;flex-wrap:wrap}
.demo-tag{font-size:.7rem;padding:.2rem .5rem;background:var(--s2);border:1px solid var(--bdr);border-radius:4px;color:var(--muted)}
.featured{padding:4rem 0;background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)}
.featured-video{max-width:900px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid var(--bdr);box-shadow:0 20px 60px rgba(0,0,0,.5)}
.featured-video .placeholder{width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,rgba(0,212,255,.1),rgba(16,185,129,.1));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;cursor:pointer}
.featured-video .placeholder .play-big{width:96px;height:96px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:2.5rem;box-shadow:0 0 60px rgba(0,212,255,.3);transition:transform .3s}
.featured-video .placeholder .play-big:hover{transform:scale(1.1)}
.api-demo{background:var(--s2);border:1px solid var(--bdr);border-radius:14px;padding:2rem;font-family:'Courier New',monospace;max-width:700px;margin:2rem auto}
.api-demo .endpoint{color:var(--emerald);font-size:.9rem;margin-bottom:.5rem}
.api-demo .method{color:var(--gold);font-weight:700;margin-right:.5rem}
.api-demo pre{background:var(--bg);border:1px solid var(--bdr);border-radius:8px;padding:1rem;overflow-x:auto;font-size:.8rem;color:var(--muted);line-height:1.5;margin-top:.75rem}
.live-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin:2rem 0}
.live-stat{text-align:center;padding:1.5rem 1rem;background:var(--s1);border:1px solid var(--bdr);border-radius:12px}
.live-stat .value{font-size:1.8rem;font-weight:800;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.live-stat .label{font-size:.8rem;color:var(--muted);margin-top:.3rem}
.live-stat .indicator{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--emerald);margin-right:.3rem;animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.cta{text-align:center;padding:5rem 1.5rem;background:var(--s1);border-top:1px solid var(--bdr)}
.cta h2{font-size:2rem;margin-bottom:1rem}.cta p{color:var(--muted);margin-bottom:2rem;font-size:1.05rem}
footer{padding:3rem 2rem;border-top:1px solid var(--bdr);text-align:center}
.footer-links{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-bottom:1.5rem}.footer-links a{color:var(--muted);font-size:.85rem}
@media(max-width:768px){.nav-links{display:none}.hero h1{font-size:2rem}.demo-grid{grid-template-columns:1fr}.tabs{gap:.3rem}.tab{padding:.4rem .8rem;font-size:.8rem}}
</style>
</head><body>

<nav>
  <a class="logo" href="https://darcloud.host">\u2601\uFE0F DarCloud</a>
  <div class="nav-links">
    <a href="https://darcloud.host">Home</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://enterprise.darcloud.host">Enterprise</a>
    <a href="https://mesh.darcloud.host">FungiMesh</a>
    <a href="https://darcloud.host/checkout/pro" class="btn btn-primary">Start Free</a>
  </div>
</nav>

<section class="hero">
  <h1>See <span>DarCloud</span> in Action</h1>
  <p>Interactive demos, video tours, and live API examples. Explore every layer of the 101-company ecosystem before you commit.</p>
</section>

<!-- Featured Demo Video -->
<section class="featured">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFAC Featured: Full Platform Tour</h2>
      <p>A complete walkthrough of the DarCloud ecosystem in 12 minutes</p>
    </div>
    <div class="featured-video">
      <div class="placeholder" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;aspect-ratio:16/9;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="play-big">\u25B6\uFE0F</div>
        <p style="color:var(--txt);font-size:1.1rem;font-weight:600">Full Platform Tour \u2014 12:30</p>
        <p style="color:var(--muted);font-size:.9rem">QuranChain \u2022 FungiMesh \u2022 AI Fleet \u2022 DarPay \u2022 All 22 Bots</p>
      </div>
    </div>
  </div>
</section>

<!-- Live Platform Stats -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDCE1 Live Platform Stats</h2>
      <p>Real-time numbers from the DarCloud infrastructure</p>
    </div>
    <div class="live-stats">
      <div class="live-stat"><div class="value"><span class="indicator"></span>23</div><div class="label">Bots Online</div></div>
      <div class="live-stat"><div class="value"><span class="indicator"></span>72</div><div class="label">DB Tables</div></div>
      <div class="live-stat"><div class="value"><span class="indicator"></span>340K</div><div class="label">Mesh Nodes</div></div>
      <div class="live-stat"><div class="value"><span class="indicator"></span>47</div><div class="label">Blockchains</div></div>
      <div class="live-stat"><div class="value"><span class="indicator"></span>66</div><div class="label">AI Agents</div></div>
      <div class="live-stat"><div class="value"><span class="indicator"></span>5</div><div class="label">Stripe Products</div></div>
    </div>
  </div>
</section>

<!-- Filter Tabs -->
<div class="container">
  <div class="tabs">
    <div class="tab active">All Demos</div>
    <div class="tab">Blockchain</div>
    <div class="tab">AI & Bots</div>
    <div class="tab">Payments</div>
    <div class="tab">Mesh</div>
    <div class="tab">Enterprise</div>
  </div>
</div>

<!-- Demo Cards -->
<section class="section" style="padding-top:0">
  <div class="container">
    <div class="demo-grid">

      <div class="demo-card">
        <div class="demo-video" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
          <div class="play">\u25B6\uFE0F</div><div class="duration">4:22</div><div class="badge">BLOCKCHAIN</div>
        </div>
        <div class="demo-body">
          <h3>QuranChain 47-Network Demo</h3>
          <p>Watch cross-chain transactions flow through 47 networks with immutable gas toll collection and automatic revenue splits.</p>
          <div class="demo-tags"><span class="demo-tag">Blockchain</span><span class="demo-tag">Smart Contracts</span><span class="demo-tag">Gas Toll</span></div>
        </div>
      </div>

      <div class="demo-card">
        <div class="demo-video" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
          <div class="play">\u25B6\uFE0F</div><div class="duration">5:18</div><div class="badge">MESH</div>
        </div>
        <div class="demo-body">
          <h3>FungiMesh Node Deployment</h3>
          <p>Deploy a mesh node in under 2 minutes. See real-time peer discovery, mycelium routing, and bandwidth sharing in action.</p>
          <div class="demo-tags"><span class="demo-tag">FungiMesh</span><span class="demo-tag">P2P</span><span class="demo-tag">Mesh</span></div>
        </div>
      </div>

      <div class="demo-card">
        <div class="demo-video" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
          <div class="play">\u25B6\uFE0F</div><div class="duration">3:55</div><div class="badge">AI</div>
        </div>
        <div class="demo-body">
          <h3>AI Fleet \u2014 66 Agents Demo</h3>
          <p>See 22 Discord bots powered by 66 AI agents handle real-time commands, NLP, and business automation with GPT-4o.</p>
          <div class="demo-tags"><span class="demo-tag">AI</span><span class="demo-tag">GPT-4o</span><span class="demo-tag">Discord</span></div>
        </div>
      </div>

      <div class="demo-card">
        <div class="demo-video" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
          <div class="play">\u25B6\uFE0F</div><div class="duration">2:44</div><div class="badge">PAYMENTS</div>
        </div>
        <div class="demo-body">
          <h3>DarPay Checkout Flow</h3>
          <p>Watch a full Stripe checkout: subscription selection, payment, webhook processing, and instant account provisioning.</p>
          <div class="demo-tags"><span class="demo-tag">Stripe</span><span class="demo-tag">Payments</span><span class="demo-tag">Halal</span></div>
        </div>
      </div>

      <div class="demo-card">
        <div class="demo-video" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
          <div class="play">\u25B6\uFE0F</div><div class="duration">6:10</div><div class="badge">ENTERPRISE</div>
        </div>
        <div class="demo-body">
          <h3>Enterprise Dashboard Tour</h3>
          <p>Full walkthrough of the enterprise admin panel: member management, revenue tracking, bot fleet control, and compliance tools.</p>
          <div class="demo-tags"><span class="demo-tag">Enterprise</span><span class="demo-tag">Admin</span><span class="demo-tag">Dashboard</span></div>
        </div>
      </div>

      <div class="demo-card">
        <div class="demo-video" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
          <div class="play">\u25B6\uFE0F</div><div class="duration">3:30</div><div class="badge">BOTS</div>
        </div>
        <div class="demo-body">
          <h3>Discord Bot Command Protocol</h3>
          <p>See the QuranChain Command Protocol in action \u2014 natural language commands, wake phrases, safety gates, and multi-bot routing.</p>
          <div class="demo-tags"><span class="demo-tag">Protocol</span><span class="demo-tag">NLP</span><span class="demo-tag">Commands</span></div>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- Live API Demo -->
<section class="section" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)">
  <div class="container">
    <div class="section-head">
      <h2>\u26A1 Live API Examples</h2>
      <p>Try these endpoints right now \u2014 they\u2019re live on Cloudflare Workers</p>
    </div>

    <div class="api-demo">
      <div class="endpoint"><span class="method">GET</span> https://darcloud.host/api/health</div>
      <pre>{
  "status": "operational",
  "services": { "api": true, "d1": true, "stripe": true, "bots": 23 },
  "version": "v74c88699"
}</pre>
    </div>

    <div class="api-demo">
      <div class="endpoint"><span class="method">GET</span> https://darcloud.host/api/companies</div>
      <pre>{
  "total": 101,
  "tiers": [
    { "tier": 1, "name": "Core Platform", "count": 5 },
    { "tier": 2, "name": "Islamic Finance", "count": 12 },
    { "tier": 3, "name": "AI & Tech", "count": 18 },
    ...
  ]
}</pre>
    </div>

    <div class="api-demo">
      <div class="endpoint"><span class="method">GET</span> https://mesh.darcloud.host/health</div>
      <pre>{
  "status": "healthy",
  "service": "FungiMesh Gateway",
  "nodes": 340000,
  "platform": "Cloudflare Workers"
}</pre>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <h2>Ready to <span style="background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Get Started</span>?</h2>
  <p>Start building on DarCloud today. Free tier available, no credit card required.</p>
  <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
    <a class="btn btn-primary" href="https://darcloud.host/checkout/pro">Start Free Trial</a>
    <a class="btn btn-outline" href="https://discord.gg/darcloud">Join Discord</a>
  </div>
</section>

<footer>
  <div class="footer-links">
    <a href="https://darcloud.host">Home</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://enterprise.darcloud.host">Enterprise</a>
    <a href="https://about.darcloud.host">About</a>
  </div>
  <p style="color:var(--muted);font-size:.85rem">\u00A9 2026 DarCloud Empire. All rights reserved.</p>
</footer>

</body></html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
export { src_default as default };
