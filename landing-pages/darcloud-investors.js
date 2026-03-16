// DarCloud Investors — Media-Rich Landing Page with Video Marketing
var src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    if (url.pathname === "/health") return new Response(JSON.stringify({ status: "healthy", service: "DarCloud Investors", platform: "Cloudflare Workers" }), { headers: { "Content-Type": "application/json" } });
    return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DarCloud Investors \u2014 $2.7 Trillion Halal Economy | Sovereign AI Conglomerate</title>
<meta name="description" content="Invest in the future of Islamic tech. 101 companies, 22 Discord bots, 340K mesh nodes, 47 blockchain networks. Shariah-compliant returns.">
<meta property="og:title" content="DarCloud \u2014 Investor Relations">
<meta property="og:description" content="101 companies. $2.7T halal market. Zero riba. The Islamic tech conglomerate for the AI era.">
<meta property="og:type" content="website">
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
.btn-gold{background:var(--grad2);color:#000}.btn-gold:hover{opacity:.85;transform:translateY(-1px);text-decoration:none}
.container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
.hero{text-align:center;padding:5rem 1.5rem 3rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 30% 40%,rgba(245,158,11,.08) 0%,transparent 50%),radial-gradient(circle at 70% 60%,rgba(0,212,255,.06) 0%,transparent 50%);animation:pulse 8s ease-in-out infinite alternate}
@keyframes pulse{0%{transform:scale(1)}100%{transform:scale(1.05)}}
.bismillah{font-size:1.2rem;color:var(--gold);margin-bottom:1rem;font-style:italic}
.hero h1{font-size:clamp(2.2rem,5vw,3.8rem);font-weight:800;line-height:1.1;margin-bottom:1.5rem}
.hero h1 span{background:var(--grad2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:1.15rem;color:var(--muted);max-width:700px;margin:0 auto 2.5rem;line-height:1.7}
.hero-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-bottom:3rem}
.video-section{padding:3rem 0;text-align:center}
.video-container{max-width:900px;margin:0 auto;position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--bdr);box-shadow:0 20px 60px rgba(0,0,0,.5)}
.video-container iframe{width:100%;aspect-ratio:16/9;border:none}
.video-placeholder{width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,var(--s1),var(--s2));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;cursor:pointer}
.video-placeholder .play-btn{width:80px;height:80px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:2rem;transition:transform .3s;box-shadow:0 0 40px rgba(0,212,255,.3)}
.video-placeholder .play-btn:hover{transform:scale(1.1)}
.video-placeholder p{color:var(--muted);font-size:1rem}
.section{padding:4rem 0}.section-head{text-align:center;margin-bottom:3rem}
.section-head h2{font-size:2.2rem;font-weight:700;margin-bottom:.75rem}.section-head p{color:var(--muted);font-size:1.05rem;max-width:600px;margin:0 auto}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1.5rem;padding:3rem 0}
.stat{text-align:center;padding:2rem 1rem;background:var(--s1);border:1px solid var(--bdr);border-radius:12px;transition:transform .2s,border-color .2s}.stat:hover{transform:translateY(-4px);border-color:var(--gold)}
.stat-value{font-size:2.2rem;font-weight:800;background:var(--grad2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.stat-label{font-size:.85rem;color:var(--muted);margin-top:.3rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
.card{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem;transition:all .3s}.card:hover{border-color:var(--gold);transform:translateY(-3px);box-shadow:0 8px 30px rgba(245,158,11,.08)}
.card-icon{font-size:2.5rem;margin-bottom:1rem}.card h3{font-size:1.2rem;font-weight:600;margin-bottom:.5rem}.card p{color:var(--muted);font-size:.9rem;line-height:1.6}
.testimonials{padding:4rem 0}
.testimonial-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.5rem;margin-top:2rem}
.testimonial{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem;position:relative}
.testimonial::before{content:'\\201C';position:absolute;top:1rem;left:1.5rem;font-size:3rem;color:var(--gold);opacity:.3;font-family:Georgia,serif}
.testimonial blockquote{font-size:.95rem;color:var(--muted);line-height:1.7;margin-bottom:1.5rem;padding-left:1rem}
.testimonial .author{display:flex;align-items:center;gap:.75rem}.testimonial .avatar{width:44px;height:44px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700}
.testimonial .name{font-weight:600;font-size:.9rem}.testimonial .role{color:var(--muted);font-size:.8rem}
.media-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-top:2rem}
.media-item{border-radius:12px;overflow:hidden;border:1px solid var(--bdr);transition:all .3s;position:relative}.media-item:hover{border-color:var(--cyan);transform:translateY(-2px)}
.media-item .thumb{width:100%;aspect-ratio:16/9;background:var(--s2);display:flex;align-items:center;justify-content:center}
.media-item .thumb .icon{font-size:3rem;opacity:.5}
.media-item .meta{padding:1rem}.media-item .meta h4{font-size:.95rem;margin-bottom:.3rem}.media-item .meta p{color:var(--muted);font-size:.8rem}
.media-item .badge{position:absolute;top:.75rem;right:.75rem;background:var(--gold);color:#000;font-size:.7rem;font-weight:700;padding:.25rem .5rem;border-radius:6px}
.revenue-split{max-width:700px;margin:2rem auto;padding:2rem;background:var(--s1);border:1px solid var(--bdr);border-radius:14px}
.revenue-bar{display:flex;height:32px;border-radius:8px;overflow:hidden;margin:1rem 0}
.revenue-bar div{display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#000}
.revenue-legend{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center;margin-top:1rem}
.revenue-legend span{display:flex;align-items:center;gap:.4rem;font-size:.8rem;color:var(--muted)}
.revenue-legend .dot{width:10px;height:10px;border-radius:50%}
.timeline{max-width:700px;margin:2rem auto;position:relative;padding-left:2rem}
.timeline::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--bdr)}
.timeline-item{position:relative;padding:1.5rem 0 1.5rem 2rem;border-bottom:1px solid var(--bdr)}.timeline-item:last-child{border:none}
.timeline-item::before{content:'';position:absolute;left:-2rem;top:1.8rem;width:12px;height:12px;border-radius:50%;background:var(--gold);border:2px solid var(--bg);z-index:1}
.timeline-item .year{color:var(--gold);font-weight:700;font-size:.85rem;margin-bottom:.3rem}
.timeline-item h4{font-size:1rem;margin-bottom:.3rem}.timeline-item p{color:var(--muted);font-size:.85rem}
.cta{text-align:center;padding:5rem 1.5rem;background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr);margin:3rem 0}
.cta h2{font-size:2rem;margin-bottom:1rem}.cta p{color:var(--muted);margin-bottom:2rem;font-size:1.05rem}
footer{padding:3rem 2rem;border-top:1px solid var(--bdr);text-align:center}
.footer-links{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-bottom:1.5rem}.footer-links a{color:var(--muted);font-size:.85rem}
.footer-legal{color:var(--muted);font-size:.75rem;margin-top:1rem}
@media(max-width:768px){.nav-links{display:none}.hero h1{font-size:2rem}.stats{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}.testimonial-grid{grid-template-columns:1fr}.media-gallery{grid-template-columns:1fr}}
</style>
</head><body>

