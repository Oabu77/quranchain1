import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const OUTPUT_DIR = "artifacts/darcloud-smoke";
const NAVIGATION_TIMEOUT_MS = 30_000;
const SETTLE_MS = 1_500;
const MAX_LINKS = 250;

const pageChecks = [
  { name: "www home", url: "https://www.darcloud.host/", markers: ["DarCloud Empire"] },
  { name: "AI", url: "https://ai.darcloud.host/", markers: ["AI", "Assistant"] },
  { name: "API gateway", url: "https://api-gateway.darcloud.host/", markers: ["API", "Gateway"] },
  { name: "blockchain", url: "https://blockchain.darcloud.host/", markers: ["Blockchain", "QuranChain"] },
  { name: "checkout", url: "https://checkout.darcloud.host/", markers: ["Checkout", "Payment", "Plans"] },
  { name: "commerce", url: "https://commerce.darcloud.host/", markers: ["Commerce", "Marketplace"] },
  { name: "DeFi", url: "https://defi.darcloud.host/", markers: ["DeFi", "Finance"] },
  { name: "education", url: "https://edu.darcloud.host/", markers: ["Education", "Learning"] },
  { name: "energy", url: "https://energy.darcloud.host/", markers: ["Energy", "Grid"] },
  { name: "health", url: "https://health.darcloud.host/", markers: ["Health", "Care"] },
  { name: "HR", url: "https://hr.darcloud.host/", markers: ["Human", "HR", "Workforce"] },
  { name: "law", url: "https://law.darcloud.host/", markers: ["Law", "Legal"] },
  { name: "media", url: "https://media.darcloud.host/", markers: ["Media", "Content"] },
  { name: "community", url: "https://community.darcloud.host/", markers: ["Community", "Dar Al-Nas"] },
  { name: "Dar Al-Nas alias", url: "https://darnas.darcloud.host/", markers: ["Dar Al-Nas", "Community"] },
  { name: "pay", url: "https://pay.darcloud.host/", markers: ["Pay", "Payment"] },
  { name: "security", url: "https://security.darcloud.host/", markers: ["Security", "Protection"] },
  { name: "telecom", url: "https://telecom.darcloud.host/", markers: ["Telecom", "Network"] },
  { name: "trade", url: "https://trade.darcloud.host/", markers: ["Trade", "Commerce"] },
  { name: "transport", url: "https://transport.darcloud.host/", markers: ["Transport", "Mobility"] },
  { name: "enterprise", url: "https://enterprise.darcloud.host/", markers: ["Enterprise", "Business"] },
  { name: "HWC", url: "https://hwc.darcloud.host/", markers: ["Wealth", "HWC"] },
  { name: "HWC alias", url: "https://halalwealthclub.darcloud.host/", markers: ["Wealth", "HWC"] },
  { name: "mesh", url: "https://mesh.darcloud.host/", markers: ["Mesh", "Network"] },
  { name: "MeshTalk", url: "https://meshtalk.darcloud.host/", markers: ["MeshTalk", "Fungi"] },
  { name: "FungiOS alias", url: "https://fungios.darcloud.host/", markers: ["MeshTalk", "Fungi"] },
  { name: "real estate", url: "https://realestate.darcloud.host/", markers: ["Real Estate", "Property"] },
  { name: "revenue", url: "https://revenue.darcloud.host/", markers: ["Revenue", "Affiliate", "Income"] },
  { name: "Omar AI", url: "https://omarai.darcloud.host/", markers: ["Omar AI", "Assistant"] },
  { name: "affiliate", url: "https://referral.darcloud.host/", markers: ["Affiliate", "Commission"] },

  { name: "signup", url: "https://darcloud.host/signup", markers: ["Sign Up", "Create"] },
  { name: "login", url: "https://darcloud.host/login", markers: ["Login", "Sign In"] },
  { name: "onboarding", url: "https://darcloud.host/onboarding", markers: ["Onboarding", "Welcome", "Setup"] },
  { name: "dashboard", url: "https://darcloud.host/dashboard", markers: ["Dashboard", "Login", "Sign In"] },
  { name: "admin", url: "https://darcloud.host/admin", markers: ["Admin", "Login", "Sign In"] },
  { name: "checkout success", url: "https://darcloud.host/checkout/success", markers: ["Success", "Payment", "Checkout"] },
  { name: "checkout cancel", url: "https://darcloud.host/checkout/cancel", markers: ["Cancel", "Checkout", "Payment"] },
  { name: "checkout plan", url: "https://darcloud.host/checkout/pro", markers: ["Checkout", "DarCloud Professional", "Pro"] },
  { name: "privacy", url: "https://darcloud.host/privacy", markers: ["Privacy"] },
  { name: "privacy alias", url: "https://darcloud.host/privacy-policy", markers: ["Privacy"] },
  { name: "terms", url: "https://darcloud.host/terms", markers: ["Terms"] },
];

