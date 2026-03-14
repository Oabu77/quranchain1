// ══════════════════════════════════════════════════════════════
// DarCloud Bot Avatar Generator & Uploader
// Generates branded circular avatars and uploads via Discord API
// ══════════════════════════════════════════════════════════════

const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

// ── Bot Branding ──────────────────────────────────────────────
const BOTS = [
  {
    name: 'DarCloud',
    dir: 'discord-bot',
    icon: 'DC',
    colors: ['#1a1a2e', '#16213e', '#0f3460'],
    accent: '#e94560',
    tagline: 'System Operations',
  },
  {
    name: 'QuranChain',
    dir: 'quranchain-bot',
    icon: 'QC',
    colors: ['#0d1117', '#1b4332', '#2d6a4f'],
    accent: '#40916c',
    tagline: 'Blockchain',
    symbol: '۝',
  },
  {
    name: 'FungiMesh',
    dir: 'fungimesh-bot',
    icon: 'FM',
    colors: ['#1a0a2e', '#2d1b69', '#5b21b6'],
    accent: '#a78bfa',
    tagline: 'Mesh Network',
    symbol: '🍄',
  },
  {
    name: 'MeshTalk',
    dir: 'meshtalk-bot',
    icon: 'MT',
    colors: ['#0c1821', '#1b2a4a', '#324a5f'],
    accent: '#38bdf8',
    tagline: 'Communications',
  },
  {
    name: 'AI Fleet',
    dir: 'aifleet-bot',
    icon: 'AI',
    colors: ['#0f0f23', '#1a1a3e', '#2d1f6b'],
    accent: '#f59e0b',
    tagline: 'AI Agents',
  },
  {
    name: 'HWC',
    dir: 'hwc-bot',
    icon: 'HC',
    colors: ['#1a0f00', '#3d2200', '#6b3a00'],
    accent: '#d4a017',
    tagline: 'Halal Wealth Club',
  },
  {
    name: 'DarLaw',
    dir: 'darlaw-bot',
    icon: 'DL',
    colors: ['#0a0a0a', '#1c1c2e', '#2a2a40'],
    accent: '#8b5cf6',
    tagline: 'Legal AI',
  },
  {
    name: 'DarPay',
    dir: 'darpay-bot',
    icon: 'DP',
    colors: ['#0a1a0a', '#0f2f1a', '#1a4a2e'],
    accent: '#10b981',
    tagline: 'Revenue Engine',
  },
];

const SIZE = 512;

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function generateAvatar(bot) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // ── Background: radial gradient effect ────────────────────
  const centerX = SIZE / 2;
  const centerY = SIZE / 2;
  const radius = SIZE / 2;

  // Fill with darkest color first
  ctx.fillStyle = bot.colors[0];
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Radial gradient layers
  for (let i = bot.colors.length - 1; i >= 0; i--) {
    const layerRadius = radius * (1 - i * 0.25);
    const rgb = hexToRgb(bot.colors[i]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, layerRadius, 0, Math.PI * 2);
    ctx.fillStyle = bot.colors[i];
    ctx.fill();
  }

  // ── Outer ring (accent color) ─────────────────────────────
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 8, 0, Math.PI * 2);
  ctx.strokeStyle = bot.accent;
  ctx.lineWidth = 6;
  ctx.stroke();

  // ── Inner decorative ring ─────────────────────────────────
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 24, 0, Math.PI * 2);
  ctx.strokeStyle = bot.accent + '40';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Geometric accent lines (tech feel) ────────────────────
  ctx.strokeStyle = bot.accent + '30';
  ctx.lineWidth = 1;
  // Horizontal lines
  for (let y = 80; y < SIZE - 80; y += 40) {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(SIZE - 60, y);
    ctx.stroke();
  }

  // ── Central circle background ─────────────────────────────
  ctx.beginPath();
  ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
  ctx.fillStyle = bot.colors[0] + 'cc';
  ctx.fill();
  ctx.strokeStyle = bot.accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  // ── Main icon text ────────────────────────────────────────
  ctx.fillStyle = bot.accent;
  ctx.font = 'bold 120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(bot.icon, centerX, centerY - 10);

  // ── Bot name below icon ───────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(bot.name, centerX, SIZE - 80);

  // ── Tagline ───────────────────────────────────────────────
  ctx.fillStyle = bot.accent + 'aa';
  ctx.font = '22px sans-serif';
  ctx.fillText(bot.tagline, centerX, SIZE - 45);

  // ── Top accent dots ───────────────────────────────────────
  const dotCount = 6;
  for (let i = 0; i < dotCount; i++) {
    const angle = (Math.PI * 2 * i) / dotCount - Math.PI / 2;
    const dotX = centerX + Math.cos(angle) * (radius - 50);
    const dotY = centerY + Math.sin(angle) * (radius - 50);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = bot.accent;
    ctx.fill();
  }

  return canvas.toBuffer('image/png');
}

async function setAvatar(bot, pngBuffer) {
  const envPath = path.join(__dirname, bot.dir, '.env');
  if (!fs.existsSync(envPath)) {
    console.log(`  ⚠ ${bot.name}: no .env file`);
    return false;
  }

  const env = {};
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) env[key.trim()] = vals.join('=').trim();
  });

  if (!env.DISCORD_TOKEN || env.DISCORD_TOKEN === 'PASTE_TOKEN_HERE') {
    console.log(`  ⚠ ${bot.name}: no token configured — saving avatar locally only`);
    return false;
  }

  const base64 = pngBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${base64}`;

  try {
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bot ${env.DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatar: dataUri }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  ✓ ${bot.name}: avatar set (${data.username}#${data.discriminator})`);
      return true;
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.retry_after) {
        console.log(`  ⏳ ${bot.name}: rate limited — retry in ${Math.ceil(err.retry_after)}s`);
        await new Promise(r => setTimeout(r, err.retry_after * 1000 + 1000));
        return setAvatar(bot, pngBuffer);
      }
      console.log(`  ✗ ${bot.name}: ${err.message || res.status}`);
      return false;
    }
  } catch (e) {
    console.log(`  ✗ ${bot.name}: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('══════════════════════════════════════════════════════════');
  console.log('  DarCloud Bot Avatar Generator');
  console.log('  Generating branded avatars for 8 bots');
  console.log('══════════════════════════════════════════════════════════\n');

  // Create avatars directory
  const avatarDir = path.join(__dirname, 'avatars');
  if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir);

  console.log('▸ Generating avatars...');
  const avatarBuffers = {};
  for (const bot of BOTS) {
    const png = generateAvatar(bot);
    const filePath = path.join(avatarDir, `${bot.dir}.png`);
    fs.writeFileSync(filePath, png);
    avatarBuffers[bot.dir] = png;
    console.log(`  ✓ ${bot.name} → avatars/${bot.dir}.png (${(png.length / 1024).toFixed(1)}KB)`);
  }

  console.log('\n▸ Uploading to Discord...');
  let uploaded = 0;
  let skipped = 0;
  for (const bot of BOTS) {
    const result = await setAvatar(bot, avatarBuffers[bot.dir]);
    if (result) {
      uploaded++;
      // Discord rate limits avatar changes — wait between uploads
      if (uploaded < BOTS.length) {
        console.log('    (waiting 5s for rate limit...)');
        await new Promise(r => setTimeout(r, 5000));
      }
    } else {
      skipped++;
    }
  }

  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`  Done! ${uploaded} avatars uploaded, ${skipped} skipped`);
  console.log(`  All PNGs saved to: avatars/`);
  console.log('══════════════════════════════════════════════════════════');
}

main().catch(console.error);
