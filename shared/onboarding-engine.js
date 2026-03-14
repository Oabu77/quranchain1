// ══════════════════════════════════════════════════════════════
// DarCloud Empire — Onboarding Engine
// Handles the full member onboarding flow across all bots
// ══════════════════════════════════════════════════════════════
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require("discord.js");
const onboardingDb = require("./onboarding-db");

// ── Onboarding Steps ──────────────────────────────────────
const ONBOARD_STEPS = {
  0: "welcome",
  1: "collect_name",
  2: "collect_email",
  3: "create_wallet",
  4: "provision_services",
  5: "select_plan",
  6: "complete",
  7: "done",
};

const SUBSCRIPTION_TIERS = {
  free:       { name: "Starter (Free)", price: 0,    features: ["QRN Wallet (100 QRN)", "DarCloud Email", "MeshTalk Account", "Community Access"] },
  pro:        { name: "Professional",   price: 4900, features: ["All Starter +", "FungiMesh Node", "10,000 QRN Bonus", "Priority Support", "API Access"] },
  enterprise: { name: "Enterprise",     price: 49900, features: ["All Pro +", "Dedicated Node Cluster", "100,000 QRN Bonus", "Custom Domain", "SLA 99.9%", "White-Label"] },
  custom:     { name: "Custom",         price: -1,   features: ["Everything +", "Custom Integration", "Dedicated Account Manager"] },
};

const SERVICE_CATALOG = {
  darcloud_email:  { name: "DarCloud Email",       type: "email",     auto: true  },
  qrn_wallet:      { name: "QRN Wallet",           type: "wallet",    auto: true  },
  meshtalk:        { name: "MeshTalk OS Account",   type: "meshtalk",  auto: true  },
  fungimesh_node:  { name: "FungiMesh Node",        type: "mesh",      auto: false },
  hwc_account:     { name: "HWC Bank Account",      type: "banking",   auto: false },
  darnas_account:  { name: "Dar Al-Nas Account",    type: "banking",   auto: false },
};

// ── Welcome Embed ─────────────────────────────────────────
function createWelcomeEmbed(member) {
  return new EmbedBuilder()
    .setColor(0x00D4AA)
    .setTitle("🕌 Bismillah — Welcome to the DarCloud Empire!")
    .setDescription(
      `Assalamu Alaikum **${member.user.displayName || member.user.username}**!\n\n` +
      "Welcome to the **DarCloud Empire** — the world's first Islamic Web3 ecosystem.\n\n" +
      "🔗 **QuranChain** — Blockchain secured by Quranic verses\n" +
      "💰 **DarPay** — Halal payments & Muslim Wallet\n" +
      "🌿 **FungiMesh** — Decentralized mesh network\n" +
      "🏦 **Halal Wealth Club** — Islamic banking\n" +
      "🏛️ **Dar Al-Nas** — Community banking\n" +
      "💬 **MeshTalk** — Encrypted communications\n\n" +
      "Let's get you set up! Click **Start Onboarding** below."
    )
    .setThumbnail(member.guild.iconURL({ size: 128 }) || null)
    .setFooter({ text: "DarCloud Empire • Powered by QuranChain" })
    .setTimestamp();
}

function createOnboardingButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("onboard_start").setLabel("🚀 Start Onboarding").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("onboard_skip").setLabel("Skip for Now").setStyle(ButtonStyle.Secondary),
  );
}

// ── Name Collection Modal ─────────────────────────────────
function createNameModal() {
  return new ModalBuilder()
    .setCustomId("onboard_name_modal")
    .setTitle("Your Information")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("full_name")
          .setLabel("Full Name")
          .setPlaceholder("Enter your full name")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
      ),
    );
}

// ── Email Collection Modal ────────────────────────────────
function createEmailModal() {
  return new ModalBuilder()
    .setCustomId("onboard_email_modal")
    .setTitle("Email & Contact")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("email")
          .setLabel("Email Address")
          .setPlaceholder("you@example.com")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(254)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("phone")
          .setLabel("Phone (Optional)")
          .setPlaceholder("+1 (555) 000-0000")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(20)
      ),
    );
}

