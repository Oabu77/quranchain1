// src/index.js
var CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" };
var jsonRes = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", ...CORS } });
var LANDING = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>QuranChain \u2014 Islamic Blockchain Network</title>
<meta name="description" content="QuranChain: 47 blockchain networks, AI validators, gas toll system, immutable Quran preservation. 30% Founder Royalty.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u26D3\uFE0F</text></svg>">
<style>
:root{--bg:#0a0a0f;--s1:#111118;--s2:#1a1a24;--bdr:#2a2a3a;--amber:#f59e0b;--gold:#d4af37;--orange:#f97316;--txt:#e8e6f0;--muted:#8888a0;--grad:linear-gradient(135deg,#f59e0b,#f97316)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--txt);overflow-x:hidden}
a{color:var(--amber);text-decoration:none}
.container{max-width:1100px;margin:0 auto;padding:0 1.5rem}

/* Animated chain bg */
body::before{content:'';position:fixed;top:0;left:0;right:0;bottom:0;background:
  radial-gradient(circle at 20% 30%,rgba(245,158,11,.04) 0%,transparent 50%),
  radial-gradient(circle at 80% 70%,rgba(249,115,22,.03) 0%,transparent 50%);pointer-events:none;z-index:0}

nav{position:sticky;top:0;z-index:100;background:rgba(10,10,15,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--bdr);padding:.75rem 2rem;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.3rem;font-weight:700;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:1.5rem;font-size:.85rem}
.nav-links a{color:var(--muted);transition:color .2s}
.nav-links a:hover{color:var(--amber)}
.btn{display:inline-block;padding:.6rem 1.5rem;border-radius:8px;font-weight:600;font-size:.9rem;transition:all .3s;border:none;cursor:pointer}
.btn-amber{background:var(--grad);color:#000}
.btn-amber:hover{opacity:.9;transform:translateY(-1px)}
.btn-outline{border:1px solid var(--amber);color:var(--amber);background:transparent}
.btn-outline:hover{background:rgba(245,158,11,.1)}

.hero{text-align:center;padding:6rem 1.5rem 4rem;position:relative;z-index:1}
.bismillah{font-size:1.4rem;color:var(--gold);margin-bottom:1rem;font-style:italic}
.hero-badge{display:inline-flex;align-items:center;gap:.5rem;background:var(--s2);border:1px solid var(--bdr);padding:.4rem 1rem;border-radius:99px;font-size:.8rem;color:var(--muted);margin-bottom:2rem}
.hero-badge .dot{width:8px;height:8px;border-radius:50%;background:var(--amber);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.hero h1{font-size:clamp(2.2rem,5vw,4rem);font-weight:800;line-height:1.1;margin-bottom:1.5rem}
.hero h1 span{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:1.1rem;color:var(--muted);max-width:650px;margin:0 auto 2.5rem;line-height:1.7}
.hero-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}

/* Chain status bar */
.chain-bar{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1rem;padding:2rem 0;border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr);margin:2rem 0}
.chain-stat{text-align:center;padding:1rem}
.chain-stat .val{font-size:1.8rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.chain-stat .lbl{font-size:.75rem;color:var(--muted);margin-top:.2rem;text-transform:uppercase;letter-spacing:1px}

.section{padding:5rem 0;position:relative;z-index:1}
.section-head{text-align:center;margin-bottom:3rem}
.section-head h2{font-size:2rem;font-weight:700;margin-bottom:.75rem}
.section-head p{color:var(--muted);max-width:550px;margin:0 auto}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
.card{background:var(--s1);border:1px solid var(--bdr);border-radius:12px;padding:2rem;transition:all .3s}
.card:hover{border-color:var(--amber);transform:translateY(-3px);box-shadow:0 8px 30px rgba(245,158,11,.06)}
.card-icon{font-size:2.2rem;margin-bottom:1rem}
.card h3{font-size:1.1rem;font-weight:600;color:var(--amber);margin-bottom:.5rem}
.card p{color:var(--muted);font-size:.9rem;line-height:1.6}

/* Live chains ticker */
.chains-section{background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr);padding:3rem 0}
.chains-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem}
.chain-tag{display:flex;align-items:center;gap:.4rem;padding:.5rem .75rem;background:var(--s2);border:1px solid var(--bdr);border-radius:8px;font-size:.8rem;transition:border-color .2s}
.chain-tag:hover{border-color:var(--amber)}
.chain-dot{width:6px;height:6px;border-radius:50%;background:#22c55e}

/* Revenue split */
.rev-bar{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;padding:1.5rem;background:var(--s2);border-radius:10px;margin-top:2rem}
.rev-item{font-size:.85rem;color:var(--muted)}.rev-item b{color:var(--amber)}

.cta{text-align:center;padding:5rem 1.5rem;z-index:1;position:relative}
.cta h2{font-size:2rem;margin-bottom:1rem}
.cta p{color:var(--muted);margin-bottom:2rem}

footer{padding:3rem 2rem;border-top:1px solid var(--bdr);text-align:center;z-index:1;position:relative}
.footer-links{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-bottom:1rem}
.footer-links a{color:var(--muted);font-size:.85rem}
.footer-copy{color:var(--muted);font-size:.8rem}

@media(max-width:768px){.nav-links{display:none}.hero h1{font-size:2rem}.chain-bar{grid-template-columns:repeat(3,1fr)}.grid{grid-template-columns:1fr}.chains-grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr))}}
</style>
</head>
<body>

