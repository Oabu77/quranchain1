// Subdomain → landing page router
// All *.darcloud.host and *.darcloud.net subdomains are routed through
// the Cloudflare Tunnel to localhost:8787 (this Worker).
// This module maps subdomains to their landing page modules.

import wwwPage from "../landing-pages/darcloud-www.js";
import aiPage from "../landing-pages/darcloud-ai-assistant.js";
import apiGatewayPage from "../landing-pages/darcloud-api-gateway.js";
import blockchainPage from "../landing-pages/darcloud-blockchain.js";
import checkoutPageModule from "../landing-pages/darcloud-checkout.js";
import commercePage from "../landing-pages/darcloud-darcommerce.js";
import defiPage from "../landing-pages/darcloud-dardefi.js";
import eduPage from "../landing-pages/darcloud-daredu.js";
import energyPage from "../landing-pages/darcloud-darenergy.js";
import healthPage from "../landing-pages/darcloud-darhealth.js";
import hrPage from "../landing-pages/darcloud-darhr.js";
import lawPage from "../landing-pages/darcloud-darlaw.js";
import mediaPage from "../landing-pages/darcloud-darmedia.js";
import darnasPage from "../landing-pages/darcloud-darnas.js";
import payPage from "../landing-pages/darcloud-darpay.js";
import securityPage from "../landing-pages/darcloud-darsecurity.js";
import telecomPage from "../landing-pages/darcloud-dartelecom.js";
import tradePage from "../landing-pages/darcloud-dartrade.js";
import transportPage from "../landing-pages/darcloud-dartransport.js";
import enterprisePage from "../landing-pages/darcloud-enterprise.js";
import hwcPage from "../landing-pages/darcloud-hwc.js";
import meshPage from "../landing-pages/darcloud-mesh-status.js";
import meshtalkPage from "../landing-pages/darcloud-meshtalk.js";
import netPage from "../landing-pages/darcloud-net.js";
import omaraiPage from "../landing-pages/darcloud-omarai.js";
import realEstatePage from "../landing-pages/darcloud-realestate.js";
import revenuePage from "../landing-pages/darcloud-revenue.js";

type LandingPage = { fetch(request: Request): Promise<Response> };

// SSO auth bar script injected into every landing page
// Checks the darcloud_session cookie via /api/auth/session
// Replaces "Sign In" nav links with user greeting + dashboard link
const SSO_AUTH_SCRIPT = `<script>
(function(){
  var api='https://darcloud.host/api/auth/session';
  fetch(api,{credentials:'include'}).then(function(r){return r.json()}).then(function(d){
    if(!d.authenticated)return;
    var u=d.user;
    // Find and update "Sign In" links in nav
    document.querySelectorAll('a[href*="/login"],a[href*="Sign In"],a[href*="sign-in"]').forEach(function(a){
      if(a.closest('nav')||a.closest('.nav-links')){
        a.textContent='\\u{1F44B} '+u.name;
        a.href='https://darcloud.host/dashboard';
        a.style.color='#10b981';
      }
    });
    // Also match text-content based sign-in links
    document.querySelectorAll('nav a, .nav-links a').forEach(function(a){
      if(a.textContent.trim()==='Sign In'||a.textContent.trim()==='Login'){
        a.textContent='\\u{1F44B} '+u.name;
        a.href='https://darcloud.host/dashboard';
        a.style.color='#10b981';
      }
    });
  }).catch(function(){});
})();
</script>`;

// Inject SSO script before </body> in landing page HTML
async function injectSSOScript(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const html = await response.text();
  const injected = html.replace("</body>", SSO_AUTH_SCRIPT + "</body>");

  const newHeaders = new Headers(response.headers);
  return new Response(injected, {
    status: response.status,
    headers: newHeaders,
  });
}

// Map subdomains to their landing page modules
const SUBDOMAIN_MAP: Record<string, LandingPage> = {
  // Existing pages
  www: wwwPage,
  ai: aiPage,
  "api-gateway": apiGatewayPage,
  blockchain: blockchainPage,
  checkout: checkoutPageModule,
  enterprise: enterprisePage,
  hwc: hwcPage,
  halalwealthclub: hwcPage,
  mesh: meshPage,
  realestate: realEstatePage,
  revenue: revenuePage,

  // New sector pages
  pay: payPage,
  meshtalk: meshtalkPage,
  community: darnasPage,
  darnas: darnasPage,
  law: lawPage,
  commerce: commercePage,
  trade: tradePage,
  health: healthPage,
  edu: eduPage,
  energy: energyPage,
  security: securityPage,
  telecom: telecomPage,
  transport: transportPage,
  hr: hrPage,
  media: mediaPage,
  defi: defiPage,
  omarai: omaraiPage,
};

// darcloud.net apex gets its own page
const NET_PAGE: LandingPage = netPage;

/**
 * Handle subdomain routing for *.darcloud.host and darcloud.net.
 * Returns a Response if a matching landing page is found, or null to
 * fall through to the main Hono app routes.
 */
export async function handleSubdomain(
  request: Request,
): Promise<Response | null> {
  const url = new URL(request.url);
  const hostname = url.hostname;

  // darcloud.net apex → net landing page
  if (hostname === "darcloud.net") {
    const resp = await NET_PAGE.fetch(request);
    return injectSSOScript(resp);
  }

  // *.darcloud.host or *.darcloud.net subdomains
  const subMatch = hostname.match(
    /^([a-z0-9-]+)\.darcloud\.(?:host|net)$/,
  );
  if (subMatch) {
    const subdomain = subMatch[1];
    const page = SUBDOMAIN_MAP[subdomain];
    if (page) {
      const resp = await page.fetch(request);
      return injectSSOScript(resp);
    }
  }

  return null;
}
