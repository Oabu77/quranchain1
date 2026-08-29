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
    <a href="https://darcloud.host/onboarding">Preview Guide</a>
    <a href="https://ai.darcloud.host">AI</a>
    <a href="https://mesh.darcloud.host">Mesh</a>
    <a href="https://darcloud.net">Preview Catalog</a>
    <a href="https://enterprise.darcloud.host">Enterprise</a>
    <a href="https://wallet.darcloud.host">Wallet Research</a>
    <a href="https://discord.gg/darcloud" target="_blank" rel="noopener">Discord</a>
  </div>
</nav>
<div class="main">
${body}
</div>
<footer>
  <div style="max-width:1000px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;gap:2rem;padding:1rem 2rem;text-align:left">
    <div><strong style="color:var(--txt)">Platform</strong><br><a href="https://darcloud.host" style="color:var(--muted)">Home</a> · <a href="https://darcloud.host/onboarding" style="color:var(--muted)">Preview Guide</a> · <a href="https://darcloud.host/docs" style="color:var(--muted)">API Docs</a> · <a href="https://darcloud.net" style="color:var(--muted)">Preview Catalog</a></div>
    <div><strong style="color:var(--txt)">Ecosystem</strong><br><a href="https://ai.darcloud.host" style="color:var(--muted)">AI Fleet</a> · <a href="https://mesh.darcloud.host" style="color:var(--muted)">FungiMesh</a> · <a href="https://blockchain.darcloud.host" style="color:var(--muted)">Blockchain</a> · <a href="https://enterprise.darcloud.host" style="color:var(--muted)">Enterprise</a></div>
    <div><strong style="color:var(--txt)">Community</strong><br><a href="https://discord.gg/darcloud" target="_blank" rel="noopener" style="color:var(--muted)">Discord</a> · <a href="https://wallet.darcloud.host" style="color:var(--muted)">Wallet Research</a> · <a href="https://realestate.darcloud.host" style="color:var(--muted)">Housing Research</a></div>
    <div><strong style="color:var(--txt)">Legal</strong><br><a href="https://darcloud.host/privacy" style="color:var(--muted)">Privacy Policy</a> · <a href="https://darcloud.host/terms" style="color:var(--muted)">Terms of Service</a></div>
  </div>
  <p style="margin-top:1rem">© 2026 DarCloud by Omar Abu Nadi. All rights reserved. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
</footer>
</body>
</html>`;
}

export const SIGNUP_PAGE = pageShell("Registration unavailable", `
<div class="card">
  <h1><span>Public registration is unavailable</span></h1>
  <p class="sub">New DarCloud accounts are not being created during this pre-release remediation.</p>
  <p>Verified-email onboarding, durable abuse controls, account deletion, and a staffed privacy workflow must be operating before registration can reopen.</p>
  <a href="https://www.darcloud.host/" class="btn btn-outline" style="display:block;text-decoration:none">Browse Preview Catalog</a>
</div>
`);

export const LOGIN_PAGE = pageShell("Account access unavailable", `
<div class="card">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1><span>Account access is unavailable</span></h1>
  <p class="sub">The main DarCloud registration, login, session, and profile system is closed during pre-release remediation.</p>
  <p>No credentials are accepted on this page. Reopening requires verified-email onboarding, durable abuse controls, self-service deletion, and a staffed privacy workflow.</p>
  <a href="https://www.darcloud.host/" class="btn btn-outline" style="display:block;text-decoration:none">Browse Preview Catalog</a>
