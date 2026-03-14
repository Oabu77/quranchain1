// ══════════════════════════════════════════════════════════════
// DarCloud Empire — Auto Setup & Service Provisioner
// One-command install for ALL DarCloud services per member
// ══════════════════════════════════════════════════════════════
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const onboardingDb = require("./onboarding-db");

// ── Full Service Catalog ──────────────────────────────────
const ALL_SERVICES = {
  // ── Core Platform (Auto-provisioned) ──
  darcloud_email: {
    name: "DarCloud Email",
    icon: "📧",
    category: "core",
    auto: true,
    description: "Secure @darcloud.host email",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const email = `${username}@darcloud.host`;
      onboardingDb.stmts.setDarCloudEmail?.run(email, uid);
      onboardingDb.provisionService(uid, email, "email", { domain: "darcloud.host", username });
      return { id: email, display: email };
    },
  },
  qrn_wallet: {
    name: "QRN Wallet",
    icon: "💰",
    category: "core",
    auto: true,
    description: "QuranChain wallet with 100 QRN starter balance",
    provision: (uid) => {
      const address = onboardingDb.generateWalletAddress(uid);
      onboardingDb.provisionService(uid, address, "wallet", { initial_balance: 100, currency: "QRN" });
      return { id: address, display: `${address.slice(0, 16)}...` };
    },
  },
  meshtalk_account: {
    name: "MeshTalk OS",
    icon: "💬",
    category: "core",
    auto: true,
    description: "Encrypted mesh communications account",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const mtId = `mt-${username}`;
      onboardingDb.stmts.setMeshTalkId?.run(mtId, uid);
      onboardingDb.provisionService(uid, mtId, "meshtalk", { username, encryption: "e2e" });
      return { id: mtId, display: mtId };
    },
  },

  // ── Hosting & Infrastructure ──
  personal_hosting: {
    name: "DarCloud Personal Hosting",
    icon: "🖥️",
    category: "hosting",
    auto: true,
    description: "Personal cloud hosting space (5GB starter)",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const hostId = `host-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, hostId, "hosting", { storage_gb: 5, region: "auto", type: "personal" });
      return { id: hostId, display: `${username}.darcloud.host` };
    },
  },
  fungimesh_node: {
    name: "FungiMesh Node",
    icon: "🌿",
    category: "mesh",
    auto: true,
    description: "Decentralized mesh network node",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const nodeId = `fm-node-${username}-${Date.now().toString(36)}`;
      onboardingDb.stmts.setFungiMeshNode?.run(nodeId, uid);
      onboardingDb.provisionService(uid, nodeId, "mesh", { type: "standard", region: "auto", dualLayer: true });
      return { id: nodeId, display: nodeId };
    },
  },

  // ── Financial Services ──
  hwc_account: {
    name: "Halal Wealth Club Account",
    icon: "🏦",
    category: "finance",
    auto: true,
    description: "Islamic banking — zero riba, Shariah-compliant",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const acctId = `hwc-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, acctId, "banking", { type: "hwc", shariah: true });
      return { id: acctId, display: `HWC-${username.toUpperCase()}` };
    },
  },
  darpay_wallet: {
    name: "DarPay™ Payment Wallet",
    icon: "💳",
    category: "finance",
    auto: true,
    description: "Halal payments — send/receive with zero riba",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const walletId = `dp-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, walletId, "payment", { type: "darpay", currency: "USD" });
      return { id: walletId, display: `DarPay-${username.toUpperCase()}` };
    },
  },
  darnas_account: {
    name: "Dar Al-Nas Bank Account",
    icon: "🏛️",
    category: "finance",
    auto: true,
    description: "Community Islamic banking services",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const acctId = `dn-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, acctId, "banking", { type: "darnas", community: true });
      return { id: acctId, display: `DarNas-${username.toUpperCase()}` };
    },
  },

  // ── Blockchain & DeFi ──
  defi_account: {
    name: "DarDeFi™ Protocol Access",
    icon: "⛓️",
    category: "blockchain",
    auto: true,
    description: "Halal DeFi — staking, yield, swaps (no riba)",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const defiId = `defi-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, defiId, "defi", { protocol: "dardefi", halal: true });
      return { id: defiId, display: `DeFi-${username.toUpperCase()}` };
    },
  },
  nft_gallery: {
    name: "DarNFT™ Gallery",
    icon: "🎨",
    category: "blockchain",
    auto: true,
    description: "Islamic digital art & asset gallery",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const nftId = `nft-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, nftId, "nft", { gallery: true });
      return { id: nftId, display: `NFT-${username.toUpperCase()}` };
    },
  },

  // ── AI & Intelligence ──
  ai_assistant: {
    name: "Omar AI™ Personal Assistant",
    icon: "🤖",
    category: "ai",
    auto: true,
    description: "AI assistant powered by Omar AI™ fleet",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const aiId = `ai-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, aiId, "ai", { model: "omar-ai-v1", quota: 100 });
      return { id: aiId, display: `OmarAI-${username}` };
    },
  },

  // ── Security ──
  darvault: {
    name: "DarVault™ Secure Storage",
    icon: "🔐",
    category: "security",
    auto: true,
    description: "Encrypted vault for passwords, keys & documents",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const vaultId = `vault-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, vaultId, "vault", { encryption: "AES-256", storage_mb: 100 });
      return { id: vaultId, display: `Vault-${username}` };
    },
  },

  // ── Lifestyle ──
  darcommerce_store: {
    name: "DarCommerce™ Storefront",
    icon: "🛒",
    category: "lifestyle",
    auto: true,
    description: "Halal e-commerce — your own shop",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const storeId = `store-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, storeId, "commerce", { type: "storefront", halal_certified: true });
      return { id: storeId, display: `${username}.darcommerce.host` };
    },
  },
  daredu_access: {
    name: "DarEdu™ Learning Platform",
    icon: "📚",
    category: "lifestyle",
    auto: true,
    description: "Islamic education — Quran, Hadith, Tech courses",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const eduId = `edu-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, eduId, "education", { courses: ["quran-101", "blockchain-basics"] });
      return { id: eduId, display: `Scholar-${username}` };
    },
  },
  darhealth_profile: {
    name: "DarHealth™ Profile",
    icon: "🏥",
    category: "lifestyle",
    auto: true,
    description: "Halal telemedicine & health records",
    provision: (uid, tag) => {
      const username = tag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);
      const healthId = `health-${username}-${Date.now().toString(36)}`;
      onboardingDb.provisionService(uid, healthId, "health", { telemedicine: true, halal_pharmacy: true });
      return { id: healthId, display: `Health-${username}` };
    },
  },
};

