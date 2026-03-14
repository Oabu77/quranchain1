// ==========================================================
// QuranChain™ — Games Engine — Earn QRN Through Knowledge
// ==========================================================
const { getOrCreateWallet, addBalance, canDoAction, stmts } = require("./database");

// ── Quran Quiz Questions ──────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: "How many Surahs are in the Quran?", choices: ["112", "114", "120", "110"], answer: 1 },
  { q: "Which is the longest Surah in the Quran?", choices: ["Al-Imran", "An-Nisa", "Al-Baqarah", "Al-Ma'idah"], answer: 2 },
  { q: "Which is the shortest Surah in the Quran?", choices: ["Al-Asr", "Al-Kawthar", "Al-Ikhlas", "An-Nas"], answer: 1 },
  { q: "How many Juz (parts) is the Quran divided into?", choices: ["25", "28", "30", "32"], answer: 2 },
  { q: "In which month was the Quran revealed?", choices: ["Shaban", "Rajab", "Ramadan", "Muharram"], answer: 2 },
  { q: "Which Surah is known as the 'Heart of the Quran'?", choices: ["Al-Fatiha", "Ya-Sin", "Ar-Rahman", "Al-Mulk"], answer: 1 },
  { q: "How many times is the word 'Bismillah' mentioned in the Quran?", choices: ["112", "113", "114", "115"], answer: 2 },
  { q: "Which Prophet is mentioned most in the Quran?", choices: ["Ibrahim", "Isa", "Nuh", "Musa"], answer: 3 },
  { q: "Surah Al-Fatiha is also known as?", choices: ["The Cow", "The Opening", "The Light", "The Star"], answer: 1 },
  { q: "Which Surah does not begin with Bismillah?", choices: ["Al-Fatiha", "At-Tawbah", "Al-Baqarah", "Al-Ikhlas"], answer: 1 },
  { q: "How many verses (ayat) are in the Quran approximately?", choices: ["5,000", "6,236", "7,000", "6,666"], answer: 1 },
  { q: "Which angel revealed the Quran to Prophet Muhammad ﷺ?", choices: ["Mikail", "Israfil", "Jibril", "Azrael"], answer: 2 },
  { q: "The first word revealed in the Quran was?", choices: ["Alhamdulillah", "Bismillah", "Iqra", "Subhanallah"], answer: 2 },
  { q: "Which Surah is called 'The Mother of the Quran'?", choices: ["Al-Fatiha", "Al-Baqarah", "Ya-Sin", "Al-Ikhlas"], answer: 0 },
  { q: "In which city was the Quran first revealed?", choices: ["Madinah", "Jerusalem", "Makkah", "Taif"], answer: 2 },
  { q: "Surah Ar-Rahman is known as?", choices: ["The King", "The Most Merciful", "The Truth", "The Light"], answer: 1 },
  { q: "How many Surahs were revealed in Makkah?", choices: ["76", "86", "90", "100"], answer: 1 },
  { q: "Which Surah mentions the story of Yusuf (Joseph)?", choices: ["Surah 10", "Surah 11", "Surah 12", "Surah 13"], answer: 2 },
  { q: "The Cave (Al-Kahf) is Surah number?", choices: ["16", "17", "18", "19"], answer: 2 },
  { q: "Which Surah is recommended to recite on Fridays?", choices: ["Ya-Sin", "Al-Kahf", "Al-Mulk", "Ar-Rahman"], answer: 1 },
  { q: "How many Prophets are mentioned by name in the Quran?", choices: ["20", "25", "30", "35"], answer: 1 },
  { q: "Which Surah mentions Ayat al-Kursi (Verse of the Throne)?", choices: ["Al-Imran", "Al-Baqarah", "An-Nisa", "Al-Ma'idah"], answer: 1 },
  { q: "The Quran was revealed over a period of how many years?", choices: ["10", "15", "20", "23"], answer: 3 },
  { q: "Which animal spoke to Prophet Sulayman in the Quran?", choices: ["Horse", "Ant", "Eagle", "Cat"], answer: 1 },
  { q: "Surah Al-Mulk protects from punishment in the?", choices: ["Fire", "Grave", "Hereafter", "Dunya"], answer: 1 },
  { q: "Which companion compiled the Quran into a single book?", choices: ["Umar", "Uthman", "Abu Bakr", "Ali"], answer: 2 },
  { q: "The word 'Quran' literally means?", choices: ["The Book", "The Recitation", "The Guidance", "The Truth"], answer: 1 },
  { q: "Surah Al-Ikhlas is equivalent to what fraction of the Quran?", choices: ["1/4", "1/3", "1/2", "2/3"], answer: 1 },
  { q: "Which Surah was the first to be revealed completely?", choices: ["Al-Fatiha", "Al-Alaq", "Al-Muddathir", "Al-Muzzammil"], answer: 0 },
  { q: "Paradise (Jannah) is described with how many levels in Islamic tradition?", choices: ["7", "8", "10", "100"], answer: 1 },
];