</div>
`);

export const ONBOARDING_PAGE = pageShell("Welcome to DarCloud", `
<div class="card" style="max-width:600px">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1>Welcome to <span>DarCloud</span> ✨</h1>
  <p class="sub">This public guide describes the restricted, non-transactional previews currently under review.</p>

  <div style="margin:2rem 0">
    <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;padding:1.25rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px">
      <div style="font-size:1.5rem">1️⃣</div>
      <div><strong style="color:var(--cyan)">Review the restricted API</strong><br><span style="color:var(--muted);font-size:.9rem">The public API is pre-release. Payment, legal, financial, infrastructure, telecom, and fulfillment operations are unavailable.</span><br><a href="/docs" style="font-size:.85rem;margin-top:.5rem;display:inline-block">Open API Reference →</a></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;padding:1.25rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px">
      <div style="font-size:1.5rem">2️⃣</div>
      <div><strong style="color:var(--cyan)">Try the QuranChain Tracker</strong><br><span style="color:var(--muted);font-size:.9rem">Record prayer and Quran-reading progress locally in this browser. It has no account sync, location access, token, mining, or financial rewards.</span><br><a href="https://quranchain.darcloud.host/" style="font-size:.85rem;margin-top:.5rem;display:inline-block">Open Local Tracker →</a></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1.5rem;padding:1.25rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px">
      <div style="font-size:1.5rem">3️⃣</div>
      <div><strong style="color:var(--cyan)">Explore Wallet Research</strong><br><span style="color:var(--muted);font-size:.9rem">Review a static budgeting and learning concept. It has no sign-up, enrollment, contact, or data-intake form.</span><br><a href="https://wallet.darcloud.host" style="font-size:.85rem;margin-top:.5rem;display:inline-block">Open Research Preview →</a></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:1rem;padding:1.25rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px">
      <div style="font-size:1.5rem">4️⃣</div>
      <div><strong style="color:var(--cyan)">Use Preview Features Carefully</strong><br><span style="color:var(--muted);font-size:.9rem">Only use capabilities that are clearly marked as available. Research and internal-preview pages do not create paid services or financial products.</span><br><a href="/terms" style="font-size:.85rem;margin-top:.5rem;display:inline-block">Read the Terms →</a></div>
    </div>
  </div>

  <a href="/docs" class="btn btn-primary" style="text-decoration:none">Open Restricted API Reference</a>
  <a href="https://www.darcloud.host/" class="btn btn-outline" style="text-decoration:none">Browse Preview Catalog</a>
</div>
`);

export function checkoutPage(plan: string): string {
  void plan;
  return pageShell("Checkout unavailable", `
<div class="card" style="max-width:600px">
  <h1><span>Checkout is unavailable</span></h1>
  <p class="sub">DarCloud is not accepting payment for this product.</p>
  <div style="padding:1.25rem;background:var(--s2);border:1px solid var(--bdr);border-radius:12px;margin:1.5rem 0">
    <strong>No purchase or entitlement is created.</strong>
    <p style="color:var(--muted);font-size:.9rem;margin:.6rem 0 0">Product fulfillment, support, pricing, and required disclosures must be verified before checkout can be enabled.</p>
  </div>
  <a href="https://www.darcloud.host/" class="btn btn-primary" style="text-decoration:none">Return to DarCloud</a>
</div>`);
}

// ── Checkout Success/Cancel Pages ──
export function checkoutResultPage(status: string, sessionId?: string): string {
  void status;
  void sessionId;
  return checkoutPage("disabled");
}

// ── Dashboard Page (account access retired) ──
export const DASHBOARD_PAGE = pageShell("Dashboard unavailable", `
<div class="card">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1><span>Account dashboard unavailable</span></h1>
  <p class="sub">The account dashboard does not accept credentials or expose account records in this release candidate.</p>
  <a href="/onboarding" class="btn btn-primary" style="text-decoration:none">Open Preview Guide</a>
  <a href="https://www.darcloud.host/" class="btn btn-outline" style="text-decoration:none">Browse Preview Catalog</a>
</div>
`);

// ── Admin Panel Page ──
export const ADMIN_PAGE = pageShell("Admin unavailable", `
<div class="card">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1><span>Admin access is unavailable</span></h1>
  <p class="sub">This restricted preview does not expose a production administrator role, user directory, operational statistics, or data-seeding controls.</p>
  <a href="/onboarding" class="btn btn-outline" style="display:block;text-decoration:none">Open Preview Guide</a>
