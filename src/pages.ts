// Shared page layout for DarCloud auth/onboarding pages
export function pageShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — DarCloud</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☁️</text></svg>">
<style>
:root{--bg:#07090f;--s1:#0d1117;--s2:#161b22;--bdr:#21262d;--cyan:#00d4ff;--emerald:#10b981;--gold:#f59e0b;--txt:#e6edf3;--muted:#8b949e;--err:#ef4444;--grad:linear-gradient(135deg,#00d4ff,#10b981)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--txt);min-height:100vh;display:flex;flex-direction:column}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
nav{background:rgba(7,9,15,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--bdr);padding:.75rem 2rem;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.4rem;font-weight:700;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:1.5rem;font-size:.9rem}
.nav-links a{color:var(--muted)}
.main{flex:1;display:flex;align-items:center;justify-content:center;padding:2rem}
.card{background:var(--s1);border:1px solid var(--bdr);border-radius:16px;padding:2.5rem;width:100%;max-width:460px}
.card h1{font-size:1.8rem;font-weight:700;margin-bottom:.5rem;text-align:center}
.card h1 span{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.card .sub{text-align:center;color:var(--muted);margin-bottom:2rem;font-size:.95rem}
.form-group{margin-bottom:1.25rem}
.form-group label{display:block;font-size:.85rem;color:var(--muted);margin-bottom:.4rem;font-weight:500}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:.7rem 1rem;background:var(--s2);border:1px solid var(--bdr);border-radius:8px;color:var(--txt);font-size:.95rem;outline:none;transition:border-color .2s}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:var(--cyan)}
.form-group textarea{resize:vertical;min-height:100px}
.btn{display:block;width:100%;padding:.75rem;border-radius:8px;font-weight:600;font-size:1rem;border:none;cursor:pointer;transition:all .3s;text-align:center}
.btn-primary{background:var(--grad);color:#000}
.btn-primary:hover{opacity:.85;transform:translateY(-1px)}
.btn-outline{border:1px solid var(--cyan);color:var(--cyan);background:transparent;margin-top:.75rem}
.btn-outline:hover{background:rgba(0,212,255,.1)}
.divider{text-align:center;color:var(--muted);margin:1.5rem 0;font-size:.85rem;position:relative}
.divider::before,.divider::after{content:'';position:absolute;top:50%;width:40%;height:1px;background:var(--bdr)}
.divider::before{left:0}.divider::after{right:0}
.footer-text{text-align:center;margin-top:1.5rem;font-size:.85rem;color:var(--muted)}
.error{background:rgba(239,68,68,.1);border:1px solid var(--err);color:var(--err);padding:.75rem;border-radius:8px;margin-bottom:1rem;font-size:.9rem;display:none}
.success{background:rgba(16,185,129,.1);border:1px solid var(--emerald);color:var(--emerald);padding:.75rem;border-radius:8px;margin-bottom:1rem;font-size:.9rem;display:none}
.bismillah{text-align:center;color:var(--gold);font-size:1.1rem;margin-bottom:1.5rem;font-style:italic}
footer{padding:1.5rem;border-top:1px solid var(--bdr);text-align:center;color:var(--muted);font-size:.8rem}
footer a{text-decoration:none}footer a:hover{color:var(--cyan);text-decoration:underline}
@media(max-width:768px){.nav-links{display:none}.card{margin:1rem;padding:1.5rem}footer div[style*="flex"]{flex-direction:column;text-align:center}}
</style>
</head>
<body>
<nav>
  <a class="logo" href="https://darcloud.host">☁️ DarCloud</a>
  <div class="nav-links">
    <a href="https://darcloud.host">Home</a>
    <a href="https://darcloud.host/dashboard">Dashboard</a>
    <a href="https://ai.darcloud.host">AI</a>
    <a href="https://mesh.darcloud.host">Mesh</a>
    <a href="https://darcloud.net">Pricing</a>
    <a href="https://enterprise.darcloud.host">Enterprise</a>
    <a href="https://halalwealthclub.darcloud.host">HWC</a>
    <a href="https://discord.gg/darcloud" target="_blank" rel="noopener">Discord</a>
    <a href="https://darcloud.host/login">Sign In</a>
  </div>
</nav>
<div class="main">
${body}
</div>
<footer>
  <div style="max-width:1000px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;gap:2rem;padding:1rem 2rem;text-align:left">
    <div><strong style="color:var(--txt)">Platform</strong><br><a href="https://darcloud.host" style="color:var(--muted)">Home</a> · <a href="https://darcloud.host/dashboard" style="color:var(--muted)">Dashboard</a> · <a href="https://darcloud.host/docs" style="color:var(--muted)">API Docs</a> · <a href="https://darcloud.net" style="color:var(--muted)">Pricing</a></div>
    <div><strong style="color:var(--txt)">Ecosystem</strong><br><a href="https://ai.darcloud.host" style="color:var(--muted)">AI Fleet</a> · <a href="https://mesh.darcloud.host" style="color:var(--muted)">FungiMesh</a> · <a href="https://blockchain.darcloud.host" style="color:var(--muted)">Blockchain</a> · <a href="https://enterprise.darcloud.host" style="color:var(--muted)">Enterprise</a></div>
    <div><strong style="color:var(--txt)">Community</strong><br><a href="https://discord.gg/darcloud" target="_blank" rel="noopener" style="color:var(--muted)">Discord</a> · <a href="https://halalwealthclub.darcloud.host" style="color:var(--muted)">HWC</a> · <a href="https://realestate.darcloud.host" style="color:var(--muted)">Real Estate</a></div>
    <div><strong style="color:var(--txt)">Legal</strong><br><a href="https://darcloud.host/privacy" style="color:var(--muted)">Privacy Policy</a> · <a href="https://darcloud.host/terms" style="color:var(--muted)">Terms of Service</a></div>
  </div>
  <p style="margin-top:1rem">© 2026 DarCloud by Omar Abu Nadi. All rights reserved. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
</footer>
</body>
</html>`;
}

export const SIGNUP_PAGE = pageShell("Create Account", `
<div class="card">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1>Create Your <span>DarCloud</span> Account</h1>
  <p class="sub">Join the Islamic cloud ecosystem. Zero riba. 100% Shariah-compliant.</p>
  <div class="error" id="error"></div>
  <div class="success" id="success"></div>
  <form id="signupForm" onsubmit="return handleSignup(event)">
    <div class="form-group">
      <label for="name">Full Name</label>
      <input type="text" id="name" name="name" required placeholder="Omar Abu Nadi" autocomplete="name">
    </div>
    <div class="form-group">
      <label for="email">Email Address</label>
      <input type="email" id="email" name="email" required placeholder="you@example.com" autocomplete="email">
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required minlength="8" placeholder="Min 8 characters" autocomplete="new-password">
    </div>
    <div class="form-group">
      <label for="plan">Plan</label>
      <select id="plan" name="plan">
        <option value="starter">Starter — Free</option>
        <option value="pro">Professional — $49/mo</option>
        <option value="enterprise">Enterprise — Contact Sales</option>
      </select>
    </div>
    <button type="submit" class="btn btn-primary" id="submitBtn">Create Account</button>
  </form>
  <div class="divider">or</div>
  <a href="/login" class="btn btn-outline" style="display:block;text-decoration:none">Already have an account? Sign in</a>
  <p class="footer-text">By signing up you agree to our Shariah-compliant terms of service.</p>
</div>
<script>
async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const error = document.getElementById('error');
  const success = document.getElementById('success');
  error.style.display = 'none';
  success.style.display = 'none';
  btn.textContent = 'Creating account...';
  btn.disabled = true;
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        plan: document.getElementById('plan').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    success.textContent = 'Account created! Redirecting...';
    success.style.display = 'block';
    if (data.token) localStorage.setItem('darcloud_token', data.token);
    const plan = document.getElementById('plan').value;
    if (plan === 'pro') {
      setTimeout(() => window.location.href = '/checkout/pro', 1500);
    } else if (plan === 'enterprise') {
      setTimeout(() => window.location.href = 'https://enterprise.darcloud.host', 1500);
    } else {
      setTimeout(() => window.location.href = '/onboarding', 1500);
    }
  } catch(err) {
    error.textContent = err.message;
    error.style.display = 'block';
    btn.textContent = 'Create Account';
    btn.disabled = false;
  }
}
</script>
`);

export const LOGIN_PAGE = pageShell("Sign In", `
<div class="card">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1>Sign in to <span>DarCloud</span></h1>
  <p class="sub">Welcome back. Access your dashboard and services.</p>
  <div class="error" id="error"></div>
  <div class="success" id="success"></div>
  <form id="loginForm" onsubmit="return handleLogin(event)">
    <div class="form-group">
      <label for="email">Email Address</label>
      <input type="email" id="email" name="email" required placeholder="you@example.com" autocomplete="email">
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" required placeholder="Your password" autocomplete="current-password">
    </div>
    <button type="submit" class="btn btn-primary" id="submitBtn">Sign In</button>
  </form>
  <div class="divider">or</div>
  <a href="/signup" class="btn btn-outline" style="display:block;text-decoration:none">Don't have an account? Create one</a>
