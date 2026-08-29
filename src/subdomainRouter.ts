// Subdomain → landing page router
// All *.darcloud.host and *.darcloud.net subdomains are routed through
// the Cloudflare Tunnel to localhost:8787 (this Worker).
// This module maps subdomains to their landing page modules.

import wwwPage from "../landing-pages/darcloud-www.js";
import quranTrackerPage from "../landing-pages/darcloud-quran-tracker.js";
import checkoutPageModule from "../landing-pages/darcloud-checkout.js";
import transportPage from "../landing-pages/darcloud-dartransport.js";
import hwcPage from "../landing-pages/darcloud-hwc.js";
import meshtalkPage from "../landing-pages/darcloud-meshtalk.js";
import realEstatePage from "../landing-pages/darcloud-realestate.js";
import unavailablePage from "../landing-pages/darcloud-disabled-preview.js";

type LandingPage = { fetch(request: Request): Promise<Response> };

// Do not inject account scripts into subdomain responses. Strip the internal
// routing header and stream the original body unchanged.
function finalizeLandingResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.delete("X-DarCloud-No-SSO");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Map subdomains to their landing page modules
const SUBDOMAIN_MAP: Record<string, LandingPage> = {
  // Existing pages
  www: wwwPage,
  ai: unavailablePage,
  "api-gateway": unavailablePage,
  // The former explorer advertised fabricated live-chain activity. Until a
  // real audited network exists, both names serve the local-only tracker.
  blockchain: quranTrackerPage,
  quranchain: quranTrackerPage,
  checkout: checkoutPageModule,
  enterprise: unavailablePage,
  hwc: hwcPage,
  halalwealthclub: hwcPage,
  banking: hwcPage,
  wallet: hwcPage,
  darwallet: hwcPage,
  mesh: unavailablePage,
  realestate: realEstatePage,
  revenue: unavailablePage,

  // New sector pages
  pay: unavailablePage,
  meshtalk: meshtalkPage,
  fungios: unavailablePage,
  community: unavailablePage,
  darnas: unavailablePage,
  law: unavailablePage,
  commerce: unavailablePage,
  trade: unavailablePage,
  health: unavailablePage,
  edu: unavailablePage,
  energy: unavailablePage,
  security: unavailablePage,
  telecom: unavailablePage,
  transport: transportPage,
  logistics: transportPage,
  darlogistics: transportPage,
  hr: unavailablePage,
  media: unavailablePage,
  defi: unavailablePage,
  omarai: unavailablePage,
};

// darcloud.net apex gets its own page
const NET_PAGE: LandingPage = wwwPage;

/**
 * Handle subdomain routing for *.darcloud.host and darcloud.net.
 * Returns a Response if a matching landing page is found, or null to
 * fall through to the main Hono app routes.
 */
export async function handleSubdomain(
  request: Request,
): Promise<Response | null> {
  const url = new URL(request.url);
  // URL.hostnames may arrive with a DNS root-label suffix. Normalize that
  // harmless representation before applying the exact DarCloud host policy.
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");

  // darcloud.net apex → net landing page
  if (hostname === "darcloud.net") {
    const resp = await NET_PAGE.fetch(request);
    return finalizeLandingResponse(resp);
  }

  // *.darcloud.host or *.darcloud.net subdomains
  const subMatch = hostname.match(
    /^([a-z0-9-]+)\.darcloud\.(?:host|net)$/,
  );
  if (subMatch) {
    const subdomain = subMatch[1];
    const page = SUBDOMAIN_MAP[subdomain] || unavailablePage;
    const resp = await page.fetch(request);
    return finalizeLandingResponse(resp);
  }

  // A nested or otherwise malformed DarCloud subdomain must never fall through
  // to apex APIs. Serve the fail-closed preview instead.
  if (
    hostname.endsWith(".darcloud.host") ||
    hostname.endsWith(".darcloud.net")
  ) {
    const resp = await unavailablePage.fetch(request);
    return finalizeLandingResponse(resp);
  }

  return null;
}