// ── Plan Selection Menu ───────────────────────────────────
function createPlanMenu() {
  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle("📋 Select Your Plan")
    .setDescription(
      "**Starter (Free)**\n" +
      "• QRN Wallet (100 QRN) • DarCloud Email • MeshTalk Account • Community Access\n\n" +
      "**Professional ($49/mo)**\n" +
      "• All Starter + FungiMesh Node • 10,000 QRN Bonus • Priority Support • API Access\n\n" +
      "**Enterprise ($499/mo)**\n" +
      "• All Pro + Dedicated Node Cluster • 100K QRN • Custom Domain • SLA 99.9%\n\n" +
      "**Custom (Contact Us)**\n" +
      "• Everything + Custom Integration • Dedicated Account Manager"
    );

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("onboard_plan_select")
      .setPlaceholder("Choose your plan")
      .addOptions([
        { label: "Starter (Free)", description: "QRN Wallet + Email + MeshTalk", value: "free", emoji: "🆓" },
        { label: "Professional ($49/mo)", description: "Starter + FungiMesh Node + 10K QRN", value: "pro", emoji: "⚡" },
        { label: "Enterprise ($499/mo)", description: "Pro + Dedicated Cluster + 100K QRN", value: "enterprise", emoji: "🏢" },
        { label: "Custom (Contact Us)", description: "Full custom integration", value: "custom", emoji: "🌟" },
      ])
  );

  return { embed, row };
}

// ── Service Provisioning ──────────────────────────────────
function provisionStarterServices(discordId, discordTag, fullName, email) {
  const username = discordTag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);

  // 1. DarCloud Email
  const darcloudEmail = `${username}@darcloud.host`;
  onboardingDb.stmts.setDarCloudEmail.run(darcloudEmail, discordId);
  onboardingDb.provisionService(discordId, darcloudEmail, "email", { domain: "darcloud.host", username });

  // 2. QRN Wallet (via QuranChain bot's database)
  const walletAddress = onboardingDb.generateWalletAddress(discordId);
  onboardingDb.provisionService(discordId, walletAddress, "wallet", { initial_balance: 100, currency: "QRN" });

  // 3. MeshTalk Account
  const meshtalkId = `mt-${username}`;
  onboardingDb.stmts.setMeshTalkId.run(meshtalkId, discordId);
  onboardingDb.provisionService(discordId, meshtalkId, "meshtalk", { username, encryption: "e2e" });

  return { darcloudEmail, walletAddress, meshtalkId };
}

function provisionProServices(discordId, discordTag) {
  const username = discordTag.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 20);

  // FungiMesh Node
  const nodeId = `fm-node-${username}-${Date.now().toString(36)}`;
  onboardingDb.stmts.setFungiMeshNode.run(nodeId, discordId);
  onboardingDb.provisionService(discordId, nodeId, "mesh", { type: "standard", region: "auto" });

  return { nodeId };
}