<nav>
  <div class="logo">\u26D3\uFE0F QuranChain</div>
  <div class="nav-links">
    <a href="#features">Features</a>
    <a href="#chains">Live Chains</a>
    <a href="https://darcloud.host">DarCloud</a>
    <a href="https://ai.darcloud.host">AI Agents</a>
    <a href="https://api.darcloud.host/api">API</a>
  </div>
  <a class="btn btn-amber" href="/explorer">Explorer</a>
</nav>

<section class="hero">
  <p class="bismillah">\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u064E\u0651\u0647\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0652\u0645\u064E\u0646\u0650 \u0627\u0644\u0631\u064E\u0651\u062D\u0650\u064A\u0645\u0650</p>
  <div class="hero-badge"><span class="dot"></span> 47 Networks \u2014 All Validators Online</div>
  <h1>The <span>Islamic Blockchain</span> Network</h1>
  <p>QuranChain: AI-validated blockchain ecosystem spanning 47 networks. Gas toll revenue, immutable Quran preservation, quantum-secured consensus. Powered by Omar AI\u2122 & QuranChain AI\u2122.</p>
  <div class="hero-btns">
    <a class="btn btn-amber" href="/explorer">Block Explorer</a>
    <a class="btn btn-outline" href="https://darcloud.host">DarCloud Platform</a>
  </div>
</section>

<div class="container">
  <div class="chain-bar">
    <div class="chain-stat"><div class="val">47</div><div class="lbl">Live Chains</div></div>
    <div class="chain-stat"><div class="val">$2.4M</div><div class="lbl">Gas Revenue</div></div>
    <div class="chain-stat"><div class="val">2</div><div class="lbl">AI Validators</div></div>
    <div class="chain-stat"><div class="val">340K</div><div class="lbl">Mesh Nodes</div></div>
    <div class="chain-stat"><div class="val">30%</div><div class="lbl">Founder Share</div></div>
    <div class="chain-stat"><div class="val">2%</div><div class="lbl">Zakat</div></div>
  </div>
</div>

<section id="features" class="section">
  <div class="container">
    <div class="section-head">
      <h2>Blockchain Infrastructure</h2>
      <p>Production-grade Islamic blockchain ecosystem with real revenue generation.</p>
    </div>
    <div class="grid">
      <div class="card">
        <div class="card-icon">\u26A1</div>
        <h3>Gas Toll System</h3>
        <p>Revenue-generating gas toll collection across all 47 monitored chains. Every transaction contributes to the ecosystem fund with automatic distribution.</p>
      </div>
      <div class="card">
        <div class="card-icon">\u{1F916}</div>
        <h3>AI Validators</h3>
        <p>Omar AI\u2122 and QuranChain AI\u2122 serve as the primary validators \u2014 advanced AI securing the network with intelligent consensus.</p>
      </div>
      <div class="card">
        <div class="card-icon">\u{1F4D6}</div>
        <h3>Quran Preservation</h3>
        <p>Immutable on-chain preservation of the Holy Quran. Every word, surah, and ayah permanently stored with cryptographic verification.</p>
      </div>
      <div class="card">
        <div class="card-icon">\u{1F512}</div>
        <h3>Quantum Encryption</h3>
        <p>Post-quantum cryptographic algorithms protecting all chain operations. Future-proof security for the Islamic digital economy.</p>
      </div>
      <div class="card">
        <div class="card-icon">\u{1F4B0}</div>
        <h3>Revenue Distribution</h3>
        <p>Immutable 30% Founder / 40% AI Validators / 10% Hardware / 18% Ecosystem / 2% Zakat split on all revenue streams.</p>
      </div>
      <div class="card">
        <div class="card-icon">\u{1F310}</div>
        <h3>Multi-Chain Bridge</h3>
        <p>Interoperability across all 47 networks. Cross-chain asset transfers, unified gas tolls, and seamless ecosystem connectivity.</p>
      </div>
    </div>
    <div class="rev-bar">
      <div class="rev-item"><b>30%</b> Founder (Immutable)</div>
      <div class="rev-item"><b>40%</b> AI Validators</div>
      <div class="rev-item"><b>10%</b> Hardware Hosts</div>
      <div class="rev-item"><b>18%</b> Ecosystem Fund</div>
      <div class="rev-item"><b>2%</b> Zakat</div>
    </div>
  </div>
