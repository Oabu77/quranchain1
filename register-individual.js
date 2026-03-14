// Register commands individually via POST (different rate limit bucket from bulk PUT)
const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve('/workspaces/quranchain1/discord-bot/.env');
const env = fs.readFileSync(envPath, 'utf8');
const vars = {};
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) vars[k.trim()] = v.join('=').trim();
}

const commands = [
  { name: 'health', description: 'Check DarCloud system health', type: 1 },
  { name: 'stats', description: 'Admin dashboard stats', type: 1 },
  { name: 'ai-fleet', description: 'List all 66 AI agents by platform', type: 1 },
  { name: 'ai-assistants', description: 'List all 12 GPT-4o assistants', type: 1 },
  { name: 'ai-benchmark', description: 'AI fleet performance metrics', type: 1 },
  { name: 'mesh-status', description: 'FungiMesh dual-layer network health', type: 1 },
  { name: 'mesh-nodes', description: 'List all mesh nodes', type: 1 },
  { name: 'tasks', description: 'List operational tasks', type: 1, options: [{ name: 'search', description: 'Filter', type: 3, required: false }] },
  { name: 'task-create', description: 'Create a new task', type: 1, options: [
    { name: 'name', description: 'Task name', type: 3, required: true },
    { name: 'slug', description: 'URL slug', type: 3, required: true },
    { name: 'description', description: 'Task description', type: 3, required: false },
  ]},
  { name: 'contracts', description: 'List all active contracts', type: 1 },
  { name: 'companies', description: 'List all 101 companies', type: 1 },
  { name: 'ip', description: 'View IP portfolio', type: 1, options: [
    { name: 'type', description: 'IP category', type: 3, required: true, choices: [
      { name: 'Trademarks', value: 'trademarks' }, { name: 'Patents', value: 'patents' },
      { name: 'Copyrights', value: 'copyrights' }, { name: 'Trade Secrets', value: 'trade-secrets' },
    ]}
  ]},
  { name: 'backups', description: 'List backup registry', type: 1 },
  { name: 'minecraft', description: 'Minecraft server status', type: 1 },
  { name: 'vms', description: 'List Multipass VMs', type: 1 },
  { name: 'fleet-health', description: 'VM fleet health', type: 1 },
  { name: 'legal-filings', description: 'Legal documents', type: 1 },
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
      { name: 'Restart', value: 'restart' }, { name: 'Logs', value: 'logs' }, { name: 'Build', value: 'build' },
    ]},
    { name: 'container', description: 'Container', type: 3, required: false, choices: [
      { name: 'relay1', value: 'relay1' }, { name: 'relay2', value: 'relay2' }, { name: 'compute1', value: 'compute1' },
      { name: 'backup1', value: 'backup1' }, { name: 'gateway1', value: 'gateway1' },
    ]},
  ]},
  { name: 'system', description: 'Full system overview', type: 1 },
  { name: 'deploy', description: 'Deploy services', type: 1, options: [
    { name: 'target', description: 'Target', type: 3, required: true, choices: [
      { name: 'API', value: 'api' }, { name: 'Bot', value: 'bot' }, { name: 'Docker', value: 'docker' },
      { name: 'Everything', value: 'all' }, { name: 'Git Pull', value: 'git-pull' },
    ]}
  ]},
  { name: 'logs', description: 'View logs', type: 1, options: [
    { name: 'source', description: 'Source', type: 3, required: true, choices: [
      { name: 'API', value: 'api' }, { name: 'Bot', value: 'bot' }, { name: 'Watchdog', value: 'watchdog' },
      { name: 'Docker', value: 'docker' }, { name: 'All', value: 'all' },
    ]},
    { name: 'lines', description: 'Lines (5-50)', type: 4, required: false },
  ]},
  { name: 'agent', description: 'AI agent task', type: 1, options: [
    { name: 'task', description: 'Task description', type: 3, required: true },
  ]},
  { name: 'git', description: 'Git operations', type: 1, options: [
    { name: 'action', description: 'Action', type: 3, required: true, choices: [
      { name: 'Status', value: 'status' }, { name: 'Pull', value: 'pull' }, { name: 'Diff', value: 'diff' }, { name: 'Log', value: 'log' },
    ]}
  ]},
  { name: 'bootstrap', description: 'Seed all data', type: 1 },
  { name: 'masjid', description: 'Find mosques nearby', type: 1, options: [
    { name: 'location', description: 'Location', type: 3, required: true },
    { name: 'radius', description: 'Radius km', type: 4, required: false },
  ]},
  { name: 'prayer', description: 'Prayer times', type: 1, options: [
    { name: 'location', description: 'Location', type: 3, required: true },
  ]},
  { name: 'qibla', description: 'Qibla direction', type: 1, options: [
    { name: 'location', description: 'Location', type: 3, required: true },
  ]},
  { name: 'upgrade', description: 'Upgrade your plan', type: 1, options: [
    { name: 'plan', description: 'Plan', type: 3, required: true, choices: [
      { name: 'Pro ($49/mo)', value: 'pro' }, { name: 'Enterprise ($499/mo)', value: 'enterprise' },
      { name: 'FungiMesh ($19.99/mo)', value: 'fungimesh_node' }, { name: 'HWC ($99/mo)', value: 'hwc_premium' },
    ]}
  ]},
];

// Filter out commands already registered (setup, my-services already exist)
const existingCommands = ['setup', 'my-services'];

function registerOne(cmd) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(cmd);
    const req = https.request({
      hostname: 'discord.com',
      path: `/api/v10/applications/${vars.DISCORD_CLIENT_ID}/guilds/${vars.DISCORD_GUILD_ID}/commands`,
      method: 'POST',
      headers: {
        'Authorization': `Bot ${vars.DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✓ ${cmd.name}`);
          resolve({ name: cmd.name, ok: true });
        } else if (res.statusCode === 429) {
          const info = JSON.parse(d);
          resolve({ name: cmd.name, ok: false, retry: info.retry_after });
        } else {
          console.log(`✗ ${cmd.name}: ${res.statusCode} ${d.substring(0,100)}`);
          resolve({ name: cmd.name, ok: false, error: res.statusCode });
        }
      });
    });
    req.setTimeout(10000, () => { req.destroy(); resolve({ name: cmd.name, ok: false, error: 'timeout' }); });
    req.on('error', e => resolve({ name: cmd.name, ok: false, error: e.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  const toRegister = commands.filter(c => !existingCommands.includes(c.name));
  console.log(`Registering ${toRegister.length} commands individually via POST...`);
  
  let registered = 0;
  for (let i = 0; i < toRegister.length; i++) {
    const result = await registerOne(toRegister[i]);
    if (result.ok) {
      registered++;
    } else if (result.retry) {
      console.log(`  Rate limited on ${result.name}, waiting ${Math.ceil(result.retry)}s...`);
      await new Promise(r => setTimeout(r, (result.retry + 1) * 1000));
      // Retry
      const retry = await registerOne(toRegister[i]);
      if (retry.ok) registered++;
      else console.log(`  Still failed: ${retry.error || 'rate limited'}`);
    }
    // Small delay between requests
    if (i < toRegister.length - 1) await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nDone: ${registered + existingCommands.length}/${commands.length + existingCommands.length} total commands registered`);
}

main().catch(e => console.error('Fatal:', e));
