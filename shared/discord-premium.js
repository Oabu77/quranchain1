// ══════════════════════════════════════════════════════════════
// DarCloud Discord Premium Apps — Monetization Engine
// Discord Premium Apps Payout Integration
// https://support-dev.discord.com/hc/en-us/articles/17299902720919
// ══════════════════════════════════════════════════════════════

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

// ── SKU Configuration ───────────────────────────────────
// After creating SKUs in Discord Developer Portal, set these env vars
const SKUS = {
  PRO: process.env.DISCORD_SKU_PRO || "",
  EMPIRE: process.env.DISCORD_SKU_EMPIRE || "",
};

// ── Tier Definitions ────────────────────────────────────
const TIERS = {
  free: {
    name: "DarCloud Basic",
    level: 0,
    emoji: "🆓",
    color: 0x95a5a6,
    features: [
      "3 AI questions/day",
      "Basic dashboard",
      "Community access",
      "Onboarding",
    ],
    limits: {
      aiAsks: 3,
      nftMints: 0,
      nftTrades: 0,
      deployAccess: false,
      founderAccess: false,
      premiumDashboard: false,
      prioritySupport: false,
    },
  },
  pro: {
    name: "DarCloud Pro",
    level: 1,
    emoji: "⭐",
    price: "$4.99/mo",
    color: 0x3498db,
    features: [
      "Unlimited AI questions (GPT-4o)",
      "NFT minting & trading",
      "Premium dashboards",
      "Priority support",
      "Advanced analytics",
      "Custom bot responses",
      "Exclusive channels",
    ],
    limits: {
      aiAsks: Infinity,
      nftMints: 50,
      nftTrades: Infinity,
      deployAccess: false,
      founderAccess: false,
      premiumDashboard: true,
      prioritySupport: true,
    },
  },
  empire: {
    name: "DarCloud Empire",
    level: 2,
    emoji: "👑",
    price: "$14.99/mo",
    color: 0xf1c40f,
    features: [
      "Everything in Pro",
      "Founder Console access",
      "Deploy & exec commands",
      "Unlimited NFT minting",
      "GPT-4o Turbo model",
      "Revenue dashboard access",
      "White-label bot access",
      "API access (all endpoints)",
      "Early access to features",
      "Direct founder support line",
    ],
    limits: {
      aiAsks: Infinity,
      nftMints: Infinity,
      nftTrades: Infinity,
      deployAccess: true,
      founderAccess: true,
      premiumDashboard: true,
      prioritySupport: true,
    },
  },
};

// ── Daily usage tracker (per-user, in-memory with SQLite fallback) ──
const _usageCache = new Map(); // userId -> { date, aiAsks, nftMints }

function getUsageKey(userId) {
  const today = new Date().toISOString().split("T")[0];
  const cached = _usageCache.get(userId);
  if (cached && cached.date === today) return cached;
  const fresh = { date: today, aiAsks: 0, nftMints: 0 };
  _usageCache.set(userId, fresh);
  return fresh;
}

function trackUsage(userId, type) {
  const usage = getUsageKey(userId);
  if (type === "ai-ask") usage.aiAsks++;
  if (type === "nft-mint") usage.nftMints++;
  return usage;
}

function getUsage(userId) {
  return getUsageKey(userId);
}

// ── Entitlement Checking ────────────────────────────────
// Discord Premium Apps use interaction.entitlements to check active subs

function getUserTier(interaction) {
  if (!interaction.entitlements || interaction.entitlements.size === 0) {
    return "free";
  }

  // Check for Empire tier first (higher priority)
  if (SKUS.EMPIRE && interaction.entitlements.some(e => e.skuId === SKUS.EMPIRE && isEntitlementActive(e))) {
    return "empire";
  }

  // Check for Pro tier
  if (SKUS.PRO && interaction.entitlements.some(e => e.skuId === SKUS.PRO && isEntitlementActive(e))) {
    return "pro";
  }

  return "free";
}