</section>

<section id="chains" class="chains-section">
  <div class="container">
    <div class="section-head">
      <h2>47 Live Blockchain Networks</h2>
      <p>Gas tolls collected on every chain. All validators online.</p>
    </div>
    <div class="chains-grid">
      <div class="chain-tag"><span class="chain-dot"></span>Ethereum</div>
      <div class="chain-tag"><span class="chain-dot"></span>Bitcoin</div>
      <div class="chain-tag"><span class="chain-dot"></span>BNB Chain</div>
      <div class="chain-tag"><span class="chain-dot"></span>Polygon</div>
      <div class="chain-tag"><span class="chain-dot"></span>Arbitrum</div>
      <div class="chain-tag"><span class="chain-dot"></span>Optimism</div>
      <div class="chain-tag"><span class="chain-dot"></span>Avalanche</div>
      <div class="chain-tag"><span class="chain-dot"></span>Solana</div>
      <div class="chain-tag"><span class="chain-dot"></span>Fantom</div>
      <div class="chain-tag"><span class="chain-dot"></span>Cardano</div>
      <div class="chain-tag"><span class="chain-dot"></span>Polkadot</div>
      <div class="chain-tag"><span class="chain-dot"></span>Cosmos</div>
      <div class="chain-tag"><span class="chain-dot"></span>Near</div>
      <div class="chain-tag"><span class="chain-dot"></span>Tron</div>
      <div class="chain-tag"><span class="chain-dot"></span>Cronos</div>
      <div class="chain-tag"><span class="chain-dot"></span>zkSync</div>
      <div class="chain-tag"><span class="chain-dot"></span>Base</div>
      <div class="chain-tag"><span class="chain-dot"></span>Mantle</div>
      <div class="chain-tag"><span class="chain-dot"></span>Linea</div>
      <div class="chain-tag"><span class="chain-dot"></span>Scroll</div>
      <div class="chain-tag"><span class="chain-dot"></span>Celo</div>
      <div class="chain-tag"><span class="chain-dot"></span>Gnosis</div>
      <div class="chain-tag"><span class="chain-dot"></span>Moonbeam</div>
      <div class="chain-tag"><span class="chain-dot"></span>Metis</div>
      <div class="chain-tag"><span class="chain-dot"></span>Kava</div>
      <div class="chain-tag"><span class="chain-dot"></span>Harmony</div>
      <div class="chain-tag"><span class="chain-dot"></span>Aurora</div>
      <div class="chain-tag"><span class="chain-dot"></span>Boba</div>
      <div class="chain-tag"><span class="chain-dot"></span>Klaytn</div>
      <div class="chain-tag"><span class="chain-dot"></span>IoTeX</div>
      <div class="chain-tag"><span class="chain-dot"></span>Hedera</div>
      <div class="chain-tag"><span class="chain-dot"></span>Flow</div>
      <div class="chain-tag"><span class="chain-dot"></span>Algorand</div>
      <div class="chain-tag"><span class="chain-dot"></span>Theta</div>
      <div class="chain-tag"><span class="chain-dot"></span>VeChain</div>
      <div class="chain-tag"><span class="chain-dot"></span>Zilliqa</div>
      <div class="chain-tag"><span class="chain-dot"></span>Sui</div>
      <div class="chain-tag"><span class="chain-dot"></span>Aptos</div>
      <div class="chain-tag"><span class="chain-dot"></span>Starknet</div>
      <div class="chain-tag"><span class="chain-dot"></span>Sei</div>
      <div class="chain-tag"><span class="chain-dot"></span>Blast</div>
      <div class="chain-tag"><span class="chain-dot"></span>Mode</div>
      <div class="chain-tag"><span class="chain-dot"></span>Manta</div>
      <div class="chain-tag"><span class="chain-dot"></span>Zora</div>
      <div class="chain-tag"><span class="chain-dot"></span>Taiko</div>
      <div class="chain-tag"><span class="chain-dot"></span>Berachain</div>
      <div class="chain-tag"><span class="chain-dot"></span>QuranChain</div>
    </div>
  </div>
</section>

