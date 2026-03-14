// ══════════════════════════════════════════════════════════════
// DarCloud Empire — Stripe/DarPay Integration
// Handles all payment processing, checkout, and webhooks
// ══════════════════════════════════════════════════════════════
const onboardingDb = require("./onboarding-db");

// ── Revenue Split (IMMUTABLE — from contracts) ────────────
const REVENUE_SPLIT = {
  founder:    0.30,  // 30% DarCloud Holdings
  validators: 0.40,  // 40% AI Validators
  hardware:   0.10,  // 10% Hardware Hosts
  ecosystem:  0.18,  // 18% Ecosystem Fund
  zakat:      0.02,  // 2% Zakat (mandatory charity)
};

// ── Stripe Configuration (LIVE — real Stripe product/price IDs) ──
const STRIPE_PRODUCTS = {
  pro: {
    name: "DarCloud Professional",
    price_cents: 4900,
    interval: "month",
    stripe_product_id: "prod_U8iRdXPXVFNjK4",
    stripe_price_id: "price_1TAR0SAqs2ifkfkqOKa2Rzq3",
    description: "Full DarCloud stack with FungiMesh node",
    features: ["FungiMesh Node", "10,000 QRN Bonus", "Priority Support", "API Access"],
  },
  enterprise: {
    name: "DarCloud Enterprise",
    price_cents: 49900,
    interval: "month",
    stripe_product_id: "prod_U8iRGJCeDwYRpF",
    stripe_price_id: "price_1TAR0TAqs2ifkfkqdtr8kWEf",
    description: "Enterprise-grade DarCloud with SLA",
    features: ["Dedicated Node Cluster", "100,000 QRN", "Custom Domain", "SLA 99.9%", "White-Label"],
  },
  fungimesh_node: {
    name: "FungiMesh Node (Standalone)",
    price_cents: 1999,
    interval: "month",
    stripe_product_id: "prod_U8iRtqLIqZxigf",
    stripe_price_id: "price_1TAR0TAqs2ifkfkqqrjzoLdm",
    description: "Individual FungiMesh mesh node",
  },
  hwc_premium: {
    name: "Halal Wealth Club Premium",
    price_cents: 9900,
    interval: "month",
    stripe_product_id: "prod_U8iRQESQNJiJ59",
    stripe_price_id: "price_1TAR0TAqs2ifkfkqKFPTW7hM",
    description: "Premium Islamic banking services",
  },
  gas_toll: {
    name: "QuranChain Gas Toll",
    price_cents: 0, // Variable
    interval: "one_time",
    stripe_product_id: "prod_U8iRv2gs6CmarP",
    stripe_price_id: "price_1TAR0UAqs2ifkfkqLNw6DvpC",
    description: "Blockchain transaction fee",
  },
};

// ── Gas Toll Chains (47) ──────────────────────────────────
const GAS_TOLL_CHAINS = [
  "QuranChain", "DarPay", "FungiMesh", "MeshTalk", "DarCloud",
  "Ethereum", "Bitcoin", "Polygon", "Solana", "Avalanche",
  "BNBChain", "Arbitrum", "Optimism", "zkSync", "Base",
  "Cosmos", "Polkadot", "Near", "Algorand", "Tezos",
  "Cardano", "Ripple", "Stellar", "Hedera", "Fantom",
  "Cronos", "Celo", "Harmony", "Klaytn", "Moonbeam",
  "Aurora", "Metis", "Boba", "Evmos", "Kava",
  "Gnosis", "Fuse", "Astar", "Velas", "IoTeX",
  "Theta", "Elrond", "Flow", "Mina", "Sui",
  "Aptos", "Sei",
];

// ── Stripe Client Factory ─────────────────────────────────
let _stripeModule = null;
try { _stripeModule = require("stripe"); } catch {
  console.warn("[DarPay] stripe npm module not installed — running in simulation mode. Run: npm install stripe");
}

function createStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[DarPay] STRIPE_SECRET_KEY not set — running in simulation mode");
    return null;
  }
  if (!_stripeModule) {
    console.warn("[DarPay] stripe module not available — install with: npm install stripe");
    return null;
  }
  return _stripeModule(key);
}