// ── Completion Embed ──────────────────────────────────────
function createCompletionEmbed(member, services, plan) {
  const tier = SUBSCRIPTION_TIERS[plan] || SUBSCRIPTION_TIERS.free;
  const embed = new EmbedBuilder()
    .setColor(0x00FF88)
    .setTitle("✅ Onboarding Complete! Welcome to the DarCloud Empire!")
    .setDescription(
      `**${member.discord_tag}**, your accounts are ready!\n\n` +
      `📧 **DarCloud Email:** ${services.darcloudEmail}\n` +
      `💰 **QRN Wallet:** \`${services.walletAddress.slice(0, 16)}...\`\n` +
      `💬 **MeshTalk ID:** ${services.meshtalkId}\n` +
      (services.nodeId ? `🌿 **FungiMesh Node:** ${services.nodeId}\n` : "") +
      `\n🏷️ **Plan:** ${tier.name}\n` +
      `🎉 **Referral Code:** \`${member.referral_code}\`\n\n` +
      "Share your referral code to earn **500 QRN** per referral!"
    )
    .setFooter({ text: "DarCloud Empire • Powered by QuranChain" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("view_dashboard").setLabel("📊 View Dashboard").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("view_wallet").setLabel("💰 My Wallet").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setLabel("🌐 DarCloud Portal").setStyle(ButtonStyle.Link).setURL("https://darcloud.host"),
  );

  return { embed, row };
}

// ── Dashboard Embed ───────────────────────────────────────
function createDashboardEmbed(dashboard) {
  const m = dashboard.member;
  const services = dashboard.services;
  const payments = dashboard.payments;
  const serviceList = services.map(s => `• **${s.service_name}** (${s.service_type}) — ${s.status}`).join("\n") || "No services yet";
  const paymentTotal = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);

  return new EmbedBuilder()
    .setColor(0x00D4AA)
    .setTitle(`📊 Dashboard — ${m.discord_tag}`)
    .setDescription(
      `**Member Since:** ${m.created_at}\n` +
      `**Plan:** ${(SUBSCRIPTION_TIERS[m.hwc_tier] || SUBSCRIPTION_TIERS.free).name}\n` +
      `**Onboarding:** ${m.onboard_complete ? "✅ Complete" : `Step ${m.onboard_step}/7`}\n` +
      `**KYC:** ${m.kyc_verified ? "✅ Verified" : "⏳ Pending"}\n\n` +
      `📧 **Email:** ${m.darcloud_email || "Not set"}\n` +
      `💰 **Wallet:** \`${m.wallet_address ? m.wallet_address.slice(0, 16) + "..." : "Not created"}\`\n` +
      `💬 **MeshTalk:** ${m.meshtalk_id || "Not set"}\n` +
      `🌿 **FungiMesh:** ${m.fungimesh_node || "Not deployed"}\n` +
      `🎉 **Referral Code:** \`${m.referral_code}\`\n\n` +
      `**── Services ──**\n${serviceList}\n\n` +
      `**── Payments ──**\n` +
      `Total Spent: $${(paymentTotal / 100).toFixed(2)}\n` +
      `Transactions: ${payments.length}`
    )
    .setFooter({ text: "DarCloud Empire • Powered by QuranChain" })
    .setTimestamp();
}