function isEntitlementActive(entitlement) {
  // Discord handles expiry — if it's in the entitlements collection, it's active
  // But double-check if endsAt exists and hasn't passed
  if (entitlement.endsAt && new Date(entitlement.endsAt) < new Date()) {
    return false;
  }
  return true;
}

function getTierInfo(tierName) {
  return TIERS[tierName] || TIERS.free;
}

// ── Premium Gate — Check if user can use a command ──────
// Returns { allowed, tier, tierInfo, reason, upsellTier }

function checkPremiumAccess(interaction, requiredTier = "free") {
  const userTier = getUserTier(interaction);
  const userTierInfo = getTierInfo(userTier);
  const requiredTierInfo = getTierInfo(requiredTier);

  if (userTierInfo.level >= requiredTierInfo.level) {
    return { allowed: true, tier: userTier, tierInfo: userTierInfo };
  }

  return {
    allowed: false,
    tier: userTier,
    tierInfo: userTierInfo,
    reason: `This command requires **${requiredTierInfo.emoji} ${requiredTierInfo.name}** (${requiredTierInfo.price || "Free"})`,
    upsellTier: requiredTier,
  };
}

// Check usage limits (for rate-limited free features)
function checkUsageLimit(interaction, type) {
  const userTier = getUserTier(interaction);
  const tierInfo = getTierInfo(userTier);
  const usage = getUsage(interaction.user.id);

  let limit, current;
  if (type === "ai-ask") {
    limit = tierInfo.limits.aiAsks;
    current = usage.aiAsks;
  } else if (type === "nft-mint") {
    limit = tierInfo.limits.nftMints;
    current = usage.nftMints;
  } else {
    return { allowed: true, tier: userTier, tierInfo, remaining: Infinity };
  }

  if (current >= limit) {
    const upsellTier = userTier === "free" ? "pro" : "empire";
    return {
      allowed: false,
      tier: userTier,
      tierInfo,
      current,
      limit,
      reason: `You've used **${current}/${limit}** ${type} today. Upgrade to ${getTierInfo(upsellTier).emoji} **${getTierInfo(upsellTier).name}** for ${limit === 0 ? "access" : "unlimited usage"}!`,
      upsellTier,
    };
  }

  return {
    allowed: true,
    tier: userTier,
    tierInfo,
    remaining: limit === Infinity ? Infinity : limit - current,
    current,
    limit,
  };
}

// ── Upsell Embed — Show when user needs to upgrade ─────

