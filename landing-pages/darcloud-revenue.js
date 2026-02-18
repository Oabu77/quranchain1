// src/index.js
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-DarPay-Signature"
};
var FOUNDER_ROYALTY_RATE = 0.3;
var REVENUE_DISTRIBUTION = {
  founder: 0.3,
  ai_validators: 0.4,
  hardware_hosts: 0.1,
  ecosystem: 0.18,
  zakat: 0.02
};
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({
        status: "healthy",
        service: "DarCloud Revenue Engine",
        version: "1.0.0",
        platform: "Cloudflare Workers",
        founder_royalty: "30% (immutable)",
        revenue_streams: ["gas_tolls", "fiat_payments", "subscriptions", "enterprise", "network_provider"],
        distribution: REVENUE_DISTRIBUTION
      });
    }
    if (url.pathname === "/api/revenue" || url.pathname === "/api/dashboard") {
      let liveData = null;
      try {
        const resp = await fetch("https://blockchain.darcloud.host/health");
        if (resp.ok)
          liveData = await resp.json();
      } catch (e) {
      }
      const gasToll = liveData?.gasTollHighway || {};
      return json({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        revenue_streams: {
          gas_tolls: {
            total_collected: gasToll.totalCollected || 0,
            founder_royalty: gasToll.founderRoyalty || 0,
            networks_monitored: gasToll.totalNetworks || 47,
            toll_rate: gasToll.tollRate || "0.1%"
          },
          fiat_payments: {
            processor: "DarPay\u2122 (Live)",
            endpoint: "https://payments.darcloud.host",
            status: "active"
          },
          subscriptions: {
            endpoint: "https://billing.darcloud.host",
            tiers: ["Starter", "Professional", "Enterprise", "Unlimited"]
          },
          enterprise: {
            endpoint: "https://enterprise.darcloud.host",
            services: ["billing", "analytics", "compliance", "sla", "provisioning"]
          }
        },
        distribution: {
          ...REVENUE_DISTRIBUTION,
          note: "30% Founder Royalty is IMMUTABLE"
        },
        total_agents: 63,
        blockchain_networks: 47
      });
    }
    if (url.pathname === "/api/webhooks/stripe" && request.method === "POST") {
      try {
        const body = await request.json();
        const eventType = body.type || "unknown";
        ctx.waitUntil(
          fetch("https://revenue.darcloud.host/webhooks/stripe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }).catch(() => {
          })
        );
        return json({
          received: true,
          event: eventType,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          founder_royalty_applied: FOUNDER_ROYALTY_RATE
        });
      } catch (e) {
        return json({ error: "Invalid webhook payload" }, 400);
      }
    }
    if (url.pathname === "/api/gas-toll") {
      let data = null;
      try {
        const resp = await fetch("https://blockchain.darcloud.host/health");
        if (resp.ok)
          data = await resp.json();
      } catch (e) {
      }
      return json({
        gas_toll_highway: data?.gasTollHighway || {
          status: "active",
          total_networks: 47,
          toll_rate: "0.1%",
          founder_royalty_rate: "30%"
        },
        networks: [
          "Ethereum",
          "BSC",
          "Polygon",
          "Arbitrum",
          "Solana",
          "Avalanche",
          "Optimism",
          "Base",
          "Fantom",
          "Cronos",
          "NEAR",
          "Cosmos",
          "Polkadot",
          "Cardano",
          "Tron",
          "Algorand",
          "Tezos",
          "Stellar",
          "Hedera",
          "Harmony"
        ],
        distribution: REVENUE_DISTRIBUTION
      });
    }
    if (url.pathname.startsWith("/api/")) {
      try {
        const originUrl = `https://darcloud.host${url.pathname}${url.search}`;
        const resp = await fetch(originUrl, {
          method: request.method,
          headers: request.headers,
          body: request.method !== "GET" ? await request.arrayBuffer() : void 0
        });
        const body = await resp.text();
        return new Response(body, {
          status: resp.status,
          headers: { ...CORS, "Content-Type": resp.headers.get("Content-Type") || "application/json" }
        });
      } catch (e) {
        return json({ error: "Origin unavailable", detail: e.message }, 502);
      }
    }
    return json({ error: "Not found", endpoints: ["/api/revenue", "/api/gas-toll", "/api/webhooks/stripe", "/api/*"] }, 404);
  }
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" }
  });
}
export {
  src_default as default
};
