// Register ALL commands GLOBALLY for all 5 bot applications
// Global commands work on EVERY server the bot is added to
// (Takes up to 1 hour for Discord to fully propagate globally)
const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnv(dir) {
  const envPath = path.resolve(dir, '.env');
  const vars = {};
  try {
    const env = fs.readFileSync(envPath, 'utf8');
    for (const line of env.split('\n')) {
      const [k, ...v] = line.split('=');
      if (k && v.length) vars[k.trim()] = v.join('=').trim();
    }
  } catch(e) {}
  return vars;
}

function registerGlobal(token, clientId, commands, label) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(commands);
    const req = https.request({
      hostname: 'discord.com',
      // GLOBAL endpoint — no guild_id = works on ALL servers
      path: `/api/v10/applications/${clientId}/commands`,
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const r = JSON.parse(d);
          console.log(`  ✓ ${label}: ${r.length} commands registered GLOBALLY`);
          resolve(r.length);
        } else if (res.statusCode === 429) {
          const retry = JSON.parse(d);
          console.log(`  ⏳ ${label}: Rate limited, retry after ${retry.retry_after}s`);
          reject(new Error(`Rate limited: ${retry.retry_after}s`));
        } else {
          console.error(`  ✗ ${label}: Failed (${res.statusCode}): ${d.substring(0,300)}`);
          reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0,200)}`));
        }
      });
    });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function retryRegister(token, clientId, commands, label) {
  try {
    return await registerGlobal(token, clientId, commands, label);
  } catch(e) {
    const match = e.message.match(/(\d+\.?\d*)/);
    const wait = match ? Math.ceil(parseFloat(match[1])) + 2 : 10;
    console.log(`    Retrying ${label} in ${wait}s...`);
    await new Promise(r => setTimeout(r, wait * 1000));
    return await registerGlobal(token, clientId, commands, label);
  }
}

// ═══════════════════════════════════════════════
// COMMAND DEFINITIONS FOR ALL 5 BOT APPLICATIONS
// ═══════════════════════════════════════════════

// ── 1. MAIN BOT (CLIENT_ID: 1472103745402831041) — 36 commands ──
const mainCommands = [
  { name: 'health', description: 'Check DarCloud system health', type: 1 },
  { name: 'stats', description: 'Admin dashboard stats (users, contracts, companies, IP)', type: 1 },
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
  { name: 'service', description: 'Manage PM2 services (start/stop/restart/status/logs)', type: 1, options: [
    { name: 'action', description: 'Action to perform', type: 3, required: true, choices: [
      { name: 'Status', value: 'status' }, { name: 'Start', value: 'start' }, { name: 'Stop', value: 'stop' },
      { name: 'Restart', value: 'restart' }, { name: 'Logs', value: 'logs' },
    ]},
    { name: 'name', description: 'Service name (blank = all)', type: 3, required: false },
  ]},
  { name: 'docker', description: 'Manage Docker containers', type: 1, options: [
    { name: 'action', description: 'Action to perform', type: 3, required: true, choices: [
      { name: 'Status', value: 'status' }, { name: 'Start', value: 'start' }, { name: 'Stop', value: 'stop' },
      { name: 'Restart', value: 'restart' }, { name: 'Logs', value: 'logs' }, { name: 'Build & Deploy', value: 'build' },
    ]},
    { name: 'container', description: 'Container name (blank = all)', type: 3, required: false },
  ]},
  { name: 'system', description: 'Full system overview — PM2 + Docker + API + Bot + Resources', type: 1 },
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
    { name: 'lines', description: 'Number of lines (5-50, default 25)', type: 4, required: false },
  ]},
  { name: 'agent', description: 'AI agent — describe a task in natural language', type: 1, options: [
    { name: 'task', description: 'What should the agent do?', type: 3, required: true },
  ]},
  { name: 'git', description: 'Git operations — status, pull, diff, log', type: 1, options: [
    { name: 'action', description: 'Git action', type: 3, required: true, choices: [
      { name: 'Status', value: 'status' }, { name: 'Pull', value: 'pull' }, { name: 'Diff', value: 'diff' }, { name: 'Log', value: 'log' },
    ]}
  ]},
  { name: 'bootstrap', description: 'Seed/reseed all 101 companies, contracts, IP, and legal filings', type: 1 },
  { name: 'masjid', description: '🕌 Find mosques near any location worldwide', type: 1, options: [
    { name: 'location', description: 'City, address, or place', type: 3, required: true },
    { name: 'radius', description: 'Search radius in km (default: 10)', type: 4, required: false, min_value: 1, max_value: 50 },
  ]},
  { name: 'prayer', description: '🕐 Get prayer times for any location', type: 1, options: [
    { name: 'location', description: 'City or address', type: 3, required: true },
  ]},
  { name: 'qibla', description: '🧭 Get Qibla direction from any location', type: 1, options: [
    { name: 'location', description: 'Your city or address', type: 3, required: true },
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
  { name: 'join', description: '🚀 One-click join — auto-setup all DarCloud services', type: 1 },
  { name: 'membership', description: '📋 View membership tiers and upgrade your plan', type: 1 },
  { name: 'billing', description: '💳 View payment history and manage subscription', type: 1 },
  { name: 'revenue', description: '💰 View DarCloud Empire revenue report and splits', type: 1 },
  { name: 'invite', description: '🎉 Get your referral link and earn QRN rewards', type: 1 },
  { name: 'subscribe', description: '💎 Subscribe to DarCloud premium services', type: 1 },
  // ── ISP / TELECOM COMMANDS ──
  { name: 'telecom-dashboard', description: '📡 DarTelecom™ full network overview', type: 1 },
  { name: 'telecom-esim', description: '📱 Dar eSIM™ — global eSIM service', type: 1 },
  { name: 'telecom-wifi', description: '📶 Dar WiFi Grid™ — mesh WiFi hotspots', type: 1 },
  { name: 'telecom-fiber', description: '🔌 Dar Fiber Net™ — fiber optic network', type: 1 },
  { name: 'telecom-5g', description: '📡 Dar5G™ — 5G core network', type: 1 },
  { name: 'telecom-satellite', description: '🛰️ Dar Sat Net™ — satellite internet', type: 1 },
  { name: 'telecom-hardware', description: '🔧 Network hardware & devices', type: 1 },
  { name: 'telecom-help', description: '❓ DarTelecom commands', type: 1 },
  { name: 'isp-status', description: '📡 DarTelecom ISP dashboard', type: 1 },
  { name: 'isp-plans', description: '📋 View ISP plans with pricing', type: 1 },
  { name: 'isp-network', description: '🌐 5G core network status', type: 1 },
  { name: 'isp-nodes', description: '🔗 List ISP mesh relay nodes', type: 1 },
  { name: 'isp-billing', description: '💰 Revenue — MRR/ARR + splits', type: 1 },
  { name: 'isp-subscribe', description: '📱 Subscribe to DarTelecom', type: 1, options: [
    { name: 'plan', description: 'ISP plan', type: 3, required: false, choices: [
      { name: 'Starter ($19.99/mo)', value: 'starter' }, { name: 'Pro ($39.99/mo)', value: 'pro' },
      { name: 'Unlimited ($59.99/mo)', value: 'unlimited' }, { name: 'Business ($99.99/mo)', value: 'business' },
      { name: 'Mesh Node (Free)', value: 'mesh_node' },
    ]}
  ]},
  { name: 'isp-provision', description: '🔧 Admin: Provision subscriber', type: 1, options: [
    { name: 'name', description: 'Subscriber name', type: 3, required: true },
    { name: 'email', description: 'Subscriber email', type: 3, required: true },
    { name: 'plan', description: 'ISP plan', type: 3, required: false, choices: [
      { name: 'Starter', value: 'starter' }, { name: 'Pro', value: 'pro' },
      { name: 'Unlimited', value: 'unlimited' }, { name: 'Business', value: 'business' },
    ]}
  ]},
  { name: 'isp-esim', description: '📱 Get eSIM activation profile', type: 1, options: [
    { name: 'subscriber_id', description: 'Subscriber UUID', type: 3, required: true },
  ]},
];

// ── 2. DARNAS BOT (CLIENT_ID: 1481879903275188295) — 16 commands ──
const darnasCommands = [
  { name: 'masjid', description: '🕌 Find mosques near any location worldwide', type: 1, options: [
    { name: 'location', description: 'City, address, or place', type: 3, required: true },
    { name: 'radius', description: 'Search radius in km (default: 10)', type: 4, required: false, min_value: 1, max_value: 50 },
  ]},
  { name: 'prayer', description: '🕐 Get prayer times for any location', type: 1, options: [
    { name: 'location', description: 'City or address', type: 3, required: true },
  ]},
  { name: 'qibla', description: '🧭 Get Qibla direction from any location', type: 1, options: [
    { name: 'location', description: 'Your city or address', type: 3, required: true },
  ]},
  { name: 'darnas', description: '🏠 DarAlNas community resources', type: 1 },
  { name: 'community', description: '👪 Community events and services', type: 1 },
  { name: 'donate', description: '💝 Support DarAlNas community projects', type: 1 },
  { name: 'volunteer', description: '🤝 Volunteer opportunities', type: 1 },
  { name: 'resources', description: '📚 Islamic educational resources', type: 1 },
  { name: 'events', description: '📅 Upcoming community events', type: 1 },
  { name: 'zakat', description: '💰 Zakat calculator and distribution info', type: 1 },
  { name: 'sadaqah', description: '💝 Sadaqah (charity) opportunities', type: 1 },
  { name: 'islamic-calendar', description: '📅 Islamic Hijri calendar', type: 1 },
  { name: 'dua', description: '🤲 Daily duas and supplications', type: 1 },
  { name: 'setup', description: '⚡ Auto-install & configure ALL DarCloud services', type: 1 },
  { name: 'my-services', description: '📋 View all your provisioned DarCloud services', type: 1 },
  { name: 'upgrade', description: '⬆️ Upgrade your DarCloud plan', type: 1, options: [
    { name: 'plan', description: 'Plan to upgrade to', type: 3, required: true, choices: [
      { name: 'Professional ($49/mo)', value: 'pro' }, { name: 'Enterprise ($499/mo)', value: 'enterprise' },
      { name: 'FungiMesh Node ($19.99/mo)', value: 'fungimesh_node' }, { name: 'HWC Premium ($99/mo)', value: 'hwc_premium' },
    ]}
  ]},
];

// ── 3. FUNGIMESH BOT (CLIENT_ID: 1481874441830011122) — 13 commands ──
const fungimeshCommands = [
  { name: 'mesh-status', description: '🍄 FungiMesh network status', type: 1 },
  { name: 'mesh-nodes', description: '📊 List all mesh nodes', type: 1 },
  { name: 'mesh-connect', description: '🔗 Connect to mesh network', type: 1 },
  { name: 'mesh-encryption', description: '🔒 Mesh encryption status', type: 1 },
  { name: 'mesh-layers', description: '🧅 Mesh network layers', type: 1 },
  { name: 'mesh-docker', description: '🐳 Docker mesh containers', type: 1 },
  { name: 'mesh-regions', description: '🌍 Mesh network regions', type: 1 },
  { name: 'mesh-heartbeat', description: '💓 Node heartbeat status', type: 1 },
  { name: 'mesh-topology', description: '🗺️ Mesh network topology', type: 1 },
  { name: 'mesh-help', description: '❓ FungiMesh help', type: 1 },
  // WiFi Gateway commands (B.A.T.M.A.N. + hostapd)
  { name: 'wifi-status', description: '📡 WiFi gateway mesh status — B.A.T.M.A.N. + WireGuard', type: 1 },
  { name: 'wifi-gateways', description: '📡 List all WiFi gateway/antenna nodes', type: 1 },
  { name: 'wifi-clients', description: '👥 Connected WiFi clients across gateways', type: 1 },
  { name: 'wifi-deploy', description: '🚀 Deploy a WiFi gateway node — installer instructions', type: 1 },
  { name: 'setup', description: '⚡ Auto-install & configure ALL DarCloud services', type: 1 },
  { name: 'my-services', description: '📋 View all your provisioned DarCloud services', type: 1 },
  { name: 'upgrade', description: '⬆️ Upgrade your DarCloud plan', type: 1, options: [
    { name: 'plan', description: 'Plan to upgrade to', type: 3, required: true, choices: [
      { name: 'Professional ($49/mo)', value: 'pro' }, { name: 'Enterprise ($499/mo)', value: 'enterprise' },
      { name: 'FungiMesh Node ($19.99/mo)', value: 'fungimesh_node' }, { name: 'HWC Premium ($99/mo)', value: 'hwc_premium' },
    ]}
  ]},
];

// ── 4. MESHTALK BOT (CLIENT_ID: 1481875443496910898) — 11 commands ──
const meshtalkCommands = [
  { name: 'talk-status', description: '💬 MeshTalk service status', type: 1 },
  { name: 'talk-services', description: '📡 MeshTalk available services', type: 1 },
  { name: 'talk-encryption', description: '🔒 MeshTalk encryption info', type: 1 },
  { name: 'talk-platforms', description: '📱 MeshTalk platforms', type: 1 },
  { name: 'talk-federation', description: '🌐 MeshTalk federation status', type: 1 },
  { name: 'talk-mesh', description: '🍄 MeshTalk mesh integration', type: 1 },
  { name: 'talk-api', description: '🔌 MeshTalk API info', type: 1 },
  { name: 'talk-help', description: '❓ MeshTalk help', type: 1 },
  { name: 'setup', description: '⚡ Auto-install & configure ALL DarCloud services', type: 1 },
  { name: 'my-services', description: '📋 View all your provisioned DarCloud services', type: 1 },
  { name: 'upgrade', description: '⬆️ Upgrade your DarCloud plan', type: 1, options: [
    { name: 'plan', description: 'Plan to upgrade to', type: 3, required: true, choices: [
      { name: 'Professional ($49/mo)', value: 'pro' }, { name: 'Enterprise ($499/mo)', value: 'enterprise' },
      { name: 'FungiMesh Node ($19.99/mo)', value: 'fungimesh_node' }, { name: 'HWC Premium ($99/mo)', value: 'hwc_premium' },
    ]}
  ]},
];

// ── 5. QURANCHAIN BOT (CLIENT_ID: 1481827197743271996) — 22 commands ──
const quranchainCommands = [
  { name: 'wallet', description: '💰 View your QRN wallet', type: 1 },
  { name: 'send', description: '💸 Send QRN tokens', type: 1 },
  { name: 'daily', description: '🎁 Claim daily QRN reward', type: 1 },
  { name: 'leaderboard', description: '🏆 QRN leaderboard', type: 1 },
  { name: 'transactions', description: '📋 Transaction history', type: 1 },
  { name: 'mine', description: '⛏️ Mine QRN tokens', type: 1 },
  { name: 'chain', description: '⛓️ Blockchain status', type: 1 },
  { name: 'validators', description: '🔐 Network validators', type: 1 },
  { name: 'chains', description: '🔗 All chains overview', type: 1 },
  { name: 'gas', description: '⛽ Gas price info', type: 1 },
  { name: 'quiz', description: '📝 Islamic quiz', type: 1 },
  { name: 'scramble', description: '🔤 Word scramble game', type: 1 },
  { name: 'answer', description: '💡 Answer a quiz/scramble', type: 1 },
  { name: 'treasure', description: '🏴‍☠️ Treasure hunt', type: 1 },
  { name: 'gamestats', description: '🎮 Game statistics', type: 1 },
  { name: 'ecosystem', description: '🌐 DarCloud ecosystem', type: 1 },
  { name: 'help', description: '❓ QuranChain help', type: 1 },
  { name: 'masjid', description: '🕌 Find mosques nearby', type: 1, options: [
    { name: 'location', description: 'City, address, or place', type: 3, required: true },
    { name: 'radius', description: 'Search radius in km', type: 4, required: false },
  ]},
  { name: 'prayer', description: '🕐 Prayer times', type: 1, options: [
    { name: 'location', description: 'City or address', type: 3, required: true },
  ]},
  { name: 'qibla', description: '🧭 Qibla direction', type: 1, options: [
    { name: 'location', description: 'Your city or address', type: 3, required: true },
  ]},
  { name: 'setup', description: '⚡ Auto-install & configure ALL DarCloud services', type: 1 },
  { name: 'my-services', description: '📋 View all your provisioned DarCloud services', type: 1 },
];

// ═══════════════════════════════════════════════
// REGISTRATION — GLOBAL (ALL SERVERS)
// ═══════════════════════════════════════════════

async function main() {
  const root = '/workspaces/quranchain1';
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  DarCloud Empire — GLOBAL Command Registration  ║');
  console.log('║  Commands will work on ALL Discord servers       ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const registrations = [
    { dir: 'fungimesh-bot', commands: fungimeshCommands, label: 'FungiMesh Bot' },
    { dir: 'meshtalk-bot', commands: meshtalkCommands, label: 'MeshTalk Bot' },
    { dir: 'quranchain-bot', commands: quranchainCommands, label: 'QuranChain Bot' },
    { dir: 'darnas-bot', commands: darnasCommands, label: 'DarAlNas Bot' },
    { dir: 'discord-bot', commands: mainCommands, label: 'Main DarCloud Bot' },
  ];

  let totalRegistered = 0;

  for (const reg of registrations) {
    const env = loadEnv(path.resolve(root, reg.dir));
    const token = env.DISCORD_TOKEN;
    
    // Extract client_id from token
    const clientId = Buffer.from(token.split('.')[0], 'base64').toString().trim();
    
    console.log(`\n═══ ${reg.label} (${reg.commands.length} commands) ═══`);
    console.log(`  Client ID: ${clientId}`);
    
    await new Promise(r => setTimeout(r, 2000)); // Rate limit spacing
    
    try {
      const count = await retryRegister(token, clientId, reg.commands, reg.label);
      totalRegistered += count;
    } catch(e) {
      console.error(`  FAILED: ${e.message}`);
    }
  }

  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  ✅ DONE — ${totalRegistered} commands registered GLOBALLY  ║`);
  console.log(`║  Note: Takes up to 1 hour for full propagation   ║`);
  console.log(`╚══════════════════════════════════════════════════╝`);
  
  // Generate invite links
  console.log('\n═══ BOT INVITE LINKS (Admin permissions) ═══');
  const seen = new Set();
  for (const reg of registrations) {
    const env = loadEnv(path.resolve(root, reg.dir));
    const clientId = Buffer.from(env.DISCORD_TOKEN.split('.')[0], 'base64').toString().trim();
    if (seen.has(clientId)) continue;
    seen.add(clientId);
    // permissions=8 = Administrator, scope=bot+applications.commands
    const link = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
    console.log(`  ${reg.label}: ${link}`);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
