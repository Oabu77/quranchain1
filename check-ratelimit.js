require('dotenv').config({ path: '/workspaces/quranchain1/discord-bot/.env' });
const https = require('https');

const options = {
  hostname: 'discord.com',
  path: '/api/v10/applications/1472103745402831041/guilds/1481826708721242165/commands',
  method: 'GET',
  headers: {
    'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Rate-Limit-Remaining:', res.headers['x-ratelimit-remaining']);
  console.log('Rate-Limit-Reset-After:', res.headers['x-ratelimit-reset-after']);
  console.log('Retry-After:', res.headers['retry-after']);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const cmds = JSON.parse(data);
      if (Array.isArray(cmds)) {
        console.log('Commands registered:', cmds.length);
        cmds.forEach(c => console.log(' -', c.name));
      } else {
        console.log('Response:', data.substring(0, 500));
      }
    } catch(e) {
      console.log('Raw:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.setTimeout(10000, () => { console.log('TIMEOUT'); req.destroy(); });
req.end();