// ── Word Scramble Words ───────────────────────────────────
const SCRAMBLE_WORDS = [
  { word: "QURAN", hint: "The Holy Book of Islam" },
  { word: "SALAH", hint: "The five daily prayers" },
  { word: "ZAKAH", hint: "Obligatory charity in Islam" },
  { word: "SAWM", hint: "Fasting during Ramadan" },
  { word: "HAJJ", hint: "Pilgrimage to Makkah" },
  { word: "IMAN", hint: "Faith and belief" },
  { word: "TAQWA", hint: "God-consciousness and piety" },
  { word: "SUNNAH", hint: "Practices and traditions of the Prophet ﷺ" },
  { word: "HADITH", hint: "Sayings of the Prophet ﷺ" },
  { word: "MASJID", hint: "Place of prayer (mosque)" },
  { word: "JANNAH", hint: "Paradise" },
  { word: "SURAH", hint: "A chapter of the Quran" },
  { word: "AYAH", hint: "A verse of the Quran" },
  { word: "WUDU", hint: "Ablution before prayer" },
  { word: "SADAQAH", hint: "Voluntary charity" },
  { word: "SHUKR", hint: "Gratitude and thankfulness" },
  { word: "SABR", hint: "Patience and perseverance" },
  { word: "RIZQ", hint: "Provision from Allah" },
  { word: "UMMAH", hint: "The Muslim community worldwide" },
  { word: "KHALIFAH", hint: "Successor or steward" },
  { word: "MAKKAH", hint: "Holiest city in Islam" },
  { word: "MADINAH", hint: "City of the Prophet ﷺ" },
  { word: "RAMADAN", hint: "Month of fasting" },
  { word: "SHAHADA", hint: "Declaration of faith" },
  { word: "BARAKAH", hint: "Divine blessing" },
  { word: "TAWHID", hint: "Oneness of Allah" },
  { word: "DHIKR", hint: "Remembrance of Allah" },
  { word: "ISTIGHFAR", hint: "Seeking forgiveness from Allah" },
  { word: "HIDAYAH", hint: "Guidance from Allah" },
  { word: "NIYYAH", hint: "Intention before worship" },
];

// ── Treasure Rewards ──────────────────────────────────────
const TREASURES = [
  { name: "📜 Ancient Scroll", qrn: 5, rarity: "Common", chance: 0.30 },
  { name: "🪙 Bronze Coin", qrn: 10, rarity: "Common", chance: 0.25 },
  { name: "💎 Silver Gem", qrn: 25, rarity: "Uncommon", chance: 0.18 },
  { name: "🏺 Golden Vessel", qrn: 50, rarity: "Rare", chance: 0.12 },
  { name: "📿 Sacred Beads", qrn: 75, rarity: "Rare", chance: 0.07 },
  { name: "🌙 Crescent Amulet", qrn: 100, rarity: "Epic", chance: 0.04 },
  { name: "⭐ Star of Knowledge", qrn: 200, rarity: "Epic", chance: 0.025 },
  { name: "🕋 Key of Wisdom", qrn: 500, rarity: "Legendary", chance: 0.01 },
  { name: "💫 Divine Light", qrn: 1000, rarity: "Mythic", chance: 0.005 },
];

// ── Scramble Helper ───────────────────────────────────────
function scrambleWord(word) {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Make sure it's actually scrambled
  if (arr.join("") === word && word.length > 1) {
    [arr[0], arr[arr.length - 1]] = [arr[arr.length - 1], arr[0]];
  }
  return arr.join("");
}

// Active games state (in-memory, per-user)
const activeQuizzes = new Map();      // userId -> { question, answer, startTime }
const activeScrambles = new Map();    // userId -> { word, scrambled, hint, startTime }

// ── Game Functions ────────────────────────────────────────

function startQuiz(userId, username) {
  const wallet = getOrCreateWallet(userId, username);
  const cooldown = canDoAction(wallet, "last_quiz", 5); // 5 min cooldown
  if (typeof cooldown === "number") {
    return { error: `Quiz on cooldown. Try again in **${cooldown} minutes**.` };
  }

  const q = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
  activeQuizzes.set(userId, {
    question: q.q,
    choices: q.choices,
    answer: q.answer,
    startTime: Date.now(),
  });

  return {
    question: q.q,
    choices: q.choices,
  };
}

function answerQuiz(userId, choiceIndex) {
  const quiz = activeQuizzes.get(userId);
  if (!quiz) return { error: "No active quiz. Start one with `/quiz`." };

  activeQuizzes.delete(userId);
  const elapsed = (Date.now() - quiz.startTime) / 1000;
  const correct = choiceIndex === quiz.answer;

  let qrnEarned = 0;
  let bonusText = "";

  if (correct) {
    // Base reward: 20 QRN, speed bonus if < 10 seconds
    qrnEarned = 20;
    if (elapsed < 5) { qrnEarned += 30; bonusText = " ⚡ Speed Bonus: +30"; }
    else if (elapsed < 10) { qrnEarned += 15; bonusText = " 🏃 Quick Bonus: +15"; }
    else if (elapsed < 20) { qrnEarned += 5; bonusText = " ✨ Bonus: +5"; }

    addBalance(userId, qrnEarned, "quiz_reward", `Quiz correct — earned ${qrnEarned} QRN`);
    stmts.setLastQuiz.run(userId);
    stmts.insertScore.run(userId, "quiz", 1, qrnEarned);
  } else {
    stmts.setLastQuiz.run(userId);
    stmts.insertScore.run(userId, "quiz", 0, 0);
  }

  return {
    correct,
    answer: quiz.choices[quiz.answer],
    qrnEarned,
    bonusText,
    elapsed: elapsed.toFixed(1),
  };
}