// ── Category Display Names ────────────────────────────────
const CATEGORIES = {
  core:       { name: "Core Platform",          icon: "🏗️" },
  hosting:    { name: "Hosting & Infrastructure", icon: "🖥️" },
  mesh:       { name: "Mesh Network",           icon: "🌿" },
  finance:    { name: "Islamic Finance",         icon: "🏦" },
  blockchain: { name: "Blockchain & DeFi",       icon: "⛓️" },
  ai:         { name: "AI & Intelligence",       icon: "🤖" },
  security:   { name: "Security",               icon: "🔐" },
  lifestyle:  { name: "Lifestyle & Education",   icon: "📚" },
};

// ── Auto-Setup All Services ───────────────────────────────
function setupAllServices(discordId, discordTag) {
  const results = { success: [], failed: [], skipped: [] };

  for (const [key, service] of Object.entries(ALL_SERVICES)) {
    try {
      // Check if already provisioned
      const existing = onboardingDb.getMemberServices?.(discordId) || [];
      const alreadyHas = existing.some(s => s.service_type === service.provision.toString().match(/type: "(\w+)"/)?.[1]);

      if (alreadyHas) {
        results.skipped.push({ key, name: service.name, icon: service.icon, reason: "Already provisioned" });
        continue;
      }

      const result = service.provision(discordId, discordTag);
      results.success.push({ key, name: service.name, icon: service.icon, id: result.display, category: service.category });
    } catch (err) {
      results.failed.push({ key, name: service.name, icon: service.icon, error: err.message });
    }
  }

  // Mark member as fully provisioned
  try {
    onboardingDb.stmts.setOnboardStep?.run(7, discordId);
    onboardingDb.stmts.setOnboardComplete?.run(1, discordId);
  } catch {}

  return results;
}

// ── Setup Progress Embed ──────────────────────────────────
function createSetupProgressEmbed(discordTag) {
  return new EmbedBuilder()
    .setColor(0x00D4AA)
    .setTitle("⚡ DarCloud Empire — Auto Setup")
    .setDescription(
      `Setting up **${Object.keys(ALL_SERVICES).length} services** for **${discordTag}**...\n\n` +
      "```\n" +
      Object.values(ALL_SERVICES).map(s => `${s.icon} ${s.name}... ⏳`).join("\n") +
      "\n```"
    )
    .setFooter({ text: "DarCloud Empire • One-Command Setup" })
    .setTimestamp();
}

