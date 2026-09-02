const REQUEST_TIMEOUT_MS = 20_000;
const RETRY_DELAYS_MS = [0, 2_000, 5_000];

const checks = [
  ["www home", "https://www.darcloud.host/", ["DarCloud"]],
  ["AI", "https://ai.darcloud.host/", ["AI"]],
  ["API gateway", "https://api-gateway.darcloud.host/", ["API"]],
  ["blockchain", "https://blockchain.darcloud.host/", ["Blockchain", "QuranChain"]],
  ["checkout", "https://checkout.darcloud.host/", ["Checkout", "Payment", "Plans"]],
  ["commerce", "https://commerce.darcloud.host/", ["Commerce", "Marketplace"]],
  ["DeFi", "https://defi.darcloud.host/", ["DeFi", "Finance"]],
  ["education", "https://edu.darcloud.host/", ["Education", "Learning"]],
  ["energy", "https://energy.darcloud.host/", ["Energy", "Grid"]],
  ["health", "https://health.darcloud.host/", ["Health", "Care"]],
  ["HR", "https://hr.darcloud.host/", ["Human", "HR", "Workforce"]],
  ["law", "https://law.darcloud.host/", ["Law", "Legal"]],
  ["media", "https://media.darcloud.host/", ["Media", "Content"]],
  ["community", "https://community.darcloud.host/", ["Dar Al-Nas", "Community"]],
  ["Dar Al-Nas alias", "https://darnas.darcloud.host/", ["Dar Al-Nas", "Community"]],
  ["pay", "https://pay.darcloud.host/", ["DarPay", "Payment"]],
  ["security", "https://security.darcloud.host/", ["Security", "Protection"]],
  ["telecom", "https://telecom.darcloud.host/", ["Telecom", "Network"]],
  ["trade", "https://trade.darcloud.host/", ["Trade", "Commerce"]],
  ["transport", "https://transport.darcloud.host/", ["Transport", "Mobility"]],
  ["enterprise", "https://enterprise.darcloud.host/", ["Enterprise", "Business"]],
  ["HWC", "https://hwc.darcloud.host/", ["Wealth", "HWC"]],
  ["HWC alias", "https://halalwealthclub.darcloud.host/", ["Wealth", "HWC"]],
  ["mesh", "https://mesh.darcloud.host/", ["Mesh", "Network"]],
  ["MeshTalk", "https://meshtalk.darcloud.host/", ["MeshTalk", "Fungi"]],
  ["FungiOS alias", "https://fungios.darcloud.host/", ["MeshTalk", "Fungi"]],
  ["real estate", "https://realestate.darcloud.host/", ["Real Estate", "realestate", "Property"]],
  ["revenue", "https://revenue.darcloud.host/", ["Revenue", "revenue", "DarCloud Empire"]],
  ["Omar AI", "https://omarai.darcloud.host/", ["Omar AI", "OmarAI", "Assistant"]],
  ["affiliate", "https://referral.darcloud.host/", ["Affiliate", "Commission"]],
  ["signup", "https://darcloud.host/signup", ["Sign Up", "Create Account"]],
  ["login", "https://darcloud.host/login", ["Login", "Sign In"]],
  ["onboarding", "https://darcloud.host/onboarding", ["Onboarding", "Welcome", "Setup"]],
  ["dashboard", "https://darcloud.host/dashboard", ["Dashboard"]],
  ["admin", "https://darcloud.host/admin", ["Admin"]],
  ["checkout success", "https://darcloud.host/checkout/success", ["Success", "Payment", "Checkout"]],
  ["checkout cancel", "https://darcloud.host/checkout/cancel", ["Cancel", "Checkout", "Payment"]],
  ["checkout plan", "https://darcloud.host/checkout/pro", ["Checkout", "Professional", "Pro"]],
  ["privacy", "https://darcloud.host/privacy", ["Privacy"]],
  ["privacy alias", "https://darcloud.host/privacy-policy", ["Privacy"]],
  ["terms", "https://darcloud.host/terms", ["Terms"]],
  ["MeshTalk home", "https://darcloud.host/meshtalk", ["MeshTalk"]],
  ["MeshTalk privacy", "https://darcloud.host/meshtalk/privacy", ["Privacy", "MeshTalk"]],
  ["MeshTalk terms", "https://darcloud.host/meshtalk/terms", ["Terms", "MeshTalk"]],
  ["MeshTalk child safety", "https://darcloud.host/meshtalk/child-safety", ["Child", "Safety", "MeshTalk"]],
];

const forbiddenMarkers = [
  "Loading platform...",
  "Connection timed out",
  "Cloudflare Tunnel error",
  "Application error: a client-side exception has occurred",
  "Internal Server Error",
  "Error 1101",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}) {
  let lastError;
  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await sleep(delay);
    try {
      return await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          "user-agent": "DarCloud-Post-Deploy-Check/1.0",
          ...(options.headers || {}),
        },
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function checkApexRedirect() {
  const response = await fetchWithRetry("https://darcloud.host/", { redirect: "manual" });
  const location = response.headers.get("location") || "";
  const target = location ? new URL(location, "https://darcloud.host/").href : "";
  const passed = [301, 302, 307, 308].includes(response.status) && target === "https://www.darcloud.host/";
  return {
    name: "apex redirect",
    url: "https://darcloud.host/",
    status: response.status,
    finalUrl: target || "https://darcloud.host/",
    passed,
    detail: passed ? "canonical redirect is correct" : `expected redirect to https://www.darcloud.host/, received ${response.status} ${location || "without Location"}`,
  };
}

async function checkPage([name, url, markers]) {
  try {
    const response = await fetchWithRetry(url, { redirect: "follow" });
    const body = await response.text();
    const normalized = body.toLowerCase();
    const markerFound = markers.some((marker) => normalized.includes(marker.toLowerCase()));
    const forbidden = forbiddenMarkers.find((marker) => body.includes(marker));
    const passed = response.status < 400 && body.length > 20 && markerFound && !forbidden;
    const details = [];
    if (response.status >= 400) details.push(`HTTP ${response.status}`);
    if (body.length <= 20) details.push(`body only ${body.length} characters`);
    if (!markerFound) details.push(`missing marker: ${markers.join(" | ")}`);
    if (forbidden) details.push(`contains failure marker: ${forbidden}`);
    return {
      name,
      url,
      status: response.status,
      finalUrl: response.url,
      passed,
      detail: details.join("; ") || "page identity verified",
    };
  } catch (error) {
    return { name, url, status: null, finalUrl: "", passed: false, detail: String(error) };
  }
}

async function main() {
  const results = [await checkApexRedirect()];
  for (const check of checks) {
    const result = await checkPage(check);
    results.push(result);
    console.log(`${result.passed ? "PASS" : "FAIL"} ${result.name} ${result.status ?? "ERR"} ${result.finalUrl || result.url} — ${result.detail}`);
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  console.log(`\nDarCloud post-deploy result: ${failed === 0 ? "PASS" : "FAIL"}`);
  console.log(`Checks: ${passed}/${results.length} passed`);

  if (failed > 0) {
    console.error("\nFailed checks:");
    for (const result of results.filter((item) => !item.passed)) {
      console.error(`- ${result.name}: ${result.status ?? "ERR"} ${result.detail}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