// ── Interaction Handler ───────────────────────────────────
async function handleOnboardingInteraction(interaction, botName = "darcloud") {
  const userId = interaction.user.id;
  const userTag = interaction.user.tag || interaction.user.username;

  // Button: Start Onboarding
  if (interaction.customId === "onboard_start") {
    const member = onboardingDb.getOrCreateMember(userId, userTag);
    onboardingDb.stmts.setOnboardStep.run(1, userId);
    onboardingDb.stmts.logEvent.run(userId, "onboard_started", "{}", botName);
    await interaction.showModal(createNameModal());
    return true;
  }

  // Button: Skip
  if (interaction.customId === "onboard_skip") {
    onboardingDb.getOrCreateMember(userId, userTag);
    onboardingDb.stmts.logEvent.run(userId, "onboard_skipped", "{}", botName);
    await interaction.reply({ content: "No problem! You can start onboarding anytime with `/onboard`.", ephemeral: true });
    return true;
  }

  // Modal: Name submitted
  if (interaction.customId === "onboard_name_modal") {
    const fullName = interaction.fields.getTextInputValue("full_name");
    onboardingDb.stmts.setFullName.run(fullName, userId);
    onboardingDb.stmts.setOnboardStep.run(2, userId);
    onboardingDb.stmts.logEvent.run(userId, "name_collected", JSON.stringify({ name: fullName }), botName);
    await interaction.showModal(createEmailModal());
    return true;
  }

  // Modal: Email submitted
  if (interaction.customId === "onboard_email_modal") {
    const email = interaction.fields.getTextInputValue("email");
    const phone = interaction.fields.getTextInputValue("phone") || null;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await interaction.reply({ content: "❌ Please enter a valid email address.", ephemeral: true });
      return true;
    }

    onboardingDb.stmts.setEmail.run(email, userId);
    if (phone) onboardingDb.stmts.setPhone.run(phone, userId);
    onboardingDb.stmts.setOnboardStep.run(3, userId);
    onboardingDb.stmts.logEvent.run(userId, "email_collected", JSON.stringify({ email }), botName);

    // Show plan selection
    const { embed, row } = createPlanMenu();
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    return true;
  }

  // Select Menu: Plan chosen
  if (interaction.customId === "onboard_plan_select") {
    const plan = interaction.values[0];
    const member = onboardingDb.stmts.getMember.get(userId);
    if (!member) {
      await interaction.reply({ content: "❌ Please start onboarding first with `/onboard`.", ephemeral: true });
      return true;
    }

    onboardingDb.stmts.setHwcTier.run(plan, userId);
    onboardingDb.stmts.setOnboardStep.run(4, userId);

    // Provision starter services for all plans
    const services = provisionStarterServices(userId, userTag, member.full_name, member.email);

    // Pro/Enterprise get extra services
    if (plan === "pro" || plan === "enterprise") {
      const proServices = provisionProServices(userId, userTag);
      services.nodeId = proServices.nodeId;
    }

    // Complete onboarding
    onboardingDb.stmts.completeOnboarding.run(userId);

    // Get updated member
    const updated = onboardingDb.stmts.getMember.get(userId);
    const { embed, row } = createCompletionEmbed(updated, services, plan);
    await interaction.update({ embeds: [embed], components: [row] });

    onboardingDb.stmts.logEvent.run(userId, "onboard_completed", JSON.stringify({ plan, services }), botName);

    // If paid plan, they'll need to go through Stripe
    if (plan === "pro" || plan === "enterprise") {
      const tier = SUBSCRIPTION_TIERS[plan];
      const paymentEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle("💳 Complete Your Payment")
        .setDescription(
          `To activate your **${tier.name}** plan ($${(tier.price / 100).toFixed(2)}/mo), ` +
          `use the \`/subscribe\` command or visit:\n\n` +
          `🔗 **https://pay.darcloud.host/checkout/${plan}**`
        );
      await interaction.followUp({ embeds: [paymentEmbed], ephemeral: true });
    }

    return true;
  }

  // Button: View Dashboard
  if (interaction.customId === "view_dashboard") {
    const dashboard = onboardingDb.getMemberDashboard(userId);
    if (!dashboard) {
      await interaction.reply({ content: "❌ No account found. Use `/onboard` to get started.", ephemeral: true });
      return true;
    }
    const embed = createDashboardEmbed(dashboard);
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return true;
  }

  // Button: View Wallet
  if (interaction.customId === "view_wallet") {
    const member = onboardingDb.stmts.getMember.get(userId);
    if (!member) {
      await interaction.reply({ content: "❌ No wallet found. Use `/onboard` to get started.", ephemeral: true });
      return true;
    }
    const embed = new EmbedBuilder()
      .setColor(0x00FF88)
      .setTitle("💰 Muslim Wallet")
      .setDescription(
        `**Wallet Address:** \`${member.wallet_address}\`\n` +
        `**Network:** QuranChain Mainnet\n` +
        `**Status:** Active ✅\n\n` +
        `Use the QuranChain bot commands to manage your QRN tokens:\n` +
        `\`/wallet\` — Check balance\n` +
        `\`/send\` — Transfer QRN\n` +
        `\`/mine\` — Mine QRN\n` +
        `\`/daily\` — Daily rewards`
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return true;
  }

  return false;
}

// ── Slash Command Handlers ────────────────────────────────
const ONBOARDING_COMMANDS = [
  {
    name: "onboard",
    description: "Start or resume your DarCloud Empire onboarding",
  },
  {
    name: "dashboard",
    description: "View your DarCloud Empire member dashboard",
  },
  {
    name: "referral",
    description: "Get your referral code and stats",
  },
  {
    name: "services",
    description: "View your active services and accounts",
  },
  {
    name: "subscribe",
    description: "Subscribe to a DarCloud plan",
    options: [
      {
        name: "plan",
        description: "The plan to subscribe to",
        type: 3, // STRING
        required: true,
        choices: [
          { name: "Professional ($49/mo)", value: "pro" },
          { name: "Enterprise ($499/mo)", value: "enterprise" },
        ],
      },
    ],
  },
];

