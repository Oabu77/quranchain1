// Register main bot commands (36 commands) with auto-retry on rate limit
const https = require('https');
const fs = require('fs');
const path = require('path');

const env = {};
try {
  const envFile = fs.readFileSync(path.resolve(__dirname, 'discord-bot/.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  }
} catch(e) { console.error('Failed to read .env:', e.message); process.exit(1); }

const TOKEN = env.DISCORD_TOKEN;
const CLIENT_ID = env.DISCORD_CLIENT_ID;
const GUILD_ID = env.DISCORD_GUILD_ID;

const commands = [
  { name: 'health', description: 'Check DarCloud system health', type: 1 },
  { name: 'stats', description: 'Admin dashboard stats', type: 1 },
  { name: 'ai-fleet', description: 'List all 66 AI agents by platform', type: 1 },
  { name: 'ai-assistants', description: 'List all 12 GPT-4o assistants', type: 1 },
  { name: 'ai-benchmark', description: 'AI fleet performance metrics', type: 1 },
  { name: 'mesh-status', description: 'FungiMesh dual-layer network health', type: 1 },
  { name: 'mesh-nodes', description: 'List all mesh nodes with heartbeat status', type: 1 },
  { name: 'tasks', description: 'List operational tasks', type: 1, options: [{ name: 'search', description: 'Filter by name/description', type: 3, required: false }] },
  { name: 'task-create', description: 'Create a new infrastructure task', type: 1, options: [
    { name: 'name', description: 'Task name', type: 3, required: true },
    { name: 'slug', description: 'URL slug', type: 3, required: true },
    { name: 'description', description: 'Task description', type: 3, required: false },
  ]},
  { name: 'contracts', description: 'List all active inter-company contracts', type: 1 },
  { name: 'companies', description: 'List all 101 DarCloud ecosystem companies', type: 1 },
  { name: 'ip', description: 'View intellectual property portfolio', type: 1, options: [
    { name: 'type', description: 'IP category', type: 3, required: true, choices: [
      { name: 'Trademarks', value: 'trademarks' }, { name: 'Patents', value: 'patents' },
      { name: 'Copyrights', value: 'copyrights' }, { name: 'Trade Secrets', value: 'trade-secrets' },
    ]}
  ]},
  { name: 'backups', description: 'List backup registry with mesh replication status', type: 1 },
  { name: 'minecraft', description: 'Minecraft server status and player counts', type: 1 },
  { name: 'vms', description: 'List Multipass VM fleet', type: 1 },
  { name: 'fleet-health', description: 'Overall VM fleet capacity and health', type: 1 },
  { name: 'legal-filings', description: 'Corporate filings and legal documents', type: 1 },
  { name: 'service', description: 'Manage PM2 services', type: 1, options: [
    { name: 'action', description: 'Action', type: 3, required: true, choices: [
      { name: 'Status', value: 'status' }, { name: 'Start', value: 'start' }, { name: 'Stop', value: 'stop' },
      { name: 'Restart', value: 'restart' }, { name: 'Logs', value: 'logs' },
    ]},
    { name: 'name', description: 'Service name', type: 3, required: false, choices: [
      { name: 'darcloud-api', value: 'darcloud-api' }, { name: 'darcloud-bot', value: 'darcloud-bot' },
      { name: 'darcloud-watchdog', value: 'darcloud-watchdog' },
    ]},
  ]},
  { name: 'docker', description: 'Manage Docker containers', type: 1, options: [
    { name: 'action', description: 'Action', type: 3, required: true, choices: [
      { name: 'Status', value: 'status' }, { name: 'Start', value: 'start' }, { name: 'Stop', value: 'stop' },
      { name: 'Restart', value: 'restart' }, { name: 'Logs', value: 'logs' }, { name: 'Build & Deploy', value: 'build' },
    ]},
    { name: 'container', description: 'Container name', type: 3, required: false, choices: [
      { name: 'relay1', value: 'relay1' }, { name: 'relay2', value: 'relay2' }, { name: 'compute1', value: 'compute1' },
      { name: 'backup1', value: 'backup1' }, { name: 'gateway1', value: 'gateway1' }, { name: 'darcloud-discord-bot', value: 'darcloud-discord-bot' },
    ]},
  ]},
  { name: 'system', description: 'Full system overview', type: 1 },
  { name: 'deploy', description: 'Deploy or redeploy services', type: 1, options: [
    { name: 'target', description: 'What to deploy', type: 3, required: true, choices: [
      { name: 'API Server', value: 'api' }, { name: 'Discord Bot', value: 'bot' },
      { name: 'Docker Fleet', value: 'docker' }, { name: 'Everything', value: 'all' }, { name: 'Git Pull + Install', value: 'git-pull' },
    ]}
  ]},
  { name: 'logs', description: 'View service logs', type: 1, options: [
    { name: 'source', description: 'Log source', type: 3, required: true, choices: [
      { name: 'API', value: 'api' }, { name: 'Bot', value: 'bot' }, { name: 'Watchdog', value: 'watchdog' },
      { name: 'Docker', value: 'docker' }, { name: 'All PM2', value: 'all' },
    ]},
    { name: 'lines', description: 'Number of lines (5-50)', type: 4, required: false },
  ]},
  { name: 'agent', description: 'AI agent — describe a task in natural language', type: 1, options: [
    { name: 'task', description: 'What should the agent do?', type: 3, required: true },
  ]},
  { name: 'git', description: 'Git operations', type: 1, options: [
    { name: 'action', description: 'Git action', type: 3, required: true, choices: [
      { name: 'Status', value: 'status' }, { name: 'Pull', value: 'pull' }, { name: 'Diff', value: 'diff' }, { name: 'Log', value: 'log' },
    ]}
  ]},
  { name: 'bootstrap', description: 'Seed/reseed all companies, contracts, IP, filings', type: 1 },
  { name: 'masjid', description: '🕌 Find mosques near any location', type: 1, options: [
    { name: 'location', description: 'City, address, or place', type: 3, required: true },
    { name: 'radius', description: 'Search radius in km', type: 4, required: false, min_value: 1, max_value: 50 },
  ]},
  { name: 'prayer', description: '🕐 Get prayer times for any location', type: 1, options: [
    { name: 'location', description: 'City or address', type: 3, required: true },
  ]},
  { name: 'qibla', description: '🧭 Get Qibla direction from any location', type: 1, options: [
    { name: 'location', description: 'City or address', type: 3, required: true },
  ]},
  { name: 'setup', description: '⚡ Auto-install & configure ALL DarCloud services', type: 1 },
  { name: 'my-services', description: '📋 View all your provisioned DarCloud services', type: 1 },
  { name: 'upgrade', description: '⬆️ Upgrade your DarCloud plan', type: 1, options: [
    { name: 'plan', description: 'Plan to upgrade to', type: 3, required: true, choices: [
      { name: 'Professional ($49/mo)', value: 'pro' },
      { name: 'Enterprise ($499/mo)', value: 'enterprise' },
      { name: 'FungiMesh Node ($19.99/mo)', value: 'fungimesh_node' },
      { name: 'HWC Premium ($99/mo)', value: 'hwc_premium' },
    ]}
  ]},
  // ── NEW: Onboarding & Membership Revenue ──
  { name: 'join', description: '🚀 One-click join — auto-setup all DarCloud services', type: 1 },
  { name: 'membership', description: '📋 View membership tiers and upgrade your plan', type: 1 },
  { name: 'billing', description: '💳 View payment history and manage subscription', type: 1 },
  { name: 'revenue', description: '💰 DarCloud Empire revenue report and splits', type: 1 },
  { name: 'invite', description: '🎉 Get your referral link and earn QRN rewards', type: 1 },
];

console.log(`Registering ${commands.length} commands for main bot...`);

function attempt() {
  const body = JSON.stringify(commands);
  const req = https.request({
    hostname: 'discord.com',
    path: `/api/v10/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`,
    method: 'PUT',
    headers: {
      'Authorization': `Bot ${TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    }
  }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const r = JSON.parse(d);
        console.log(`✅ SUCCESS: Registered ${r.length} commands for main bot!`);
        process.exit(0);
      } else if (res.statusCode === 429) {
        const retry = JSON.parse(d);
        const wait = Math.ceil(retry.retry_after) + 2;
        console.log(`⏳ Rate limited, retrying in ${wait}s...`);
        setTimeout(attempt, wait * 1000);
      } else {
        console.error(`❌ Failed (${res.statusCode}): ${d.substring(0,300)}`);
        process.exit(1);
      }
    });
  });
  req.setTimeout(15000, () => { console.error('Timeout, retrying in 10s...'); setTimeout(attempt, 10000); });
  req.on('error', e => { console.error(`Error: ${e.message}, retrying in 10s...`); setTimeout(attempt, 10000); });
  req.write(body);
  req.end();
}

attempt();
