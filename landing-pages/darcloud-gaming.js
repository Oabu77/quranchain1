// DarCloud Gaming — Halal Gaming & Esports Platform
var src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    if (url.pathname === "/health") return new Response(JSON.stringify({ status: "healthy", service: "DarCloud Gaming" }), { headers: { "Content-Type": "application/json" } });
    return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DarCloud Gaming \u2014 Halal Esports & Blockchain Gaming</title>
<meta name="description" content="The first halal gaming ecosystem. Play-to-earn with Shariah-compliant NFTs, competitive esports, and 340K mesh-powered servers.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\uD83C\uDFAE</text></svg>">
<style>
:root{--bg:#07090f;--s1:#0d1117;--s2:#161b22;--bdr:#21262d;--cyan:#00d4ff;--emerald:#10b981;--gold:#f59e0b;--purple:#8b5cf6;--red:#ef4444;--txt:#e6edf3;--muted:#8b949e;--grad1:linear-gradient(135deg,#8b5cf6,#ef4444);--grad2:linear-gradient(135deg,#00d4ff,#8b5cf6);--grad3:linear-gradient(135deg,#f59e0b,#ef4444)}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--txt);overflow-x:hidden}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
nav{position:sticky;top:0;z-index:100;background:rgba(7,9,15,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--bdr);padding:.75rem 2rem;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.4rem;font-weight:700;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:1.5rem;font-size:.9rem;align-items:center}.nav-links a{color:var(--muted);transition:color .2s}.nav-links a:hover{color:var(--purple);text-decoration:none}
.btn{display:inline-block;padding:.6rem 1.5rem;border-radius:8px;font-weight:600;font-size:.9rem;transition:all .3s;cursor:pointer;border:none}
.btn-glow{background:var(--grad1);color:#fff;box-shadow:0 0 20px rgba(139,92,246,.3)}.btn-glow:hover{opacity:.85;transform:translateY(-1px);box-shadow:0 0 30px rgba(139,92,246,.5);text-decoration:none}
.btn-outline{border:1px solid var(--purple);color:var(--purple);background:transparent}.btn-outline:hover{background:rgba(139,92,246,.1);text-decoration:none}
.container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
.hero{text-align:center;padding:5rem 1.5rem 3rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 25% 35%,rgba(139,92,246,.12) 0%,transparent 50%),radial-gradient(circle at 75% 65%,rgba(239,68,68,.08) 0%,transparent 50%),radial-gradient(circle at 50% 50%,rgba(0,212,255,.05) 0%,transparent 50%);animation:pulse 6s ease-in-out infinite alternate}
@keyframes pulse{0%{transform:scale(1) rotate(0deg)}100%{transform:scale(1.05) rotate(1deg)}}
.hero h1{font-size:clamp(2.5rem,6vw,4rem);font-weight:900;line-height:1.05;margin-bottom:1.5rem;text-transform:uppercase;letter-spacing:-.02em}
.hero h1 span{background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:1.15rem;color:var(--muted);max-width:650px;margin:0 auto 2.5rem;line-height:1.7}
.hero-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-bottom:3rem}
.section{padding:4rem 0}.section-head{text-align:center;margin-bottom:3rem}
.section-head h2{font-size:2.2rem;font-weight:700;margin-bottom:.75rem}.section-head p{color:var(--muted);font-size:1.05rem;max-width:600px;margin:0 auto}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;padding:2rem 0}
.stat{text-align:center;padding:1.5rem 1rem;background:var(--s1);border:1px solid var(--bdr);border-radius:12px;transition:all .2s}.stat:hover{border-color:var(--purple);transform:translateY(-3px)}
.stat-value{font-size:2rem;font-weight:800;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.stat-label{font-size:.8rem;color:var(--muted);margin-top:.3rem}
.video-hero{max-width:900px;margin:0 auto 3rem;border-radius:16px;overflow:hidden;border:2px solid var(--bdr);position:relative;box-shadow:0 20px 80px rgba(139,92,246,.15)}
.video-hero::after{content:'';position:absolute;inset:0;border-radius:16px;pointer-events:none;box-shadow:inset 0 0 60px rgba(139,92,246,.05)}
.video-placeholder{width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(239,68,68,.1),rgba(0,212,255,.1));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;cursor:pointer}
.play-btn{width:90px;height:90px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:2.5rem;box-shadow:0 0 50px rgba(139,92,246,.4);transition:transform .3s;animation:glow 3s ease-in-out infinite alternate}
.play-btn:hover{transform:scale(1.15)}
@keyframes glow{0%{box-shadow:0 0 30px rgba(139,92,246,.3)}100%{box-shadow:0 0 60px rgba(139,92,246,.5)}}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
.card{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem;transition:all .3s;position:relative;overflow:hidden}.card:hover{border-color:var(--purple);transform:translateY(-3px);box-shadow:0 8px 30px rgba(139,92,246,.1)}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--grad1);opacity:0;transition:opacity .3s}.card:hover::before{opacity:1}
.card-icon{font-size:2.5rem;margin-bottom:1rem}.card h3{font-size:1.2rem;font-weight:600;margin-bottom:.5rem}.card p{color:var(--muted);font-size:.9rem;line-height:1.6}
.game-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem}
.game-card{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;overflow:hidden;transition:all .3s}
.game-card:hover{border-color:var(--purple);transform:translateY(-3px)}
.game-thumb{width:100%;aspect-ratio:16/10;background:linear-gradient(135deg,var(--s2),var(--bg));display:flex;align-items:center;justify-content:center;position:relative}
.game-thumb .icon{font-size:4rem;opacity:.4}
.game-thumb .genre{position:absolute;top:.75rem;right:.75rem;font-size:.7rem;font-weight:700;padding:.2rem .5rem;border-radius:4px;background:var(--purple);color:#fff}
.game-thumb .status{position:absolute;bottom:.75rem;left:.75rem;font-size:.65rem;font-weight:600;padding:.2rem .5rem;border-radius:4px;background:var(--emerald);color:#000}
.game-body{padding:1.5rem}
.game-body h3{font-size:1.1rem;margin-bottom:.3rem}
.game-body p{color:var(--muted);font-size:.8rem;line-height:1.5;margin-bottom:.75rem}
.game-meta{display:flex;gap:.5rem;flex-wrap:wrap}
.game-meta span{font-size:.7rem;padding:.15rem .4rem;background:var(--s2);border:1px solid var(--bdr);border-radius:3px;color:var(--muted)}
.esports{background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr);padding:4rem 0}
.tournament{max-width:800px;margin:2rem auto;background:var(--bg);border:1px solid var(--bdr);border-radius:14px;overflow:hidden}
.tournament-header{padding:1.5rem 2rem;background:var(--grad1);color:#fff}
.tournament-header h3{font-size:1.2rem;margin-bottom:.3rem}
.tournament-header p{opacity:.8;font-size:.85rem}
.tournament-body{padding:2rem}
.tournament-row{display:flex;justify-content:space-between;align-items:center;padding:.75rem 0;border-bottom:1px solid var(--bdr)}
.tournament-row:last-child{border:none}
.tournament-row .team{display:flex;align-items:center;gap:.5rem}
.tournament-row .team .badge{width:32px;height:32px;border-radius:8px;background:var(--s2);display:flex;align-items:center;justify-content:center;font-size:1rem}
.tournament-row .rank{color:var(--gold);font-weight:700;width:2rem}
.tournament-row .prize{color:var(--emerald);font-weight:600;font-size:.9rem}
.media-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-top:2rem}
.media-item{border-radius:12px;overflow:hidden;border:1px solid var(--bdr);transition:all .3s;cursor:pointer}.media-item:hover{border-color:var(--purple);transform:translateY(-2px)}
.media-thumb{width:100%;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;position:relative}
.media-thumb .play{width:52px;height:52px;border-radius:50%;background:var(--grad1);display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 0 20px rgba(139,92,246,.3)}
.media-thumb .dur{position:absolute;bottom:.5rem;right:.5rem;background:rgba(0,0,0,.7);padding:.15rem .4rem;border-radius:3px;font-size:.7rem}
.media-meta{padding:1rem}.media-meta h4{font-size:.9rem;margin-bottom:.2rem}.media-meta p{color:var(--muted);font-size:.75rem}
.cta{text-align:center;padding:5rem 1.5rem;position:relative;overflow:hidden}
.cta::before{content:'';position:absolute;top:-100%;left:-100%;width:300%;height:300%;background:radial-gradient(circle at 50% 50%,rgba(139,92,246,.06) 0%,transparent 50%)}
.cta h2{font-size:2.2rem;margin-bottom:1rem;text-transform:uppercase;letter-spacing:.02em}.cta p{color:var(--muted);margin-bottom:2rem;font-size:1.05rem}
footer{padding:3rem 2rem;border-top:1px solid var(--bdr);text-align:center}
.footer-links{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-bottom:1.5rem}.footer-links a{color:var(--muted);font-size:.85rem}
@media(max-width:768px){.nav-links{display:none}.hero h1{font-size:2.2rem}.grid{grid-template-columns:1fr}.game-grid{grid-template-columns:1fr}.stats{grid-template-columns:repeat(2,1fr)}.media-gallery{grid-template-columns:1fr}}
</style>
</head><body>

<nav>
  <a class="logo" href="https://darcloud.host">\uD83C\uDFAE DarCloud Gaming</a>
  <div class="nav-links">
    <a href="https://darcloud.host">DarCloud</a>
    <a href="https://mesh.darcloud.host">FungiMesh</a>
    <a href="https://blockchain.darcloud.host">Blockchain</a>
    <a href="https://defi.darcloud.host">DeFi</a>
    <a href="#" class="btn btn-glow">Play Now</a>
  </div>
</nav>

<section class="hero">
  <h1><span>Halal Gaming</span><br>for the Next Generation</h1>
  <p>Blockchain-powered play-to-earn, competitive esports, and 340K mesh-powered game servers. All Shariah-compliant. No gambling. No haram content. Pure skill-based competition.</p>
  <div class="hero-btns">
    <a class="btn btn-glow" href="#">Enter the Arena</a>
    <a class="btn btn-outline" href="#trailer">Watch Trailer \u25B6</a>
  </div>
</section>

<!-- Platform Stats -->
<div class="container">
  <div class="stats">
    <div class="stat"><div class="stat-value">340K</div><div class="stat-label">Game Servers</div></div>
    <div class="stat"><div class="stat-value">47</div><div class="stat-label">Blockchains</div></div>
    <div class="stat"><div class="stat-value">0</div><div class="stat-label">Gambling</div></div>
    <div class="stat"><div class="stat-value">100%</div><div class="stat-label">Halal</div></div>
    <div class="stat"><div class="stat-value">P2E</div><div class="stat-label">Play to Earn</div></div>
  </div>
</div>

<!-- Trailer Video -->
<section class="section" id="trailer">
  <div class="container">
    <div class="video-hero">
      <div class="video-placeholder" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;aspect-ratio:16/9;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="play-btn">\u25B6\uFE0F</div>
        <p style="color:var(--txt);font-size:1.2rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em">DarCloud Gaming \u2014 Official Trailer</p>
        <p style="color:var(--muted);font-size:.9rem">Halal Esports \u2022 Blockchain P2E \u2022 Mesh Servers</p>
      </div>
    </div>
  </div>
</section>

<!-- Features -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\u26A1 Platform Features</h2>
      <p>Everything you need for competitive halal gaming</p>
    </div>
    <div class="grid">
      <div class="card"><div class="card-icon">\u26D3\uFE0F</div><h3>Blockchain Rewards</h3><p>Earn QuranChain tokens for victories. NFT trophies, achievement badges, and seasonal rewards \u2014 all on-chain.</p></div>
      <div class="card"><div class="card-icon">\uD83C\uDF44</div><h3>Mesh-Powered Servers</h3><p>Games run on FungiMesh\u2019s 340K node network. Zero central servers, ultra-low latency, impossible to DDoS.</p></div>
      <div class="card"><div class="card-icon">\uD83C\uDFC6</div><h3>Esports Tournaments</h3><p>Compete in skill-based tournaments with real prizes. No gambling, no loot boxes \u2014 pure competitive gaming.</p></div>
      <div class="card"><div class="card-icon">\uD83D\uDD12</div><h3>Shariah-Certified</h3><p>Every game reviewed for halal compliance. No gambling mechanics, no haram imagery, no exploitative monetization.</p></div>
      <div class="card"><div class="card-icon">\uD83E\uDD16</div><h3>AI Anti-Cheat</h3><p>66 AI agents monitor gameplay for cheating, boosting, and exploitation. Fair play for everyone.</p></div>
      <div class="card"><div class="card-icon">\uD83D\uDCB0</div><h3>Play-to-Earn</h3><p>Earn while you play. Top players earn QuranChain tokens, mesh credits, and exclusive NFTs for their skills.</p></div>
    </div>
  </div>
</section>

<!-- Games -->
<section class="section" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFAE Featured Games</h2>
      <p>Halal-certified games in the DarCloud ecosystem</p>
    </div>
    <div class="game-grid">
      <div class="game-card">
        <div class="game-thumb" style="background:linear-gradient(135deg,rgba(139,92,246,.2),rgba(0,212,255,.1))"><span class="icon">\u2694\uFE0F</span><span class="genre">Strategy</span><span class="status">\u25CF LIVE</span></div>
        <div class="game-body"><h3>Khalifah: Empire Builder</h3><p>Build your Islamic civilization from the ground up. Trade on 47 blockchain markets. Compete for resources on the mesh network.</p><div class="game-meta"><span>Strategy</span><span>P2E</span><span>Blockchain</span><span>Multiplayer</span></div></div>
      </div>
      <div class="game-card">
        <div class="game-thumb" style="background:linear-gradient(135deg,rgba(239,68,68,.2),rgba(245,158,11,.1))"><span class="icon">\uD83C\uDFF9</span><span class="genre">Action</span><span class="status">\u25CF BETA</span></div>
        <div class="game-body"><h3>Saif: The Guardian</h3><p>Cooperative action game. Defend communities, protect the innocent, and earn honor tokens. Up to 8-player squads on mesh servers.</p><div class="game-meta"><span>Action</span><span>Co-op</span><span>Mesh</span><span>8P</span></div></div>
      </div>
      <div class="game-card">
        <div class="game-thumb" style="background:linear-gradient(135deg,rgba(16,185,129,.2),rgba(0,212,255,.1))"><span class="icon">\uD83E\uDDE9</span><span class="genre">Puzzle</span><span class="status">\u25CF LIVE</span></div>
        <div class="game-body"><h3>Hikmah Puzzles</h3><p>Islamic knowledge puzzle game. Answer Quran and Hadith trivia, solve logic puzzles, compete in daily challenges.</p><div class="game-meta"><span>Puzzle</span><span>Education</span><span>Daily</span><span>Solo/PvP</span></div></div>
      </div>
      <div class="game-card">
        <div class="game-thumb" style="background:linear-gradient(135deg,rgba(245,158,11,.2),rgba(139,92,246,.1))"><span class="icon">\uD83C\uDFCE\uFE0F</span><span class="genre">Racing</span><span class="status">\u25CF DEV</span></div>
        <div class="game-body"><h3>Desert Sprint</h3><p>High-speed desert racing with NFT vehicles. Upgrade parts on-chain, race across procedurally generated dune tracks.</p><div class="game-meta"><span>Racing</span><span>NFT</span><span>PvP</span><span>12P</span></div></div>
      </div>
    </div>
  </div>
</section>

<!-- Esports Tournaments -->
<section class="esports">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFC6 Esports Tournaments</h2>
      <p>Compete for prizes in skill-based tournaments \u2014 no gambling, pure competition</p>
    </div>
    <div class="tournament">
      <div class="tournament-header">
        <h3>DarCloud Invitational \u2014 Season 1</h3>
        <p>Khalifah: Empire Builder \u2022 32 Teams \u2022 Prize Pool: 50,000 QRC Tokens</p>
      </div>
      <div class="tournament-body">
        <div class="tournament-row"><span class="rank">#1</span><div class="team"><span class="badge">\uD83E\uDD47</span><span>Team Saladin</span></div><span class="prize">20,000 QRC</span></div>
        <div class="tournament-row"><span class="rank">#2</span><div class="team"><span class="badge">\uD83E\uDD48</span><span>Team Tariq</span></div><span class="prize">12,000 QRC</span></div>
        <div class="tournament-row"><span class="rank">#3</span><div class="team"><span class="badge">\uD83E\uDD49</span><span>Team Khalid</span></div><span class="prize">8,000 QRC</span></div>
        <div class="tournament-row"><span class="rank">#4</span><div class="team"><span class="badge">\uD83C\uDFC5</span><span>Team Fatimah</span></div><span class="prize">5,000 QRC</span></div>
        <div class="tournament-row"><span class="rank">#5</span><div class="team"><span class="badge">\uD83C\uDFC5</span><span>Team Noor</span></div><span class="prize">5,000 QRC</span></div>
      </div>
    </div>
  </div>
</section>

<!-- Media Gallery -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFA5 Gaming Media</h2>
      <p>Trailers, gameplay, and tournament highlights</p>
    </div>
    <div class="media-gallery">
      <div class="media-item" onclick="this.querySelector('.media-thumb').innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="media-thumb" style="background:linear-gradient(135deg,rgba(139,92,246,.15),rgba(239,68,68,.1))"><div class="play">\u25B6\uFE0F</div><span class="dur">2:30</span></div>
        <div class="media-meta"><h4>Khalifah Gameplay Trailer</h4><p>Empire building meets blockchain \u2022 Official</p></div>
      </div>
      <div class="media-item" onclick="this.querySelector('.media-thumb').innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="media-thumb" style="background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(0,212,255,.1))"><div class="play">\u25B6\uFE0F</div><span class="dur">5:15</span></div>
        <div class="media-meta"><h4>Tournament Highlights S1</h4><p>Best moments from the DarCloud Invitational</p></div>
      </div>
      <div class="media-item" onclick="this.querySelector('.media-thumb').innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;height:100%;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="media-thumb" style="background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(139,92,246,.1))"><div class="play">\u25B6\uFE0F</div><span class="dur">3:45</span></div>
        <div class="media-meta"><h4>Mesh Server Technology</h4><p>How 340K nodes power lag-free gaming</p></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <h2>Ready to <span style="background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Compete</span>?</h2>
  <p>Join the first halal gaming ecosystem. No gambling. No haram. Just pure competition.</p>
  <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
    <a class="btn btn-glow" href="#">Enter the Arena</a>
    <a class="btn btn-outline" href="https://discord.gg/darcloud">Join Discord</a>
  </div>
</section>

<footer>
  <div class="footer-links">
    <a href="https://darcloud.host">DarCloud</a>
    <a href="https://blockchain.darcloud.host">Blockchain</a>
    <a href="https://mesh.darcloud.host">FungiMesh</a>
    <a href="https://defi.darcloud.host">DeFi</a>
  </div>
  <p style="color:var(--muted);font-size:.85rem">\u00A9 2026 DarCloud Gaming. Part of the DarCloud Empire. All rights reserved.</p>
</footer>

</body></html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
export { src_default as default };