// ── Checkout Session Creation ─────────────────────────────
async function createCheckoutSession(discordId, productKey, metadata = {}) {
  const stripe = createStripeClient();
  const product = STRIPE_PRODUCTS[productKey];
  if (!product) throw new Error(`Unknown product: ${productKey}`);

  const member = onboardingDb.stmts.getMember.get(discordId);
  const sessionData = {
    discordId,
    product: productKey,
    amount: product.price_cents,
    metadata: { ...metadata, discord_id: discordId },
  };

  if (!stripe) {
    // Simulation mode — create a fake session for development
    const fakeSessionId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    onboardingDb.recordPayment(discordId, fakeSessionId, product.price_cents, productKey, sessionData);
    return {
      id: fakeSessionId,
      url: `https://pay.darcloud.host/sim/${fakeSessionId}`,
      simulated: true,
    };
  }

  // Real Stripe checkout using pre-created price IDs
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: product.interval === "one_time" ? "payment" : "subscription",
    line_items: [{
      price: product.stripe_price_id,
      quantity: 1,
    }],
    customer_email: member?.email || undefined,
    metadata: { discord_id: discordId, product: productKey, ...metadata },
    success_url: `https://darcloud.host/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://darcloud.host/checkout/cancel`,
  });

  onboardingDb.recordPayment(discordId, session.id, product.price_cents, productKey, sessionData);
  return { id: session.id, url: session.url, simulated: false };
}

// ── Webhook Handler ───────────────────────────────────────
async function handleStripeWebhook(payload, signature) {
  const stripe = createStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  if (stripe && webhookSecret) {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } else {
    // Simulation mode
    event = typeof payload === "string" ? JSON.parse(payload) : payload;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const discordId = session.metadata?.discord_id;
      const product = session.metadata?.product;

      if (discordId) {
        onboardingDb.confirmPayment(session.id, session.payment_intent);

        // Update member plan
        if (product === "pro" || product === "enterprise") {
          onboardingDb.stmts.setHwcTier.run(product, discordId);
        }

        // Set Stripe customer
        if (session.customer) {
          onboardingDb.stmts.setStripeCustomer.run(session.customer, discordId);
        }

        // Log
        onboardingDb.stmts.logEvent.run(discordId, "payment_completed", JSON.stringify({
          session_id: session.id,
          product,
          amount: session.amount_total,
        }), "stripe");

        // Calculate revenue splits
        const amount = session.amount_total;
        const splits = {
          founder:    Math.floor(amount * REVENUE_SPLIT.founder),
          validators: Math.floor(amount * REVENUE_SPLIT.validators),
          hardware:   Math.floor(amount * REVENUE_SPLIT.hardware),
          ecosystem:  Math.floor(amount * REVENUE_SPLIT.ecosystem),
          zakat:      Math.floor(amount * REVENUE_SPLIT.zakat),
        };

        console.log(`[DarPay] Payment ${session.id}: $${(amount / 100).toFixed(2)} — Splits:`, splits);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const discordId = subscription.metadata?.discord_id;
      if (discordId) {
        const status = subscription.status === "active" ? "active" : "cancelled";
        onboardingDb.stmts.logEvent.run(discordId, `subscription_${status}`, JSON.stringify({
          sub_id: subscription.id,
          status: subscription.status,
        }), "stripe");

        if (status === "cancelled") {
          onboardingDb.stmts.setHwcTier.run("free", discordId);
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const discordId = invoice.metadata?.discord_id || invoice.subscription_details?.metadata?.discord_id;
      if (discordId) {
        onboardingDb.stmts.logEvent.run(discordId, "payment_failed", JSON.stringify({
          invoice_id: invoice.id,
          amount: invoice.amount_due,
        }), "stripe");
      }
      break;
    }
  }

  return { received: true, type: event.type };
}

// ── Revenue Report ────────────────────────────────────────
function getRevenueReport() {
  const totalRevenue = onboardingDb.stmts.totalRevenue.get();
  const total = totalRevenue.total;
  const memberCount = onboardingDb.stmts.memberCount.get().count;
  const onboarded = onboardingDb.stmts.onboardedCount.get().count;

  return {
    total_revenue_cents: total,
    total_revenue_display: `$${(total / 100).toFixed(2)}`,
    splits: {
      founder:    `$${(total * REVENUE_SPLIT.founder / 100).toFixed(2)}`,
      validators: `$${(total * REVENUE_SPLIT.validators / 100).toFixed(2)}`,
      hardware:   `$${(total * REVENUE_SPLIT.hardware / 100).toFixed(2)}`,
      ecosystem:  `$${(total * REVENUE_SPLIT.ecosystem / 100).toFixed(2)}`,
      zakat:      `$${(total * REVENUE_SPLIT.zakat / 100).toFixed(2)}`,
    },
    members: {
      total: memberCount,
      onboarded,
      conversion_rate: memberCount > 0 ? `${((onboarded / memberCount) * 100).toFixed(1)}%` : "0%",
    },
    gas_toll_chains: GAS_TOLL_CHAINS.length,
  };
}

module.exports = {
  REVENUE_SPLIT,
  STRIPE_PRODUCTS,
  GAS_TOLL_CHAINS,
  createCheckoutSession,
  handleStripeWebhook,
  getRevenueReport,
  createStripeClient,
};