</div>
<script>
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const error = document.getElementById('error');
  const success = document.getElementById('success');
  error.style.display = 'none';
  success.style.display = 'none';
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    success.textContent = 'Welcome back! Redirecting...';
    success.style.display = 'block';
    localStorage.setItem('darcloud_token', data.token);
    setTimeout(() => window.location.href = '/dashboard', 1500);
  } catch(err) {
    error.textContent = err.message;
    error.style.display = 'block';
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
}
</script>
`);

export const ONBOARDING_PAGE = pageShell("Welcome to DarCloud", `
<div class="card" style="max-width:600px">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1>Welcome to <span>DarCloud</span> ✨</h1>
  <p class="sub">Your account is ready. Here's how to get started with the Islamic cloud ecosystem.</p>

  <div style="margin:2rem 0">
    <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;padding:1.25rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px">
      <div style="font-size:1.5rem">1️⃣</div>
      <div><strong style="color:var(--cyan)">Explore the API</strong><br><span style="color:var(--muted);font-size:.9rem">Browse all 25+ endpoints in the interactive API docs. Build integrations with blockchain, mesh, AI, and more.</span><br><a href="https://api.darcloud.host/api" style="font-size:.85rem;margin-top:.5rem;display:inline-block">Open API Docs →</a></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;padding:1.25rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px">
      <div style="font-size:1.5rem">2️⃣</div>
      <div><strong style="color:var(--cyan)">Meet the AI Fleet</strong><br><span style="color:var(--muted);font-size:.9rem">77 specialized AI agents ready to work. Chat with QuranChain AI, deploy bots, or explore the full fleet.</span><br><a href="https://ai.darcloud.host" style="font-size:.85rem;margin-top:.5rem;display:inline-block">Browse AI Agents →</a></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;padding:1.25rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px">
      <div style="font-size:1.5rem">3️⃣</div>
      <div><strong style="color:var(--cyan)">Join Halal Wealth Club</strong><br><span style="color:var(--muted);font-size:.9rem">Access halal banking, zero-riba home loans with just $5K down, business loans, and more.</span><br><a href="https://halalwealthclub.darcloud.host" style="font-size:.85rem;margin-top:.5rem;display:inline-block">Learn About HWC →</a></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:1rem;padding:1.25rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px">
      <div style="font-size:1.5rem">4️⃣</div>
      <div><strong style="color:var(--cyan)">Upgrade to Pro</strong><br><span style="color:var(--muted);font-size:.9rem">Unlimited API calls, 10 AI agents, full mesh + blockchain access, and HWC membership. $49/mo.</span><br><a href="/checkout/pro" style="font-size:.85rem;margin-top:.5rem;display:inline-block">Upgrade to Pro →</a></div>
    </div>
  </div>

  <a href="https://darcloud.host" class="btn btn-primary" style="text-decoration:none">Go to DarCloud Dashboard</a>
  <a href="https://darcloud.net" class="btn btn-outline" style="text-decoration:none">Explore DarCloud.net</a>
