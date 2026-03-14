// ==========================================================
// QuranChain™ / DarCloud™ Discord Bot — Slash Command Registration
// ==========================================================
const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { readFileSync } = require("fs");
const { resolve } = require("path");

// Load .env
try {
  const env = readFileSync(resolve(__dirname, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // optional: for instant dev registration

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment");
  process.exit(1);
}

const commands = [
  // ── System ──
  new SlashCommandBuilder()
    .setName("health")
    .setDescription("Check DarCloud system health"),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Admin dashboard stats (users, contracts, companies, IP)"),

  // ── AI Fleet ──
  new SlashCommandBuilder()
    .setName("ai-fleet")
    .setDescription("List all 66 AI agents by platform"),

  new SlashCommandBuilder()
    .setName("ai-assistants")
    .setDescription("List all 12 GPT-4o assistants"),

  new SlashCommandBuilder()
    .setName("ai-benchmark")
    .setDescription("AI fleet performance metrics"),

  // ── Mesh Network ──
  new SlashCommandBuilder()
    .setName("mesh-status")
    .setDescription("FungiMesh dual-layer network health"),

  new SlashCommandBuilder()
    .setName("mesh-nodes")
    .setDescription("List all mesh nodes with heartbeat status"),

  // ── Tasks ──
  new SlashCommandBuilder()
    .setName("tasks")
    .setDescription("List operational tasks")
    .addStringOption((opt) =>
      opt.setName("search").setDescription("Filter by name/description").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("task-create")
    .setDescription("Create a new infrastructure task")
    .addStringOption((opt) => opt.setName("name").setDescription("Task name").setRequired(true))
    .addStringOption((opt) => opt.setName("slug").setDescription("URL slug").setRequired(true))
    .addStringOption((opt) => opt.setName("description").setDescription("Task description").setRequired(false)),

  // ── Contracts ──
  new SlashCommandBuilder()
    .setName("contracts")
    .setDescription("List all active inter-company contracts"),

  new SlashCommandBuilder()
    .setName("companies")
    .setDescription("List all 101 DarCloud ecosystem companies"),

  // ── IP Portfolio ──
  new SlashCommandBuilder()
    .setName("ip")
    .setDescription("View intellectual property portfolio")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("IP category")
        .setRequired(true)
        .addChoices(
          { name: "Trademarks", value: "trademarks" },
          { name: "Patents", value: "patents" },
          { name: "Copyrights", value: "copyrights" },
          { name: "Trade Secrets", value: "trade-secrets" }
        )
    ),

  // ── Backups ──
  new SlashCommandBuilder()
    .setName("backups")
    .setDescription("List backup registry with mesh replication status"),

  // ── Minecraft ──
  new SlashCommandBuilder()
    .setName("minecraft")
    .setDescription("Minecraft server status and player counts"),

  // ── Multipass VMs ──
  new SlashCommandBuilder()
    .setName("vms")
    .setDescription("List Multipass VM fleet"),

  new SlashCommandBuilder()
    .setName("fleet-health")
    .setDescription("Overall VM fleet capacity and health"),

  // ── Legal ──
  new SlashCommandBuilder()
    .setName("legal-filings")
    .setDescription("Corporate filings and legal documents"),

  // ── Service Management ──
  new SlashCommandBuilder()
    .setName("service")
    .setDescription("Manage PM2 services (start/stop/restart/status/logs)")
    .addStringOption((opt) =>
      opt.setName("action").setDescription("Action to perform").setRequired(true)
        .addChoices(
          { name: "Status", value: "status" },
          { name: "Start", value: "start" },
          { name: "Stop", value: "stop" },
          { name: "Restart", value: "restart" },
          { name: "Logs", value: "logs" }
        )
    )
    .addStringOption((opt) =>
      opt.setName("name").setDescription("Service name (blank = all)").setRequired(false)
        .addChoices(
          { name: "darcloud-api", value: "darcloud-api" },
          { name: "darcloud-bot", value: "darcloud-bot" },
          { name: "darcloud-watchdog", value: "darcloud-watchdog" }
        )
    ),

  new SlashCommandBuilder()
    .setName("docker")
    .setDescription("Manage Docker containers (start/stop/restart/logs/build)")
    .addStringOption((opt) =>
      opt.setName("action").setDescription("Action to perform").setRequired(true)
        .addChoices(
          { name: "Status", value: "status" },
          { name: "Start", value: "start" },
          { name: "Stop", value: "stop" },
          { name: "Restart", value: "restart" },
          { name: "Logs", value: "logs" },
          { name: "Build & Deploy", value: "build" }
        )
    )
    .addStringOption((opt) =>
      opt.setName("container").setDescription("Container name (blank = all)").setRequired(false)
        .addChoices(
          { name: "relay1", value: "relay1" },
          { name: "relay2", value: "relay2" },
          { name: "compute1", value: "compute1" },
          { name: "backup1", value: "backup1" },
          { name: "gateway1", value: "gateway1" },
          { name: "darcloud-discord-bot", value: "darcloud-discord-bot" }
        )
    ),

  new SlashCommandBuilder()
    .setName("system")
    .setDescription("Full system overview — PM2 + Docker + API + Bot + Resources"),

  new SlashCommandBuilder()
    .setName("deploy")
    .setDescription("Deploy or redeploy services")
    .addStringOption((opt) =>
      opt.setName("target").setDescription("What to deploy").setRequired(true)
        .addChoices(
          { name: "API Server", value: "api" },
          { name: "Discord Bot", value: "bot" },
          { name: "Docker Fleet", value: "docker" },
          { name: "Everything", value: "all" },
          { name: "Git Pull + Install", value: "git-pull" }
        )
    ),

  new SlashCommandBuilder()
    .setName("logs")
    .setDescription("View service logs")
    .addStringOption((opt) =>
      opt.setName("source").setDescription("Log source").setRequired(true)
        .addChoices(
          { name: "API", value: "api" },
          { name: "Bot", value: "bot" },
          { name: "Watchdog", value: "watchdog" },
          { name: "Docker", value: "docker" },
          { name: "All PM2", value: "all" }
        )
    )
    .addIntegerOption((opt) =>
      opt.setName("lines").setDescription("Number of lines (5-50, default 25)").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("agent")
    .setDescription("AI agent — describe a task in natural language")
    .addStringOption((opt) =>
      opt.setName("task").setDescription("What should the agent do? e.g. 'restart everything' or 'check system health'").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("git")
    .setDescription("Git operations — status, pull, diff, log")
    .addStringOption((opt) =>
      opt.setName("action").setDescription("Git action").setRequired(true)
        .addChoices(
          { name: "Status", value: "status" },
          { name: "Pull", value: "pull" },
          { name: "Diff", value: "diff" },
          { name: "Log", value: "log" }
        )
    ),

  // ── Admin ──
  new SlashCommandBuilder()
    .setName("bootstrap")
    .setDescription("Seed/reseed all 101 companies, contracts, IP, and legal filings"),

  // ── Masjid & Prayer ──
  new SlashCommandBuilder()
    .setName("masjid")
    .setDescription("🕌 Find mosques near any location worldwide")
    .addStringOption((opt) => opt.setName("location").setDescription("City, address, or place (e.g. Houston TX, London, Cairo)").setRequired(true))
    .addIntegerOption((opt) => opt.setName("radius").setDescription("Search radius in km (default: 10)").setRequired(false).setMinValue(1).setMaxValue(50)),

  new SlashCommandBuilder()
    .setName("prayer")
    .setDescription("🕐 Get prayer times for any location")
    .addStringOption((opt) => opt.setName("location").setDescription("City or address").setRequired(true)),

  new SlashCommandBuilder()
    .setName("qibla")
    .setDescription("🧭 Get Qibla direction from any location")
    .addStringOption((opt) => opt.setName("location").setDescription("Your city or address").setRequired(true)),

  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("⚡ Auto-install & configure ALL DarCloud services"),

  new SlashCommandBuilder()
    .setName("my-services")
    .setDescription("📋 View all your provisioned DarCloud services"),

  new SlashCommandBuilder()
    .setName("upgrade")
    .setDescription("⬆️ Upgrade your DarCloud plan")
    .addStringOption((opt) =>
      opt.setName("plan").setDescription("Plan to upgrade to").setRequired(true)
        .addChoices(
          { name: "Professional ($49/mo)", value: "pro" },
          { name: "Enterprise ($499/mo)", value: "enterprise" },
          { name: "FungiMesh Node ($19.99/mo)", value: "fungimesh_node" },
          { name: "HWC Premium ($99/mo)", value: "hwc_premium" },
        )),

  // ── Onboarding & Membership ──
  new SlashCommandBuilder()
    .setName("join")
    .setDescription("🚀 One-click join — auto-setup all DarCloud services"),

  new SlashCommandBuilder()
    .setName("membership")
    .setDescription("📋 View membership tiers and upgrade your plan"),

  new SlashCommandBuilder()
    .setName("billing")
    .setDescription("💳 View payment history and manage subscription"),

  new SlashCommandBuilder()
    .setName("revenue")
    .setDescription("💰 View DarCloud Empire revenue report and splits"),

  new SlashCommandBuilder()
    .setName("invite")
    .setDescription("🎉 Get your referral link and earn QRN rewards"),

  new SlashCommandBuilder().setName("onboard").setDescription("🚀 Start your onboarding journey"),
  new SlashCommandBuilder().setName("dashboard").setDescription("📊 View your personal dashboard"),
  new SlashCommandBuilder().setName("referral").setDescription("🔗 Get your referral link"),
  new SlashCommandBuilder().setName("services").setDescription("🛒 Browse available services"),
  new SlashCommandBuilder().setName("subscribe").setDescription("💳 Subscribe to premium services"),
  new SlashCommandBuilder()
    .setName("ai-ask")
    .setDescription("🤖 Ask our AI assistant a question")
    .addStringOption((opt) => opt.setName("question").setDescription("Your question").setRequired(true)),
  new SlashCommandBuilder()
    .setName("founder")
    .setDescription("👑 Founder Console — natural language AI command center")
    .addStringOption((opt) => opt.setName("command").setDescription("Tell the AI what to do (natural language)").setRequired(true)),
  new SlashCommandBuilder()
    .setName("founder-dashboard")
    .setDescription("📊 Founder Dashboard — full empire overview & KPIs"),
  new SlashCommandBuilder()
    .setName("founder-deploy")
    .setDescription("🚀 Deploy services, bots, or infrastructure")
    .addStringOption((opt) => opt.setName("target").setDescription("What to deploy (e.g. 'all bots', 'darcommerce', 'mesh nodes')").setRequired(true)),
  new SlashCommandBuilder()
    .setName("founder-exec")
    .setDescription("⚡ Execute a system command or task")
    .addStringOption((opt) => opt.setName("task").setDescription("Task to execute (natural language)").setRequired(true)),
  new SlashCommandBuilder().setName("premium").setDescription("⭐ View your DarCloud Premium status & upgrade"),
  new SlashCommandBuilder().setName("shop").setDescription("🛒 DarCloud Shop — browse & buy premium subscriptions"),
].map((cmd) => cmd.toJSON());

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash commands...`);

    if (GUILD_ID) {
      // Guild-specific (instant, for development)
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(`✓ Registered ${commands.length} commands to guild ${GUILD_ID}`);
    } else {
      // Global (takes ~1 hour to propagate)
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log(`✓ Registered ${commands.length} global commands (propagation ~1hr)`);
    }
  } catch (err) {
    console.error("Failed to register commands:", err);
    process.exit(1);
  }
})();