const forbiddenBodyMarkers = [
  "Loading platform...",
  "Application error: a client-side exception has occurred",
  "Internal Server Error",
  "Error 1101",
  "This deployment is temporarily unavailable",
];

function isDarCloudHost(hostname) {
  return hostname === "darcloud.host" || hostname.endsWith(".darcloud.host");
}

function shouldCheckLink(url) {
  if (!isDarCloudHost(url.hostname)) return false;
  if (!/^https?:$/.test(url.protocol)) return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname === "/logout") return false;
  if (/\b(delete|remove|revoke|terminate)\b/i.test(url.pathname)) return false;
  return true;
}

async function fetchManual(url) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(NAVIGATION_TIMEOUT_MS),
    headers: { "user-agent": "DarCloud-QA-Smoke/1.0" },
  });
  const text = await response.text();
  return {
    status: response.status,
    location: response.headers.get("location") || "",
    contentType: response.headers.get("content-type") || "",
    text,
  };
}

async function checkApexRedirect() {
  const result = {
    name: "apex redirect",
    url: "https://darcloud.host/",
    passed: false,
    errors: [],
    warnings: [],
  };

  try {
    const response = await fetchManual(result.url);
    result.status = response.status;
    result.location = response.location;
    result.title = "";
    if (![301, 302, 307, 308].includes(response.status)) {
      result.errors.push(`expected an HTTP redirect, received ${response.status}`);
    }
    if (response.location && new URL(response.location, result.url).href !== "https://www.darcloud.host/") {
      result.errors.push(`expected redirect to https://www.darcloud.host/, received ${response.location}`);
    }
    if (!response.location) {
      result.errors.push("redirect response did not include a Location header");
    }
    result.passed = result.errors.length === 0;
  } catch (error) {
    result.errors.push(String(error));
  }
  return result;
}

