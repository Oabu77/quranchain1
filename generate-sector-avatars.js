// ══════════════════════════════════════════════════════════════
// DarCloud Empire — Sector Bot Avatar Generator
// Generates branded circular avatars for all 13 new sector bots
// ══════════════════════════════════════════════════════════════

const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const SECTOR_BOTS = [
  { name: 'DarHealth',    dir: 'darhealth-bot',    icon: 'DH', colors: ['#0a1a0a', '#1a3a2a', '#2a5a3a'], accent: '#22c55e', tagline: 'Healthcare' },
  { name: 'DarMedia',     dir: 'darmedia-bot',     icon: 'DM', colors: ['#1a0a2e', '#2d1b4e', '#4a2d6e'], accent: '#f472b6', tagline: 'Media & Broadcast' },
  { name: 'DarRealty',    dir: 'darrealty-bot',     icon: 'DR', colors: ['#1a1a0a', '#3a3a1a', '#5a5a2a'], accent: '#eab308', tagline: 'Real Estate' },
  { name: 'DarCommerce',  dir: 'darcommerce-bot',  icon: 'DC', colors: ['#1a0f00', '#3a2a1a', '#5a4a2a'], accent: '#f97316', tagline: 'Digital Commerce' },
  { name: 'DarTrade',     dir: 'dartrade-bot',     icon: 'DT', colors: ['#0a1a2e', '#1a2a3e', '#2a3a5e'], accent: '#06b6d4', tagline: 'Global Trade' },
  { name: 'DarEdu',       dir: 'daredu-bot',       icon: 'DE', colors: ['#0a0a2e', '#1a1a4e', '#2a2a6e'], accent: '#818cf8', tagline: 'Education' },
  { name: 'DarEnergy',    dir: 'darenergy-bot',    icon: 'EN', colors: ['#1a1a00', '#2a2a0a', '#4a4a1a'], accent: '#84cc16', tagline: 'Energy & Mining' },
  { name: 'DarSecurity',  dir: 'darsecurity-bot',  icon: 'DS', colors: ['#0a0a0a', '#1a1a1a', '#2a2a2a'], accent: '#ef4444', tagline: 'Cyber Security' },
  { name: 'DarTransport', dir: 'dartransport-bot', icon: 'OA', colors: ['#0a1a0a', '#1a3a2a', '#2a5a3a'], accent: '#14b8a6', tagline: 'Transport & Aviation' },
  { name: 'DarTelecom',   dir: 'dartelecom-bot',   icon: '5G', colors: ['#0a0a2e', '#1a1a4e', '#2a2a6e'], accent: '#3b82f6', tagline: 'Telecommunications' },
  { name: 'Omar AI',      dir: 'omarai-bot',       icon: 'OA', colors: ['#0a0a0a', '#1a0a1a', '#2e0a2e'], accent: '#f59e0b', tagline: 'Supreme AI' },
  { name: 'DarDeFi',      dir: 'dardefi-bot',      icon: 'DF', colors: ['#1a0a2e', '#2d0a4e', '#4a0a6e'], accent: '#c084fc', tagline: 'DeFi Protocol' },
  { name: 'DarHR',        dir: 'darhr-bot',        icon: 'HR', colors: ['#0a1a1a', '#1a2a2a', '#2a4a4a'], accent: '#2dd4bf', tagline: 'Human Resources' },
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

  const centerX = SIZE / 2;
  const centerY = SIZE / 2;
  const radius = SIZE / 2;

  // Fill with darkest color
  ctx.fillStyle = bot.colors[0];
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Radial gradient layers
  for (let i = bot.colors.length - 1; i >= 0; i--) {
    const layerRadius = radius * (1 - i * 0.25);
    ctx.beginPath();
    ctx.arc(centerX, centerY, layerRadius, 0, Math.PI * 2);
    ctx.fillStyle = bot.colors[i];
    ctx.fill();
  }

  // Outer ring (accent color)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 8, 0, Math.PI * 2);
  ctx.strokeStyle = bot.accent;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Inner decorative ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 24, 0, Math.PI * 2);
  ctx.strokeStyle = bot.accent + '40';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Geometric accent lines (tech feel)
  ctx.strokeStyle = bot.accent + '30';
  ctx.lineWidth = 1;
  for (let y = 80; y < SIZE - 80; y += 40) {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(SIZE - 60, y);
    ctx.stroke();
  }

  // Central circle background
  ctx.beginPath();
  ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
  ctx.fillStyle = bot.colors[0] + 'cc';
  ctx.fill();
  ctx.strokeStyle = bot.accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Main icon text
  ctx.fillStyle = bot.accent;
  ctx.font = 'bold 120px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(bot.icon, centerX, centerY - 10);

  // Bot name below icon
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(bot.name, centerX, SIZE - 80);

  // Tagline
  ctx.fillStyle = bot.accent + 'aa';
  ctx.font = '22px sans-serif';
  ctx.fillText(bot.tagline, centerX, SIZE - 45);

  // Top accent dots
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

// ── Main ────────────────────────────────────────────────────
const avatarDir = path.join(__dirname, 'avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir);

console.log('══════════════════════════════════════════════════════════');
console.log('  DarCloud Sector Bot Avatar Generator');
console.log('  Generating branded avatars for 13 sector bots');
console.log('══════════════════════════════════════════════════════════\n');

for (const bot of SECTOR_BOTS) {
  const png = generateAvatar(bot);
  const filePath = path.join(avatarDir, `${bot.dir}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`  ✓ ${bot.name} → avatars/${bot.dir}.png (${(png.length / 1024).toFixed(1)}KB)`);
}

console.log('\n══════════════════════════════════════════════════════════');
console.log(`  Done! 13 sector bot avatars generated in avatars/`);
console.log('══════════════════════════════════════════════════════════');