</div>
`);

export function checkoutPage(plan: string): string {
  const plans: Record<string, { name: string; price: string; features: string[] }> = {
    starter: {
      name: "Starter",
      price: "Free",
      features: ["API Access (1K req/day)", "1 AI Agent", "Basic Mesh Access", "Community Support"]
    },
    pro: {
      name: "Professional",
      price: "$49/mo",
      features: ["Unlimited API Calls", "10 AI Agents", "Full Mesh + Blockchain", "Priority Support", "HWC Membership"]
    },
    startup: {
      name: "Enterprise Startup",
      price: "$499/mo",
      features: ["5 Dedicated VMs", "10 AI Agents", "Basic Compliance Engine", "Email Support", "99.9% SLA"]
    },
    business: {
      name: "Enterprise Business",
      price: "$1,999/mo",
      features: ["20 Dedicated VMs", "30 AI Agents", "Full Compliance Engine", "Priority Support", "99.95% SLA", "Custom Billing"]
    }
  };

  const p = plans[plan] || plans.pro;
  const featureHtml = p.features.map(f => `<li style="padding:.4rem 0;font-size:.9rem;color:var(--muted)">✓ ${f}</li>`).join("");

  return pageShell(`Checkout — ${p.name}`, `
<div class="card" style="max-width:500px">
  <h1>Checkout: <span>${p.name}</span></h1>
  <p class="sub">Secure, Shariah-compliant payment via DarPay™</p>
  <div class="error" id="error"></div>
  <div class="success" id="success"></div>

  <div style="text-align:center;padding:1.5rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px;margin-bottom:1.5rem">
    <div style="font-size:2.5rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${p.price}</div>
    <div style="color:var(--muted);font-size:.9rem;margin-top:.25rem">Billed monthly • Cancel anytime</div>
  </div>

  <ul style="list-style:none;margin-bottom:1.5rem;padding:0">${featureHtml}</ul>

  <form id="checkoutForm" onsubmit="return handleCheckout(event)">
    <div class="form-group">
      <label for="email">Email Address</label>
      <input type="email" id="email" name="email" required placeholder="you@example.com">
    </div>
    <div class="form-group">
      <label for="name">Full Name</label>
      <input type="text" id="name" name="name" required placeholder="Your name">
    </div>
    <button type="submit" class="btn btn-primary" id="submitBtn">Subscribe — ${p.price}</button>
  </form>

  <p style="text-align:center;margin-top:1rem;font-size:.8rem;color:var(--muted)">
    🔒 Powered by DarPay™ • Zero riba • 2% Zakat auto-calculated
  </p>
  <a href="/signup" class="btn btn-outline" style="text-decoration:none;margin-top:.5rem">← Back to signup</a>
