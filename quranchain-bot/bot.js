// ==========================================================
// QuranChain™ Blockchain Discord Bot
// Real 47-chain ecosystem | QRN Economy | Islamic Knowledge Games
// Owner: Omar Mohammad Abunadi — 30% Founder Royalty (Immutable)
// ==========================================================
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { readFileSync } = require("fs");
const { resolve } = require("path");

// Load .env
try {
  const env = readFileSync(resolve(__dirname, ".env"), "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#") && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch {}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const API_BASE = process.env.API_BASE || "http://localhost:8787";

if (!DISCORD_TOKEN) { console.error("Missing DISCORD_TOKEN"); process.exit(1); }

// ── Load Modules ──────────────────────────────────────────
const { getOrCreateWallet, addBalance, transfer, canDoAction, stmts, generateTxHash, tradeQrnForUsd, tradeUsdForQrn, getUsdBalance, QRN_TO_USD_RATE, TRADE_FEE_PERCENT } = require("./database");
const { mineBlock, getChainStats, LIVE_CHAINS, VALIDATORS, REVENUE_SPLIT, MAX_SUPPLY } = require("./blockchain");
const { startQuiz, answerQuiz, startScramble, answerScramble, claimDaily, openTreasure, activeQuizzes, activeScrambles } = require("./games");

// ── DarCloud Empire Shared Modules ────────────────────────
const onboardingDb = require("../shared/onboarding-db");
const onboardingEngine = require("../shared/onboarding-engine");
const stripeIntegration = require("../shared/stripe-integration");
const botIpc = require("../shared/bot-ipc");
const masjidFinder = require("../shared/masjid-finder");
const { MeshRouter } = require("../shared/mesh-router");
const openaiAgents = require("../shared/openai-agents");
const discordPremium = require("../shared/discord-premium");
const commandProtocol = require("../shared/command-protocol");
const meshRouter = new MeshRouter("quranchain");
const smartContracts = require("./smart-contracts");

// ── Discord Client ────────────────────────────────────────
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// ── Logging ───────────────────────────────────────────────
function log(tag, msg) { console.log(`[${new Date().toISOString()}] [${tag}] ${msg}`); }

// ── Embed Builder ─────────────────────────────────────────
function qcEmbed(title) {
  return new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle(title)
    .setFooter({ text: "QuranChain™ — 47 Chains | 30% Founder Royalty | 2% Zakat" })
    .setTimestamp();
}

function truncate(str, max = 1024) {
  return str && str.length > max ? str.slice(0, max - 3) + "..." : str || "";
}

// ── API Helper (for DarCloud integration) ─────────────────
async function api(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// ── Command Handlers ──────────────────────────────────────
const handlers = {

  // ─── Wallet ─────────────────────────────────
  async wallet(interaction) {
    const wallet = getOrCreateWallet(interaction.user.id, interaction.user.username);
    const embed = qcEmbed("🪙 QuranChain Wallet");
    embed.addFields(
      { name: "Owner", value: `<@${wallet.user_id}>`, inline: true },
      { name: "Balance", value: `**${wallet.balance.toFixed(2)} QRN**`, inline: true },
      { name: "Level", value: `${wallet.level} (${wallet.xp} XP)`, inline: true },
      { name: "Mining Power", value: `⛏️ ${wallet.mining_power}x`, inline: true },
      { name: "Total Earned", value: `${wallet.total_earned.toFixed(2)} QRN`, inline: true },
      { name: "Total Spent", value: `${wallet.total_spent.toFixed(2)} QRN`, inline: true },
      { name: "Streak", value: `🔥 ${wallet.streak} days`, inline: true },
    );
    if (wallet.validator_name) embed.addFields({ name: "Validator", value: wallet.validator_name, inline: true });
    embed.addFields({ name: "Wallet Address", value: `\`QRN:${wallet.user_id.slice(-8)}\``, inline: true });
    embed.setDescription(`*Member since ${wallet.created_at}*`);
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Send QRN ───────────────────────────────
  async send(interaction) {
    const recipient = interaction.options.getUser("to");
    const amount = interaction.options.getNumber("amount");
    const memo = interaction.options.getString("memo") || "Transfer";

    if (recipient.bot) return interaction.editReply({ embeds: [qcEmbed("❌ Error").setDescription("Can't send to bots.")] });

    getOrCreateWallet(interaction.user.id, interaction.user.username);
    const result = transfer(interaction.user.id, recipient.id, recipient.username, amount, memo);

    if (!result.success) {
      return interaction.editReply({ embeds: [qcEmbed("❌ Transfer Failed").setDescription(result.error)] });
    }

    const embed = qcEmbed("✅ Transfer Complete");
    embed.addFields(
      { name: "From", value: `<@${interaction.user.id}>`, inline: true },
      { name: "To", value: `<@${recipient.id}>`, inline: true },
      { name: "Amount", value: `**${amount.toFixed(2)} QRN**`, inline: true },
      { name: "Memo", value: memo },
      { name: "TX Hash", value: `\`${result.txHash.slice(0, 18)}...\`` },
    );
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Mining ─────────────────────────────────
  async mine(interaction) {
    const chain = interaction.options.getString("chain") || "QuranChain";
    const wallet = getOrCreateWallet(interaction.user.id, interaction.user.username);
    const cooldown = canDoAction(wallet, "last_mine", 2); // 2 min
    if (typeof cooldown === "number") {
      return interaction.editReply({ embeds: [qcEmbed("⏳ Mining Cooldown").setDescription(`Try again in **${cooldown} minutes**.`)] });
    }
    stmts.setLastMine.run(interaction.user.id);

    const result = mineBlock(interaction.user.id, interaction.user.username, chain);
    const embed = qcEmbed("⛏️ Block Mined!");
    embed.setDescription(`You mined block **#${result.blockNumber}** on **${result.chain}**!`);
    embed.addFields(
      { name: "Reward", value: `**+${result.reward.toFixed(2)} QRN**`, inline: true },
      { name: "Chain", value: result.chain, inline: true },
      { name: "Difficulty", value: `${result.difficulty}`, inline: true },
      { name: "Validator", value: `${result.validator} (${result.validatorType})`, inline: true },
      { name: "Block Hash", value: `\`${result.hash.slice(0, 22)}...\`` },
      { name: "Gas Collected", value: `${result.gasCollected.toFixed(4)} QRN`, inline: true },
      { name: "Zakat Share", value: `${result.gasSplit.zakat.toFixed(4)} QRN`, inline: true },
    );
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Chain Stats ────────────────────────────
  async chain(interaction) {
    const stats = getChainStats();
    const embed = qcEmbed("⛓️ QuranChain Network Stats");
    embed.addFields(
      { name: "Live Chains", value: `**${stats.liveChains}**`, inline: true },
      { name: "Block Height", value: `**${stats.blockHeight}**`, inline: true },
      { name: "Difficulty", value: `**${stats.difficulty}**`, inline: true },
      { name: "Total Supply", value: `${stats.totalSupply} / ${stats.maxSupply} QRN`, inline: true },
      { name: "Circulating", value: `${stats.circulatingPercent}%`, inline: true },
      { name: "Block Reward", value: `${stats.currentReward} QRN`, inline: true },
      { name: "Wallets", value: `${stats.wallets}`, inline: true },
      { name: "Transactions", value: `${stats.transactions}`, inline: true },
      { name: "Halving In", value: `${stats.halvingIn} blocks`, inline: true },
      { name: "Gas Revenue", value: `${stats.gasRevenue} QRN`, inline: true },
      { name: "Zakat Distributed", value: `${stats.totalZakat} QRN`, inline: true },
      { name: "Validators", value: `${stats.validators} (AI + Regional)`, inline: true },
      { name: "Mesh Nodes", value: `${stats.meshNodes.toLocaleString()}`, inline: true },
    );
    if (stats.lastBlock) {
      embed.addFields({ name: "Last Block", value: `#${stats.lastBlock.number} on ${stats.lastBlock.chain} — ${stats.lastBlock.validator} — ${stats.lastBlock.time}` });
    }
    const split = stats.revenueSplit;
    embed.addFields({ name: "Revenue Split", value: `👤 ${split.founder * 100}% Founder | 🤖 ${split.validators * 100}% Validators | 🖥️ ${split.hardware * 100}% Hardware | 🌍 ${split.ecosystem * 100}% Ecosystem | 🕌 ${split.zakat * 100}% Zakat` });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Validators ─────────────────────────────
  async validators(interaction) {
    const embed = qcEmbed("🤖 QuranChain Validators");
    const totalPower = VALIDATORS.reduce((s, v) => s + v.power, 0);
    const list = VALIDATORS.map(v => {
      const pct = ((v.power / totalPower) * 100).toFixed(1);
      return `${v.type.includes("AI") ? "🤖" : v.type === "Regional" ? "🌍" : "⚡"} **${v.name}** — ${v.type} — Power: ${v.power} (${pct}%)`;
    }).join("\n");
    embed.setDescription(list);
    embed.addFields({ name: "Total Validators", value: `${VALIDATORS.length}`, inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Live Chains ────────────────────────────
  async chains(interaction) {
    const embed = qcEmbed("🔗 47 Live Blockchain Networks");
    const chainList = LIVE_CHAINS.map(c => `🟢 ${c}`);
    const mid = Math.ceil(chainList.length / 2);
    embed.addFields(
      { name: "Networks 1-24", value: chainList.slice(0, mid).join("\n"), inline: true },
      { name: "Networks 25-47", value: chainList.slice(mid).join("\n"), inline: true },
    );
    embed.setDescription("Gas tolls collected on every chain. All validators online.");
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Gas Revenue ────────────────────────────
  async gas(interaction) {
    const stats = getChainStats();
    const byChain = require("./blockchain").getGasRevenueByChain();
    const embed = qcEmbed("⛽ Gas Toll Revenue");
    embed.addFields(
      { name: "Total Gas Revenue", value: `**${stats.gasRevenue} QRN**`, inline: true },
      { name: "Total Zakat", value: `**${stats.totalZakat} QRN**`, inline: true },
    );
    if (byChain.length > 0) {
      const list = byChain.map((c, i) => `${i + 1}. **${c.chain}** — ${c.total.toFixed(2)} QRN (${c.collections} blocks)`).join("\n");
      embed.addFields({ name: "Top Chains by Revenue", value: truncate(list) });
    }
    const split = REVENUE_SPLIT;
    embed.addFields({ name: "Revenue Distribution", value: `👤 **30%** Founder (Immutable)\n🤖 **40%** AI Validators\n🖥️ **10%** Hardware Hosts\n🌍 **18%** Ecosystem Fund\n🕌 **2%** Zakat (Mandatory)` });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Leaderboard ────────────────────────────
  async leaderboard(interaction) {
    const leaders = stmts.leaderboard.all();
    const embed = qcEmbed("🏆 QRN Leaderboard — Top 10");
    if (leaders.length === 0) {
      embed.setDescription("No wallets yet. Be the first — use `/wallet`!");
    } else {
      const list = leaders.map((l, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        return `${medal} **${l.username}** — ${l.balance.toFixed(2)} QRN (Lvl ${l.level})`;
      }).join("\n");
      embed.setDescription(list);
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Transaction History ────────────────────
  async transactions(interaction) {
    const userId = interaction.user.id;
    const txs = stmts.getUserTx.all(userId, userId);
    const embed = qcEmbed("📜 Transaction History");
    if (txs.length === 0) {
      embed.setDescription("No transactions yet.");
    } else {
      const list = txs.map(tx => {
        const dir = tx.to_user === userId ? "📥" : "📤";
        return `${dir} **${tx.amount.toFixed(2)} QRN** — ${tx.type} — ${tx.chain}\n   \`${tx.tx_hash.slice(0, 18)}...\` — ${tx.created_at}`;
      }).join("\n");
      embed.setDescription(truncate(list, 2000));
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Daily Reward ───────────────────────────
  async daily(interaction) {
    getOrCreateWallet(interaction.user.id, interaction.user.username);
    const result = claimDaily(interaction.user.id, interaction.user.username);
    if (result.error) {
      return interaction.editReply({ embeds: [qcEmbed("⏳ Daily Already Claimed").setDescription(result.error)] });
    }
    const embed = qcEmbed("🎁 Daily Reward Claimed!");
    embed.addFields(
      { name: "Base Reward", value: `${result.baseReward} QRN`, inline: true },
      { name: "Streak Bonus", value: `+${result.streakBonus} QRN`, inline: true },
      { name: "Total", value: `**${result.reward} QRN**`, inline: true },
      { name: "Streak", value: `🔥 ${result.streak} days (${result.streakMultiplier}x multiplier)` },
    );
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Quran Quiz ─────────────────────────────
  async quiz(interaction) {
    getOrCreateWallet(interaction.user.id, interaction.user.username);
    const result = startQuiz(interaction.user.id, interaction.user.username);
    if (result.error) {
      return interaction.editReply({ embeds: [qcEmbed("⏳ Quiz Cooldown").setDescription(result.error)] });
    }
    const embed = qcEmbed("📖 Quran Knowledge Quiz");
    embed.setDescription(`**${result.question}**\n\nEarn up to **50 QRN** for a correct answer!\nSpeed bonus: ⚡ <5s = +30 | 🏃 <10s = +15 | ✨ <20s = +5`);

    const row = new ActionRowBuilder().addComponents(
      result.choices.map((choice, i) =>
        new ButtonBuilder().setCustomId(`quiz_${i}`).setLabel(choice).setStyle(ButtonStyle.Primary)
      )
    );
    return interaction.editReply({ embeds: [embed], components: [row] });
  },

  // ─── Word Scramble ──────────────────────────
  async scramble(interaction) {
    getOrCreateWallet(interaction.user.id, interaction.user.username);
    const result = startScramble(interaction.user.id, interaction.user.username);
    if (result.error) {
      return interaction.editReply({ embeds: [qcEmbed("⏳ Scramble Cooldown").setDescription(result.error)] });
    }
    const embed = qcEmbed("🔀 Islamic Word Scramble");
    embed.setDescription(`Unscramble this word for **25-50 QRN**!\n\n# \`${result.scrambled}\`\n\n💡 **Hint:** ${result.hint}\n📝 **Letters:** ${result.letters}\n\nType your answer with \`/answer\``);
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Answer (for scramble) ──────────────────
  async answer(interaction) {
    const guess = interaction.options.getString("guess");
    const result = answerScramble(interaction.user.id, guess);
    if (result.error) {
      return interaction.editReply({ embeds: [qcEmbed("❌ Error").setDescription(result.error)] });
    }
    if (result.correct) {
      const embed = qcEmbed("✅ Correct!");
      embed.setDescription(`The word was **${result.word}**!`);
      embed.addFields(
        { name: "Earned", value: `**+${result.qrnEarned} QRN**${result.bonusText}`, inline: true },
        { name: "Time", value: `${result.elapsed}s`, inline: true },
      );
      return interaction.editReply({ embeds: [embed] });
    } else {
      return interaction.editReply({ embeds: [qcEmbed("❌ Wrong!").setDescription(`Try again! 💡 Hint: ${result.hint}`)] });
    }
  },

  // ─── Treasure Hunt ──────────────────────────
  async treasure(interaction) {
    getOrCreateWallet(interaction.user.id, interaction.user.username);
    const result = openTreasure(interaction.user.id, interaction.user.username);
    if (result.error) {
      return interaction.editReply({ embeds: [qcEmbed("⏳ Treasure Cooldown").setDescription(result.error)] });
    }
    if (!result.found) {
      return interaction.editReply({ embeds: [qcEmbed("💨 Empty Chest").setDescription("You searched but found nothing this time. Try again in 30 minutes!")] });
    }
    const t = result.treasure;
    const embed = qcEmbed("🎉 Treasure Found!");
    embed.setDescription(`${t.name}`);
    embed.addFields(
      { name: "Rarity", value: t.rarity, inline: true },
      { name: "Reward", value: `**+${t.qrn} QRN**`, inline: true },
    );
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Game Stats ─────────────────────────────
  async gamestats(interaction) {
    const user = interaction.options.getUser("player") || interaction.user;
    getOrCreateWallet(user.id, user.username);
    const stats = require("./games").getGameStats(user.id);
    const wallet = stmts.getWallet.get(user.id);
    const embed = qcEmbed(`📊 Game Stats — ${user.username}`);
    embed.addFields(
      { name: "Balance", value: `${wallet.balance.toFixed(2)} QRN`, inline: true },
      { name: "Level", value: `${wallet.level}`, inline: true },
      { name: "Mining Power", value: `${wallet.mining_power}x`, inline: true },
    );
    if (stats.length === 0) {
      embed.addFields({ name: "Games", value: "No games played yet!" });
    } else {
      for (const s of stats) {
        embed.addFields({
          name: `${s.game.charAt(0).toUpperCase() + s.game.slice(1)}`,
          value: `Played: ${s.games_played} | Score: ${s.total_score} | Earned: ${s.total_qrn.toFixed(2)} QRN`,
          inline: true,
        });
      }
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── DarCloud Ecosystem ─────────────────────
  async ecosystem(interaction) {
    const embed = qcEmbed("🏢 DarCloud Ecosystem — 101 Companies");
    try {
      const data = await api("/api/contracts/companies");
      embed.addFields({ name: "Total Companies", value: `**${data.total || data.result?.companies?.length || 0}**`, inline: true });
      const companies = data.result?.companies || [];
      const tiers = {
        "Core Platform": companies.filter(c => c.type === "parent" || ["quranchain", "fungimesh", "darcloud-ai"].includes(c.company_id)),
        "Blockchain & DeFi": companies.filter(c => c.sector?.includes("defi") || c.sector?.includes("blockchain") || c.sector?.includes("staking") || c.sector?.includes("nft")),
        "Islamic Finance": companies.filter(c => c.sector?.includes("islamic") || c.sector?.includes("takaful") || c.sector?.includes("sukuk")),
      };
      for (const [tier, cos] of Object.entries(tiers)) {
        if (cos.length > 0) {
          embed.addFields({ name: tier, value: truncate(cos.map(c => `• ${c.name}`).join("\n")) });
        }
      }
    } catch {
      embed.setDescription("101 companies across 6 tiers:\n• Core Platform (10)\n• Islamic Finance & Banking (20)\n• AI & Technology (20)\n• Halal Lifestyle & Commerce (15)\n• Blockchain & DeFi (15)\n• International Operations (21)");
    }
    embed.addFields({ name: "Owner", value: "**Omar Mohammad Abunadi** — 30% Founder Royalty (Immutable)" });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Revenue Split ──────────────────────────
  async revenue(interaction) {
    const stats = getChainStats();
    const embed = qcEmbed("💰 Revenue Distribution — Immutable");
    embed.setDescription("All revenue across 47 chains follows this immutable split:");
    embed.addFields(
      { name: "👤 30% — Founder", value: "Omar Mohammad Abunadi (Immutable)", inline: true },
      { name: "🤖 40% — AI Validators", value: "Omar AI™ + QuranChain AI™", inline: true },
      { name: "🖥️ 10% — Hardware Hosts", value: "340K mesh nodes, 14 validators", inline: true },
      { name: "🌍 18% — Ecosystem Fund", value: "Development, marketing, operations", inline: true },
      { name: "🕌 2% — Zakat", value: `Mandatory charity — ${stats.totalZakat} QRN distributed`, inline: true },
    );
    embed.addFields(
      { name: "Total Gas Revenue", value: `${stats.gasRevenue} QRN`, inline: true },
      { name: "Total Supply", value: `${stats.totalSupply} / ${stats.maxSupply} QRN`, inline: true },
    );
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Masjid Finder ──────────────────────────
  async masjid(interaction) {
    const location = interaction.options.getString("location");
    const radius = interaction.options.getInteger("radius") || 10;

    const geo = await masjidFinder.geocode(location);
    if (!geo) {
      return interaction.editReply({ embeds: [qcEmbed("❌ Location Not Found").setDescription(`Could not find "${location}". Try a city name like "Houston TX" or "London UK".`).setColor(0xef4444)] });
    }

    const mosques = await masjidFinder.findMosquesNearby(geo.lat, geo.lon, radius, 10);
    const qibla = masjidFinder.getQiblaDirection(geo.lat, geo.lon);

    const embed = qcEmbed(`🕌 Mosques Near ${location}`);
    embed.setDescription(
      `**${mosques.length}** mosques found within ${radius}km of ${geo.displayName.split(",").slice(0, 2).join(",")}\n` +
      `🧭 **Qibla:** ${qibla.bearing}° ${qibla.compass} | ${qibla.distToKaaba} km to Makkah\n\n` +
      masjidFinder.formatMosqueList(mosques) +
      masjidFinder.getSignupCTA()
    );
    embed.setColor(0x22c55e);
    embed.setFooter({ text: "QuranChain™ Masjid Finder — Powered by DarCloud | Data: OpenStreetMap" });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Prayer Times ─────────────────────────────
  async prayer(interaction) {
    const location = interaction.options.getString("location");

    const geo = await masjidFinder.geocode(location);
    if (!geo) {
      return interaction.editReply({ embeds: [qcEmbed("❌ Location Not Found").setDescription(`Could not find "${location}".`).setColor(0xef4444)] });
    }

    const times = await masjidFinder.getPrayerTimes(geo.lat, geo.lon);
    const qibla = masjidFinder.getQiblaDirection(geo.lat, geo.lon);

    const embed = qcEmbed(`🕐 Prayer Times — ${location}`);
    embed.setDescription(
      `📅 **${times.date}** | 🌙 **${times.hijri}**\n` +
      `📍 ${geo.displayName.split(",").slice(0, 2).join(",")}\n` +
      `🧭 Qibla: **${qibla.bearing}° ${qibla.compass}** | ${qibla.distToKaaba} km to Makkah`
    );
    embed.addFields(
      { name: "🌅 Fajr", value: times.fajr, inline: true },
      { name: "☀️ Sunrise", value: times.sunrise, inline: true },
      { name: "🕐 Dhuhr", value: times.dhuhr, inline: true },
      { name: "🌤️ Asr", value: times.asr, inline: true },
      { name: "🌅 Maghrib", value: times.maghrib, inline: true },
      { name: "🌙 Isha", value: times.isha, inline: true },
    );
    embed.setColor(0x3b82f6);
    embed.setFooter({ text: `Method: ${times.method} | QuranChain™ — DarCloud Empire` });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Qibla Direction ──────────────────────────
  async qibla(interaction) {
    const location = interaction.options.getString("location");

    const geo = await masjidFinder.geocode(location);
    if (!geo) {
      return interaction.editReply({ embeds: [qcEmbed("❌ Location Not Found").setDescription(`Could not find "${location}".`).setColor(0xef4444)] });
    }

    const qibla = masjidFinder.getQiblaDirection(geo.lat, geo.lon);

    const embed = qcEmbed(`🧭 Qibla Direction — ${location}`);
    embed.setDescription(
      `📍 From: ${geo.displayName.split(",").slice(0, 3).join(",")}\n` +
      `🕋 To: Al-Masjid al-Haram, Makkah\n\n` +
      `🧭 **Direction: ${qibla.bearing}° ${qibla.compass}**\n` +
      `📏 **Distance to Kaaba: ${qibla.distToKaaba.toLocaleString()} km**\n\n` +
      `Use a compass and face **${qibla.bearing}°** from North.`
    );
    embed.setColor(0xf59e0b);
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Trade QRN ↔ USD ─────────────────────────
  async trade(interaction) {
    const direction = interaction.options.getString("direction");
    const amount = interaction.options.getNumber("amount");

    getOrCreateWallet(interaction.user.id, interaction.user.username);

    if (direction === "sell") {
      // QRN → USD
      const result = tradeQrnForUsd(interaction.user.id, interaction.user.username, amount);
      if (!result.success) {
        return interaction.editReply({ embeds: [qcEmbed("❌ Trade Failed").setDescription(result.error).setColor(0xef4444)] });
      }
      const usdBal = getUsdBalance(interaction.user.id);
      const wallet = stmts.getWallet.get(interaction.user.id);
      const embed = qcEmbed("💱 Trade Executed — QRN → USD");
      embed.setColor(0x22c55e);
      embed.addFields(
        { name: "Sold", value: `**${result.qrnAmount.toFixed(2)} QRN**`, inline: true },
        { name: "Received", value: `**$${result.usdAmount.toFixed(2)} USD**`, inline: true },
        { name: "Rate", value: `1 QRN = $${QRN_TO_USD_RATE} USD`, inline: true },
        { name: "Fee (0.3%)", value: `${result.feeQrn.toFixed(4)} QRN`, inline: true },
        { name: "QRN Balance", value: `${wallet.balance.toFixed(2)} QRN`, inline: true },
        { name: "USD Balance", value: `$${usdBal.balance.toFixed(2)}`, inline: true },
        { name: "TX Hash", value: `\`${result.txHash.slice(0, 18)}...\`` },
      );
      return interaction.editReply({ embeds: [embed] });

    } else {
      // USD → QRN
      const result = tradeUsdForQrn(interaction.user.id, interaction.user.username, amount);
      if (!result.success) {
        return interaction.editReply({ embeds: [qcEmbed("❌ Trade Failed").setDescription(result.error).setColor(0xef4444)] });
      }
      const usdBal = getUsdBalance(interaction.user.id);
      const wallet = stmts.getWallet.get(interaction.user.id);
      const embed = qcEmbed("💱 Trade Executed — USD → QRN");
      embed.setColor(0x22c55e);
      embed.addFields(
        { name: "Sold", value: `**$${result.usdAmount.toFixed(2)} USD**`, inline: true },
        { name: "Received", value: `**${result.qrnAmount.toFixed(2)} QRN**`, inline: true },
        { name: "Rate", value: `1 QRN = $${QRN_TO_USD_RATE} USD`, inline: true },
        { name: "Fee (0.3%)", value: `${result.feeQrn.toFixed(4)} QRN`, inline: true },
        { name: "QRN Balance", value: `${wallet.balance.toFixed(2)} QRN`, inline: true },
        { name: "USD Balance", value: `$${usdBal.balance.toFixed(2)}`, inline: true },
        { name: "TX Hash", value: `\`${result.txHash.slice(0, 18)}...\`` },
      );
      return interaction.editReply({ embeds: [embed] });
    }
  },

  // ─── Trade History ──────────────────────────
  async trades(interaction) {
    const userId = interaction.user.id;
    getOrCreateWallet(userId, interaction.user.username);
    const trades = stmts.getUserTrades.all(userId);
    const usdBal = getUsdBalance(userId);
    const wallet = stmts.getWallet.get(userId);

    const embed = qcEmbed("📊 Trade History — QRN ↔ USD");
    embed.addFields(
      { name: "QRN Balance", value: `${wallet.balance.toFixed(2)} QRN`, inline: true },
      { name: "USD Balance", value: `$${usdBal.balance.toFixed(2)}`, inline: true },
      { name: "Rate", value: `1 QRN = $${QRN_TO_USD_RATE}`, inline: true },
    );
    if (trades.length === 0) {
      embed.setDescription("No trades yet. Use `/trade` to swap QRN ↔ USD!");
    } else {
      const list = trades.map(t => {
        const icon = t.direction === "QRN_TO_USD" ? "📤" : "📥";
        return `${icon} **${t.qrn_amount.toFixed(2)} QRN** ↔ **$${t.usd_amount.toFixed(2)} USD** — ${t.created_at}`;
      }).join("\n");
      embed.addFields({ name: "Recent Trades", value: truncate(list) });
    }
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── Help ───────────────────────────────────
  async help(interaction) {
    const embed = qcEmbed("📖 QuranChain Bot — Commands");
    embed.setDescription("**بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ**\n\nQuranChain: The Islamic Blockchain Network — 47 chains, QRN economy, NFT marketplace, smart contracts.");
    embed.addFields(
      { name: "💰 Economy", value: "`/wallet` — View your QRN wallet\n`/send` — Send QRN to someone\n`/trade` — Swap QRN ↔ USD\n`/trades` — Trade history\n`/daily` — Claim daily reward (streak bonus!)\n`/leaderboard` — Top 10 holders\n`/transactions` — Your TX history" },
      { name: "⛏️ Blockchain", value: "`/mine` — Mine a block on any chain\n`/chain` — Network statistics\n`/validators` — View 14 validators\n`/chains` — All 47 live networks\n`/gas` — Gas toll revenue" },
      { name: "📜 Smart Contracts", value: "`/contract-deploy` — Deploy a smart contract\n`/my-contracts` — View your contracts" },
      { name: "🎨 NFT Trading", value: "`/nft-mint` — Mint an NFT on your contract\n`/nft-buy` — Buy an NFT from the marketplace\n`/nft-sell` — List your NFT for sale\n`/nft-transfer` — Transfer an NFT to someone\n`/nft-gallery` — View NFT collection\n`/nft-market` — Browse the marketplace" },
      { name: "📖 Islamic Knowledge", value: "`/quiz` — Quran knowledge quiz (earn QRN)\n`/scramble` — Islamic word scramble (earn QRN)\n`/answer` — Answer a scramble\n`/treasure` — Treasure hunt\n`/gamestats` — Your stats" },
      { name: "🕌 Masjid & Prayer", value: "`/masjid` — Find mosques near any location\n`/prayer` — Prayer times for any city\n`/qibla` — Qibla direction from anywhere" },
      { name: "🏢 Ecosystem", value: "`/ecosystem` — 101 DarCloud companies\n`/revenue` — Revenue distribution" },
    );
    return interaction.editReply({ embeds: [embed] });
  },

  // ── Auto-Setup Commands ─────────────────────────────────────
  async setup(interaction) {
    const autoSetup = require("../shared/auto-setup");
    onboardingDb.getOrCreateMember(interaction.user.id, interaction.user.tag || interaction.user.username);
    const results = autoSetup.setupAllServices(interaction.user.id, interaction.user.tag || interaction.user.username);
    const { embed, row } = autoSetup.createSetupCompleteEmbed(interaction.user.tag || interaction.user.username, results);
    await interaction.editReply({ embeds: [embed], components: row ? [row] : [] });
  },

  "my-services": async (interaction) => {
    const autoSetup = require("../shared/auto-setup");
    const embed = autoSetup.createServiceStatusEmbed(interaction.user.id, interaction.user.tag || interaction.user.username);
    await interaction.editReply({ embeds: [embed] });
  },

  // ─── Smart Contracts ────────────────────────
  async "contract-deploy"(interaction) {
    const type = interaction.options.getString("type");
    const name = interaction.options.getString("name");

    const result = smartContracts.deployContract(interaction.user.id, interaction.user.username, type, name);
    if (result.error) {
      return interaction.editReply({ embeds: [qcEmbed("❌ Deploy Failed").setDescription(result.error).setColor(0xef4444)] });
    }

    const embed = qcEmbed("📜 Smart Contract Deployed!");
    embed.addFields(
      { name: "Contract ID", value: `\`${result.contractId}\``, inline: true },
      { name: "Type", value: result.type, inline: true },
      { name: "Name", value: result.name, inline: true },
      { name: "Chain", value: result.chain, inline: true },
      { name: "Gas Cost", value: `${result.gasCost} QRN`, inline: true },
      { name: "Block", value: `#${result.blockNumber}`, inline: true },
      { name: "Code Hash", value: `\`${result.codeHash}\`` },
      { name: "TX Hash", value: `\`${result.txHash.slice(0, 22)}...\`` },
    );
    embed.setColor(0x22c55e);
    return interaction.editReply({ embeds: [embed] });
  },

  async "my-contracts"(interaction) {
    const contracts = smartContracts.stmts.getUserContracts.all(interaction.user.id);
    const embed = qcEmbed("📜 My Smart Contracts");
    if (contracts.length === 0) {
      embed.setDescription("You haven't deployed any contracts yet. Use `/contract-deploy` to create one.");
    } else {
      const list = contracts.map(c => {
        const state = JSON.parse(c.state_json || "{}");
        return `📜 **${c.name}** (\`${c.contract_id}\`)\n   Type: ${c.contract_type} | NFTs: ${state.nfts_minted || 0} | Volume: ${(state.total_volume || 0).toFixed(2)} QRN | Chain: ${c.chain}`;
      }).join("\n\n");
      embed.setDescription(truncate(list, 2000));
    }
    embed.addFields({ name: "Total Contracts", value: String(contracts.length), inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  // ─── NFT Minting & Trading ─────────────────
  async "nft-mint"(interaction) {
    const contractId = interaction.options.getString("contract");
    const name = interaction.options.getString("name");
    const description = interaction.options.getString("description") || "";
    const category = interaction.options.getString("category") || "islamic_art";
    const rarity = interaction.options.getString("rarity") || "common";
    const price = interaction.options.getNumber("price") || 0;

    const result = smartContracts.mintNft(interaction.user.id, interaction.user.username, contractId, name, description, category, rarity, price);
    if (result.error) {
      return interaction.editReply({ embeds: [qcEmbed("❌ Mint Failed").setDescription(result.error).setColor(0xef4444)] });
    }

    const embed = qcEmbed(`${result.rarityIcon} NFT Minted — ${result.rarity}!`);
    embed.addFields(
      { name: "Token ID", value: `\`${result.tokenId}\``, inline: true },
      { name: "Name", value: result.name, inline: true },
      { name: "Rarity", value: `${result.rarityIcon} ${result.rarity}`, inline: true },
      { name: "Category", value: result.category, inline: true },
      { name: "Mint Cost", value: `${result.mintCost} QRN`, inline: true },
      { name: "Royalty", value: `${result.royaltyPct}%`, inline: true },
      { name: "Contract", value: `\`${result.contractId}\``, inline: true },
      { name: "Chain", value: result.chain, inline: true },
      { name: "For Sale", value: result.forSale ? `✅ ${result.price} QRN` : "❌ Not listed", inline: true },
      { name: "TX Hash", value: `\`${result.txHash.slice(0, 22)}...\`` },
    );
    if (result.description) embed.setDescription(result.description);
    embed.setColor(0x22c55e);
    return interaction.editReply({ embeds: [embed] });
  },

  async "nft-buy"(interaction) {
    const tokenId = interaction.options.getString("token");

    const result = smartContracts.buyNft(interaction.user.id, interaction.user.username, tokenId);
    if (result.error) {
      return interaction.editReply({ embeds: [qcEmbed("❌ Purchase Failed").setDescription(result.error).setColor(0xef4444)] });
    }

    const embed = qcEmbed("🎉 NFT Purchased!");
    embed.addFields(
      { name: "NFT", value: `**${result.name}** (${result.rarity})`, inline: true },
      { name: "Price Paid", value: `${result.price.toFixed(2)} QRN`, inline: true },
      { name: "Seller Received", value: `${result.sellerReceives} QRN`, inline: true },
      { name: "Creator Royalty", value: `${result.royaltyPaid} QRN`, inline: true },
      { name: "Zakat", value: `${result.zakatPaid} QRN`, inline: true },
      { name: "Platform Fee", value: `${result.platformFee} QRN`, inline: true },
      { name: "TX Hash", value: `\`${result.txHash.slice(0, 22)}...\`` },
    );
    embed.setColor(0x22c55e);
    return interaction.editReply({ embeds: [embed] });
  },

  async "nft-sell"(interaction) {
    const tokenId = interaction.options.getString("token");
    const price = interaction.options.getNumber("price");

    const result = smartContracts.listNftForSale(interaction.user.id, tokenId, price);
    if (result.error) {
      return interaction.editReply({ embeds: [qcEmbed("❌ Listing Failed").setDescription(result.error).setColor(0xef4444)] });
    }

    const embed = qcEmbed("🏷️ NFT Listed for Sale");
    embed.addFields(
      { name: "NFT", value: `**${result.name}** (${result.rarity})`, inline: true },
      { name: "Price", value: `${result.price} QRN`, inline: true },
      { name: "Token ID", value: `\`${result.tokenId}\``, inline: true },
    );
    embed.setColor(0x22c55e);
    return interaction.editReply({ embeds: [embed] });
  },

  async "nft-transfer"(interaction) {
    const tokenId = interaction.options.getString("token");
    const recipient = interaction.options.getUser("to");

    if (recipient.bot) return interaction.editReply({ embeds: [qcEmbed("❌ Error").setDescription("Can't transfer to bots.")] });

    const result = smartContracts.transferNft(interaction.user.id, recipient.id, recipient.username, tokenId);
    if (result.error) {
      return interaction.editReply({ embeds: [qcEmbed("❌ Transfer Failed").setDescription(result.error).setColor(0xef4444)] });
    }

    const embed = qcEmbed("📤 NFT Transferred");
    embed.addFields(
      { name: "NFT", value: `**${result.name}**`, inline: true },
      { name: "To", value: `<@${recipient.id}>`, inline: true },
      { name: "TX Hash", value: `\`${result.txHash.slice(0, 22)}...\`` },
    );
    embed.setColor(0x22c55e);
    return interaction.editReply({ embeds: [embed] });
  },

  async "nft-gallery"(interaction) {
    const user = interaction.options.getUser("owner") || interaction.user;
    const nfts = smartContracts.stmts.getUserNfts.all(user.id);
    const nftCount = smartContracts.stmts.userNftCount.get(user.id).count;

    const embed = qcEmbed(`🖼️ NFT Gallery — ${user.username}`);
    if (nfts.length === 0) {
      embed.setDescription("No NFTs owned. Mint one with `/nft-mint` or buy from the `/nft-market`!");
    } else {
      const list = nfts.slice(0, 15).map(n => {
        const tier = smartContracts.RARITY_TIERS[n.rarity] || { color: "⬜" };
        return `${tier.color} **${n.name}** (\`${n.token_id.slice(0, 12)}...\`)\n   ${n.category} | ${n.for_sale ? `🏷️ ${n.price_qrn} QRN` : "Not for sale"}`;
      }).join("\n\n");
      embed.setDescription(truncate(list, 2000));
    }
    embed.addFields({ name: "Total NFTs", value: String(nftCount), inline: true });
    return interaction.editReply({ embeds: [embed] });
  },

  async "nft-market"(interaction) {
    const category = interaction.options.getString("category");
    const forSale = category
      ? smartContracts.stmts.getForSaleByCategory.all(category)
      : smartContracts.stmts.getForSale.all();
    const stats = smartContracts.getMarketplaceStats();

    const embed = qcEmbed("🏪 NFT Marketplace");
    if (forSale.length === 0) {
      embed.setDescription("No NFTs currently listed. Be the first — use `/nft-mint`!");
    } else {
      const list = forSale.map(n => {
        const tier = smartContracts.RARITY_TIERS[n.rarity] || { color: "⬜" };
        return `${tier.color} **${n.name}** — **${n.price_qrn} QRN**\n   \`${n.token_id}\` | ${n.category} | Creator royalty: ${n.royalty_pct}%`;
      }).join("\n\n");
      embed.setDescription(truncate(list, 2000));
    }
    embed.addFields(
      { name: "Total NFTs Minted", value: String(stats.totalNfts), inline: true },
      { name: "Trade Volume", value: `${stats.totalVolume} QRN`, inline: true },
      { name: "Total Trades", value: String(stats.totalTrades), inline: true },
      { name: "Smart Contracts", value: String(stats.totalContracts), inline: true },
      { name: "Categories", value: String(stats.categories), inline: true },
    );
    return interaction.editReply({ embeds: [embed] });
  },

  async upgrade(interaction) {
    const plan = interaction.options.getString("plan");
    try {
      const session = await stripeIntegration.createCheckoutSession(interaction.user.id, plan);
      const embed = qcEmbed("⬆️ Upgrade Plan")
        .setColor(0x00D4AA)
        .setDescription(`Click below to upgrade:\n\n[🔗 Secure Checkout](${session.url})`);
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply({ content: "❌ " + err.message });
    }
  },

  async "ai-ask"(interaction) {
    const usageCheck = discordPremium.checkUsageLimit(interaction, "ai-ask");
    if (!usageCheck.allowed) { const upsell = discordPremium.createUpsellEmbed(usageCheck, "ai-ask"); return interaction.editReply(upsell); }
    discordPremium.trackUsage(interaction.user.id, "ai-ask");
    const question = interaction.options.getString("question");
    const agent = interaction.options.getString("agent") || null;
    const assistantId = agent || openaiAgents.detectAssistant(question) || openaiAgents.getDefaultAssistant("quranchain-bot");
    const result = await openaiAgents.askAssistant(question, assistantId, "quranchain-bot", { userId: interaction.user.id });
    const embed = qcEmbed(`🤖 ${result.assistant || "AI"}`)
      .setColor(result.success ? 0x10B981 : 0xEF4444)
      .setDescription(result.success ? result.answer : `❌ ${result.error}`)
      .setFooter({ text: result.success ? `${result.model} • ${result.tokens} tokens` : "OpenAI" })
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  },

  async premium(interaction) {
    const embed = discordPremium.createPremiumStatusEmbed(interaction);
    const tier = discordPremium.getUserTier(interaction);
    if (tier !== "empire") { const c = discordPremium.createComparisonEmbed(); await interaction.editReply({ embeds: [embed, ...c.embeds], components: c.components }); }
    else { await interaction.editReply({ embeds: [embed] }); }
  },

  async shop(interaction) {
    const shopData = discordPremium.createShopEmbed(interaction);
    await interaction.editReply(shopData);
  },
};

// ── Interaction Handler ───────────────────────────────────

// ── Message Handler — Wake Phrase Detection ───────────────
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const wake = commandProtocol.detectWake(message.content);
  if (!wake.matched) return;

  try {
    const roles = message.member?.roles?.cache;
    const response = await commandProtocol.processCommand(message.content, message.author.id, roles);
    if (!response.protocol) return;

    const embedData = commandProtocol.toEmbed(response);
    const embed = new EmbedBuilder()
      .setTitle(embedData.title)
      .setColor(embedData.color)
      .setDescription(embedData.description)
      .setTimestamp()
      .setFooter({ text: "QuranChain™ Command Protocol v1.0" });
    for (const field of embedData.fields) {
      embed.addFields({ name: field.name, value: String(field.value || "—").slice(0, 1024), inline: field.inline || false });
    }
    await message.reply({ embeds: [embed] });
  } catch (err) {
    log("ERROR", `Protocol error: ${err.message}`);
  }
});

client.on("interactionCreate", async (interaction) => {
  // Premium button handler
  if (interaction.isButton() && interaction.customId === "premium_compare") {
    await interaction.deferReply({ ephemeral: true });
    const comp = discordPremium.createComparisonEmbed();
    await interaction.editReply(comp);
    return;
  }

  // Shop buy buttons
  if (interaction.isButton() && interaction.customId.startsWith("shop_buy_")) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const result = discordPremium.handleShopButton(interaction.customId);
      if (result.handled && result.plan) {
        const session = await stripeIntegration.createCheckoutSession(interaction.user.id, result.plan);
        const embed = qcEmbed("💳 Checkout").setColor(0xFFD700).setDescription(`🔗 **[Complete Checkout](${session.url})**\n\n${session.simulated ? "⚠️ *Simulation mode*" : "🔒 *Secured by Stripe*"}`).setTimestamp();
        await interaction.editReply({ embeds: [embed] });
      }
      return;
    } catch (err) {
      if (!interaction.replied) await interaction.editReply({ content: `❌ ${err.message}` }).catch(() => {});
      return;
    }
  }

  if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
    // Handle onboarding interactions first
    try {
      const handled = await onboardingEngine.handleOnboardingInteraction(interaction, "quranchain");
      if (handled) return;
    } catch (err) { log("ERROR", `Onboarding interaction: ${err.message}`); }

    // Handle quiz answers
    if (interaction.isButton() && interaction.customId.startsWith("quiz_")) {
      await interaction.deferUpdate();
      const choiceIndex = parseInt(interaction.customId.split("_")[1]);
      const result = answerQuiz(interaction.user.id, choiceIndex);

      if (result.error) {
        return interaction.followUp({ embeds: [qcEmbed("❌ Error").setDescription(result.error)], ephemeral: true });
      }

      const embed = result.correct
        ? qcEmbed("✅ Correct!").setDescription(`**+${result.qrnEarned} QRN**${result.bonusText}\nAnswer: **${result.answer}**\nTime: ${result.elapsed}s`).setColor(0x22c55e)
        : qcEmbed("❌ Wrong!").setDescription(`The correct answer was: **${result.answer}**\nTime: ${result.elapsed}s`).setColor(0xef4444);

      return interaction.editReply({ embeds: [embed], components: [] });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  // Handle shared onboarding commands
  const onboardCmds = ["onboard", "dashboard", "referral", "services", "subscribe"];
  if (onboardCmds.includes(interaction.commandName)) {
    try { await onboardingEngine.handleOnboardingCommand(interaction, "quranchain"); } catch (err) {
      log("ERROR", `[${interaction.commandName}] ${err.message}`);
      if (!interaction.replied) await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true }).catch(() => {});
    }
    return;
  }

  const handler = handlers[interaction.commandName];
  if (!handler) return;

  try {
    await interaction.deferReply();
    await handler(interaction);
  } catch (err) {
    log("ERROR", `Command /${interaction.commandName}: ${err.message}`);
    const errEmbed = qcEmbed("❌ Error").setDescription(err.message).setColor(0xef4444);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [errEmbed] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
    }
  }
});

// ── Bot Ready ─────────────────────────────────────────────
client.once("ready", () => {
  log("INFO", "╔═══════════════════════════════════════════╗");
  log("INFO", "║   QuranChain™ Blockchain Bot — ONLINE     ║");
  log("INFO", "╚═══════════════════════════════════════════╝");
  log("INFO", `✓ Logged in as ${client.user.tag}`);
  log("INFO", `✓ ${LIVE_CHAINS.length} live chains monitored`);
  log("INFO", `✓ ${VALIDATORS.length} validators active`);
  log("INFO", `✓ Revenue split: 30/40/10/18/2`);
  log("INFO", `✓ API: ${API_BASE}`);
  log("INFO", `✓ Guilds: ${client.guilds.cache.size}`);

  // Heartbeat
  setInterval(() => {
    const stats = getChainStats();
    log("HEARTBEAT", `Chains: ${stats.liveChains} | Blocks: ${stats.blockHeight} | Wallets: ${stats.wallets} | Supply: ${stats.totalSupply} QRN | Gas: ${stats.gasRevenue} QRN`);
  }, 120000);

  // Start IPC server for cross-bot communication + mesh routing
  const meshHandlers = meshRouter.getIpcHandlers();
  botIpc.startIpcServer("quranchain", {
    "/create-wallet": async (req, body) => {
      const wallet = getOrCreateWallet(body.discord_id, body.discord_tag);
      onboardingDb.getOrCreateMember(body.discord_id, body.discord_tag);
      return wallet;
    },
    "/wallet": async (req, body, params) => {
      const id = params.get("id") || body.discord_id;
      return stmts.getWallet.get(id) || null;
    },
    "/chain-stats": async () => getChainStats(),
    "/transfer": async (req, body) => {
      return transfer(body.from_id, body.to_id, body.to_username, body.amount, body.memo);
    },
    ...meshHandlers,
  });
  log("INFO", "✓ IPC server started on port 9002");
  meshRouter.start().then(() => log("INFO", `✓ MESH ROUTER ONLINE — ${meshRouter.nodeId}`)).catch(() => {});
});

// Discord Premium entitlement events
client.on("entitlementCreate", e => { discordPremium.handleEntitlementCreate(e); log("INFO", `[PREMIUM] New sub: ${e.userId}`); });
client.on("entitlementUpdate", (o, n) => { discordPremium.handleEntitlementUpdate(o, n); });
client.on("entitlementDelete", e => { discordPremium.handleEntitlementDelete(e); log("INFO", `[PREMIUM] Cancelled: ${e.userId}`); });

// ── Error Handling ────────────────────────────────────────
client.on("error", (err) => log("ERROR", err.message));
process.on("uncaughtException", (err) => log("FATAL", err.stack));
process.on("unhandledRejection", (err) => log("FATAL", `Unhandled: ${err}`));
process.on("SIGINT", () => { log("INFO", "Shutting down..."); client.destroy(); process.exit(0); });
process.on("SIGTERM", () => { log("INFO", "Shutting down..."); client.destroy(); process.exit(0); });

client.login(DISCORD_TOKEN);