// ── Setup Complete Embed ──────────────────────────────────
function createSetupCompleteEmbed(discordTag, results) {
  const successByCat = {};
  for (const s of results.success) {
    if (!successByCat[s.category]) successByCat[s.category] = [];
    successByCat[s.category].push(s);
  }

  let description = `✅ **${results.success.length}** services activated for **${discordTag}**\n`;
  if (results.skipped.length) description += `⏭️ **${results.skipped.length}** already configured\n`;
  if (results.failed.length) description += `❌ **${results.failed.length}** failed\n`;
  description += "\n";

  // Group by category
  for (const [catKey, cat] of Object.entries(CATEGORIES)) {
    const services = successByCat[catKey];
    if (!services || !services.length) continue;
    description += `**${cat.icon} ${cat.name}**\n`;
    for (const s of services) {
      description += `${s.icon} ${s.name}: \`${s.id}\`\n`;
    }
    description += "\n";
  }

  // Add skipped
  if (results.skipped.length) {
    description += "**⏭️ Already Active**\n";
    for (const s of results.skipped) {
      description += `${s.icon} ${s.name}\n`;
    }
    description += "\n";
  }

  const embed = new EmbedBuilder()
    .setColor(results.failed.length > 0 ? 0xFFAA00 : 0x00FF88)
    .setTitle("🎉 DarCloud Empire — Setup Complete!")
    .setDescription(description)
    .addFields(
      { name: "🌐 Portal", value: "[darcloud.host](https://darcloud.host/dashboard)", inline: true },
      { name: "💬 Support", value: "[Discord](https://discord.gg/darcloud)", inline: true },
      { name: "📋 Revenue Split", value: "30-40-10-18-2%", inline: true },
    )
    .setFooter({ text: `DarCloud Empire • ${results.success.length} services • Powered by QuranChain` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("view_dashboard").setLabel("📊 Dashboard").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("view_wallet").setLabel("💰 Wallet").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("setup_upgrade").setLabel("⬆️ Upgrade Plan").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setLabel("🌐 DarCloud Portal").setStyle(ButtonStyle.Link).setURL("https://darcloud.host/dashboard"),
  );

  return { embed, row };
}

// ── Service Status Embed ──────────────────────────────────
function createServiceStatusEmbed(discordId, discordTag) {
  let services = [];
  try {
    services = onboardingDb.getMemberServices?.(discordId) || [];
  } catch {}

  const member = onboardingDb.stmts.getMember?.get(discordId);
  const totalServices = Object.keys(ALL_SERVICES).length;
  const activeCount = services.length;
  const pct = Math.round((activeCount / totalServices) * 100);

  const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
  let desc = `**${discordTag}** — ${activeCount}/${totalServices} services active\n\`[${bar}] ${pct}%\`\n\n`;

  if (services.length) {
    for (const s of services) {
      const svc = Object.values(ALL_SERVICES).find(a => {
        try { return a.provision.toString().includes(`"${s.service_type}"`); } catch { return false; }
      });
      desc += `${svc?.icon || "•"} **${s.service_name}** — ${s.status === "active" ? "✅" : "⏳"}\n`;
    }
  } else {
    desc += "No services provisioned yet. Run `/setup` to get started!";
  }

  return new EmbedBuilder()
    .setColor(0x00D4AA)
    .setTitle("📋 Your DarCloud Services")
    .setDescription(desc)
    .addFields(
      { name: "Plan", value: member?.hwc_tier ? member.hwc_tier.charAt(0).toUpperCase() + member.hwc_tier.slice(1) : "Free", inline: true },
      { name: "QRN Balance", value: member?.wallet_address ? "100 QRN" : "—", inline: true },
      { name: "Referral Code", value: member?.referral_code || "—", inline: true },
    )
    .setFooter({ text: "DarCloud Empire • /setup to provision all services" })
    .setTimestamp();
}

module.exports = {
  ALL_SERVICES,
  CATEGORIES,
  setupAllServices,
  createSetupProgressEmbed,
  createSetupCompleteEmbed,
  createServiceStatusEmbed,
};