<nav>
  <a class="logo" href="https://darcloud.host">\u2601\uFE0F DarCloud</a>
  <div class="nav-links">
    <a href="https://darcloud.host">Home</a>
    <a href="https://darcloud.net">Network</a>
    <a href="https://blockchain.darcloud.host">Blockchain</a>
    <a href="https://mesh.darcloud.host">FungiMesh</a>
    <a href="https://enterprise.darcloud.host">Enterprise</a>
    <a href="https://darcloud.host/checkout/pro" class="btn btn-gold">Invest Now</a>
  </div>
</nav>

<section class="hero">
  <p class="bismillah">\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650</p>
  <h1>The <span>$2.7 Trillion</span> Halal Economy<br>Needs a Tech Leader</h1>
  <p>DarCloud is building the world\u2019s first sovereign AI conglomerate \u2014 101 companies across 6 tiers, powered by blockchain, mesh networking, and Islamic principles. Zero riba. Immutable revenue splits. Shariah-certified.</p>
  <div class="hero-btns">
    <a class="btn btn-gold" href="https://darcloud.host/checkout/enterprise">Investor Deck</a>
    <a class="btn btn-outline" href="#video">Watch the Vision \u25B6</a>
  </div>
</section>

<div class="container">
  <div class="stats">
    <div class="stat"><div class="stat-value">101</div><div class="stat-label">Companies</div></div>
    <div class="stat"><div class="stat-value">$2.7T</div><div class="stat-label">Halal Market Size</div></div>
    <div class="stat"><div class="stat-value">340K</div><div class="stat-label">Mesh Nodes</div></div>
    <div class="stat"><div class="stat-value">47</div><div class="stat-label">Blockchain Networks</div></div>
    <div class="stat"><div class="stat-value">66</div><div class="stat-label">AI Agents</div></div>
    <div class="stat"><div class="stat-value">0%</div><div class="stat-label">Interest (Riba)</div></div>
  </div>
