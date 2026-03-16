// DarCloud About — Company Story, Team, and Mission
var src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    if (url.pathname === "/health") return new Response(JSON.stringify({ status: "healthy", service: "DarCloud About" }), { headers: { "Content-Type": "application/json" } });
    return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>About DarCloud \u2014 Building the Islamic Tech Empire</title>
<meta name="description" content="Meet the vision, mission, and founder behind DarCloud \u2014 the world's first sovereign AI conglomerate serving the $2.7T halal economy.">
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
.container{max-width:1000px;margin:0 auto;padding:0 1.5rem}
.hero{text-align:center;padding:5rem 1.5rem 3rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 50% 40%,rgba(139,92,246,.08) 0%,transparent 50%),radial-gradient(circle at 30% 70%,rgba(0,212,255,.05) 0%,transparent 50%);animation:pulse 8s ease-in-out infinite alternate}
@keyframes pulse{0%{transform:scale(1)}100%{transform:scale(1.05)}}
.bismillah{font-size:1.4rem;color:var(--gold);margin-bottom:1.5rem;font-style:italic}
.hero h1{font-size:clamp(2.2rem,5vw,3.5rem);font-weight:800;line-height:1.1;margin-bottom:1.5rem}
.hero h1 span{background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:1.15rem;color:var(--muted);max-width:700px;margin:0 auto;line-height:1.7}
.section{padding:4rem 0}.section-head{text-align:center;margin-bottom:2.5rem}
.section-head h2{font-size:2rem;font-weight:700;margin-bottom:.75rem}.section-head p{color:var(--muted);font-size:1.05rem;max-width:600px;margin:0 auto}
.story{max-width:800px;margin:0 auto}
.story p{color:var(--muted);font-size:1.05rem;line-height:1.8;margin-bottom:1.5rem}
.story .highlight{color:var(--txt);font-weight:500}
.story .gold{color:var(--gold)}
.video-embed{max-width:800px;margin:2rem auto;border-radius:16px;overflow:hidden;border:1px solid var(--bdr);box-shadow:0 20px 60px rgba(0,0,0,.5)}
.video-embed .placeholder{width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,rgba(139,92,246,.1),rgba(0,212,255,.1));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;cursor:pointer}
.video-embed .play{width:80px;height:80px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:0 0 40px rgba(0,212,255,.3);transition:transform .3s}
.video-embed .play:hover{transform:scale(1.1)}
.values{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:2rem}
.value-card{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem;text-align:center;transition:all .3s}
.value-card:hover{border-color:var(--purple);transform:translateY(-3px)}
.value-card .icon{font-size:2.5rem;margin-bottom:1rem}
.value-card h3{font-size:1.1rem;font-weight:600;margin-bottom:.5rem}
.value-card p{color:var(--muted);font-size:.9rem;line-height:1.6}
.founder{display:flex;gap:2.5rem;align-items:center;padding:3rem 0;flex-wrap:wrap}
.founder-avatar{width:200px;height:200px;border-radius:20px;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:5rem;flex-shrink:0;box-shadow:0 10px 40px rgba(0,212,255,.15)}
.founder-info h3{font-size:1.8rem;font-weight:700;margin-bottom:.5rem}
.founder-info .title{color:var(--gold);font-size:1rem;margin-bottom:1rem}
.founder-info p{color:var(--muted);font-size:.95rem;line-height:1.7;margin-bottom:1rem}
.founder-stats{display:flex;gap:1.5rem;flex-wrap:wrap;margin-top:1rem}
.founder-stat{text-align:center;padding:1rem;background:var(--s2);border:1px solid var(--bdr);border-radius:10px;min-width:100px}
.founder-stat .num{font-size:1.5rem;font-weight:800;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.founder-stat .label{font-size:.75rem;color:var(--muted);margin-top:.2rem}
.principles{background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr);padding:4rem 0}
.principle-list{max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem}
.principle{display:flex;gap:1rem;align-items:flex-start;padding:1.5rem;background:var(--bg);border:1px solid var(--bdr);border-radius:12px}
.principle .num{font-size:1.5rem;font-weight:800;background:var(--grad2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;min-width:2rem}
.principle h4{font-size:1rem;font-weight:600;margin-bottom:.3rem}
.principle p{color:var(--muted);font-size:.85rem;line-height:1.6}
.stack{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:2rem}
.stack-item{padding:1.5rem;background:var(--s1);border:1px solid var(--bdr);border-radius:12px;text-align:center;transition:all .2s}
.stack-item:hover{border-color:var(--cyan)}
.stack-item .icon{font-size:1.5rem;margin-bottom:.5rem}
.stack-item h4{font-size:.9rem;font-weight:600;margin-bottom:.2rem}
.stack-item p{color:var(--muted);font-size:.75rem}
.cta{text-align:center;padding:5rem 1.5rem}
.cta h2{font-size:2rem;margin-bottom:1rem}.cta p{color:var(--muted);margin-bottom:2rem;font-size:1.05rem}
footer{padding:3rem 2rem;border-top:1px solid var(--bdr);text-align:center}
.footer-links{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-bottom:1.5rem}.footer-links a{color:var(--muted);font-size:.85rem}
@media(max-width:768px){.nav-links{display:none}.hero h1{font-size:2rem}.founder{flex-direction:column;text-align:center}.founder-avatar{margin:0 auto}.values{grid-template-columns:1fr}.stack{grid-template-columns:repeat(2,1fr)}}
</style>
</head><body>

<nav>
  <a class="logo" href="https://darcloud.host">\u2601\uFE0F DarCloud</a>
  <div class="nav-links">
    <a href="https://darcloud.host">Home</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://demo.darcloud.host">Demo</a>
    <a href="https://enterprise.darcloud.host">Enterprise</a>
    <a href="https://darcloud.host/checkout/pro" class="btn btn-primary">Get Started</a>
  </div>
</nav>

<section class="hero">
  <p class="bismillah">\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650</p>
  <h1>Building the <span>Islamic Tech Empire</span></h1>
  <p>DarCloud is the world\u2019s first sovereign AI conglomerate \u2014 101 companies serving 2 billion Muslims through blockchain, mesh networking, and artificial intelligence. Every byte is halal. Every transaction is transparent. Every algorithm is ethical.</p>
</section>

<!-- Origin Story Video -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFAC Our Story</h2>
      <p>How one developer\u2019s vision became a 101-company empire</p>
    </div>
    <div class="video-embed">
      <div class="placeholder" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;aspect-ratio:16/9;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="play">\u25B6\uFE0F</div>
        <p style="color:var(--txt);font-size:1.1rem;font-weight:600">The DarCloud Origin Story \u2014 8:15</p>
        <p style="color:var(--muted);font-size:.85rem">From idea to 101 companies in one year</p>
      </div>
    </div>
  </div>
</section>

<!-- The Story -->
<section class="section" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)">
  <div class="container">
    <div class="story">
      <p><span class="highlight">DarCloud was born from a simple observation:</span> the $2.7 trillion halal economy had no tech leader. While the rest of the world had Apple, Google, and Amazon, the Muslim world relied on borrowed infrastructure that often conflicted with Islamic values.</p>
      <p>Founded by <span class="gold">Omar Abu Nadi</span>, DarCloud set out to build something unprecedented \u2014 not a single company, but an entire technological ecosystem. <span class="highlight">101 companies across 6 tiers</span>, each serving a specific need within the Islamic economy, all interconnected through shared infrastructure.</p>
      <p>The name <span class="gold">\u201CDar\u201D</span> means \u201Chouse\u201D or \u201Cabode\u201D in Arabic. DarCloud is the digital house for the ummah \u2014 a sovereign cloud where data stays halal, finance stays clean, and technology serves its people rather than exploiting them.</p>
      <p>Today, DarCloud operates <span class="highlight">22 Discord bots, 66 AI agents, 47 blockchain networks, and 340,000 mesh nodes</span> across 6 continents. The platform processes Shariah-compliant payments through Stripe, routes transactions through immutable smart contracts, and distributes revenue according to Islamic principles \u2014 including an automatic 2% Zakat fund.</p>
    </div>
  </div>