</div>
`);

// ── Privacy Policy ──
export const PRIVACY_PAGE = pageShell("Privacy Policy", `
<div class="card" style="max-width:800px">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1><span>Privacy Policy</span></h1>
  <p class="sub">Last updated: August 29, 2026</p>

  <div style="text-align:left;line-height:1.8;color:var(--txt);font-size:.95rem">

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">1. Introduction</h2>
  <p>DarCloud ("we," "us," or "our"), operated by DarCloud LLC, explains here how the main darcloud.host preview pages handle information. A service with its own privacy policy, such as MeshTalk, is governed by that service-specific policy.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">2. Information We Collect</h2>
  <p><strong>Main account:</strong> Registration, login, session, profile, and account APIs are closed. The reviewed release candidate does not collect account credentials or create account records.</p>
  <p><strong>Wallet preview:</strong> The Wallet research page has no waitlist, enrollment, application, contact, or data-intake form.</p>
  <p><strong>Connected-service data:</strong> If you use a separately identified bot or service, that service may receive identifiers and content needed for the action you request. Review its specific notice before use.</p>
  <p><strong>Payments:</strong> Checkout is currently disabled. The disabled checkout route does not collect card information or create a subscription. If a paid product is enabled later, its page and this policy will identify the payment processor and data flow before collection.</p>
  <p><strong>Usage and security data:</strong> Cloudflare may process IP address, request time, device/browser information, and similar request metadata to deliver and protect the service.</p>
  <p><strong>Optional technical preview data:</strong> A technical preview may store identifiers, status updates, or configuration that you deliberately submit. Its interface must state when the data is fictional, local-only, or retained by the server.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">3. How We Use Your Information</h2>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li>Provide, secure, and improve the available DarCloud software</li>
    <li>Monitor system health and prevent abuse</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">4. Data Storage & Security</h2>
  <p>Application data from separately identified services may be stored in Cloudflare D1 and processed through Cloudflare's network. Network communications use HTTPS, but no internet service can guarantee absolute security.</p>
  <p>Historical records may still exist from earlier prototypes. Before production promotion, the operator must inventory those records and document lawful retention, access, and deletion handling. Disabled account, contact, and automated privacy-request routes do not accept or store new submissions.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">5. Data Sharing</h2>
  <p>We do <strong>not</strong> sell, rent, or trade your personal information. Data may be shared with:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li><strong>Cloudflare:</strong> Infrastructure hosting and CDN</li>
    <li><strong>Connected providers:</strong> Only when you deliberately use a clearly identified integration and the disclosure for that feature explains the transfer</li>
    <li><strong>Authorities or safety recipients:</strong> When required by law or reasonably necessary to protect people and the service</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">6. Your Rights</h2>
  <p>Depending on your location and applicable law, you may have rights concerning access, correction, deletion, portability, objection, or restriction. Use the email in the Contact section. DarCloud must verify a requester's identity before acting on historical or service-specific data.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">7. Cookies & Tracking</h2>
  <p>The reviewed main preview does not set an application authentication cookie. We do not use third-party tracking cookies, ad networks, or behavioral analytics. Cloudflare may set security cookies for DDoS protection.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">8. Children's Privacy</h2>
  <p>DarCloud services are not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided data, email the address below so the report can be reviewed.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">9. International Data</h2>
  <p>Cloudflare or another separately identified service provider may process information in countries other than the one where you live. Publication in a new jurisdiction requires documenting the applicable transfer mechanism and service-specific disclosures; this notice does not claim a mechanism that has not been verified.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">10. Changes to This Policy</h2>
  <p>We may update this policy periodically. Changes will be posted at <a href="https://darcloud.host/privacy">darcloud.host/privacy</a> with an updated revision date. Continued use of our services constitutes acceptance of the revised policy.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">11. Contact</h2>
  <p>For privacy inquiries, data requests, or concerns, use the email below. The automated web intake is disabled because no identity-verified processing workflow is operating. Response timing depends on identity verification, applicable law, and the request; this preview does not promise a fixed turnaround.</p>
  <p style="margin-top:.5rem">
    <strong>Omar Abu Nadi</strong><br>
    Email: <a href="mailto:omarabunadi28@gmail.com">omarabunadi28@gmail.com</a><br>
    Web: <a href="https://darcloud.host">darcloud.host</a><br>
    Discord: DarCloud Community Server
  </p>

  <div style="margin-top:2rem;padding:1rem;background:var(--s2);border-radius:8px;border-left:3px solid var(--gold);color:var(--muted);font-size:.85rem">
    <em>"Indeed, Allah commands you to render trusts to whom they are due." — Quran 4:58</em>
  </div>

  </div>