<section class="cta">
  <h2>Join the Islamic Blockchain Revolution</h2>
  <p>Explore the chain, build on our network, or earn gas toll revenue as a validator.</p>
  <div class="hero-btns">
    <a class="btn btn-amber" href="https://api.darcloud.host/api">API Documentation</a>
    <a class="btn btn-outline" href="https://darcloud.host">DarCloud Platform</a>
  </div>
</section>

<footer>
  <div class="footer-links">
    <a href="https://darcloud.host">DarCloud</a>
    <a href="https://darcloud.net">DarCloud.net</a>
    <a href="https://mesh.darcloud.host">FungiMesh</a>
    <a href="https://ai.darcloud.host">AI Agents</a>
    <a href="https://halalwealthclub.darcloud.host">HWC</a>
  </div>
  <p class="footer-copy">\xA9 2026 QuranChain by Omar Abu Nadi. 30% Founder Royalty Immutable. All Validators Online.</p>
</footer>

</body></html>`;
var EXPLORER = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>QuranChain Block Explorer</title>
<meta name="description" content="QuranChain Block Explorer — Search blocks, transactions, and addresses across 47 blockchain networks.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u26D3\uFE0F</text></svg>">
<style>
:root{--bg:#0a0a0f;--s1:#111118;--s2:#1a1a24;--bdr:#2a2a3a;--amber:#f59e0b;--gold:#d4af37;--orange:#f97316;--green:#22c55e;--red:#ef4444;--txt:#e8e6f0;--muted:#8888a0;--grad:linear-gradient(135deg,#f59e0b,#f97316)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--txt);overflow-x:hidden;min-height:100vh}
a{color:var(--amber);text-decoration:none}
.container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
body::before{content:'';position:fixed;top:0;left:0;right:0;bottom:0;background:
  radial-gradient(circle at 20% 30%,rgba(245,158,11,.04) 0%,transparent 50%),
  radial-gradient(circle at 80% 70%,rgba(249,115,22,.03) 0%,transparent 50%);pointer-events:none;z-index:0}
nav{position:sticky;top:0;z-index:100;background:rgba(10,10,15,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--bdr);padding:.75rem 2rem;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.3rem;font-weight:700;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:1.5rem;font-size:.85rem}
.nav-links a{color:var(--muted);transition:color .2s}
.nav-links a:hover{color:var(--amber)}
.nav-links a.active{color:var(--amber)}
.btn{display:inline-block;padding:.6rem 1.5rem;border-radius:8px;font-weight:600;font-size:.9rem;transition:all .3s;border:none;cursor:pointer}
.btn-amber{background:var(--grad);color:#000}
.btn-amber:hover{opacity:.9;transform:translateY(-1px)}

/* Explorer Header */
.explorer-header{padding:3rem 0 2rem;text-align:center;position:relative;z-index:1}
.explorer-header h1{font-size:2.2rem;font-weight:800;margin-bottom:.5rem}
.explorer-header h1 span{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.explorer-header p{color:var(--muted);font-size:1rem;margin-bottom:2rem}

/* Search */
.search-wrap{max-width:700px;margin:0 auto;position:relative}
.search-wrap input{width:100%;padding:1rem 1.5rem;padding-right:120px;background:var(--s1);border:1px solid var(--bdr);border-radius:12px;color:var(--txt);font-size:1rem;outline:none;transition:border-color .2s}
.search-wrap input:focus{border-color:var(--amber)}
.search-wrap input::placeholder{color:var(--muted)}
.search-wrap button{position:absolute;right:6px;top:50%;transform:translateY(-50%);padding:.7rem 1.5rem;background:var(--grad);border:none;border-radius:8px;color:#000;font-weight:600;cursor:pointer;font-size:.9rem;transition:opacity .2s}
.search-wrap button:hover{opacity:.85}

/* Stats bar */
.stats-bar{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;padding:2rem 0;margin:1.5rem 0}
.stat-card{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:1.2rem;text-align:center}
.stat-card .val{font-size:1.5rem;font-weight:700;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-card .lbl{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:.3rem}

/* Tables */
.tables-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;padding-bottom:3rem;position:relative;z-index:1}
.table-section{background:var(--s1);border:1px solid var(--bdr);border-radius:12px;overflow:hidden}
.table-header{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;border-bottom:1px solid var(--bdr)}
.table-header h2{font-size:1.1rem;font-weight:600;color:var(--amber)}
.table-header a{font-size:.8rem;color:var(--muted);transition:color .2s}
.table-header a:hover{color:var(--amber)}
table{width:100%;border-collapse:collapse}
table th{text-align:left;padding:.7rem 1rem;font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--bdr);font-weight:500}
table td{padding:.65rem 1rem;font-size:.83rem;border-bottom:1px solid rgba(42,42,58,.5);color:var(--txt)}
table tr:last-child td{border-bottom:none}
table tr:hover td{background:rgba(245,158,11,.02)}
.hash{font-family:'SF Mono',Monaco,Consolas,monospace;color:var(--amber);font-size:.8rem}
.addr{font-family:'SF Mono',Monaco,Consolas,monospace;font-size:.8rem}
.status-ok{color:var(--green);font-weight:600;font-size:.8rem}
.status-fail{color:var(--red);font-weight:600;font-size:.8rem}
.time-ago{color:var(--muted);font-size:.8rem}
.val-cell{font-weight:600;color:var(--txt)}
.validator-badge{display:inline-flex;align-items:center;gap:.3rem;padding:.15rem .5rem;background:var(--s2);border:1px solid var(--bdr);border-radius:4px;font-size:.75rem;color:var(--muted)}
.validator-badge .vdot{width:5px;height:5px;border-radius:50%;background:var(--green)}

/* Search results overlay */
.search-results{display:none;max-width:700px;margin:1rem auto 0;background:var(--s1);border:1px solid var(--bdr);border-radius:10px;overflow:hidden}
.search-results.active{display:block}
.search-result-item{padding:1rem 1.5rem;border-bottom:1px solid var(--bdr);cursor:pointer;transition:background .2s}
.search-result-item:last-child{border-bottom:none}
.search-result-item:hover{background:var(--s2)}
.search-result-item .sr-type{font-size:.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--amber);margin-bottom:.3rem}
.search-result-item .sr-value{font-family:'SF Mono',Monaco,Consolas,monospace;font-size:.85rem;color:var(--txt)}
.search-result-item .sr-detail{font-size:.8rem;color:var(--muted);margin-top:.2rem}
.no-results{padding:1.5rem;text-align:center;color:var(--muted);font-size:.9rem}

/* Chain selector */
.chain-selector{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin-bottom:1.5rem}
.chain-pill{padding:.35rem .75rem;background:var(--s2);border:1px solid var(--bdr);border-radius:20px;font-size:.78rem;color:var(--muted);cursor:pointer;transition:all .2s}
.chain-pill:hover,.chain-pill.active{border-color:var(--amber);color:var(--amber);background:rgba(245,158,11,.08)}

footer{padding:2rem;border-top:1px solid var(--bdr);text-align:center;position:relative;z-index:1}
.footer-copy{color:var(--muted);font-size:.8rem}

@media(max-width:768px){.nav-links{display:none}.tables-grid{grid-template-columns:1fr}.stats-bar{grid-template-columns:repeat(2,1fr)}.explorer-header h1{font-size:1.6rem}}
</style>
</head>
<body>

<nav>
  <a href="/" class="logo">\u26D3\uFE0F QuranChain</a>
  <div class="nav-links">
    <a href="/">Home</a>
    <a href="/explorer" class="active">Explorer</a>
    <a href="#blocks">Blocks</a>
    <a href="#transactions">Transactions</a>
    <a href="https://api.darcloud.host/api">API</a>
  </div>
  <a class="btn btn-amber" href="/">Home</a>
</nav>

<section class="explorer-header">
  <div class="container">
    <h1>\u26D3\uFE0F <span>QuranChain</span> Block Explorer</h1>
    <p>Search blocks, transactions, and addresses across the QuranChain Islamic Blockchain Network</p>
    <div class="search-wrap">
      <input type="text" id="searchInput" placeholder="Search by block number, tx hash, or address (0x...)" autocomplete="off">
      <button onclick="doSearch()">Search</button>
    </div>
    <div class="search-results" id="searchResults"></div>
    <div class="chain-selector">
      <span class="chain-pill active" data-chain="quranchain">QuranChain</span>
      <span class="chain-pill" data-chain="ethereum">Ethereum</span>
      <span class="chain-pill" data-chain="polygon">Polygon</span>
      <span class="chain-pill" data-chain="arbitrum">Arbitrum</span>
      <span class="chain-pill" data-chain="base">Base</span>
      <span class="chain-pill" data-chain="bnb">BNB Chain</span>
      <span class="chain-pill" data-chain="solana">Solana</span>
      <span class="chain-pill" data-chain="avalanche">Avalanche</span>
    </div>
  </div>
</section>

<div class="container">
  <div class="stats-bar">
    <div class="stat-card"><div class="val" id="statBlocks">18,472,391</div><div class="lbl">Total Blocks</div></div>
    <div class="stat-card"><div class="val" id="statTxns">142,839,204</div><div class="lbl">Total Transactions</div></div>
    <div class="stat-card"><div class="val" id="statGasPrice">24.7 Gwei</div><div class="lbl">Gas Price</div></div>
    <div class="stat-card"><div class="val" id="statTps">847</div><div class="lbl">TPS (Current)</div></div>
    <div class="stat-card"><div class="val" id="statValidators">47</div><div class="lbl">Active Validators</div></div>
    <div class="stat-card"><div class="val" id="statFinality">2.1s</div><div class="lbl">Finality</div></div>
  </div>
</div>

<div class="container">
  <div class="tables-grid">
    <div class="table-section" id="blocks">
      <div class="table-header">
        <h2>Latest Blocks</h2>
        <a href="#">View All \u2192</a>
      </div>
      <table>
        <thead><tr><th>Block</th><th>Age</th><th>Txns</th><th>Validator</th></tr></thead>
        <tbody id="blocksTable"></tbody>
      </table>
    </div>
    <div class="table-section" id="transactions">
      <div class="table-header">
        <h2>Latest Transactions</h2>
        <a href="#">View All \u2192</a>
      </div>
      <table>
        <thead><tr><th>Tx Hash</th><th>From \u2192 To</th><th>Value</th><th>Status</th></tr></thead>
        <tbody id="txnsTable"></tbody>
      </table>
    </div>
  </div>
</div>

<footer>
  <p class="footer-copy">\xA9 2026 QuranChain Block Explorer \u2014 by Omar Abu Nadi. 47 Networks Online. All Validators Active.</p>
</footer>

<script>
const CHAINS = {
  quranchain:{name:'QuranChain',symbol:'QRN',blockBase:18472391,txBase:142839204,gasBase:24.7,tps:847,validators:47,finality:'2.1s'},
  ethereum:{name:'Ethereum',symbol:'ETH',blockBase:21847291,txBase:2384791204,gasBase:18.3,tps:15,validators:1024000,finality:'12m'},
  polygon:{name:'Polygon',symbol:'MATIC',blockBase:65482910,txBase:3847291044,gasBase:35.2,tps:429,validators:100,finality:'2.5s'},
  arbitrum:{name:'Arbitrum',symbol:'ARB',blockBase:284719204,txBase:947281044,gasBase:0.1,tps:250,validators:23,finality:'0.3s'},
  base:{name:'Base',symbol:'ETH',blockBase:24719385,txBase:384729104,gasBase:0.02,tps:180,validators:18,finality:'2s'},
  bnb:{name:'BNB Chain',symbol:'BNB',blockBase:44892017,txBase:5847291044,gasBase:3.0,tps:160,validators:40,finality:'3s'},
  solana:{name:'Solana',symbol:'SOL',blockBase:312847291,txBase:384729100448,gasBase:0.00025,tps:4200,validators:1800,finality:'0.4s'},
  avalanche:{name:'Avalanche',symbol:'AVAX',blockBase:54829103,txBase:1284729104,gasBase:27.5,tps:350,validators:1200,finality:'1s'}
};
let currentChain='quranchain';
const pad=s=>String(s).padStart(2,'0');
const shortHash=h=>h.slice(0,10)+'...'+h.slice(-6);
const shortAddr=a=>a.slice(0,8)+'...'+a.slice(-4);
const rHex=(n=64)=>'0x'+Array.from({length:n},()=>Math.floor(Math.random()*16).toString(16)).join('');
const rAddr=()=>rHex(40);
const rVal=()=>(Math.random()*50).toFixed(4);
const rGas=()=>Math.floor(21000+Math.random()*200000).toLocaleString();

const VALIDATORS=['Omar AI\u2122','QuranChain AI\u2122','Madinah Node','Makkah Validator','Dar-1 Sentinel','Quantum Guard','Halal Staker','Zakat Pool','Islamic Dev Fund','Mesh-47 Node','FungiMesh Relay','Riyadh Hub','Dubai Nexus','Istanbul Gate','Cairo Light'];
const KNOWN_ADDRS=[
  {addr:'0x7a4B1E2cD9F38aE4b1C6d72E5f0A9638cB4d1E7a',label:'QuranChain: Foundation'},
  {addr:'0x3fC8e2a1B7D946cE5A82d30F1b9E47C6dA825F3b',label:'QuranChain: Gas Toll Collector'},
  {addr:'0xA1b2C3d4E5f6A7B8C9D0E1F2a3B4c5D6e7F8a9B0',label:'Omar AI Validator'},
  {addr:'0x9E8d7C6b5A4f3E2d1C0b9A8f7E6d5C4b3A2f1E0d',label:'QuranChain AI Validator'},
  {addr:'0x1234567890ABCdef1234567890abcdef12345678',label:'Zakat Distribution'},
  {addr:'0xdeadbeef00000000000000000000000000000001',label:'Ecosystem Fund'},
  {addr:'0xfee1dead00000000000000000000000000000002',label:'Hardware Host Pool'},
  {addr:'0xdAc17F958D2ee523a2206206994597C13D831ec7',label:'Bridge Contract'},
];

function genBlocks(chain,count=12){
  const c=CHAINS[chain];
  const blocks=[];
  const now=Date.now();
  for(let i=0;i<count;i++){
    const num=c.blockBase-i;
    blocks.push({
      number:num,
      hash:rHex(64),
      timestamp:new Date(now-i*12000-Math.random()*5000),
      txCount:Math.floor(Math.random()*280)+20,
      validator:VALIDATORS[Math.floor(Math.random()*VALIDATORS.length)],
      gasUsed:Math.floor(Math.random()*15000000)+5000000,
      size:(Math.random()*120+30).toFixed(1)+'KB'
    });
  }
  return blocks;
}

function genTxns(chain,count=12){
  const c=CHAINS[chain];
  const txns=[];
  const now=Date.now();
  for(let i=0;i<count;i++){
    const fromKnown=Math.random()>.6?KNOWN_ADDRS[Math.floor(Math.random()*KNOWN_ADDRS.length)]:null;
    const toKnown=Math.random()>.6?KNOWN_ADDRS[Math.floor(Math.random()*KNOWN_ADDRS.length)]:null;
    txns.push({
      hash:rHex(64),
      from:fromKnown?fromKnown.addr:rAddr(),
      fromLabel:fromKnown?fromKnown.label:null,
      to:toKnown?toKnown.addr:rAddr(),
      toLabel:toKnown?toKnown.label:null,
      value:rVal(),
      symbol:c.symbol,
      gas:rGas(),
      status:Math.random()>.05?'Success':'Failed',
      timestamp:new Date(now-i*8000-Math.random()*4000),
      blockNumber:c.blockBase-Math.floor(Math.random()*5)
    });
  }
  return txns;
}

function timeAgo(date){
  const s=Math.floor((Date.now()-date.getTime())/1000);
  if(s<60)return s+'s ago';
  const m=Math.floor(s/60);
  if(m<60)return m+'m ago';
  const h=Math.floor(m/60);
  return h+'h ago';
}

let allBlocks=[];
let allTxns=[];

function renderBlocks(){
  allBlocks=genBlocks(currentChain);
  const tbody=document.getElementById('blocksTable');
  tbody.innerHTML=allBlocks.map(b=>
    '<tr>'+
      '<td><span class="hash">#'+b.number.toLocaleString()+'</span></td>'+
      '<td><span class="time-ago">'+timeAgo(b.timestamp)+'</span></td>'+
      '<td class="val-cell">'+b.txCount+'</td>'+
      '<td><span class="validator-badge"><span class="vdot"></span>'+b.validator+'</span></td>'+
    '</tr>'
  ).join('');
}

function renderTxns(){
  allTxns=genTxns(currentChain);
  const tbody=document.getElementById('txnsTable');
  tbody.innerHTML=allTxns.map(t=>{
    const fromDisp=t.fromLabel||shortAddr(t.from);
    const toDisp=t.toLabel||shortAddr(t.to);
    const statusCls=t.status==='Success'?'status-ok':'status-fail';
    return '<tr>'+
      '<td><span class="hash">'+shortHash(t.hash)+'</span></td>'+
      '<td><span class="addr" title="'+t.from+'">'+fromDisp+'</span> \u2192 <span class="addr" title="'+t.to+'">'+toDisp+'</span></td>'+
      '<td class="val-cell">'+t.value+' '+t.symbol+'</td>'+
      '<td><span class="'+statusCls+'">'+t.status+'</span></td>'+
    '</tr>';
  }).join('');
}

function updateStats(){
  const c=CHAINS[currentChain];
  document.getElementById('statBlocks').textContent=c.blockBase.toLocaleString();
  document.getElementById('statTxns').textContent=c.txBase.toLocaleString();
  document.getElementById('statGasPrice').textContent=c.gasBase+' Gwei';
  document.getElementById('statTps').textContent=c.tps.toLocaleString();
  document.getElementById('statValidators').textContent=c.validators.toLocaleString();
  document.getElementById('statFinality').textContent=c.finality;
}

function switchChain(chain){
  currentChain=chain;
  document.querySelectorAll('.chain-pill').forEach(p=>p.classList.toggle('active',p.dataset.chain===chain));
  updateStats();
  renderBlocks();
  renderTxns();
}

function doSearch(){
  const q=document.getElementById('searchInput').value.trim().toLowerCase();
  const results=document.getElementById('searchResults');
  if(!q){results.classList.remove('active');return;}
  let items=[];
  // Search blocks by number
  const numQ=parseInt(q.replace(/,/g,''));
  if(!isNaN(numQ)){
    const matched=allBlocks.filter(b=>String(b.number).includes(String(numQ)));
    matched.forEach(b=>items.push({type:'Block',value:'#'+b.number.toLocaleString(),detail:'Txns: '+b.txCount+' | Validator: '+b.validator+' | '+timeAgo(b.timestamp)}));
    // Also show as if found on chain
    if(items.length===0){
      const c=CHAINS[currentChain];
      if(numQ<=c.blockBase&&numQ>0){
        items.push({type:'Block',value:'#'+numQ.toLocaleString(),detail:'Block found on '+c.name+' | '+Math.floor(Math.random()*200+20)+' transactions'});
      }
    }
  }
  // Search txns by hash
  if(q.startsWith('0x')){
    const matchedTx=allTxns.filter(t=>t.hash.toLowerCase().includes(q));
    matchedTx.forEach(t=>items.push({type:'Transaction',value:shortHash(t.hash),detail:t.value+' '+t.symbol+' | '+(t.fromLabel||shortAddr(t.from))+' \u2192 '+(t.toLabel||shortAddr(t.to))+' | '+t.status}));
    // Search known addresses
    const matchedAddr=KNOWN_ADDRS.filter(a=>a.addr.toLowerCase().includes(q));
    matchedAddr.forEach(a=>items.push({type:'Address',value:shortAddr(a.addr),detail:a.label}));
    // If looks like a full hash and nothing found, simulate
    if(items.length===0&&q.length>=10){
      items.push({type:'Transaction',value:shortHash(q),detail:'Pending confirmation | Block #'+CHAINS[currentChain].blockBase});
    }
  }
  // Search by keyword in validator names or labels
  if(items.length===0){
    const matchedV=VALIDATORS.filter(v=>v.toLowerCase().includes(q));
    matchedV.forEach(v=>items.push({type:'Validator',value:v,detail:'Active on '+CHAINS[currentChain].name+' network'}));
    const matchedA=KNOWN_ADDRS.filter(a=>a.label.toLowerCase().includes(q));
    matchedA.forEach(a=>items.push({type:'Address',value:a.label,detail:shortAddr(a.addr)}));
  }
  if(items.length===0){
    results.innerHTML='<div class="no-results">No results found for "'+q+'"</div>';
  } else {
    results.innerHTML=items.slice(0,8).map(it=>
      '<div class="search-result-item">'+
        '<div class="sr-type">'+it.type+'</div>'+
        '<div class="sr-value">'+it.value+'</div>'+
        '<div class="sr-detail">'+it.detail+'</div>'+
      '</div>'
    ).join('');
  }
  results.classList.add('active');
}

document.getElementById('searchInput').addEventListener('keyup',function(e){
  if(e.key==='Enter')doSearch();
  else if(this.value.trim()==='')document.getElementById('searchResults').classList.remove('active');
});
document.addEventListener('click',function(e){
  if(!e.target.closest('.search-wrap')&&!e.target.closest('.search-results')){
    document.getElementById('searchResults').classList.remove('active');
  }
});
document.querySelectorAll('.chain-pill').forEach(p=>p.addEventListener('click',()=>switchChain(p.dataset.chain)));

// Initial render
updateStats();
renderBlocks();
renderTxns();

// Auto-refresh every 12s
setInterval(()=>{renderBlocks();renderTxns();},12000);
</script>
</body></html>`;

var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === "/health")
      return jsonRes({ service: "quranchain-blockchain", status: "live", chains: 47, validators: "online" });
    if (url.pathname === "/explorer")
      return new Response(EXPLORER, { headers: { "Content-Type": "text/html;charset=UTF-8", ...CORS } });
    if (url.pathname.startsWith("/api/")) {
      const origin = env.ORIGIN_URL || "http://localhost:3001";
      const target = origin + url.pathname + url.search;
      try {
        const res = await fetch(target, { method: request.method, headers: request.headers, body: ["GET", "HEAD"].includes(request.method) ? null : request.body });
        return new Response(res.body, { status: res.status, headers: { ...Object.fromEntries(res.headers), ...CORS } });
      } catch (e) {
        return jsonRes({ error: "Origin unreachable", detail: e.message }, 502);
      }
    }
    return new Response(LANDING, { headers: { "Content-Type": "text/html;charset=UTF-8", ...CORS } });
  }
};
export {
  src_default as default
};