function startScramble(userId, username) {
  const wallet = getOrCreateWallet(userId, username);
  const cooldown = canDoAction(wallet, "last_scramble", 3); // 3 min cooldown
  if (typeof cooldown === "number") {
    return { error: `Scramble on cooldown. Try again in **${cooldown} minutes**.` };
  }

  const item = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
  const scrambled = scrambleWord(item.word);
  activeScrambles.set(userId, {
    word: item.word,
    scrambled,
    hint: item.hint,
    startTime: Date.now(),
  });

  return { scrambled, hint: item.hint, letters: item.word.length };
}

function answerScramble(userId, guess) {
  const game = activeScrambles.get(userId);
  if (!game) return { error: "No active scramble. Start one with `/scramble`." };

  const correct = guess.toUpperCase().trim() === game.word;

  if (correct) {
    activeScrambles.delete(userId);
    const elapsed = (Date.now() - game.startTime) / 1000;
    let qrnEarned = 25;
    let bonusText = "";

    if (elapsed < 5) { qrnEarned += 25; bonusText = " ⚡ Lightning: +25"; }
    else if (elapsed < 10) { qrnEarned += 10; bonusText = " 🏃 Quick: +10"; }

    addBalance(userId, qrnEarned, "scramble_reward", `Word scramble — earned ${qrnEarned} QRN`);
    stmts.setLastScramble.run(userId);
    stmts.insertScore.run(userId, "scramble", 1, qrnEarned);

    return { correct: true, word: game.word, qrnEarned, bonusText, elapsed: elapsed.toFixed(1) };
  }

  return { correct: false, hint: game.hint };
}

function claimDaily(userId, username) {
  const wallet = getOrCreateWallet(userId, username);
  const cooldown = canDoAction(wallet, "last_daily", 1440); // 24 hours
  if (typeof cooldown === "number") {
    const hours = Math.floor(cooldown / 60);
    const mins = cooldown % 60;
    return { error: `Already claimed today. Next claim in **${hours}h ${mins}m**.` };
  }

  // Check streak — if last daily was within 48 hours, continue streak
  let newStreak = 1;
  if (wallet.last_daily) {
    const lastDaily = new Date(wallet.last_daily + "Z").getTime();
    const hoursSince = (Date.now() - lastDaily) / (1000 * 60 * 60);
    if (hoursSince < 48) {
      newStreak = wallet.streak + 1;
    }
  }

  // Base: 100 QRN + streak bonus (10 QRN per streak day, max 7x)
  const streakMultiplier = Math.min(newStreak, 7);
  const baseReward = 100;
  const streakBonus = streakMultiplier * 10;
  const totalReward = baseReward + streakBonus;

  stmts.updateStreak.run(newStreak, userId);
  addBalance(userId, totalReward, "daily_reward", `Daily reward — streak ${newStreak} — ${totalReward} QRN`);
  stmts.insertScore.run(userId, "daily", 1, totalReward);

  return {
    reward: totalReward,
    baseReward,
    streakBonus,
    streak: newStreak,
    streakMultiplier,
  };
}

function openTreasure(userId, username) {
  const wallet = getOrCreateWallet(userId, username);
  const cooldown = canDoAction(wallet, "last_treasure", 30); // 30 min cooldown
  if (typeof cooldown === "number") {
    return { error: `Treasure hunt on cooldown. Try again in **${cooldown} minutes**.` };
  }

  stmts.setLastTreasure.run(userId);

  // Roll for treasure
  const roll = Math.random();
  let cumulative = 0;
  let found = TREASURES[0]; // fallback

  for (const t of TREASURES) {
    cumulative += t.chance;
    if (roll <= cumulative) { found = t; break; }
  }

  // 15% chance of finding nothing
  if (Math.random() < 0.15) {
    stmts.insertScore.run(userId, "treasure", 0, 0);
    return { found: false };
  }

  addBalance(userId, found.qrn, "treasure_reward", `Found ${found.name} — ${found.qrn} QRN`);
  stmts.insertScore.run(userId, "treasure", 1, found.qrn);

  return { found: true, treasure: found };
}

function getGameStats(userId) {
  return stmts.userStats.all(userId);
}

function getGameLeaderboard(game) {
  return stmts.topScores.all(game);
}

module.exports = {
  startQuiz, answerQuiz,
  startScramble, answerScramble,
  claimDaily, openTreasure,
  getGameStats, getGameLeaderboard,
  activeQuizzes, activeScrambles,
};
