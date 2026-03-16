// QuranChain Blockchain — Full Media Landing Page
var src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    if (url.pathname === "/health") return new Response(JSON.stringify({ status: "healthy", service: "QuranChain Landing" }), { headers: { "Content-Type": "application/json" } });
    return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>QuranChain\u2122 \u2014 47 Blockchain Networks | The Islamic Blockchain Ecosystem</title>
<meta name="description" content="QuranChain: 47 blockchain networks, immutable smart contracts, gas toll revenue, and 2% Zakat fund. The blockchain for the ummah.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u26D3\uFE0F</text></svg>">
<style>
:root{--bg:#07090f;--s1:#0d1117;--s2:#161b22;--bdr:#21262d;--cyan:#00d4ff;--emerald:#10b981;--gold:#f59e0b;--purple:#8b5cf6;--txt:#e6edf3;--muted:#8b949e;--grad1:linear-gradient(135deg,#10b981,#00d4ff);--grad2:linear-gradient(135deg,#f59e0b,#ef4444);--gradchain:linear-gradient(135deg,#10b981,#00d4ff,#8b5cf6)}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--txt);overflow-x:hidden}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
nav{position:sticky;top:0;z-index:100;background:rgba(7,9,15,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--bdr);padding:.75rem 2rem;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.4rem;font-weight:700;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:1.5rem;font-size:.9rem;align-items:center}.nav-links a{color:var(--muted);transition:color .2s}.nav-links a:hover{color:var(--emerald);text-decoration:none}
.btn{display:inline-block;padding:.6rem 1.5rem;border-radius:8px;font-weight:600;font-size:.9rem;transition:all .3s;cursor:pointer;border:none}
.btn-primary{background:var(--grad1);color:#000}.btn-primary:hover{opacity:.85;transform:translateY(-1px);text-decoration:none}
.btn-outline{border:1px solid var(--emerald);color:var(--emerald);background:transparent}.btn-outline:hover{background:rgba(16,185,129,.1);text-decoration:none}
.btn-gold{background:var(--grad2);color:#000}.btn-gold:hover{opacity:.85;transform:translateY(-1px);text-decoration:none}
.container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
.hero{text-align:center;padding:5rem 1.5rem 3rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 30% 40%,rgba(16,185,129,.1) 0%,transparent 50%),radial-gradient(circle at 70% 60%,rgba(0,212,255,.07) 0%,transparent 50%),radial-gradient(circle at 50% 80%,rgba(139,92,246,.05) 0%,transparent 50%);animation:pulse 8s ease-in-out infinite alternate}
@keyframes pulse{0%{transform:scale(1)}100%{transform:scale(1.05)}}
.bismillah{font-size:1.3rem;color:var(--gold);margin-bottom:1.5rem;font-style:italic}
.hero h1{font-size:clamp(2.2rem,5vw,3.8rem);font-weight:800;line-height:1.1;margin-bottom:1.5rem}
.hero h1 span{background:var(--gradchain);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:1.15rem;color:var(--muted);max-width:700px;margin:0 auto 2.5rem;line-height:1.7}
.hero-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-bottom:3rem}
.section{padding:4rem 0}.section-head{text-align:center;margin-bottom:3rem}
.section-head h2{font-size:2.2rem;font-weight:700;margin-bottom:.75rem}.section-head p{color:var(--muted);font-size:1.05rem;max-width:600px;margin:0 auto}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;padding:2rem 0}
.stat{text-align:center;padding:1.5rem 1rem;background:var(--s1);border:1px solid var(--bdr);border-radius:12px;transition:all .2s}.stat:hover{border-color:var(--emerald);transform:translateY(-3px)}
.stat-value{font-size:2rem;font-weight:800;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.stat-label{font-size:.8rem;color:var(--muted);margin-top:.3rem}
.video-section{padding:4rem 0;text-align:center}
.video-container{max-width:900px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid var(--bdr);box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 100px rgba(16,185,129,.05)}
.video-placeholder{width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(0,212,255,.08),rgba(139,92,246,.06));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;cursor:pointer;position:relative}
.video-placeholder::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at center,transparent 30%,rgba(7,9,15,.3) 100%)}
.play-btn{width:88px;height:88px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:2.2rem;box-shadow:0 0 50px rgba(16,185,129,.35);transition:transform .3s;z-index:1;animation:chainPulse 3s ease-in-out infinite alternate}
.play-btn:hover{transform:scale(1.12)}
@keyframes chainPulse{0%{box-shadow:0 0 30px rgba(16,185,129,.25)}100%{box-shadow:0 0 60px rgba(16,185,129,.45)}}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
.card{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem;transition:all .3s}.card:hover{border-color:var(--emerald);transform:translateY(-3px);box-shadow:0 8px 30px rgba(16,185,129,.08)}
.card-icon{font-size:2.5rem;margin-bottom:1rem}.card h3{font-size:1.2rem;font-weight:600;margin-bottom:.5rem}.card p{color:var(--muted);font-size:.9rem;line-height:1.6}
.chain-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.75rem;margin-top:2rem}
.chain{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:1rem .75rem;text-align:center;transition:all .2s;font-size:.8rem}
.chain:hover{border-color:var(--emerald);transform:translateY(-2px)}
.chain .icon{font-size:1.5rem;margin-bottom:.4rem;display:block}
.chain .name{font-weight:600;margin-bottom:.2rem;font-size:.75rem}
.chain .type{color:var(--muted);font-size:.65rem}
.revenue{max-width:700px;margin:2rem auto;background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem}
.revenue h3{text-align:center;margin-bottom:1rem}
.revenue-bar{display:flex;height:36px;border-radius:8px;overflow:hidden;margin:1rem 0}
.revenue-bar div{display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#000}
.revenue-legend{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;margin-top:1rem}
.revenue-legend span{display:flex;align-items:center;gap:.4rem;font-size:.8rem;color:var(--muted)}
.revenue-legend .dot{width:10px;height:10px;border-radius:50%}
.architecture{background:var(--s2);border:1px solid var(--bdr);border-radius:14px;padding:2rem;max-width:800px;margin:2rem auto;font-family:'Courier New',monospace}
.architecture h3{font-family:-apple-system,sans-serif;text-align:center;margin-bottom:1.5rem}
.arch-layer{display:flex;align-items:center;gap:1rem;padding:.75rem 1rem;border-bottom:1px solid var(--bdr)}
.arch-layer:last-child{border:none}
.arch-layer .label{color:var(--emerald);font-weight:700;min-width:120px;font-size:.8rem}
.arch-layer .desc{color:var(--muted);font-size:.8rem}
.media-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-top:2rem}
.media-item{border-radius:12px;overflow:hidden;border:1px solid var(--bdr);transition:all .3s;cursor:pointer}
.media-item:hover{border-color:var(--emerald);transform:translateY(-2px)}
.media-thumb{width:100%;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;position:relative}
.media-thumb .play{width:52px;height:52px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 0 20px rgba(16,185,129,.3)}
.media-thumb .dur{position:absolute;bottom:.5rem;right:.5rem;background:rgba(0,0,0,.7);padding:.15rem .4rem;border-radius:3px;font-size:.7rem}
.media-thumb .badge{position:absolute;top:.5rem;left:.5rem;background:var(--emerald);color:#000;font-size:.65rem;font-weight:700;padding:.2rem .4rem;border-radius:4px}
.media-meta{padding:1rem}.media-meta h4{font-size:.9rem;margin-bottom:.2rem}.media-meta p{color:var(--muted);font-size:.75rem}
.testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;margin-top:2rem}
.testimonial{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem;position:relative}
.testimonial::before{content:'\\201C';position:absolute;top:1rem;left:1.5rem;font-size:3rem;color:var(--emerald);opacity:.3;font-family:Georgia,serif}
.testimonial blockquote{color:var(--muted);font-size:.9rem;line-height:1.7;margin-bottom:1.5rem;padding-left:1rem}
.testimonial .author{display:flex;align-items:center;gap:.75rem}
.testimonial .avatar{width:40px;height:40px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:700;color:#000}
.testimonial .name{font-weight:600;font-size:.85rem}.testimonial .role{color:var(--muted);font-size:.75rem}
.cta{text-align:center;padding:5rem 1.5rem;background:var(--s1);border-top:1px solid var(--bdr)}
.cta h2{font-size:2rem;margin-bottom:1rem}.cta p{color:var(--muted);margin-bottom:2rem;font-size:1.05rem}
footer{padding:3rem 2rem;border-top:1px solid var(--bdr);text-align:center}
.footer-links{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-bottom:1.5rem}.footer-links a{color:var(--muted);font-size:.85rem}
@media(max-width:768px){.nav-links{display:none}.hero h1{font-size:2rem}.grid{grid-template-columns:1fr}.chain-grid{grid-template-columns:repeat(3,1fr)}.testimonials{grid-template-columns:1fr}.media-gallery{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}}
</style>
</head><body>

<nav>
  <a class="logo" href="https://darcloud.host">\u26D3\uFE0F QuranChain\u2122</a>
  <div class="nav-links">
    <a href="https://darcloud.host">DarCloud</a>
    <a href="https://mesh.darcloud.host">FungiMesh</a>
    <a href="https://defi.darcloud.host">DeFi</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://darcloud.host/checkout/pro" class="btn btn-primary">Start Building</a>
  </div>
</nav>

<section class="hero">
  <p class="bismillah">\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650</p>
  <h1><span>47 Blockchain Networks</span><br>One Islamic Ecosystem</h1>
  <p>QuranChain is the world\u2019s first Islamic blockchain ecosystem \u2014 47 interconnected networks with immutable smart contracts, automatic gas toll revenue, and a hardcoded 2% Zakat fund. Built for the ummah.</p>
  <div class="hero-btns">
    <a class="btn btn-primary" href="https://darcloud.host/checkout/pro">Deploy a Node</a>
    <a class="btn btn-outline" href="#explainer">Watch Explainer \u25B6</a>
    <a class="btn btn-gold" href="https://investors.darcloud.host">Investor Info</a>
  </div>
</section>

<!-- Stats -->
<div class="container">
  <div class="stats">
    <div class="stat"><div class="stat-value">47</div><div class="stat-label">Networks</div></div>
    <div class="stat"><div class="stat-value">340K</div><div class="stat-label">Validators</div></div>
    <div class="stat"><div class="stat-value">2%</div><div class="stat-label">Auto-Zakat</div></div>
    <div class="stat"><div class="stat-value">0%</div><div class="stat-label">Riba</div></div>
    <div class="stat"><div class="stat-value">\u221E</div><div class="stat-label">Immutable</div></div>
  </div>
</div>

<!-- Explainer Video -->
<section class="video-section" id="explainer">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFAC QuranChain Explained</h2>
      <p>Understand the 47-network ecosystem in 5 minutes</p>
    </div>
    <div class="video-container">
      <div class="video-placeholder" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;aspect-ratio:16/9;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="play-btn">\u25B6\uFE0F</div>
        <p style="color:var(--txt);font-size:1.1rem;font-weight:600;z-index:1">QuranChain: The Islamic Blockchain \u2014 5:30</p>
        <p style="color:var(--muted);font-size:.85rem;z-index:1">47 Networks \u2022 Gas Toll \u2022 Smart Contracts \u2022 Zakat</p>
      </div>
    </div>
  </div>
</section>

<!-- Core Features -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\u26A1 Core Features</h2>
      <p>What makes QuranChain different from every other blockchain</p>
    </div>
    <div class="grid">
      <div class="card"><div class="card-icon">\u26D3\uFE0F</div><h3>47 Interconnected Chains</h3><p>Not one chain but an entire ecosystem. 47 purpose-built networks for finance, identity, supply chain, governance, education, healthcare, and more.</p></div>
      <div class="card"><div class="card-icon">\u26FD</div><h3>Gas Toll Revenue</h3><p>Every transaction pays a gas toll. 30% to the founder, 40% to validators, 10% to hardware hosts, 18% to ecosystem, 2% to Zakat. Immutable split.</p></div>
      <div class="card"><div class="card-icon">\uD83E\uDD32</div><h3>2% Auto-Zakat</h3><p>2% of all gas revenue is automatically routed to the Zakat fund \u2014 hardcoded in the smart contract. Cannot be disabled or modified by anyone.</p></div>
      <div class="card"><div class="card-icon">\uD83D\uDD12</div><h3>Shariah Smart Contracts</h3><p>Contracts are reviewed by AI and human scholars for Shariah compliance. No riba, no gharar, no maysir. Islamic law baked into the protocol.</p></div>
      <div class="card"><div class="card-icon">\uD83C\uDF0D</div><h3>Cross-Chain Bridges</h3><p>Seamless asset transfer between all 47 chains. Atomic swaps, liquidity pools, and unified wallets across the entire ecosystem.</p></div>
      <div class="card"><div class="card-icon">\uD83C\uDF44</div><h3>Mesh Validation</h3><p>Validators run on FungiMesh\u2019s 340K node network. Truly decentralized consensus with no single points of failure.</p></div>
    </div>
  </div>
</section>

<!-- The 47 Chains -->
<section class="section" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDD17 The 47 Chains</h2>
      <p>Purpose-built networks serving every sector of the Islamic economy</p>
    </div>
    <div class="chain-grid">
      <div class="chain"><span class="icon">\uD83D\uDCB0</span><span class="name">QRC-Finance</span><span class="type">DeFi</span></div>
      <div class="chain"><span class="icon">\uD83D\uDCB3</span><span class="name">QRC-Pay</span><span class="type">Payments</span></div>
      <div class="chain"><span class="icon">\uD83C\uDFE6</span><span class="name">QRC-Bank</span><span class="type">Banking</span></div>
      <div class="chain"><span class="icon">\uD83D\uDCC8</span><span class="name">QRC-Trade</span><span class="type">Exchange</span></div>
      <div class="chain"><span class="icon">\uD83C\uDFE0</span><span class="name">QRC-Realty</span><span class="type">Property</span></div>
      <div class="chain"><span class="icon">\uD83C\uDF93</span><span class="name">QRC-Edu</span><span class="type">Education</span></div>
      <div class="chain"><span class="icon">\uD83C\uDFE5</span><span class="name">QRC-Health</span><span class="type">Healthcare</span></div>
      <div class="chain"><span class="icon">\u2696\uFE0F</span><span class="name">QRC-Law</span><span class="type">Legal</span></div>
      <div class="chain"><span class="icon">\uD83D\uDEE1\uFE0F</span><span class="name">QRC-Guard</span><span class="type">Security</span></div>
      <div class="chain"><span class="icon">\uD83D\uDCF1</span><span class="name">QRC-Telco</span><span class="type">Telecom</span></div>
      <div class="chain"><span class="icon">\u26A1</span><span class="name">QRC-Energy</span><span class="type">Energy</span></div>
      <div class="chain"><span class="icon">\uD83D\uDE9A</span><span class="name">QRC-Logix</span><span class="type">Transport</span></div>
      <div class="chain"><span class="icon">\uD83D\uDCF0</span><span class="name">QRC-Media</span><span class="type">Media</span></div>
      <div class="chain"><span class="icon">\uD83D\uDED2</span><span class="name">QRC-Souk</span><span class="type">Commerce</span></div>
      <div class="chain"><span class="icon">\uD83E\uDD16</span><span class="name">QRC-AI</span><span class="type">AI/ML</span></div>
      <div class="chain"><span class="icon">\uD83C\uDFAE</span><span class="name">QRC-Play</span><span class="type">Gaming</span></div>
      <div class="chain"><span class="icon">\uD83D\uDD11</span><span class="name">QRC-ID</span><span class="type">Identity</span></div>
      <div class="chain"><span class="icon">\uD83D\uDDC3\uFE0F</span><span class="name">QRC-Gov</span><span class="type">Governance</span></div>
      <div class="chain"><span class="icon">\uD83E\uDD32</span><span class="name">QRC-Zakat</span><span class="type">Charity</span></div>
      <div class="chain"><span class="icon">\uD83D\uDD4C</span><span class="name">QRC-Waqf</span><span class="type">Endowment</span></div>
      <div class="chain"><span class="icon">\uD83C\uDF44</span><span class="name">QRC-Mesh</span><span class="type">Network</span></div>
      <div class="chain"><span class="icon">\uD83D\uDCCA</span><span class="name">QRC-Data</span><span class="type">Analytics</span></div>
      <div class="chain"><span class="icon">\uD83C\uDF10</span><span class="name">QRC-DNS</span><span class="type">Naming</span></div>
      <div class="chain"><span class="icon">\uD83D\uDDC4\uFE0F</span><span class="name">QRC-Store</span><span class="type">Storage</span></div>
    </div>
    <p style="text-align:center;color:var(--muted);margin-top:1.5rem;font-size:.9rem">+ 23 more specialized chains for regional, industry-specific, and cross-border applications</p>
  </div>
</section>

<!-- Revenue Model -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDCB0 Gas Toll Revenue Model</h2>
      <p>Every transaction generates revenue, split immutably on-chain</p>
    </div>
    <div class="revenue">
      <h3>Immutable Revenue Split</h3>
      <div class="revenue-bar">
        <div style="width:30%;background:var(--gold)">30%</div>
        <div style="width:40%;background:var(--emerald)">40%</div>
        <div style="width:10%;background:var(--cyan)">10%</div>
        <div style="width:18%;background:var(--purple)">18%</div>
        <div style="width:2%;background:#ef4444">2%</div>
      </div>
      <div class="revenue-legend">
        <span><span class="dot" style="background:var(--gold)"></span>Founder (30%)</span>
        <span><span class="dot" style="background:var(--emerald)"></span>Validators (40%)</span>
        <span><span class="dot" style="background:var(--cyan)"></span>Hardware (10%)</span>
        <span><span class="dot" style="background:var(--purple)"></span>Ecosystem (18%)</span>
        <span><span class="dot" style="background:#ef4444"></span>Zakat (2%)</span>
      </div>
    </div>
  </div>
</section>

<!-- Architecture -->
<section class="section" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFD7\uFE0F Architecture</h2>
      <p>How QuranChain\u2019s layers work together</p>
    </div>
    <div class="architecture">
      <h3>Protocol Stack</h3>
      <div class="arch-layer"><span class="label">Layer 0</span><span class="desc">FungiMesh P2P Network \u2014 340K nodes, mycelium routing</span></div>
      <div class="arch-layer"><span class="label">Layer 1</span><span class="desc">QuranChain Consensus \u2014 Proof of Stake + Shariah validation</span></div>
      <div class="arch-layer"><span class="label">Layer 2</span><span class="desc">47 App Chains \u2014 Purpose-built networks for each sector</span></div>
      <div class="arch-layer"><span class="label">Bridges</span><span class="desc">Cross-chain bridges \u2014 Atomic swaps, liquidity routing</span></div>
      <div class="arch-layer"><span class="label">Smart Layer</span><span class="desc">Shariah Contracts \u2014 AI-audited, scholar-reviewed</span></div>
      <div class="arch-layer"><span class="label">Gas Toll</span><span class="desc">Revenue Engine \u2014 30/40/10/18/2 immutable split</span></div>
      <div class="arch-layer"><span class="label">API Layer</span><span class="desc">Cloudflare Workers \u2014 Edge API, D1 database, Stripe</span></div>
    </div>
  </div>
</section>

<!-- Video Gallery -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFA5 Deep Dives</h2>
      <p>Technical videos and community presentations</p>
    </div>
    <div class="media-gallery">
      <div class="media-item" onclick="this.querySelector('.media-thumb').innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="media-thumb" style="background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(0,212,255,.1))"><div class="play">\u25B6\uFE0F</div><span class="dur">7:20</span><span class="badge">TECH</span></div>
        <div class="media-meta"><h4>Consensus Mechanism Deep Dive</h4><p>Proof of Stake + Shariah validation explained</p></div>
      </div>
      <div class="media-item" onclick="this.querySelector('.media-thumb').innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="media-thumb" style="background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(239,68,68,.1))"><div class="play">\u25B6\uFE0F</div><span class="dur">4:15</span><span class="badge">FINANCE</span></div>
        <div class="media-meta"><h4>Gas Toll Revenue Model</h4><p>How every transaction generates halal income</p></div>
      </div>
      <div class="media-item" onclick="this.querySelector('.media-thumb').innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="media-thumb" style="background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(16,185,129,.1))"><div class="play">\u25B6\uFE0F</div><span class="dur">3:40</span><span class="badge">DEMO</span></div>
        <div class="media-meta"><h4>Cross-Chain Bridge Demo</h4><p>Live atomic swap between QRC-Finance and QRC-Pay</p></div>
      </div>
      <div class="media-item" onclick="this.querySelector('.media-thumb').innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="media-thumb" style="background:linear-gradient(135deg,rgba(0,212,255,.15),rgba(16,185,129,.1))"><div class="play">\u25B6\uFE0F</div><span class="dur">5:55</span></div>
        <div class="media-meta"><h4>Smart Contract Auditing with AI</h4><p>How AI + scholars verify Shariah compliance</p></div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="section" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDCAC Community Voices</h2>
    </div>
    <div class="testimonials">
      <div class="testimonial">
        <blockquote>"QuranChain is the first blockchain that takes Islamic values seriously. The auto-Zakat fund alone makes it revolutionary."</blockquote>
        <div class="author"><div class="avatar">AK</div><div><div class="name">Dr. Amina Khalil</div><div class="role">Islamic Finance Scholar</div></div></div>
      </div>
      <div class="testimonial">
        <blockquote>"47 purpose-built chains instead of one chain trying to do everything \u2014 that\u2019s the right architecture. Finally someone got it."</blockquote>
        <div class="author"><div class="avatar">RS</div><div><div class="name">Rashid Sheikh</div><div class="role">Blockchain Developer</div></div></div>
      </div>
      <div class="testimonial">
        <blockquote>"Running a validator node on FungiMesh is incredibly easy. Deployed in 2 minutes, earning gas toll revenue from day one."</blockquote>
        <div class="author"><div class="avatar">HL</div><div><div class="name">Hassan Lowe</div><div class="role">Node Operator</div></div></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <h2>Join the <span style="background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent">QuranChain</span> Ecosystem</h2>
  <p>Deploy a validator, build a dApp, or invest in the 47-chain Islamic blockchain ecosystem.</p>
  <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
    <a class="btn btn-primary" href="https://darcloud.host/checkout/pro">Deploy a Node</a>
    <a class="btn btn-gold" href="https://investors.darcloud.host">Investor Deck</a>
    <a class="btn btn-outline" href="https://discord.gg/darcloud">Join Discord</a>
  </div>
</section>

<footer>
  <div class="footer-links">
    <a href="https://darcloud.host">DarCloud</a>
    <a href="https://mesh.darcloud.host">FungiMesh</a>
    <a href="https://defi.darcloud.host">DeFi</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://about.darcloud.host">About</a>
  </div>
  <p style="color:var(--muted);font-size:.85rem">\u00A9 2026 QuranChain\u2122 by DarCloud Empire. All rights reserved.</p>
</footer>

</body></html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
export { src_default as default };