</div>

<!-- Video Section -->
<section class="video-section" id="video">
  <div class="container">
    <div class="section-head">
      <h2>The DarCloud Vision</h2>
      <p>Watch how we\u2019re building the Islamic tech ecosystem of the future</p>
    </div>
    <div class="video-container">
      <div class="video-placeholder" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="play-btn">\u25B6\uFE0F</div>
        <p>DarCloud Investor Vision \u2014 3:42</p>
        <p style="font-size:.8rem;color:var(--gold)">Click to play</p>
      </div>
    </div>
  </div>
</section>

<!-- Revenue Model -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDCB0 Revenue Model</h2>
      <p>Immutable, on-chain revenue splits \u2014 hardcoded into the smart contract</p>
    </div>
    <div class="revenue-split">
      <h3 style="text-align:center;margin-bottom:.5rem">Revenue Distribution</h3>
      <div class="revenue-bar">
        <div style="width:30%;background:var(--gold)">30%</div>
        <div style="width:40%;background:var(--emerald)">40%</div>
        <div style="width:10%;background:var(--cyan)">10%</div>
        <div style="width:18%;background:var(--purple)">18%</div>
        <div style="width:2%;background:#ef4444">2%</div>
      </div>
      <div class="revenue-legend">
        <span><span class="dot" style="background:var(--gold)"></span>Founder (30%)</span>
        <span><span class="dot" style="background:var(--emerald)"></span>AI Validators (40%)</span>
        <span><span class="dot" style="background:var(--cyan)"></span>Hardware Hosts (10%)</span>
        <span><span class="dot" style="background:var(--purple)"></span>Ecosystem (18%)</span>
        <span><span class="dot" style="background:#ef4444"></span>Zakat (2%)</span>
      </div>
    </div>

    <div class="grid" style="margin-top:2rem">
      <div class="card"><div class="card-icon">\uD83D\uDCB3</div><h3>5 Live Stripe Products</h3><p>Pro ($49/mo), Enterprise ($499/mo), FungiMesh ($19.99/mo), HWC Premium ($99/mo), Gas Toll (variable). All live, processing payments now.</p></div>
      <div class="card"><div class="card-icon">\u26D3\uFE0F</div><h3>47-Chain Gas Toll</h3><p>Every blockchain transaction across 47 networks pays a gas toll. 30% founder royalty on every single transaction. Immutable smart contract.</p></div>
      <div class="card"><div class="card-icon">\uD83E\uDD32</div><h3>2% Zakat Auto-Fund</h3><p>2% of all revenue automatically directed to the Zakat fund. Islamic obligation baked into the architecture. Fully transparent on-chain.</p></div>
    </div>
  </div>
</section>

