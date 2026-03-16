// DarCloud Partners — Partnership, Integration & Ecosystem Page
var src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    if (url.pathname === "/health") return new Response(JSON.stringify({ status: "healthy", service: "DarCloud Partners" }), { headers: { "Content-Type": "application/json" } });
    return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DarCloud Partners \u2014 Build With Us | Integration & Ecosystem</title>
<meta name="description" content="Partner with DarCloud's 101-company ecosystem. API integrations, white-label solutions, and revenue sharing for the halal economy.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u2601\uFE0F</text></svg>">
<style>
:root{--bg:#07090f;--s1:#0d1117;--s2:#161b22;--bdr:#21262d;--cyan:#00d4ff;--emerald:#10b981;--gold:#f59e0b;--purple:#8b5cf6;--txt:#e6edf3;--muted:#8b949e;--grad1:linear-gradient(135deg,#00d4ff,#10b981);--grad2:linear-gradient(135deg,#8b5cf6,#00d4ff)}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--txt);overflow-x:hidden}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
nav{position:sticky;top:0;z-index:100;background:rgba(7,9,15,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--bdr);padding:.75rem 2rem;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.4rem;font-weight:700;background:var(--grad1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:1.5rem;font-size:.9rem;align-items:center}.nav-links a{color:var(--muted);transition:color .2s}.nav-links a:hover{color:var(--cyan);text-decoration:none}
.btn{display:inline-block;padding:.6rem 1.5rem;border-radius:8px;font-weight:600;font-size:.9rem;transition:all .3s;cursor:pointer;border:none}
.btn-primary{background:var(--grad1);color:#000}.btn-primary:hover{opacity:.85;transform:translateY(-1px);text-decoration:none}
.btn-outline{border:1px solid var(--cyan);color:var(--cyan);background:transparent}.btn-outline:hover{background:rgba(0,212,255,.1);text-decoration:none}
.btn-purple{background:var(--grad2);color:#fff}.btn-purple:hover{opacity:.85;transform:translateY(-1px);text-decoration:none}
.container{max-width:1200px;margin:0 auto;padding:0 1.5rem}
.hero{text-align:center;padding:5rem 1.5rem 3rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle at 35% 45%,rgba(139,92,246,.08) 0%,transparent 50%),radial-gradient(circle at 65% 55%,rgba(0,212,255,.06) 0%,transparent 50%);animation:pulse 8s ease-in-out infinite alternate}
@keyframes pulse{0%{transform:scale(1)}100%{transform:scale(1.05)}}
.hero h1{font-size:clamp(2.2rem,5vw,3.5rem);font-weight:800;line-height:1.1;margin-bottom:1.5rem}
.hero h1 span{background:var(--grad2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{font-size:1.15rem;color:var(--muted);max-width:650px;margin:0 auto 2.5rem;line-height:1.7}
.hero-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
.section{padding:4rem 0}.section-head{text-align:center;margin-bottom:3rem}
.section-head h2{font-size:2.2rem;font-weight:700;margin-bottom:.75rem}.section-head p{color:var(--muted);font-size:1.05rem;max-width:600px;margin:0 auto}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
.card{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem;transition:all .3s}.card:hover{border-color:var(--purple);transform:translateY(-3px);box-shadow:0 8px 30px rgba(139,92,246,.08)}
.card-icon{font-size:2.5rem;margin-bottom:1rem}.card h3{font-size:1.2rem;font-weight:600;margin-bottom:.5rem}.card p{color:var(--muted);font-size:.9rem;line-height:1.6}
.card .badge{display:inline-block;margin-top:.75rem;font-size:.7rem;padding:.2rem .5rem;background:var(--s2);border:1px solid var(--bdr);border-radius:4px;color:var(--cyan)}
.video-section{padding:4rem 0;background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)}
.video-container{max-width:800px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid var(--bdr);box-shadow:0 20px 60px rgba(0,0,0,.5)}
.video-placeholder{width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,rgba(139,92,246,.1),rgba(0,212,255,.05));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;cursor:pointer}
.play-btn{width:80px;height:80px;border-radius:50%;background:var(--grad2);display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:0 0 40px rgba(139,92,246,.3);transition:transform .3s}
.play-btn:hover{transform:scale(1.1)}
.partner-types{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem}
.partner-type{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem;text-align:center;transition:all .3s;position:relative;overflow:hidden}
.partner-type::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.partner-type.gold::before{background:var(--gold)}.partner-type.platinum::before{background:var(--grad1)}.partner-type.diamond::before{background:var(--grad2)}
.partner-type:hover{transform:translateY(-3px)}
.partner-type .tier{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem}
.partner-type.gold .tier{color:var(--gold)}.partner-type.platinum .tier{color:var(--cyan)}.partner-type.diamond .tier{color:var(--purple)}
.partner-type .icon{font-size:3rem;margin-bottom:1rem}
.partner-type h3{font-size:1.3rem;font-weight:700;margin-bottom:.5rem}
.partner-type p{color:var(--muted);font-size:.85rem;line-height:1.6;margin-bottom:1rem}
.partner-type ul{list-style:none;text-align:left;margin-bottom:1.5rem}
.partner-type ul li{color:var(--muted);font-size:.85rem;padding:.3rem 0;border-bottom:1px solid var(--bdr)}
.partner-type ul li::before{content:'\u2713 ';color:var(--emerald)}
.integration-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem}
.int-card{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:1.5rem;text-align:center;transition:all .2s}
.int-card:hover{border-color:var(--cyan)}
.int-card .icon{font-size:2rem;margin-bottom:.75rem}
.int-card h4{font-size:.95rem;margin-bottom:.3rem}
.int-card p{color:var(--muted);font-size:.75rem}
.testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.5rem;margin-top:2rem}
.testimonial{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem;position:relative}
.testimonial::before{content:'\\201C';position:absolute;top:1rem;left:1.5rem;font-size:3rem;color:var(--purple);opacity:.3;font-family:Georgia,serif}
.testimonial blockquote{color:var(--muted);font-size:.9rem;line-height:1.7;margin-bottom:1.5rem;padding-left:1rem}
.testimonial .author{display:flex;align-items:center;gap:.75rem}
.testimonial .avatar{width:40px;height:40px;border-radius:50%;background:var(--grad2);display:flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:700;color:#fff}
.testimonial .name{font-weight:600;font-size:.85rem}.testimonial .role{color:var(--muted);font-size:.75rem}
.cta{text-align:center;padding:5rem 1.5rem;background:var(--s1);border-top:1px solid var(--bdr)}
.cta h2{font-size:2rem;margin-bottom:1rem}.cta p{color:var(--muted);margin-bottom:2rem;font-size:1.05rem}
footer{padding:3rem 2rem;border-top:1px solid var(--bdr);text-align:center}
.footer-links{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;margin-bottom:1.5rem}.footer-links a{color:var(--muted);font-size:.85rem}
@media(max-width:768px){.nav-links{display:none}.hero h1{font-size:2rem}.grid{grid-template-columns:1fr}.partner-types{grid-template-columns:1fr}.testimonials{grid-template-columns:1fr}}
</style>
</head><body>

<nav>
  <a class="logo" href="https://darcloud.host">\u2601\uFE0F DarCloud</a>
  <div class="nav-links">
    <a href="https://darcloud.host">Home</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://about.darcloud.host">About</a>
    <a href="https://demo.darcloud.host">Demo</a>
    <a href="https://darcloud.host/checkout/enterprise" class="btn btn-purple">Become a Partner</a>
  </div>
</nav>

<section class="hero">
  <h1>Build With the <span>DarCloud Ecosystem</span></h1>
  <p>Partner with a 101-company conglomerate. Access APIs, white-label solutions, revenue sharing, and a network of 340,000 mesh nodes serving 2 billion Muslims.</p>
  <div class="hero-btns">
    <a class="btn btn-purple" href="https://darcloud.host/checkout/enterprise">Apply to Partner</a>
    <a class="btn btn-outline" href="#video">Watch Overview \u25B6</a>
  </div>
</section>

<!-- Partner Video -->
<section class="video-section" id="video">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFAC Partnership Overview</h2>
      <p>See how partners are building on the DarCloud ecosystem</p>
    </div>
    <div class="video-container">
      <div class="video-placeholder" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;aspect-ratio:16/9;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
        <div class="play-btn">\u25B6\uFE0F</div>
        <p style="color:var(--txt);font-weight:600">Partnership Ecosystem Tour \u2014 6:45</p>
        <p style="color:var(--muted);font-size:.85rem">APIs \u2022 White-Label \u2022 Revenue Share \u2022 Integration</p>
      </div>
    </div>
  </div>
</section>

<!-- Integration Points -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDD17 Integration Points</h2>
      <p>Connect to every layer of the DarCloud stack</p>
    </div>
    <div class="integration-grid">
      <div class="int-card"><div class="icon">\uD83D\uDCB3</div><h4>Payment API</h4><p>Stripe-powered halal payments</p></div>
      <div class="int-card"><div class="icon">\u26D3\uFE0F</div><h4>Blockchain API</h4><p>47-chain transaction routing</p></div>
      <div class="int-card"><div class="icon">\uD83C\uDF44</div><h4>Mesh SDK</h4><p>FungiMesh node integration</p></div>
      <div class="int-card"><div class="icon">\uD83E\uDD16</div><h4>AI Agent API</h4><p>GPT-4o agent fleet access</p></div>
      <div class="int-card"><div class="icon">\uD83D\uDCE1</div><h4>Webhook Events</h4><p>Real-time event streaming</p></div>
      <div class="int-card"><div class="icon">\uD83D\uDD12</div><h4>SSO / OAuth</h4><p>Single sign-on integration</p></div>
      <div class="int-card"><div class="icon">\uD83C\uDFAE</div><h4>Discord SDK</h4><p>Bot & command framework</p></div>
      <div class="int-card"><div class="icon">\uD83D\uDCCA</div><h4>Analytics API</h4><p>Revenue & usage dashboards</p></div>
    </div>
  </div>
</section>

<!-- Partner Tiers -->
<section class="section" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)">
  <div class="container">
    <div class="section-head">
      <h2>\uD83C\uDFC6 Partnership Tiers</h2>
      <p>Choose the level that fits your business</p>
    </div>
    <div class="partner-types">
      <div class="partner-type gold">
        <div class="tier">Gold Partner</div>
        <div class="icon">\uD83E\uDD47</div>
        <h3>Integrator</h3>
        <p>Perfect for developers building on DarCloud APIs</p>
        <ul>
          <li>Full API access</li>
          <li>Developer documentation</li>
          <li>Community support</li>
          <li>Revenue sharing (5%)</li>
          <li>Partner badge</li>
        </ul>
        <a class="btn btn-outline" href="https://darcloud.host/checkout/pro">Apply \u2192</a>
      </div>
      <div class="partner-type platinum">
        <div class="tier">Platinum Partner</div>
        <div class="icon">\uD83E\uDD48</div>
        <h3>White-Label</h3>
        <p>Brand DarCloud services under your own name</p>
        <ul>
          <li>Everything in Gold</li>
          <li>White-label UI</li>
          <li>Custom branding</li>
          <li>Revenue sharing (12%)</li>
          <li>Priority support</li>
          <li>Co-marketing</li>
        </ul>
        <a class="btn btn-primary" href="https://darcloud.host/checkout/enterprise">Apply \u2192</a>
      </div>
      <div class="partner-type diamond">
        <div class="tier">Diamond Partner</div>
        <div class="icon">\uD83D\uDC8E</div>
        <h3>Strategic</h3>
        <p>Deep integration and joint-venture opportunities</p>
        <ul>
          <li>Everything in Platinum</li>
          <li>Custom AI agents</li>
          <li>Dedicated mesh nodes</li>
          <li>Revenue sharing (20%)</li>
          <li>Joint ventures</li>
          <li>Board advisory seat</li>
        </ul>
        <a class="btn btn-purple" href="https://darcloud.host/checkout/enterprise">Contact Us \u2192</a>
      </div>
    </div>
  </div>
</section>

<!-- What Partners Build -->
<section class="section">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDEE0\uFE0F What Partners Build</h2>
      <p>Real use cases from the DarCloud ecosystem</p>
    </div>
    <div class="grid">
      <div class="card"><div class="card-icon">\uD83C\uDFE6</div><h3>Islamic Banking Apps</h3><p>Build neobanks and fintech products using DarPay, DarDeFi, and HWC APIs. Full Shariah compliance out of the box.</p><span class="badge">Finance</span></div>
      <div class="card"><div class="card-icon">\uD83D\uDCF1</div><h3>Halal E-Commerce</h3><p>Launch halal marketplaces with DarCommerce APIs, Stripe payments, and blockchain-verified product certification.</p><span class="badge">Commerce</span></div>
      <div class="card"><div class="card-icon">\uD83C\uDF93</div><h3>EdTech Platforms</h3><p>Create Islamic education apps using DarEdu content APIs, AI tutors, and Quran study tools.</p><span class="badge">Education</span></div>
      <div class="card"><div class="card-icon">\uD83C\uDFE5</div><h3>Health Tech</h3><p>Build telehealth and wellness apps with DarHealth APIs, halal medication databases, and Islamic counseling tools.</p><span class="badge">Healthcare</span></div>
      <div class="card"><div class="card-icon">\uD83D\uDCF0</div><h3>Media Platforms</h3><p>Launch halal media apps using DarMedia content delivery, FungiMesh streaming, and AI content moderation.</p><span class="badge">Media</span></div>
      <div class="card"><div class="card-icon">\uD83C\uDFE0</div><h3>PropTech Solutions</h3><p>Build halal real estate platforms with DarRealty APIs, Islamic mortgage calculators, and blockchain title deeds.</p><span class="badge">Real Estate</span></div>
    </div>
  </div>
</section>

<!-- Partner Testimonials -->
<section class="section" style="background:var(--s1);border-top:1px solid var(--bdr);border-bottom:1px solid var(--bdr)">
  <div class="container">
    <div class="section-head">
      <h2>\uD83D\uDCAC Partner Voices</h2>
      <p>From companies building on the DarCloud ecosystem</p>
    </div>
    <div class="testimonials">
      <div class="testimonial">
        <blockquote>"Integrating with DarCloud\u2019s API took less than a day. The documentation is excellent and the revenue sharing model is incredibly fair."</blockquote>
        <div class="author"><div class="avatar">MR</div><div><div class="name">Mohammed Rahman</div><div class="role">CTO, HalalCart</div></div></div>
      </div>
      <div class="testimonial">
        <blockquote>"The white-label option lets us offer Islamic banking services under our own brand. DarCloud handles all the compliance \u2014 we focus on our customers."</blockquote>
        <div class="author"><div class="avatar">FA</div><div><div class="name">Fatima Al-Zahra</div><div class="role">CEO, BarakaBank</div></div></div>
      </div>
      <div class="testimonial">
        <blockquote>"FungiMesh SDK was a game-changer for our app. We deployed 500 nodes in the first week and our users love the decentralized streaming."</blockquote>
        <div class="author"><div class="avatar">IK</div><div><div class="name">Ibrahim Khalil</div><div class="role">Lead Developer, NoorStream</div></div></div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <h2>Ready to <span style="background:var(--grad2);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Partner</span> With Us?</h2>
  <p>Join the 101-company ecosystem and start building for 2 billion Muslims.</p>
  <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
    <a class="btn btn-purple" href="https://darcloud.host/checkout/enterprise">Become a Partner</a>
    <a class="btn btn-primary" href="https://demo.darcloud.host">See Demos</a>
    <a class="btn btn-outline" href="https://discord.gg/darcloud">Join Discord</a>
  </div>
</section>

<footer>
  <div class="footer-links">
    <a href="https://darcloud.host">Home</a>
    <a href="https://about.darcloud.host">About</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://enterprise.darcloud.host">Enterprise</a>
  </div>
  <p style="color:var(--muted);font-size:.85rem">\u00A9 2026 DarCloud Empire by Omar Abu Nadi. All rights reserved.</p>
</footer>

</body></html>`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
export { src_default as default };