</div>
<script>
async function handleCheckout(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const error = document.getElementById('error');
  const success = document.getElementById('success');
  error.style.display = 'none';
  success.style.display = 'none';
  btn.textContent = 'Processing...';
  btn.disabled = true;
  try {
    const res = await fetch('/api/checkout/session', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: document.getElementById('email').value,
        name: document.getElementById('name').value,
        plan: '${plan}'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    if (data.checkout_url) {
      success.textContent = 'Redirecting to secure checkout...';
      success.style.display = 'block';
      setTimeout(() => window.location.href = data.checkout_url, 1000);
    } else {
      success.textContent = data.message || 'Subscription recorded! Redirecting to onboarding...';
      success.style.display = 'block';
      setTimeout(() => window.location.href = '/onboarding', 2000);
    }
  } catch(err) {
    error.textContent = err.message;
    error.style.display = 'block';
    btn.textContent = 'Subscribe — ${p.price}';
    btn.disabled = false;
  }
}
</script>
`);
}

// ── Checkout Success/Cancel Pages ──
export function checkoutResultPage(status: string, sessionId?: string): string {
  if (status === "success") {
    return pageShell("Payment Success", `
<div class="card" style="max-width:500px;text-align:center">
  <div style="font-size:4rem;margin-bottom:1rem">✅</div>
  <h1>Payment <span>Successful!</span></h1>
  <p class="sub">Alhamdulillah — your subscription is now active.</p>
  <p style="color:var(--muted);font-size:.9rem;margin:1rem 0">
    Session: <code>${sessionId || "N/A"}</code>
  </p>
  <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:12px;padding:1.25rem;margin:1.5rem 0">
    <p style="font-size:.9rem;color:var(--muted);margin:0">Your services are being provisioned. You'll receive a confirmation email shortly.</p>
  </div>
  <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
    <a href="/dashboard" class="btn btn-primary" style="text-decoration:none">Go to Dashboard</a>
    <a href="https://discord.gg/darcloud" class="btn btn-outline" style="text-decoration:none">Join Discord</a>
  </div>
  <p style="text-align:center;margin-top:1.5rem;font-size:.8rem;color:var(--muted)">
    2% Zakat automatically calculated and distributed • Shariah-compliant
  </p>
</div>`);
  }
  return pageShell("Payment Cancelled", `
<div class="card" style="max-width:500px;text-align:center">
  <div style="font-size:4rem;margin-bottom:1rem">↩️</div>
  <h1>Checkout <span>Cancelled</span></h1>
  <p class="sub">No charges were made. You can try again anytime.</p>
  <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-top:1.5rem">
    <a href="/checkout/pro" class="btn btn-primary" style="text-decoration:none">Try Again</a>
    <a href="https://www.darcloud.host/" class="btn btn-outline" style="text-decoration:none">Back to Home</a>
  </div>
</div>`);
}

// ── Dashboard Page (post-login) ──
export const DASHBOARD_PAGE = pageShell("Dashboard", `
<div class="card" style="max-width:900px">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1>Your <span>DarCloud</span> Dashboard</h1>
  <p class="sub" id="greeting">Loading your dashboard...</p>
  <div class="error" id="error" style="display:none"></div>

  <div id="dashContent" style="display:none">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin:2rem 0">
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:1.8rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent" id="planName">—</div>
        <div style="color:var(--muted);font-size:.8rem;margin-top:.25rem">Current Plan</div>
      </div>
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:1.8rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent" id="aiAgents">—</div>
        <div style="color:var(--muted);font-size:.8rem;margin-top:.25rem">AI Agents</div>
      </div>
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:1.8rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent" id="healthStatus">—</div>
        <div style="color:var(--muted);font-size:.8rem;margin-top:.25rem">System Health</div>
      </div>
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:12px;padding:1.25rem;text-align:center">
        <div style="font-size:1.8rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent" id="dbTables">—</div>
        <div style="color:var(--muted);font-size:.8rem;margin-top:.25rem">D1 Tables</div>
      </div>
    </div>

    <h2 style="font-size:1.2rem;margin:2rem 0 1rem;color:var(--cyan)">Quick Actions</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:2rem">
      <a href="/docs" style="text-decoration:none;display:flex;align-items:flex-start;gap:.75rem;padding:1rem;background:var(--s2);border:1px solid var(--bdr);border-radius:10px">
        <div style="font-size:1.3rem">📚</div>
        <div><strong style="color:var(--txt)">API Docs</strong><br><span style="color:var(--muted);font-size:.8rem">Interactive OpenAPI explorer</span></div>
      </a>
      <a href="https://ai.darcloud.host" style="text-decoration:none;display:flex;align-items:flex-start;gap:.75rem;padding:1rem;background:var(--s2);border:1px solid var(--bdr);border-radius:10px">
        <div style="font-size:1.3rem">🤖</div>
        <div><strong style="color:var(--txt)">AI Fleet</strong><br><span style="color:var(--muted);font-size:.8rem">77 agents at your service</span></div>
      </a>
      <a href="https://mesh.darcloud.host" style="text-decoration:none;display:flex;align-items:flex-start;gap:.75rem;padding:1rem;background:var(--s2);border:1px solid var(--bdr);border-radius:10px">
        <div style="font-size:1.3rem">🌐</div>
        <div><strong style="color:var(--txt)">FungiMesh</strong><br><span style="color:var(--muted);font-size:.8rem">Encrypted mesh network</span></div>
      </a>
      <a href="https://blockchain.darcloud.host" style="text-decoration:none;display:flex;align-items:flex-start;gap:.75rem;padding:1rem;background:var(--s2);border:1px solid var(--bdr);border-radius:10px">
        <div style="font-size:1.3rem">⛓️</div>
        <div><strong style="color:var(--txt)">Blockchain</strong><br><span style="color:var(--muted);font-size:.8rem">QuranChain explorer</span></div>
      </a>
      <a href="https://halalwealthclub.darcloud.host" style="text-decoration:none;display:flex;align-items:flex-start;gap:.75rem;padding:1rem;background:var(--s2);border:1px solid var(--bdr);border-radius:10px">
        <div style="font-size:1.3rem">💰</div>
        <div><strong style="color:var(--txt)">Halal Wealth Club</strong><br><span style="color:var(--muted);font-size:.8rem">Zero-riba banking</span></div>
      </a>
      <a href="/checkout/pro" style="text-decoration:none;display:flex;align-items:flex-start;gap:.75rem;padding:1rem;background:var(--s2);border:1px solid var(--bdr);border-radius:10px">
        <div style="font-size:1.3rem">⚡</div>
        <div><strong style="color:var(--txt)">Upgrade Plan</strong><br><span style="color:var(--muted);font-size:.8rem">Unlock full features</span></div>
      </a>
    </div>

    <div style="display:flex;gap:1rem;flex-wrap:wrap">
      <a href="/admin" class="btn btn-outline" style="text-decoration:none;flex:1;min-width:140px">Admin Panel</a>
      <button onclick="logout()" class="btn btn-outline" style="flex:1;min-width:140px;color:var(--err);border-color:var(--err)">Sign Out</button>
    </div>
  </div>
</div>
<script>
(async function() {
  const token = localStorage.getItem('darcloud_token');
  // Check SSO cookie session first, then localStorage
  let meRes;
  if (token) {
    meRes = await fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token }, credentials: 'include' });
  } else {
    // Try cookie-based session
    meRes = await fetch('/api/auth/session', { credentials: 'include' });
  }
  if (!meRes.ok && !token) { window.location.href = '/login'; return; }
  const meData = await meRes.json();
  if (!meData.success && !meData.authenticated) { localStorage.removeItem('darcloud_token'); window.location.href = '/login'; return; }
  const me = meData;
  const user = me.user;
  try {
    const healthRes = await fetch('/health');
    document.getElementById('greeting').textContent = 'As-salamu alaykum, ' + user.name + '!';
    document.getElementById('planName').textContent = (user.plan || 'starter').charAt(0).toUpperCase() + (user.plan || 'starter').slice(1);
    if (healthRes.ok) {
      const health = await healthRes.json();
      document.getElementById('healthStatus').textContent = health.status === 'healthy' ? '✅' : '⚠️';
      document.getElementById('dbTables').textContent = health.components?.database?.tables || '—';
      document.getElementById('aiAgents').textContent = health.components?.ai_agents || '77';
    } else {
      document.getElementById('healthStatus').textContent = '⚠️';
      document.getElementById('dbTables').textContent = '—';
      document.getElementById('aiAgents').textContent = '77';
    }
    document.getElementById('dashContent').style.display = 'block';
  } catch(e) {
    document.getElementById('error').textContent = 'Failed to load dashboard: ' + e.message;
    document.getElementById('error').style.display = 'block';
  }
})();
function logout() {
  localStorage.removeItem('darcloud_token');
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => { window.location.href = '/login'; });
}
setInterval(async () => {
  const t = localStorage.getItem('darcloud_token');
  if (!t) return;
  try { const r = await fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + t } }); if (!r.ok) { localStorage.removeItem('darcloud_token'); window.location.href = '/login'; } } catch(e) {}
}, 300000);
</script>
`);

// ── Admin Panel Page ──
export const ADMIN_PAGE = pageShell("Admin Panel", `
<div class="card" style="max-width:1000px">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1><span>DarCloud</span> Admin Panel</h1>
  <p class="sub">System overview and management</p>
  <div class="error" id="error" style="display:none"></div>

  <div id="adminContent" style="display:none">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.75rem;margin:2rem 0">
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:10px;padding:1rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:var(--cyan)" id="s-users">—</div>
        <div style="color:var(--muted);font-size:.75rem">Users</div>
      </div>
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:10px;padding:1rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:var(--cyan)" id="s-companies">—</div>
        <div style="color:var(--muted);font-size:.75rem">Companies</div>
      </div>
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:10px;padding:1rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:var(--cyan)" id="s-contracts">—</div>
        <div style="color:var(--muted);font-size:.75rem">Contracts</div>
      </div>
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:10px;padding:1rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:var(--cyan)" id="s-filings">—</div>
        <div style="color:var(--muted);font-size:.75rem">Legal Filings</div>
      </div>
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:10px;padding:1rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:var(--cyan)" id="s-ip">—</div>
        <div style="color:var(--muted);font-size:.75rem">IP Protections</div>
      </div>
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:10px;padding:1rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:var(--cyan)" id="s-contacts">—</div>
        <div style="color:var(--muted);font-size:.75rem">Contact Msgs</div>
      </div>
      <div style="background:var(--s2);border:1px solid var(--bdr);border-radius:10px;padding:1rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:var(--cyan)" id="s-hwc">—</div>
        <div style="color:var(--muted);font-size:.75rem">HWC Apps</div>
      </div>
    </div>

    <h2 style="font-size:1.1rem;margin:2rem 0 1rem;color:var(--cyan)">Plan Breakdown</h2>
    <div id="planBreakdown" style="margin-bottom:2rem"></div>

    <h2 style="font-size:1.1rem;margin:2rem 0 1rem;color:var(--cyan)">Recent Users</h2>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:.85rem" id="usersTable">
        <thead><tr style="border-bottom:1px solid var(--bdr)">
          <th style="text-align:left;padding:.5rem;color:var(--muted)">Email</th>
          <th style="text-align:left;padding:.5rem;color:var(--muted)">Name</th>
          <th style="text-align:left;padding:.5rem;color:var(--muted)">Plan</th>
          <th style="text-align:left;padding:.5rem;color:var(--muted)">Joined</th>
        </tr></thead>
        <tbody id="usersBody"></tbody>
      </table>
    </div>

    <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:2rem">
      <a href="/dashboard" class="btn btn-outline" style="text-decoration:none;flex:1;min-width:140px">← Dashboard</a>
      <button onclick="seedAll()" class="btn btn-primary" style="flex:1;min-width:140px" id="seedBtn">Bootstrap Ecosystem</button>
    </div>
  </div>