async function checkPage(browser, check, discoveredLinks) {
  const context = await browser.newContext({
    ignoreHTTPSErrors: false,
    userAgent: "DarCloud-QA-Smoke/1.0",
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const badFirstPartyResponses = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const requestUrl = new URL(request.url());
    if (isDarCloudHost(requestUrl.hostname)) {
      failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText || "failed"}`);
    }
  });
  page.on("response", (response) => {
    const responseUrl = new URL(response.url());
    if (isDarCloudHost(responseUrl.hostname) && response.status() >= 500) {
      badFirstPartyResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  const result = {
    name: check.name,
    url: check.url,
    passed: false,
    errors: [],
    warnings: [],
    status: null,
    finalUrl: "",
    title: "",
    bodyPreview: "",
    consoleErrors,
    pageErrors,
    failedRequests,
    badFirstPartyResponses,
  };

  try {
    const response = await page.goto(check.url, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await page.waitForTimeout(SETTLE_MS);

    result.status = response?.status() ?? null;
    result.finalUrl = page.url();
    result.title = await page.title();
    const bodyText = (await page.locator("body").innerText({ timeout: 5_000 })).replace(/\s+/g, " ").trim();
    result.bodyPreview = bodyText.slice(0, 300);

    if (!response) result.errors.push("navigation returned no document response");
    if (result.status === null || result.status >= 400) result.errors.push(`document status was ${result.status}`);
    if (bodyText.length < 40) result.errors.push(`page body was unexpectedly small (${bodyText.length} characters)`);

    for (const marker of forbiddenBodyMarkers) {
      if (`${result.title}\n${bodyText}`.includes(marker)) {
        result.errors.push(`page contains failure marker: ${marker}`);
      }
    }

    const searchable = `${result.title}\n${bodyText}`.toLowerCase();
    if (!check.markers.some((marker) => searchable.includes(marker.toLowerCase()))) {
      result.errors.push(`none of the expected page markers were present: ${check.markers.join(", ")}`);
    }

    if (pageErrors.length > 0) result.errors.push(`uncaught browser errors: ${pageErrors.join(" | ")}`);
    if (failedRequests.length > 0) result.errors.push(`failed first-party requests: ${failedRequests.join(" | ")}`);
    if (badFirstPartyResponses.length > 0) result.errors.push(`5xx first-party responses: ${badFirstPartyResponses.join(" | ")}`);
    if (consoleErrors.length > 0) result.warnings.push(`console errors: ${consoleErrors.join(" | ")}`);

    const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean),
    );
    for (const href of hrefs) {
      try {
        const resolved = new URL(href, page.url());
        resolved.hash = "";
        if (shouldCheckLink(resolved)) discoveredLinks.add(resolved.href);
      } catch {
        result.warnings.push(`invalid link: ${href}`);
      }
    }

    result.passed = result.errors.length === 0;
  } catch (error) {
    result.errors.push(String(error));
  } finally {
    await context.close();
  }

  return result;
}

async function checkDiscoveredLink(url) {
  const result = { url, passed: false, status: null, finalUrl: "", error: "" };
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(NAVIGATION_TIMEOUT_MS),
      headers: { "user-agent": "DarCloud-QA-Smoke/1.0" },
    });
    result.status = response.status;
    result.finalUrl = response.url;
    result.passed = response.status < 400;
    if (!result.passed) result.error = `HTTP ${response.status}`;
    await response.body?.cancel();
  } catch (error) {
    result.error = String(error);
  }
  return result;
}

function escapeTable(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function buildMarkdown(report) {
  const lines = [
    "# DarCloud live-page smoke report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Overall: **${report.passed ? "PASS" : "FAIL"}**`,
    "",
    `Pages: ${report.summary.passedPages}/${report.summary.totalPages} passed`,
    `Internal links: ${report.summary.passedLinks}/${report.summary.totalLinks} passed`,
    "",
    "## Page results",
    "",
    "| Status | Page | HTTP | Final URL | Evidence |",
    "|---|---|---:|---|---|",
  ];

  for (const item of report.pages) {
    const evidence = item.passed
      ? item.title || item.bodyPreview
      : [...item.errors, ...item.warnings].join("; ");
    lines.push(`| ${item.passed ? "PASS" : "FAIL"} | ${escapeTable(item.name)} | ${escapeTable(item.status)} | ${escapeTable(item.finalUrl || item.location || item.url)} | ${escapeTable(evidence).slice(0, 500)} |`);
  }

  lines.push("", "## Internal-link results", "", "| Status | URL | HTTP | Detail |", "|---|---|---:|---|");
  for (const item of report.links) {
    lines.push(`| ${item.passed ? "PASS" : "FAIL"} | ${escapeTable(item.url)} | ${escapeTable(item.status)} | ${escapeTable(item.error || item.finalUrl)} |`);
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const discoveredLinks = new Set();
  const pages = [await checkApexRedirect()];

  try {
    for (const check of pageChecks) {
      const result = await checkPage(browser, check, discoveredLinks);
      pages.push(result);
      console.log(`${result.passed ? "PASS" : "FAIL"} ${check.url} ${result.status ?? "ERR"} ${result.title || result.errors[0] || ""}`);
    }
  } finally {
    await browser.close();
  }

  const links = [];
  for (const url of [...discoveredLinks].sort().slice(0, MAX_LINKS)) {
    const result = await checkDiscoveredLink(url);
    links.push(result);
    console.log(`${result.passed ? "PASS" : "FAIL"} link ${url} ${result.status ?? "ERR"}`);
  }

  const summary = {
    totalPages: pages.length,
    passedPages: pages.filter((item) => item.passed).length,
    totalLinks: links.length,
    passedLinks: links.filter((item) => item.passed).length,
  };
  const report = {
    generatedAt: new Date().toISOString(),
    passed: summary.passedPages === summary.totalPages && summary.passedLinks === summary.totalLinks,
    summary,
    pages,
    links,
  };

  await writeFile(`${OUTPUT_DIR}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(`${OUTPUT_DIR}/report.md`, buildMarkdown(report));

  console.log(`\nDarCloud smoke result: ${report.passed ? "PASS" : "FAIL"}`);
  console.log(`Pages: ${summary.passedPages}/${summary.totalPages}; links: ${summary.passedLinks}/${summary.totalLinks}`);
  if (!report.passed) process.exitCode = 1;
}

main().catch(async (error) => {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(`${OUTPUT_DIR}/fatal.txt`, `${error?.stack || error}\n`);
  console.error(error);
  process.exitCode = 1;
});
