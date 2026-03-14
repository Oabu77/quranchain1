// Native HTTPS command registration — bypasses discord.js REST client hang
const https = require('https');
const fs = require('fs');
const path = require('path');

const botDir = process.argv[2];
if (!botDir) { console.error('Usage: node register-native.js <bot-dir>'); process.exit(1); }

// Load .env
const envPath = path.resolve(botDir, '.env');
try {
  const env = fs.readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
} catch(e) { console.error('Cannot read .env:', e.message); process.exit(1); }

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Missing DISCORD_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID');
  process.exit(1);
}

// Load commands from register-commands.js by extracting them
// We'll require the SlashCommandBuilder to build commands
const { SlashCommandBuilder } = require(path.resolve(botDir, 'node_modules', 'discord.js'));

// Actually, let's just run the register-commands.js module in a way that captures commands
// Instead, let's parse register-commands.js and extract the commands array

// Simpler approach: require discord.js from the bot dir and build commands inline
// But easiest: just spawn the registration via native HTTPS with the commands JSON

// Get commands by requiring a modified version... Actually, let's just use the existing
// register-commands.js approach but swap out the REST.put with our own native HTTPS

const regFile = path.resolve(botDir, 'register-commands.js');
const regContent = fs.readFileSync(regFile, 'utf8');

// Create a sandbox that captures the commands array
const vm = require('vm');
const discordJs = require(path.resolve(botDir, 'node_modules', 'discord.js'));

// Create module mock
const moduleExports = {};
const sandbox = {
  require: (mod) => {
    if (mod === 'discord.js') return discordJs;
    if (mod === 'fs') return fs;
    if (mod === 'path') return path;
    return require(mod);
  },
  process: { ...process, exit: () => {} },
  console: { ...console },
  module: { exports: moduleExports },
  exports: moduleExports,
  __dirname: botDir,
  __filename: regFile,
};

// We need a different approach - let's just extract the commands by eval'ing the part that builds them
// Actually simplest: fork the register-commands.js but intercept the REST call

// Let's just manually build the same commands from register-commands.js content
// by extracting everything between "const commands = [" and "].map"

const cmdMatch = regContent.match(/const commands = \[([\s\S]*?)\]\.map/);
if (!cmdMatch && !regContent.includes('const commands = [')) {
  // Try alternative patterns
  console.error('Could not find commands array in register-commands.js');
  process.exit(1);
}

// Easiest approach: just use eval in context
let commands;
try {
  // Extract everything needed to build commands
  const { SlashCommandBuilder: SB } = discordJs;
  
  // Read the file, find the commands section, and evaluate it
  // Replace the async registration part with just exporting
  let modified = regContent
    .replace(/const \{ REST, Routes,/g, 'const { ')  // Remove REST, Routes imports
    .replace(/require\("discord\.js"\)/g, 'require("' + path.resolve(botDir, 'node_modules', 'discord.js').replace(/\\/g, '\\\\') + '")')
    .replace(/require\('discord\.js'\)/g, 'require("' + path.resolve(botDir, 'node_modules', 'discord.js').replace(/\\/g, '\\\\') + '")')
    .replace(/const rest[\s\S]*$/, ''); // Remove everything after commands definition
  
  // Find where .map((cmd) => cmd.toJSON()) ends
  const mapIdx = modified.indexOf('.map(');
  if (mapIdx > 0) {
    modified = modified.substring(0, mapIdx) + ';';
  }
  
  // Add the missing closing bracket if needed
  if (!modified.trim().endsWith('];')) {
    modified += '\n];';
  }
  
  // Evaluate to get commands
  const evalScript = modified + '\nmodule.exports = commands;';
  const m = { exports: {} };
  const fn = new Function('require', 'module', 'exports', '__dirname', '__filename', 'process', 'console', evalScript);
  fn(
    (mod) => {
      if (mod === 'discord.js') return discordJs;
      if (mod === 'fs') return fs;  
      if (mod === 'path') return path;
      return require(mod);
    },
    m, m.exports, botDir, regFile, { ...process, exit: () => {} }, console
  );
  commands = m.exports;
} catch(e) {
  console.error('Failed to extract commands:', e.message);
  process.exit(1);
}

if (!Array.isArray(commands)) {
  console.error('Commands is not an array');
  process.exit(1);
}

// Convert to JSON if not already
const commandsJson = commands.map(c => typeof c.toJSON === 'function' ? c.toJSON() : c);
const body = JSON.stringify(commandsJson);

console.log(`Registering ${commandsJson.length} commands for ${path.basename(botDir)} via native HTTPS...`);

const apiPath = `/api/v10/applications/${CLIENT_ID}/guilds/${GUILD_ID}/commands`;

const req = https.request({
  hostname: 'discord.com',
  path: apiPath,
  method: 'PUT',
  headers: {
    'Authorization': `Bot ${TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data);
        console.log(`✓ Registered ${result.length} commands to guild ${GUILD_ID}`);
      } catch(e) {
        console.log(`✓ Registration completed (status ${res.statusCode})`);
      }
    } else {
      console.error(`✗ Failed (status ${res.statusCode}):`, data.substring(0, 500));
    }
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.setTimeout(15000, () => {
  console.error('Request timed out after 15s');
  req.destroy();
  process.exit(1);
});

req.write(body);
req.end();