</div>
<script>
(async function() {
  const token = localStorage.getItem('darcloud_token');
  if (!token) { window.location.href = '/login'; return; }
  try {
    const res = await fetch('/api/admin/stats', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) { if (res.status === 401) { localStorage.removeItem('darcloud_token'); window.location.href = '/login'; } return; }
    const d = await res.json();
    const s = d.stats;
    document.getElementById('s-users').textContent = s.users;
    document.getElementById('s-companies').textContent = s.companies;
    document.getElementById('s-contracts').textContent = s.contracts;
    document.getElementById('s-filings').textContent = s.legal_filings;
    document.getElementById('s-ip').textContent = s.ip_protections;
    document.getElementById('s-contacts').textContent = s.contact_submissions;
    document.getElementById('s-hwc').textContent = s.hwc_applications;
    const pb = document.getElementById('planBreakdown');
    pb.innerHTML = (d.plan_breakdown || []).map(p =>
      '<span style="display:inline-block;background:var(--s2);border:1px solid var(--bdr);border-radius:6px;padding:.4rem .8rem;margin:.25rem;font-size:.85rem">' +
      '<strong style="color:var(--cyan)">' + p.plan + '</strong>: ' + p.count + '</span>'
    ).join('');
    const tb = document.getElementById('usersBody');
    tb.innerHTML = (d.recent_users || []).map(u =>
      '<tr style="border-bottom:1px solid var(--bdr)">' +
      '<td style="padding:.5rem">' + u.email + '</td>' +
      '<td style="padding:.5rem">' + u.name + '</td>' +
      '<td style="padding:.5rem"><span style="background:rgba(0,212,255,.1);color:var(--cyan);padding:.15rem .5rem;border-radius:4px;font-size:.8rem">' + u.plan + '</span></td>' +
      '<td style="padding:.5rem;color:var(--muted)">' + (u.created_at || '').substring(0,10) + '</td></tr>'
    ).join('');
    document.getElementById('adminContent').style.display = 'block';
  } catch(e) {
    document.getElementById('error').textContent = 'Failed to load: ' + e.message;
    document.getElementById('error').style.display = 'block';
  }
})();
async function seedAll() {
  if (!confirm('Bootstrap the full DarCloud ecosystem? This will seed all 101 companies, 175 contracts, and legal filings into the database.')) return;
  const btn = document.getElementById('seedBtn');
  const token = localStorage.getItem('darcloud_token');
  btn.textContent = 'Bootstrapping...'; btn.disabled = true;
  try {
    const res = await fetch('/api/contracts/bootstrap', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Bootstrap failed (status ' + res.status + ')'); }
    const d = await res.json();
    btn.textContent = 'Done! Reloading...';
    setTimeout(() => window.location.reload(), 1500);
  } catch(e) { btn.textContent = 'Failed: ' + e.message; btn.disabled = false; }
}
</script>
`);

// ── Privacy Policy ──
export const PRIVACY_PAGE = pageShell("Privacy Policy", `
<div class="card" style="max-width:800px">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1><span>Privacy Policy</span></h1>
  <p class="sub">Last updated: March 13, 2026</p>

  <div style="text-align:left;line-height:1.8;color:var(--txt);font-size:.95rem">

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">1. Introduction</h2>
  <p>DarCloud ("we," "us," or "our"), operated by Omar Abu Nadi, is committed to protecting your privacy in accordance with Islamic principles of <em>amanah</em> (trust) and transparency. This Privacy Policy explains how we collect, use, and safeguard your information across all DarCloud services, including darcloud.host, darcloud.net, and all associated subdomains and Discord bots.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">2. Information We Collect</h2>
  <p><strong>Account Information:</strong> Name, email address, and password hash when you create a DarCloud account.</p>
  <p><strong>Discord Data:</strong> Discord user ID, username, and guild membership when interacting with our bots. We do not store message content.</p>
  <p><strong>Payment Information:</strong> Processed securely through Stripe. We never store full credit card numbers. All transactions are Shariah-compliant — zero riba (interest).</p>
  <p><strong>Usage Data:</strong> API request logs, page visits, and service interactions for operational monitoring via Cloudflare Analytics.</p>
  <p><strong>Mesh Network Data:</strong> Node identifiers, heartbeat timestamps, and network topology for FungiMesh participants.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">3. How We Use Your Information</h2>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li>Provide and maintain DarCloud services across all 101 companies</li>
    <li>Process Shariah-compliant payments via DarPay</li>
    <li>Authenticate users and manage account security (JWT tokens, 24h expiry)</li>
    <li>Monitor system health and prevent abuse</li>
    <li>Communicate service updates and onboarding information</li>
    <li>Calculate and distribute Zakat (2% of eligible revenue)</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">4. Data Storage & Security</h2>
  <p>Your data is stored on <strong>Cloudflare's global network</strong> using D1 databases with encryption at rest. API communications are encrypted via TLS 1.3. We implement rate limiting (5 attempts/min on auth endpoints) and use HMAC-SHA256 for token signing.</p>
  <p>FungiMesh network data is distributed across mesh nodes with dual-layer encryption.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">5. Data Sharing</h2>
  <p>We do <strong>not</strong> sell, rent, or trade your personal information. Data may be shared with:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant)</li>
    <li><strong>Cloudflare:</strong> Infrastructure hosting and CDN</li>
    <li><strong>Discord:</strong> Bot functionality and user verification</li>
    <li><strong>DarCloud subsidiaries:</strong> Inter-company service delivery as defined in our 175 active contracts</li>
  </ul>
  <p>We will never share data with services that engage in riba-based transactions or haram activities.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">6. Revenue Distribution Transparency</h2>
  <p>DarCloud operates with full transparency on revenue allocation:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li>30% — Founder</li>
    <li>40% — AI Validators</li>
    <li>10% — Hardware Hosts</li>
    <li>18% — Ecosystem Development</li>
    <li>2% — Zakat (mandatory charitable giving)</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">7. Your Rights</h2>
  <p>You have the right to:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li>Access your personal data via <code style="background:var(--s2);padding:2px 6px;border-radius:4px">/api/auth/me</code></li>
    <li>Request data deletion by contacting us</li>
    <li>Export your data in JSON format (use the button below)</li>
    <li>Opt out of non-essential communications</li>
    <li>Withdraw consent at any time</li>
  </ul>
  <div style="margin:1rem 0">
    <button onclick="exportData()" class="btn btn-outline" style="max-width:300px;margin:0 auto" id="exportBtn">Export My Data (JSON)</button>
    <p id="exportMsg" style="text-align:center;margin-top:.5rem;font-size:.85rem;display:none"></p>
  </div>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">8. Cookies & Tracking</h2>
  <p>We use minimal cookies for authentication (JWT session tokens). We do not use third-party tracking cookies, ad networks, or behavioral analytics. Cloudflare may set security cookies for DDoS protection.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">9. Children's Privacy</h2>
  <p>DarCloud services are not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us data, please contact us for immediate removal.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">10. International Data</h2>
  <p>DarCloud operates across 153 countries via Cloudflare's edge network. By using our services, you consent to data processing in the jurisdiction where Cloudflare edge servers are located. We comply with applicable data protection laws including GDPR, CCPA, and PDPA.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">11. Changes to This Policy</h2>
  <p>We may update this policy periodically. Changes will be posted at <a href="https://darcloud.host/privacy">darcloud.host/privacy</a> with an updated revision date. Continued use of our services constitutes acceptance of the revised policy.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">12. Contact</h2>
  <p>For privacy inquiries, data requests, or concerns:</p>
  <p style="margin-top:.5rem">
    <strong>Omar Abu Nadi</strong><br>
    Email: <a href="mailto:omarabunadi28@gmail.com">omarabunadi28@gmail.com</a><br>
    Web: <a href="https://darcloud.host">darcloud.host</a><br>
    Discord: DarCloud Community Server
  </p>

  <div style="margin-top:1.5rem;padding:1.25rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px">
    <h3 style="color:var(--cyan);font-size:1rem;margin-bottom:1rem">Privacy Request Form</h3>
    <div id="contactError" style="background:rgba(239,68,68,.1);border:1px solid var(--err);color:var(--err);padding:.5rem;border-radius:6px;margin-bottom:.75rem;font-size:.85rem;display:none"></div>
    <div id="contactSuccess" style="background:rgba(16,185,129,.1);border:1px solid var(--emerald);color:var(--emerald);padding:.5rem;border-radius:6px;margin-bottom:.75rem;font-size:.85rem;display:none"></div>
    <form onsubmit="return submitPrivacyRequest(event)">
      <div style="margin-bottom:.75rem"><label style="display:block;font-size:.8rem;color:var(--muted);margin-bottom:.3rem">Email</label><input type="email" id="prEmail" required style="width:100%;padding:.5rem .75rem;background:var(--bg);border:1px solid var(--bdr);border-radius:6px;color:var(--txt);font-size:.9rem" placeholder="you@example.com"></div>
      <div style="margin-bottom:.75rem"><label style="display:block;font-size:.8rem;color:var(--muted);margin-bottom:.3rem">Request Type</label><select id="prType" style="width:100%;padding:.5rem .75rem;background:var(--bg);border:1px solid var(--bdr);border-radius:6px;color:var(--txt);font-size:.9rem"><option value="data-access">Access My Data</option><option value="data-deletion">Delete My Data</option><option value="data-export">Export My Data</option><option value="opt-out">Opt Out of Communications</option><option value="other">Other Inquiry</option></select></div>
      <div style="margin-bottom:.75rem"><label style="display:block;font-size:.8rem;color:var(--muted);margin-bottom:.3rem">Details</label><textarea id="prDetails" rows="3" style="width:100%;padding:.5rem .75rem;background:var(--bg);border:1px solid var(--bdr);border-radius:6px;color:var(--txt);font-size:.9rem;resize:vertical" placeholder="Describe your request..."></textarea></div>
      <button type="submit" class="btn btn-primary" style="max-width:200px" id="prSubmitBtn">Submit Request</button>
    </form>
  </div>

  <div style="margin-top:2rem;padding:1rem;background:var(--s2);border-radius:8px;border-left:3px solid var(--gold);color:var(--muted);font-size:.85rem">
    <em>"Indeed, Allah commands you to render trusts to whom they are due." — Quran 4:58</em>
  </div>

  </div>