function createUpsellEmbed(result, commandName) {
  const upsellTier = getTierInfo(result.upsellTier || "pro");

  const embed = new EmbedBuilder()
    .setTitle(`${upsellTier.emoji} Upgrade to ${upsellTier.name}`)
    .setColor(upsellTier.color)
    .setDescription(
      `${result.reason || `\`/${commandName}\` requires a premium subscription.`}\n\n` +
      `**${upsellTier.name}** — ${upsellTier.price || "Free"}\n` +
      upsellTier.features.map(f => `✅ ${f}`).join("\n")
    )
    .setFooter({ text: "DarCloud Premium • Powered by Discord" })
    .setTimestamp();

  // Premium subscription button — Discord handles the purchase flow
  const row = new ActionRowBuilder();

  if (SKUS.PRO || SKUS.EMPIRE) {
    // If SKUs are configured, use Discord's premium button
    const skuId = result.upsellTier === "empire" ? SKUS.EMPIRE : SKUS.PRO;
    if (skuId) {
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Premium)
          .setSKUId(skuId)
      );
    }
  } else {
    // Fallback: link to website for Stripe checkout
    row.addComponents(
      new ButtonBuilder()
        .setLabel(`Get ${upsellTier.name}`)
        .setStyle(ButtonStyle.Link)
        .setURL("https://darcloud.host/subscribe")
        .setEmoji(upsellTier.emoji)
    );
  }

  // Always show tier comparison button
  row.addComponents(
    new ButtonBuilder()
      .setCustomId("premium_compare")
      .setLabel("Compare Plans")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📊")
  );

  return { embeds: [embed], components: [row] };
}

// ── Tier Comparison Embed ───────────────────────────────

function createComparisonEmbed() {
  const embed = new EmbedBuilder()
    .setTitle("📊 DarCloud Premium Plans")
    .setColor(0x2b2d31)
    .setDescription("Choose the plan that fits your needs:")
    .addFields(
      {
        name: `${TIERS.free.emoji} ${TIERS.free.name}`,
        value: TIERS.free.features.map(f => `• ${f}`).join("\n") + "\n**Price: FREE**",
        inline: true,
      },
      {
        name: `${TIERS.pro.emoji} ${TIERS.pro.name}`,
        value: TIERS.pro.features.map(f => `• ${f}`).join("\n") + `\n**Price: ${TIERS.pro.price}**`,
        inline: true,
      },
      {
        name: `${TIERS.empire.emoji} ${TIERS.empire.name}`,
        value: TIERS.empire.features.map(f => `• ${f}`).join("\n") + `\n**Price: ${TIERS.empire.price}**`,
        inline: true,
      }
    )
    .setFooter({ text: "DarCloud Premium • Discord handles all payments securely" })
    .setTimestamp();

  const row = new ActionRowBuilder();

  if (SKUS.PRO) {
    row.addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Premium).setSKUId(SKUS.PRO)
    );
  }
  if (SKUS.EMPIRE) {
    row.addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Premium).setSKUId(SKUS.EMPIRE)
    );
  }
  if (!SKUS.PRO && !SKUS.EMPIRE) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Subscribe on Web")
        .setStyle(ButtonStyle.Link)
        .setURL("https://darcloud.host/subscribe")
        .setEmoji("💳")
    );
  }

  return { embeds: [embed], components: row.components.length > 0 ? [row] : [] };
}

// ── Premium Status Embed (for /premium command) ────────

function createPremiumStatusEmbed(interaction) {
  const tier = getUserTier(interaction);
  const tierInfo = getTierInfo(tier);
  const usage = getUsage(interaction.user.id);

  const embed = new EmbedBuilder()
    .setTitle(`${tierInfo.emoji} Your DarCloud Premium Status`)
    .setColor(tierInfo.color)
    .setDescription(`**Current Plan:** ${tierInfo.name}`)
    .addFields(
      {
        name: "Features",
        value: tierInfo.features.map(f => `✅ ${f}`).join("\n"),
        inline: false,
      },
      {
        name: "Today's Usage",
        value: [
          `🤖 AI Questions: ${usage.aiAsks}/${tierInfo.limits.aiAsks === Infinity ? "∞" : tierInfo.limits.aiAsks}`,
          `🎨 NFT Mints: ${usage.nftMints}/${tierInfo.limits.nftMints === Infinity ? "∞" : tierInfo.limits.nftMints}`,
        ].join("\n"),
        inline: true,
      }
    )
    .setFooter({ text: "DarCloud Premium • Resets daily at midnight UTC" })
    .setTimestamp();

  // Show upgrade button if not on Empire
  if (tier !== "empire") {
    const nextTier = tier === "free" ? "pro" : "empire";
    const nextTierInfo = getTierInfo(nextTier);
    embed.addFields({
      name: "⬆️ Upgrade Available",
      value: `**${nextTierInfo.emoji} ${nextTierInfo.name}** — ${nextTierInfo.price}\n${nextTierInfo.features.slice(0, 3).map(f => `• ${f}`).join("\n")}`,
      inline: true,
    });
  }

  return embed;
}

// ── ENTITLEMENT EVENT HANDLERS ──────────────────────────
// These should be registered in each bot's client event handlers

function handleEntitlementCreate(entitlement) {
  console.log(`[PREMIUM] New subscription: User ${entitlement.userId} → SKU ${entitlement.skuId}`);
  // Could notify founder, send welcome DM, etc.
}

function handleEntitlementUpdate(oldEntitlement, newEntitlement) {
  console.log(`[PREMIUM] Subscription updated: User ${newEntitlement.userId} → SKU ${newEntitlement.skuId}`);
}

function handleEntitlementDelete(entitlement) {
  console.log(`[PREMIUM] Subscription cancelled: User ${entitlement.userId} → SKU ${entitlement.skuId}`);
}

// ── Premium Command Definitions ─────────────────────────
// Map of commands to their required tier
const PREMIUM_COMMANDS = {
  // Free tier (everyone)
  "help": "free",
  "onboard": "free",
  "dashboard": "free",
  "referral": "free",
  "services": "free",
  "premium": "free",

  // Pro tier ($4.99/mo)
  "nft-mint": "pro",
  "nft-buy": "pro",
  "nft-sell": "pro",
  "nft-transfer": "pro",
  "nft-gallery": "pro",
  "nft-market": "pro",
  "contract-deploy": "pro",

  // Empire tier ($14.99/mo)
  "founder": "empire",
  "founder-dashboard": "empire",
  "founder-deploy": "empire",
  "founder-exec": "empire",

  // Usage-limited (check separately)
  "ai-ask": "usage",      // free=3/day, pro=unlimited
  "subscribe": "free",    // Always accessible
};

// Quick access function — returns required tier for a command
function getRequiredTier(commandName) {
  return PREMIUM_COMMANDS[commandName] || "free";
}

// ── Premium Revenue Projections ─────────────────────────
const REVENUE_PROJECTIONS = {
  // Discord takes 15% for Premium Apps (first 2 years), 30% after
  discordCut: 0.15,
  projections: {
    "100 Pro + 20 Empire": {
      monthly: (100 * 4.99 * 0.85) + (20 * 14.99 * 0.85),
      annual: ((100 * 4.99 * 0.85) + (20 * 14.99 * 0.85)) * 12,
    },
    "500 Pro + 100 Empire": {
      monthly: (500 * 4.99 * 0.85) + (100 * 14.99 * 0.85),
      annual: ((500 * 4.99 * 0.85) + (100 * 14.99 * 0.85)) * 12,
    },
    "1000 Pro + 250 Empire": {
      monthly: (1000 * 4.99 * 0.85) + (250 * 14.99 * 0.85),
      annual: ((1000 * 4.99 * 0.85) + (250 * 14.99 * 0.85)) * 12,
    },
  },
};

// ── SHOP PRODUCTS — Full Store Catalog ──────────────────
const SHOP_PRODUCTS = [
  {
    id: "pro_subscription",
    name: "DarCloud Pro",
    emoji: "⭐",
    price: "$4.99/mo",
    color: 0x3498db,
    tier: "pro",
    description: "Unlock the full power of DarCloud AI & NFT platform",
    features: [
      "Unlimited GPT-4o AI questions",
      "NFT minting & trading (50/day)",
      "Premium analytics dashboards",
      "Priority support queue",
      "Custom bot responses",
      "Exclusive Pro channels",
      "Advanced data exports",
    ],
    popular: true,
  },
  {
    id: "empire_subscription",
    name: "DarCloud Empire",
    emoji: "👑",
    price: "$14.99/mo",
    color: 0xf1c40f,
    tier: "empire",
    description: "Full empire access — deploy, execute, and command everything",
    features: [
      "Everything in Pro",
      "Founder Console & AI command center",
      "Deploy & exec system commands",
      "Unlimited NFT minting",
      "GPT-4o Turbo model access",
      "Revenue dashboard & analytics",
      "White-label bot access",
      "Full API access (all endpoints)",
      "Early access to new features",
      "Direct founder support channel",
    ],
    popular: false,
  },
  {
    id: "fungimesh_node",
    name: "FungiMesh Node",
    emoji: "🍄",
    price: "$19.99/mo",
    color: 0x22c55e,
    tier: "addon",
    description: "Run your own node on the FungiMesh decentralized network",
    features: [
      "Dedicated mesh relay node",
      "Earn QRN validator rewards",
      "Layer 2 Python mesh access",
      "E2E encrypted communications",
      "Network governance voting",
    ],
    popular: false,
  },
  {
    id: "hwc_premium",
    name: "Halal Wealth Club Premium",
    emoji: "🏦",
    price: "$99/mo",
    color: 0x8b5cf6,
    tier: "addon",
    description: "Premium Islamic finance tools & Shariah-compliant investing",
    features: [
      "Shariah-compliant portfolio screener",
      "Zakat auto-calculator & tracking",
      "Halal investment research (AI)",
      "Private wealth advisory channel",
      "Quarterly Islamic finance reports",
      "DeFi yield farming (halal-filtered)",
    ],
    popular: false,
  },
  {
    id: "enterprise_plan",
    name: "DarCloud Enterprise",
    emoji: "🏢",
    price: "$499/mo",
    color: 0xef4444,
    tier: "enterprise",
    description: "Full enterprise white-label deployment with SLA",
    features: [
      "Dedicated node cluster",
      "100,000 QRN allocation",
      "Custom domain & branding",
      "99.9% uptime SLA",
      "White-label everything",
      "Dedicated account manager",
      "Custom API integrations",
    ],
    popular: false,
  },
];

// ── Shop Embed Builder ──────────────────────────────────

function createShopEmbed(interaction) {
  const userTier = getUserTier(interaction);
  const tierInfo = getTierInfo(userTier);

  const headerEmbed = new EmbedBuilder()
    .setTitle("🛒 DarCloud Shop")
    .setColor(0x2b2d31)
    .setDescription(
      `Welcome to the DarCloud Empire Store!\n` +
      `Your current plan: ${tierInfo.emoji} **${tierInfo.name}**\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💎 **Premium Subscriptions** — Upgrade your experience\n` +
      `🍄 **Add-ons** — Expand your empire\n` +
      `🏢 **Enterprise** — Full white-label deployment\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `All payments handled securely by Discord.\n` +
      `Revenue split: 30% Founder · 40% AI Validators · 10% Hardware · 18% Ecosystem · 2% Zakat ☪️`
    )
    .setFooter({ text: "DarCloud Empire™ — Powered by Discord Premium Apps" })
    .setTimestamp();

  const productEmbeds = SHOP_PRODUCTS.map(product => {
    const embed = new EmbedBuilder()
      .setTitle(`${product.emoji} ${product.name}${product.popular ? " — ⚡ MOST POPULAR" : ""}`)
      .setColor(product.color)
      .setDescription(
        `*${product.description}*\n\n` +
        `**Price:** ${product.price}\n\n` +
        product.features.map(f => `✅ ${f}`).join("\n")
      );
    return embed;
  });

  // Build action rows with subscribe buttons
  const rows = [];

  // Row 1: Main subscriptions
  const row1 = new ActionRowBuilder();
  if (SKUS.PRO) {
    row1.addComponents(new ButtonBuilder().setStyle(ButtonStyle.Premium).setSKUId(SKUS.PRO));
  } else {
    row1.addComponents(
      new ButtonBuilder().setCustomId("shop_buy_pro").setLabel("⭐ Get Pro — $4.99/mo").setStyle(ButtonStyle.Primary)
    );
  }
  if (SKUS.EMPIRE) {
    row1.addComponents(new ButtonBuilder().setStyle(ButtonStyle.Premium).setSKUId(SKUS.EMPIRE));
  } else {
    row1.addComponents(
      new ButtonBuilder().setCustomId("shop_buy_empire").setLabel("👑 Get Empire — $14.99/mo").setStyle(ButtonStyle.Success)
    );
  }
  rows.push(row1);

  // Row 2: Add-ons & Enterprise (Stripe checkout links)
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("shop_buy_fungimesh").setLabel("🍄 FungiMesh Node — $19.99/mo").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("shop_buy_hwc").setLabel("🏦 HWC Premium — $99/mo").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("shop_buy_enterprise").setLabel("🏢 Enterprise — $499/mo").setStyle(ButtonStyle.Danger),
  );
  rows.push(row2);

  // Row 3: Utility buttons
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("premium_compare").setLabel("📊 Compare Plans").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setLabel("🌐 DarCloud Portal").setStyle(ButtonStyle.Link).setURL("https://darcloud.host/subscribe"),
  );
  rows.push(row3);

  return {
    embeds: [headerEmbed, ...productEmbeds],
    components: rows,
  };
}

