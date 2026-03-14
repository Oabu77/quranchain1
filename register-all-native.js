// Native HTTPS command registration for ALL DarCloud bots
// Bypasses discord.js REST client hanging issue
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

function registerCommands(token, clientId, guildId, commands, label) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(commands);
    const req = https.request({
      hostname: 'discord.com',
      path: `/api/v10/applications/${clientId}/guilds/${guildId}/commands`,
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
          console.log(`✓ ${label}: Registered ${r.length} commands`);
          resolve(r.length);
        } else if (res.statusCode === 429) {
          const retry = JSON.parse(d);
          console.log(`⏳ ${label}: Rate limited, retry after ${retry.retry_after}s`);
          reject(new Error(`Rate limited: ${retry.retry_after}s`));
        } else {
          console.error(`✗ ${label}: Failed (${res.statusCode}): ${d.substring(0,300)}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.setTimeout(15000, () => { console.error(`✗ ${label}: Timeout`); req.destroy(); reject(new Error('Timeout')); });
    req.on('error', e => { console.error(`✗ ${label}: ${e.message}`); reject(e); });
    req.write(body);
    req.end();
  });
}

// ─── Main Discord Bot: 31 commands ───
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
    { name: 'name', description: 'Service name (blank = all)', type: 3, required: false, choices: [
      { name: 'darcloud-api', value: 'darcloud-api' }, { name: 'darcloud-bot', value: 'darcloud-bot' },
      { name: 'darcloud-watchdog', value: 'darcloud-watchdog' },
    ]},
  ]},
  { name: 'docker', description: 'Manage Docker containers', type: 1, options: [
    { name: 'action', description: 'Action to perform', type: 3, required: true, choices: [
      { name: 'Status', value: 'status' }, { name: 'Start', value: 'start' }, { name: 'Stop', value: 'stop' },
      { name: 'Restart', value: 'restart' }, { name: 'Logs', value: 'logs' }, { name: 'Build & Deploy', value: 'build' },
    ]},
    { name: 'container', description: 'Container name (blank = all)', type: 3, required: false, choices: [
      { name: 'relay1', value: 'relay1' }, { name: 'relay2', value: 'relay2' }, { name: 'compute1', value: 'compute1' },
      { name: 'backup1', value: 'backup1' }, { name: 'gateway1', value: 'gateway1' }, { name: 'darcloud-discord-bot', value: 'darcloud-discord-bot' },
    ]},
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
  // ── Onboarding & Membership Revenue ──
  { name: 'join', description: '🚀 One-click join — auto-setup all DarCloud services', type: 1 },
  { name: 'membership', description: '📋 View membership tiers and upgrade your plan', type: 1 },
  { name: 'billing', description: '💳 View payment history and manage subscription', type: 1 },
  { name: 'revenue', description: '💰 View DarCloud Empire revenue report and splits', type: 1 },
  { name: 'invite', description: '🎉 Get your referral link and earn QRN rewards', type: 1 },
];

// ─── Sector bot commands (shared commands + sector-specific) ───
const setupCommands = [
  { name: 'setup', description: '⚡ Auto-install & configure ALL DarCloud services', type: 1 },
  { name: 'my-services', description: '📋 View all your provisioned DarCloud services', type: 1 },
  { name: 'upgrade', description: '⬆️ Upgrade your DarCloud plan', type: 1, options: [
    { name: 'plan', description: 'Plan to upgrade to', type: 3, required: true, choices: [
      { name: 'Professional ($49/mo)', value: 'pro' }, { name: 'Enterprise ($499/mo)', value: 'enterprise' },
      { name: 'FungiMesh Node ($19.99/mo)', value: 'fungimesh_node' }, { name: 'HWC Premium ($99/mo)', value: 'hwc_premium' },
    ]}
  ]},
];

// ─── Bot directories and their unique commands ───
const sectorBots = {
  'fungimesh-bot': [
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
  ],
  'meshtalk-bot': [
    { name: 'talk-status', description: '💬 MeshTalk service status', type: 1 },
    { name: 'talk-services', description: '📡 MeshTalk available services', type: 1 },
    { name: 'talk-encryption', description: '🔒 MeshTalk encryption info', type: 1 },
    { name: 'talk-platforms', description: '📱 MeshTalk platforms', type: 1 },
    { name: 'talk-federation', description: '🌐 MeshTalk federation status', type: 1 },
    { name: 'talk-mesh', description: '🍄 MeshTalk mesh integration', type: 1 },
    { name: 'talk-api', description: '🔌 MeshTalk API info', type: 1 },
    { name: 'talk-help', description: '❓ MeshTalk help', type: 1 },
  ],
  'quranchain-bot': [
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
    { name: 'revenue', description: '💵 Revenue dashboard', type: 1 },
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
  ],
};

async function main() {
  const root = '/workspaces/quranchain1';
  const mainEnv = loadEnv(path.resolve(root, 'discord-bot'));
  
  // 1. Register bots with UNIQUE CLIENT_IDs first (no rate limit)
  const uniqueBots = ['fungimesh-bot', 'meshtalk-bot', 'quranchain-bot'];
  
  for (const botName of uniqueBots) {
    const env = loadEnv(path.resolve(root, botName));
    if (!env.DISCORD_TOKEN || !env.DISCORD_CLIENT_ID || !env.DISCORD_GUILD_ID) {
      console.log(`⚠ ${botName}: Missing credentials, skipping`);
      continue;
    }
    
    if (env.DISCORD_CLIENT_ID === mainEnv.DISCORD_CLIENT_ID) {
      console.log(`⊘ ${botName}: Same app as main bot, will be covered by main registration`);
      continue;
    }
    
    const botCmds = [...(sectorBots[botName] || []), ...setupCommands];
    console.log(`\n═══ ${botName.toUpperCase()} (${botCmds.length} commands) ═══`);
    
    await new Promise(r => setTimeout(r, 1000));
    try {
      await registerCommands(env.DISCORD_TOKEN, env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID, botCmds, botName);
    } catch(e) {
      console.log(`  Retrying after delay...`);
      const match = e.message.match(/(\d+\.?\d*)/);
      if (match) await new Promise(r => setTimeout(r, (parseFloat(match[1]) + 1) * 1000));
      else await new Promise(r => setTimeout(r, 5000));
      await registerCommands(env.DISCORD_TOKEN, env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID, botCmds, botName);
    }
  }
  
  // 2. Register darnas-bot if unique
  const darnasEnv = loadEnv(path.resolve(root, 'darnas-bot'));
  if (darnasEnv.DISCORD_CLIENT_ID && darnasEnv.DISCORD_CLIENT_ID !== mainEnv.DISCORD_CLIENT_ID) {
    const darnasCmds = [
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
      ...setupCommands,
    ];
    console.log(`\n═══ DARNAS-BOT (${darnasCmds.length} commands) ═══`);
    await new Promise(r => setTimeout(r, 1000));
    await registerCommands(darnasEnv.DISCORD_TOKEN, darnasEnv.DISCORD_CLIENT_ID, darnasEnv.DISCORD_GUILD_ID, darnasCmds, 'darnas-bot');
  }
  
  console.log('\n══════════════════════════════');
  
  // 4. Register main discord-bot (31 commands) — may be rate limited
  console.log(`\n═══ MAIN BOT (${mainCommands.length} commands) ═══`);
  try {
    await registerCommands(mainEnv.DISCORD_TOKEN, mainEnv.DISCORD_CLIENT_ID, mainEnv.DISCORD_GUILD_ID, mainCommands, 'discord-bot');
  } catch(e) {
    const match = e.message.match(/(\d+\.?\d*)/);
    if (match) {
      const waitSec = Math.ceil(parseFloat(match[1])) + 2;
      console.log(`  Waiting ${waitSec}s for rate limit to clear...`);
      await new Promise(r => setTimeout(r, waitSec * 1000));
      await registerCommands(mainEnv.DISCORD_TOKEN, mainEnv.DISCORD_CLIENT_ID, mainEnv.DISCORD_GUILD_ID, mainCommands, 'discord-bot');
    } else {
      throw e;
    }
  }
  
  console.log('\n══════════════════════════════');
  console.log('✅ All registrations complete!');
  console.log('Note: Bots sharing CLIENT_ID', mainEnv.DISCORD_CLIENT_ID, 'all use the main bot\'s 31 commands.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