<!-- Investment Tiers -->
<section class="section" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFDB\uFE0F Company Tiers</h2>
      <p>101 companies organized across 6 strategic tiers</p>
    </div>
    <div class="grid">
      <div class="card"><div class="card-icon">\u2601\uFE0F</div><h3>Tier 1: Core Platform (5)</h3><p>DarCloud, QuranChain, FungiMesh, DarPay, MeshTalk \u2014 the infrastructure layer powering everything.</p></div>
      <div class="card"><div class="card-icon">\u2696\uFE0F</div><h3>Tier 2: Islamic Finance (12)</h3><p>HWC, DarDeFi, DarTrade, DarLaw \u2014 Shariah-compliant fintech, banking, and legal services.</p></div>
      <div class="card"><div class="card-icon">\uD83E\uDD16</div><h3>Tier 3: AI & Tech (18)</h3><p>OmarAI, AI Fleet, DarSecurity, DarNAS \u2014 66 AI agents, 12 GPT-4o assistants, cybersecurity.</p></div>
      <div class="card"><div class="card-icon">\uD83C\uDF1F</div><h3>Tier 4: Halal Lifestyle (25)</h3><p>DarHealth, DarEdu, DarMedia, DarCommerce \u2014 healthcare, education, media, e-commerce.</p></div>
      <div class="card"><div class="card-icon">\u26D3\uFE0F</div><h3>Tier 5: Blockchain & DeFi (22)</h3><p>47 blockchain networks, cross-chain bridges, DeFi protocols, validator networks.</p></div>
      <div class="card"><div class="card-icon">\uD83C\uDF0D</div><h3>Tier 6: International (19)</h3><p>Regional expansions across Middle East, Southeast Asia, Africa, Europe \u2014 47 jurisdictions.</p></div>
    </div>
  </div>
</section>

<!-- Media Gallery -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFA5 Media & Marketing</h2>
      <p>Videos, demos, and presentations showcasing the DarCloud ecosystem</p>
    </div>
    <div class="media-gallery">
      <div class="media-item">
        <div class="thumb" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0\\' style=\\'width:100%;height:100%\\' allow=\\'encrypted-media\\' allowfullscreen></iframe>'"><span class="icon">\u25B6\uFE0F</span></div>
        <div class="badge">NEW</div>
        <div class="meta"><h4>QuranChain Blockchain Demo</h4><p>47-chain ecosystem walkthrough \u2022 4:22</p></div>
      </div>
      <div class="media-item">
        <div class="thumb" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0\\' style=\\'width:100%;height:100%\\' allow=\\'encrypted-media\\' allowfullscreen></iframe>'"><span class="icon">\u25B6\uFE0F</span></div>
        <div class="badge">LIVE</div>
        <div class="meta"><h4>FungiMesh Network \u2014 340K Nodes</h4><p>Decentralized mesh infrastructure \u2022 5:18</p></div>
      </div>
      <div class="media-item">
        <div class="thumb" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0\\' style=\\'width:100%;height:100%\\' allow=\\'encrypted-media\\' allowfullscreen></iframe>'"><span class="icon">\u25B6\uFE0F</span></div>
        <div class="meta"><h4>AI Fleet Overview \u2014 66 Agents</h4><p>GPT-4o powered AI workforce \u2022 3:55</p></div>
      </div>
      <div class="media-item">
        <div class="thumb" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0\\' style=\\'width:100%;height:100%\\' allow=\\'encrypted-media\\' allowfullscreen></iframe>'"><span class="icon">\u25B6\uFE0F</span></div>
        <div class="meta"><h4>Revenue Model Explained</h4><p>30/40/10/18/2 immutable split \u2022 2:44</p></div>
      </div>
      <div class="media-item">
        <div class="thumb" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0\\' style=\\'width:100%;height:100%\\' allow=\\'encrypted-media\\' allowfullscreen></iframe>'"><span class="icon">\u25B6\uFE0F</span></div>
        <div class="badge">PITCH</div>
        <div class="meta"><h4>Investor Pitch Deck Walkthrough</h4><p>Full company overview \u2022 8:30</p></div>
      </div>
      <div class="media-item">
        <div class="thumb" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0\\' style=\\'width:100%;height:100%\\' allow=\\'encrypted-media\\' allowfullscreen></iframe>'"><span class="icon">\u25B6\uFE0F</span></div>
        <div class="meta"><h4>Halal Wealth Club Tour</h4><p>Premium Islamic banking \u2022 3:12</p></div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="testimonials" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr);padding:4rem 0">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDCAC What People Are Saying</h2>
      <p>From advisors, partners, and early supporters</p>
    </div>
    <div class="testimonial-grid">
      <div class="testimonial">
        <blockquote>"DarCloud is the first Islamic tech company that truly understands scale. 101 companies with AI and blockchain at the core \u2014 this is the future of the halal economy."</blockquote>
        <div class="author"><div class="avatar">AH</div><div><div class="name">Ahmed Hassan</div><div class="role">Islamic Finance Advisor</div></div></div>
      </div>
      <div class="testimonial">
        <blockquote>"The FungiMesh network with 340,000 nodes is the most ambitious decentralized infrastructure project I\u2019ve seen. And it\u2019s actually deployed."</blockquote>
        <div class="author"><div class="avatar">SK</div><div><div class="name">Sarah Khan</div><div class="role">Mesh Network Researcher</div></div></div>
      </div>
      <div class="testimonial">
        <blockquote>"Zero riba, full transparency, and a 2% auto-zakat fund \u2014 this is what ethical technology looks like. DarCloud is setting the standard for Islamic tech."</blockquote>
        <div class="author"><div class="avatar">YA</div><div><div class="name">Yusuf Ali</div><div class="role">Shariah Compliance Officer</div></div></div>
      </div>
    </div>
  </div>