</div>
`);

// ── Terms of Service ──
export const TERMS_PAGE = pageShell("Terms of Service", `
<div class="card" style="max-width:800px">
  <p class="bismillah">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
  <h1><span>Terms of Service</span></h1>
  <p class="sub">Last updated: August 29, 2026</p>

  <div style="text-align:left;line-height:1.8;color:var(--txt);font-size:.95rem">

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">1. Acceptance of Terms</h2>
  <p>These Terms apply to the main darcloud.host account and preview pages provided by DarCloud LLC. A service with its own terms, such as MeshTalk, is governed by those service-specific terms. If you do not agree, do not use the relevant service.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">2. Service Description</h2>
  <p>DarCloud develops communications software and internal or research previews. Each page states its current scope. A research, prototype, fictional-data, or internal-test page is not a promise that commercial operations, infrastructure, licensed activity, fulfillment, or third-party integrations exist.</p>
  <p>Checkout and paid entitlements are disabled. These preview pages do not offer a bank account, deposit, transfer, card, credit, insurance, investment, token sale, exchange, staking, mining reward, transportation booking, shipment, telecom plan, or other regulated service.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">3. Account Access</h2>
  <p>Main DarCloud account registration, login, sessions, profiles, and dashboards are unavailable in this release candidate. A separately identified service may have its own account terms and privacy notice.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">4. Acceptable Use</h2>
  <p>You agree NOT to use DarCloud services to:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li>Distribute illegal, hateful, or harmful content</li>
    <li>Attempt to compromise system security or other users' data</li>
    <li>Bypass access controls, rate limits, or safety features</li>
    <li>Resell services without authorization</li>
    <li>Violate any applicable laws or regulations</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">5. Payments</h2>
  <p>Checkout is disabled and the current preview pages do not create charges, purchases, subscriptions, or entitlements. Any future paid offering must publish its price, fulfillment scope, cancellation terms, refund terms, provider disclosures, and applicable additional agreement before accepting payment.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">6. Intellectual Property and User Content</h2>
  <p>DarCloud and its licensors retain rights in their software, designs, and branding to the extent provided by applicable law. These Terms do not claim a registration, patent, trademark, certification, or license that has not been independently verified.</p>
  <p>You retain rights in content you submit. You grant DarCloud a limited license to host, process, transmit, and display it only as needed to operate, secure, and legally administer the feature you choose.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">7. API and Preview Use</h2>
  <p>If an API or preview is available:</p>
  <ul style="margin-left:1.5rem;margin-bottom:1rem">
    <li>Observe the authentication, rate-limit, and safety controls shown for that feature</li>
    <li>Do not treat fictional, illustrative, local-only, or generated preview records as real-world facts</li>
    <li>Do not rely on a preview for emergencies, financial decisions, legal advice, transportation, deliveries, telecommunications, religious rulings, or regulated activity</li>
    <li>Availability and data persistence are not guaranteed for internal or research previews</li>
  </ul>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">8. Disclaimers and Liability</h2>
  <p>DarCloud services are provided "as is" without warranties of any kind. To the maximum extent permitted by law, DarCloud shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the services.</p>
  <p>Nothing in these Terms excludes rights or liability that cannot lawfully be excluded. Because checkout is disabled, the current previews do not create a paid-service liability cap based on a purchase amount.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">9. Suspension and Termination</h2>
  <p>We may restrict or terminate access for violations, legal requirements, safety risks, security incidents, or discontinuation of a preview. Data access and deletion are governed by the applicable privacy notice and service-specific controls.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">10. Governing Law</h2>
  <p>Applicable governing law, venue, and non-waivable consumer rights depend on the service, the parties, and the user's location. Nothing in these Terms claims a regulatory exemption or waives rights that cannot lawfully be waived.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">11. Changes to Terms</h2>
  <p>We reserve the right to modify these Terms at any time. Changes will be posted at <a href="https://darcloud.host/terms">darcloud.host/terms</a>. Continued use of our services after changes constitutes acceptance of the revised Terms.</p>

  <h2 style="color:var(--cyan);margin:1.5rem 0 .5rem;font-size:1.2rem">12. Contact</h2>
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