async function handleOnboardingCommand(interaction, botName = "darcloud") {
  const userId = interaction.user.id;
  const userTag = interaction.user.tag || interaction.user.username;

  switch (interaction.commandName) {
    case "onboard": {
      const member = onboardingDb.getOrCreateMember(userId, userTag);
      if (member.onboard_complete) {
        const dashboard = onboardingDb.getMemberDashboard(userId);
        const embed = createDashboardEmbed(dashboard);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      const embed = createWelcomeEmbed(interaction.member || interaction.user);
      const buttons = createOnboardingButtons();
      return interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    }

    case "dashboard": {
      const dashboard = onboardingDb.getMemberDashboard(userId);
      if (!dashboard) {
        return interaction.reply({ content: "❌ No account found. Use `/onboard` to get started.", ephemeral: true });
      }
      const embed = createDashboardEmbed(dashboard);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    case "referral": {
      const member = onboardingDb.stmts.getMember.get(userId);
      if (!member) {
        return interaction.reply({ content: "❌ No account found. Use `/onboard` to get started.", ephemeral: true });
      }
      const referrals = onboardingDb.db.prepare("SELECT COUNT(*) as count FROM members WHERE referred_by = ?").get(member.referral_code);
      const embed = new EmbedBuilder()
        .setColor(0x00D4AA)
        .setTitle("🎉 Your Referral Program")
        .setDescription(
          `**Your Referral Code:** \`${member.referral_code}\`\n\n` +
          `**Referrals:** ${referrals.count}\n` +
          `**QRN Earned:** ${referrals.count * 500} QRN\n\n` +
          `Share your code! Each referral earns **500 QRN** for you AND your friend.`
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    case "services": {
      const services = onboardingDb.stmts.getUserServices.all(userId);
      if (!services.length) {
        return interaction.reply({ content: "❌ No services yet. Use `/onboard` to get started.", ephemeral: true });
      }
      const list = services.map(s => `• **${s.service_name}** (${s.service_type}) — ${s.status}`).join("\n");
      const embed = new EmbedBuilder()
        .setColor(0x00D4AA)
        .setTitle("🛠️ Your Active Services")
        .setDescription(list);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    case "subscribe": {
      const plan = interaction.options.getString("plan");
      const tier = SUBSCRIPTION_TIERS[plan];
      if (!tier) {
        return interaction.reply({ content: "❌ Invalid plan.", ephemeral: true });
      }
      const member = onboardingDb.getOrCreateMember(userId, userTag);

      // Create real Stripe checkout session
      try {
        const stripeIntegration = require("./stripe-integration");
        const session = await stripeIntegration.createCheckoutSession(userId, plan);
        const embed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle(`💳 Subscribe to ${tier.name}`)
          .setDescription(
            `**Price:** $${(tier.price / 100).toFixed(2)}/month\n\n` +
            `**Features:**\n${tier.features.map(f => `✅ ${f}`).join("\n")}\n\n` +
            `🔗 **[Complete Checkout Here](${session.url})**\n\n` +
            (session.simulated ? "⚠️ *Simulation mode*" : "🔒 *Secured by Stripe*")
          )
          .setFooter({ text: "DarCloud Empire • Revenue Split: 30-40-10-18-2%" })
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `❌ Payment error: ${err.message}`, ephemeral: true });
      }
    }
  }
}

module.exports = {
  ONBOARD_STEPS,
  SUBSCRIPTION_TIERS,
  SERVICE_CATALOG,
  ONBOARDING_COMMANDS,
  createWelcomeEmbed,
  createOnboardingButtons,
  createDashboardEmbed,
  handleOnboardingInteraction,
  handleOnboardingCommand,
  provisionStarterServices,
  provisionProServices,
};