</section>

<!-- Founder -->
<section class="section">
  <div class="container">
    <div class="section-head"><h2>\uD83D\uDC64 Founder</h2></div>
    <div class="founder">
      <div class="founder-avatar">\uD83D\uDC68\u200D\uD83D\uDCBB</div>
      <div class="founder-info">
        <h3>Omar Abu Nadi</h3>
        <div class="title">Founder & CEO, DarCloud Empire</div>
        <p>Full-stack engineer, blockchain architect, and Islamic tech visionary. Built the entire DarCloud ecosystem from zero \u2014 every line of code, every smart contract, every AI agent. Believes technology should serve humanity\u2019s highest values.</p>
        <div class="founder-stats">
          <div class="founder-stat"><div class="num">101</div><div class="label">Companies</div></div>
          <div class="founder-stat"><div class="num">66</div><div class="label">AI Agents</div></div>
          <div class="founder-stat"><div class="num">47</div><div class="label">Chains</div></div>
          <div class="founder-stat"><div class="num">22</div><div class="label">Bots</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Core Values -->
<section class="section" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)">
  <div class="container">
    <div class="section-head">
      <h2>\u2728 Core Values</h2>
      <p>The principles that guide every decision at DarCloud</p>
    </div>
    <div class="values">
      <div class="value-card"><div class="icon">\uD83D\uDD4C</div><h3>Islamic First</h3><p>Every product, transaction, and algorithm is designed to comply with Shariah principles. Zero riba, full transparency, automatic Zakat.</p></div>
      <div class="value-card"><div class="icon">\uD83D\uDD12</div><h3>Sovereignty</h3><p>Your data belongs to you. DarCloud runs on decentralized mesh infrastructure so no single entity controls the network.</p></div>
      <div class="value-card"><div class="icon">\u26D3\uFE0F</div><h3>Immutability</h3><p>Revenue splits, smart contracts, and governance rules are hardcoded on-chain. No one can change them \u2014 not even the founder.</p></div>
      <div class="value-card"><div class="icon">\uD83E\uDD1D</div><h3>Fair Distribution</h3><p>30/40/10/18/2 revenue split: Founder, AI Validators, Hardware Hosts, Ecosystem, Zakat. Transparent and automatic.</p></div>
      <div class="value-card"><div class="icon">\uD83C\uDF0D</div><h3>Global Access</h3><p>DarCloud is built to serve 2 billion Muslims worldwide \u2014 from Jakarta to London, Cairo to Toronto. 47 jurisdictions covered.</p></div>
      <div class="value-card"><div class="icon">\uD83E\uDD16</div><h3>AI for Good</h3><p>66 AI agents that work for the community, not against it. Ethical AI with Islamic guardrails and Shariah compliance checks.</p></div>
    </div>
  </div>