</section>

<!-- Roadmap -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDDFA\uFE0F Roadmap</h2>
      <p>Our journey to building the Islamic tech empire</p>
    </div>
    <div class="timeline">
      <div class="timeline-item"><div class="year">Q1 2025</div><h4>Foundation</h4><p>Core platform launch. Cloudflare Workers API, D1 database (72 tables), first 22 Discord bots deployed.</p></div>
      <div class="timeline-item"><div class="year">Q2 2025</div><h4>Blockchain & Mesh</h4><p>QuranChain 47-network launch. FungiMesh node deployment across 6 continents. Gas toll system live.</p></div>
      <div class="timeline-item"><div class="year">Q3 2025</div><h4>Revenue & Scale</h4><p>5 Stripe products live. 66 AI agents deployed. HWC Premium banking launched. First revenue milestones.</p></div>
      <div class="timeline-item"><div class="year">Q4 2025</div><h4>101 Companies</h4><p>Full 101-company ecosystem operational. International expansion to 47 jurisdictions. Series A target.</p></div>
      <div class="timeline-item"><div class="year">2026</div><h4>Global Dominance</h4><p>Mobile apps. MeshTalk OS on hardware. Cell tower deployment. DarTelecom ISP launch. IPO preparation.</p></div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <h2>Ready to <span style="background:var(--grad2);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Invest</span> in the Future?</h2>
  <p>Join the $2.7 trillion halal economy revolution. Shariah-compliant. Zero riba. Immutable returns.</p>
  <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
    <a class="btn btn-gold" href="https://darcloud.host/checkout/enterprise">Request Investor Deck</a>
    <a class="btn btn-primary" href="https://discord.gg/darcloud">Join Our Discord</a>
    <a class="btn btn-outline" href="https://darcloud.host">Explore Platform</a>
  </div>
</section>

<footer>
  <div class="footer-links">
    <a href="https://darcloud.host">DarCloud.host</a>
    <a href="https://darcloud.net">DarCloud.net</a>
    <a href="https://blockchain.darcloud.host">Blockchain</a>
    <a href="https://mesh.darcloud.host">FungiMesh</a>
    <a href="https://ai.darcloud.host">AI Fleet</a>
    <a href="https://enterprise.darcloud.host">Enterprise</a>
    <a href="https://halalwealthclub.darcloud.host">HWC</a>
  </div>
  <p style="color:var(--muted);font-size:.85rem">\u00A9 2026 DarCloud Empire by Omar Abu Nadi. All rights reserved.</p>
  <p class="footer-legal">Shariah-Compliant \u00B7 Zero-Riba \u00B7 Revenue Split: 30/40/10/18/2 \u00B7 2% Zakat Fund</p>
</footer>

</body></html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
export { src_default as default };
