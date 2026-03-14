// Register onboarding commands for ALL DarCloud Empire bots
// Run: node register-onboarding-commands.js
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

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID || process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("Missing DISCORD_TOKEN or CLIENT_ID");
  process.exit(1);
}

// Onboarding commands (added to existing commands)
const ONBOARDING_COMMANDS = [
  { name: "onboard", description: "Start or resume your DarCloud Empire onboarding" },
  { name: "dashboard", description: "View your DarCloud Empire member dashboard" },
  { name: "referral", description: "Get your referral code and stats" },
  { name: "services", description: "View your active services and accounts" },
  {
    name: "subscribe",
    description: "Subscribe to a DarCloud plan",
    options: [{
      name: "plan",
      description: "The plan to subscribe to",
      type: 3,
      required: true,
      choices: [
        { name: "Professional ($49/mo)", value: "pro" },
        { name: "Enterprise ($499/mo)", value: "enterprise" },
      ],
    }],
  },
  {
    name: "revenue",
    description: "View DarCloud Empire revenue dashboard",
  },
  {
    name: "members",
    description: "View recent member activity (admin)",
  },
];

async function registerCommands() {
  // Fetch existing commands
  const base = "https://discord.com/api/v10";
  const headers = { Authorization: `Bot ${TOKEN}`, "Content-Type": "application/json" };

  // Get existing commands
  const url = GUILD_ID
    ? `${base}/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`
    : `${base}/applications/${CLIENT_ID}/commands`;

  const existingRes = await fetch(url, { headers });
  const existing = await existingRes.json();
  const existingNames = Array.isArray(existing) ? existing.map(c => c.name) : [];

  // Only register new commands that don't exist yet
  const newCommands = ONBOARDING_COMMANDS.filter(c => !existingNames.includes(c.name));

  if (newCommands.length === 0) {
    console.log("All onboarding commands already registered.");
    return;
  }

  // Register each new command
  for (const cmd of newCommands) {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(cmd),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✓ Registered: /${cmd.name}`);
    } else {
      console.error(`✗ Failed: /${cmd.name}`, data);
    }
  }

  console.log(`\n✓ Registered ${newCommands.length} new onboarding commands`);
  console.log(`Total commands: ${existingNames.length + newCommands.length}`);
}

registerCommands().catch(console.error);
