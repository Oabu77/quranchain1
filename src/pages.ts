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
@media(max-width:768px){.nav-links{display:none}.card{margin:1rem;padding:1.5rem}}
</style>
</head>
<body>
<nav>
  <a class="logo" href="https://darcloud.host">☁️ DarCloud</a>
  <div class="nav-links">
    <a href="https://darcloud.host">Home</a>
    <a href="https://darcloud.net">Pricing</a>
    <a href="https://enterprise.darcloud.host">Enterprise</a>
    <a href="https://halalwealthclub.darcloud.host">HWC</a>
  </div>
</nav>
<div class="main">
${body}
</div>
<footer>© 2026 DarCloud by Omar Abu Nadi. All rights reserved. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</footer>
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
        <div style="font-size:1.8rem;font-weight:800;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent">77</div>
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
  if (!token) { window.location.href = '/login'; return; }
  try {
    const [meRes, healthRes] = await Promise.all([
      fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } }),
      fetch('/health')
    ]);
    if (!meRes.ok) { localStorage.removeItem('darcloud_token'); window.location.href = '/login'; return; }
    const me = await meRes.json();
    const health = await healthRes.json();
    document.getElementById('greeting').textContent = 'As-salamu alaykum, ' + me.user.name + '!';
    document.getElementById('planName').textContent = (me.user.plan || 'starter').charAt(0).toUpperCase() + (me.user.plan || 'starter').slice(1);
    document.getElementById('healthStatus').textContent = health.status === 'healthy' ? '✅' : '⚠️';
    document.getElementById('dbTables').textContent = health.components?.database?.tables || '—';
    document.getElementById('dashContent').style.display = 'block';
  } catch(e) {
    document.getElementById('error').textContent = 'Failed to load dashboard: ' + e.message;
    document.getElementById('error').style.display = 'block';
  }
})();
function logout() { localStorage.removeItem('darcloud_token'); window.location.href = '/login'; }
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
  const btn = document.getElementById('seedBtn');
  const token = localStorage.getItem('darcloud_token');
  btn.textContent = 'Bootstrapping...'; btn.disabled = true;
  try {
    const res = await fetch('/api/contracts/bootstrap', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
    const d = await res.json();
    btn.textContent = 'Done! Reloading...';
    setTimeout(() => window.location.reload(), 1500);
  } catch(e) { btn.textContent = 'Failed: ' + e.message; }
}
</script>
`);