// ── Shop Buy Button Handler ─────────────────────────────
// Returns { handled: true/false, plan?: string }
function handleShopButton(customId) {
  const map = {
    shop_buy_pro: "pro",
    shop_buy_empire: "empire",
    shop_buy_fungimesh: "fungimesh_node",
    shop_buy_hwc: "hwc_premium",
    shop_buy_enterprise: "enterprise",
  };
  const plan = map[customId];
  if (!plan) return { handled: false };
  return { handled: true, plan };
}

// ── Post Shop to Channel ────────────────────────────────
// Use this to populate the #shop channel with persistent store embeds
async function postShopToChannel(channel) {
  const headerEmbed = new EmbedBuilder()
    .setTitle("🛒 DarCloud Empire — Official Store")
    .setColor(0x1a7f37)
    .setDescription(
      "**Welcome to the DarCloud Store!**\n\n" +
      "Browse our premium subscriptions, add-ons, and enterprise plans below.\n" +
      "All purchases are handled securely through Discord's payment system.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    )
    .setImage("https://darcloud.host/assets/shop-banner.png")
    .setTimestamp();
  await channel.send({ embeds: [headerEmbed] });

  for (const product of SHOP_PRODUCTS) {
    const embed = new EmbedBuilder()
      .setTitle(`${product.emoji} ${product.name}${product.popular ? "  ⚡ MOST POPULAR" : ""}`)
      .setColor(product.color)
      .setDescription(
        `*${product.description}*\n\n` +
        `💰 **${product.price}**\n\n` +
        product.features.map(f => `✅ ${f}`).join("\n") + "\n\n" +
        (product.popular ? "⭐ *Recommended for most users*" : "")
      );

    const row = new ActionRowBuilder();
    if (product.tier === "pro" && SKUS.PRO) {
      row.addComponents(new ButtonBuilder().setStyle(ButtonStyle.Premium).setSKUId(SKUS.PRO));
    } else if (product.tier === "empire" && SKUS.EMPIRE) {
      row.addComponents(new ButtonBuilder().setStyle(ButtonStyle.Premium).setSKUId(SKUS.EMPIRE));
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`shop_buy_${product.id}`)
          .setLabel(`Get ${product.name} — ${product.price}`)
          .setStyle(product.popular ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setEmoji(product.emoji)
      );
    }
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("premium_compare")
        .setLabel("Compare Plans")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📊")
    );

    await channel.send({ embeds: [embed], components: [row] });
  }

  // Final CTA
  const ctaEmbed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setDescription(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
      "💡 **Not sure which plan?** Use `/premium` to check your current status.\n" +
      "❓ **Questions?** Ask our AI with `/ai-ask how do premium plans work?`\n" +
      "🔗 **Web Portal:** https://darcloud.host/subscribe\n\n" +
      "**Revenue Split:** 30% Founder · 40% AI Validators · 10% Hardware · 18% Ecosystem · 2% Zakat ☪️\n\n" +
      "*Discord handles all payments securely. Cancel anytime.*"
    );
  await channel.send({ embeds: [ctaEmbed] });
}

module.exports = {
  SKUS,
  TIERS,
  PREMIUM_COMMANDS,
  REVENUE_PROJECTIONS,
  SHOP_PRODUCTS,
  getUserTier,
  getTierInfo,
  checkPremiumAccess,
  checkUsageLimit,
  trackUsage,
  getUsage,
  getRequiredTier,
  createUpsellEmbed,
  createComparisonEmbed,
  createPremiumStatusEmbed,
  createShopEmbed,
  handleShopButton,
  postShopToChannel,
  handleEntitlementCreate,
  handleEntitlementUpdate,
  handleEntitlementDelete,
};