</div>
<script>
async function exportData() {
  const btn = document.getElementById('exportBtn');
  const msg = document.getElementById('exportMsg');
  const token = localStorage.getItem('darcloud_token');
  if (!token) { msg.textContent = 'Please log in first to export your data.'; msg.style.color = 'var(--err)'; msg.style.display = 'block'; return; }
  btn.textContent = 'Exporting...'; btn.disabled = true;
  try {
    const res = await fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error('Authentication failed. Please log in again.');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'darcloud-my-data-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    msg.textContent = 'Data exported successfully!'; msg.style.color = 'var(--emerald)'; msg.style.display = 'block';
  } catch(e) { msg.textContent = e.message; msg.style.color = 'var(--err)'; msg.style.display = 'block'; }
  btn.textContent = 'Export My Data (JSON)'; btn.disabled = false;
}
async function submitPrivacyRequest(e) {
  e.preventDefault();
  const btn = document.getElementById('prSubmitBtn');
  const err = document.getElementById('contactError');
  const suc = document.getElementById('contactSuccess');
  err.style.display = 'none'; suc.style.display = 'none';
  const email = document.getElementById('prEmail').value;
  const type = document.getElementById('prType').value;
  const details = document.getElementById('prDetails').value;
  if (!email) { err.textContent = 'Please enter your email.'; err.style.display = 'block'; return false; }
  btn.textContent = 'Submitting...'; btn.disabled = true;
  try {
    const res = await fetch('/api/privacy-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type, details })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Submission failed');
    suc.textContent = 'Privacy request submitted successfully. Reference: ' + (data.reference || 'PR-' + Date.now()) + '. We will respond within 30 days.';
    suc.style.display = 'block';
    e.target.reset();
  } catch(err2) { err.textContent = err2.message; err.style.display = 'block'; }
  btn.textContent = 'Submit Request'; btn.disabled = false;
  return false;
}
</script>
`);

// ── Terms of Service ──
export const TERMS_PAGE = pageShell("Terms of Service", `
<div class="card" style="max-width:800px">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1><span>Terms of Service</span></h1>
  <p class="sub">Last updated: March 13, 2026</p>

  <div style="text-align:left;line-height:1.8;color:var(--txt);font-size:.95rem">

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">1. Acceptance of Terms</h2>
  <p>By accessing or using any DarCloud services — including darcloud.host, darcloud.net, all subdomains, Discord bots, APIs, and related applications — you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you may not use our services.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">2. Service Description</h2>
  <p>DarCloud is a Shariah-compliant cloud infrastructure ecosystem operated by Omar Abu Nadi, comprising 101 companies across six sectors: Core Platform, Islamic Finance & Banking, AI & Technology, Halal Lifestyle & Commerce, Blockchain & DeFi, and International & Regional operations.</p>
  <p>Our services include but are not limited to: cloud hosting, API access, AI fleet management, FungiMesh encrypted networking, QuranChain blockchain, DarPay payment processing, MeshTalk communications, and the Halal Wealth Club.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">3. Account Registration</h2>
  <p>To access certain features, you must create an account. You agree to:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li>Provide accurate, current, and complete registration information</li>
    <li>Maintain the security of your password and JWT tokens</li>
    <li>Accept responsibility for all activities under your account</li>
    <li>Notify us immediately of any unauthorized use</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">4. Shariah Compliance</h2>
  <p>All DarCloud services operate under strict Shariah compliance:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li><strong>Zero Riba (Interest):</strong> No interest-based transactions on any platform</li>
    <li><strong>Halal Operations:</strong> All business activities comply with Islamic principles</li>
    <li><strong>Zakat:</strong> 2% of eligible revenue is allocated to Zakat as a mandatory charitable obligation</li>
    <li><strong>Transparency:</strong> Revenue split is public: 30% Founder, 40% AI Validators, 10% Hardware Hosts, 18% Ecosystem, 2% Zakat</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">5. Acceptable Use</h2>
  <p>You agree NOT to use DarCloud services to:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li>Engage in any haram (forbidden) activities</li>
    <li>Process riba-based financial transactions</li>
    <li>Distribute illegal, hateful, or harmful content</li>
    <li>Attempt to compromise system security or other users' data</li>
    <li>Exceed rate limits (5 requests/minute on authentication endpoints)</li>
    <li>Resell services without authorization</li>
    <li>Violate any applicable laws or regulations</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">6. Payment Terms</h2>
  <p><strong>Pricing:</strong> Service plans are listed on each product page. All prices are in USD.</p>
  <p><strong>Billing:</strong> Subscriptions are billed monthly via DarPay (Stripe backend). All payments are processed in a Shariah-compliant manner with zero interest.</p>
  <p><strong>Refunds:</strong> We offer a 14-day refund policy from the date of purchase. Refund requests must be submitted via email to omarabunadi28@gmail.com.</p>
  <p><strong>Cancellation:</strong> You may cancel your subscription at any time. Access continues until the end of the current billing period.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">7. Intellectual Property</h2>
  <p>All DarCloud branding, technology, content, and infrastructure — including QuranChain\u2122, FungiMesh\u2122, DarPay\u2122, DarLaw AI\u2122, and all 101 company brands — are the property of Omar Abu Nadi and DarCloud. Our IP portfolio includes 75 trademarks, 27 patents, 8 copyrights, and 6 trade secrets across 153 countries.</p>
  <p>You retain ownership of content you create using our services. By using our services, you grant DarCloud a license to host and display your content as necessary to provide the services.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">8. API Usage</h2>
  <p>Access to the DarCloud API is governed by:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li>Authentication via JWT tokens (HMAC-SHA256, 24-hour expiry)</li>
    <li>Rate limiting as specified in API documentation at <a href="https://darcloud.host/docs">darcloud.host/docs</a></li>
    <li>Fair use policy — excessive automated requests may be throttled</li>
    <li>API responses are for your use only and may not be redistributed</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">9. FungiMesh Network</h2>
  <p>Participation in the FungiMesh mesh network is subject to additional terms:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li>Node operators agree to maintain uptime and respond to heartbeat checks</li>
    <li>All mesh traffic is encrypted with dual-layer encryption</li>
    <li>Node operators receive compensation per the Hardware Hosts revenue allocation (10%)</li>
    <li>DarCloud reserves the right to remove non-compliant nodes</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">10. Limitation of Liability</h2>
  <p>DarCloud services are provided "as is" without warranties of any kind. To the maximum extent permitted by law, DarCloud shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the services.</p>
  <p>Our total liability shall not exceed the amount you paid for the services in the 12 months preceding the claim.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">11. Termination</h2>
  <p>We may suspend or terminate your account if you violate these Terms, engage in haram activities on our platform, or fail to pay for subscribed services. Upon termination, you may request export of your data within 30 days.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">12. Governing Law</h2>
  <p>These Terms are governed by and construed in accordance with the laws applicable to international cloud service agreements, with consideration for Islamic Shariah principles in matters of finance and commerce.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">13. Changes to Terms</h2>
  <p>We reserve the right to modify these Terms at any time. Changes will be posted at <a href="https://darcloud.host/terms">darcloud.host/terms</a>. Continued use of our services after changes constitutes acceptance of the revised Terms.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">14. Contact</h2>
  <p>For questions about these Terms:</p>
  <p style="margin-top:.5rem">
    <strong>Omar Abu Nadi</strong><br>
    Email: <a href="mailto:omarabunadi28@gmail.com">omarabunadi28@gmail.com</a><br>
    Web: <a href="https://darcloud.host">darcloud.host</a><br>
    Privacy Policy: <a href="https://darcloud.host/privacy">darcloud.host/privacy</a>
  </p>

  <div style="margin-top:2rem;padding:1rem;background:var(--s2);border-radius:8px;border-left:3px solid var(--gold);color:var(--muted);font-size:.85rem">
    <em>"O you who believe, fulfill your contracts." — Quran 5:1</em>
  </div>

  </div>
</div>
`);