</section>

<!-- Operating Principles -->
<section class="principles">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDCDC Operating Principles</h2>
      <p>The non-negotiable rules of the DarCloud Empire</p>
    </div>
    <div class="principle-list">
      <div class="principle"><div class="num">01</div><div><h4>No Riba, Ever</h4><p>Zero interest in all financial products. All lending follows murabaha (cost-plus) or musharakah (partnership) models.</p></div></div>
      <div class="principle"><div class="num">02</div><div><h4>On-Chain Transparency</h4><p>Every revenue transaction is recorded on the QuranChain blockchain. Anyone can verify the 30/40/10/18/2 split.</p></div></div>
      <div class="principle"><div class="num">03</div><div><h4>Automatic Zakat</h4><p>2% of all revenue is automatically routed to the Zakat fund. This is hardcoded in the smart contract \u2014 it cannot be disabled.</p></div></div>
      <div class="principle"><div class="num">04</div><div><h4>Privacy by Design</h4><p>No tracking, no surveillance, no data selling. User data is encrypted end-to-end and stored on sovereign infrastructure.</p></div></div>
      <div class="principle"><div class="num">05</div><div><h4>Open Economy</h4><p>Anyone can build on DarCloud. APIs are documented, mesh nodes are open, and the ecosystem welcomes builders.</p></div></div>
    </div>
  </div>
</section>

<!-- Tech Stack -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDEE0\uFE0F Tech Stack</h2>
      <p>Battle-tested infrastructure powering the empire</p>
    </div>
    <div class="stack">
      <div class="stack-item"><div class="icon">\u2601\uFE0F</div><h4>Cloudflare Workers</h4><p>Edge computing, CDN, D1 database</p></div>
      <div class="stack-item"><div class="icon">\u26D3\uFE0F</div><h4>QuranChain</h4><p>47-network blockchain ecosystem</p></div>
      <div class="stack-item"><div class="icon">\uD83C\uDF44</div><h4>FungiMesh</h4><p>340K decentralized mesh nodes</p></div>
      <div class="stack-item"><div class="icon">\uD83E\uDD16</div><h4>GPT-4o Fleet</h4><p>66 AI agents, 12 assistants</p></div>
      <div class="stack-item"><div class="icon">\uD83D\uDCB3</div><h4>Stripe</h4><p>5 live payment products</p></div>
      <div class="stack-item"><div class="icon">\uD83C\uDFAE</div><h4>Discord.js v14</h4><p>22 bots, real-time commands</p></div>
      <div class="stack-item"><div class="icon">\uD83D\uDDC3\uFE0F</div><h4>D1 Database</h4><p>72 tables, SQLite on edge</p></div>
      <div class="stack-item"><div class="icon">\uD83D\uDD12</div><h4>JWT + PBKDF2</h4><p>Zero-trust auth everywhere</p></div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta" style="background:var(--s1);border-top:1px solid var(--bdr)">
  <h2>Join the <span style="background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Movement</span></h2>
  <p>Be part of the world\u2019s first sovereign Islamic tech ecosystem.</p>
  <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
    <a class="btn btn-primary" href="https://darcloud.host/checkout/pro">Start Building</a>
    <a class="btn btn-outline" href="https://investors.darcloud.host">Investor Info</a>
    <a class="btn btn-outline" href="https://discord.gg/darcloud">Join Discord</a>
  </div>
</section>

<footer>
  <div class="footer-links">
    <a href="https://darcloud.host">Home</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://demo.darcloud.host">Demo</a>
    <a href="https://partners.darcloud.host">Partners</a>
  </div>
  <p style="color:var(--muted);font-size:.85rem">\u00A9 2026 DarCloud Empire by Omar Abu Nadi. All rights reserved.</p>
</footer>

</body></html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
export { src_default as default };
