// ==========================================================
// QuranChain™ Blockchain — SQLite Database Layer
// ==========================================================
const Database = require("better-sqlite3");
const { resolve } = require("path");

const DB_PATH = resolve(__dirname, "quranchain.db");
const db = new Database(DB_PATH);

// Enable WAL for better concurrent performance
db.pragma("journal_mode = WAL");

// ── Schema ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS wallets (
    user_id       TEXT PRIMARY KEY,
    username      TEXT NOT NULL,
    balance       REAL NOT NULL DEFAULT 0,
    total_earned  REAL NOT NULL DEFAULT 0,
    total_spent   REAL NOT NULL DEFAULT 0,
    mining_power  INTEGER NOT NULL DEFAULT 1,
    level         INTEGER NOT NULL DEFAULT 1,
    xp            INTEGER NOT NULL DEFAULT 0,
    streak        INTEGER NOT NULL DEFAULT 0,
    last_daily    TEXT,
    last_mine     TEXT,
    last_quiz     TEXT,
    last_scramble TEXT,
    last_treasure TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user     TEXT,
    to_user       TEXT NOT NULL,
    amount        REAL NOT NULL,
    type          TEXT NOT NULL,
    memo          TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blocks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    hash          TEXT NOT NULL,
    prev_hash     TEXT NOT NULL,
    miner         TEXT NOT NULL,
    reward        REAL NOT NULL,
    difficulty    INTEGER NOT NULL DEFAULT 1,
    nonce         INTEGER NOT NULL,
    tx_count      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS game_scores (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       TEXT NOT NULL,
    game          TEXT NOT NULL,
    score         INTEGER NOT NULL DEFAULT 0,
    qrn_earned    REAL NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tx_to ON transactions(to_user);
  CREATE INDEX IF NOT EXISTS idx_tx_from ON transactions(from_user);
  CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at);
  CREATE INDEX IF NOT EXISTS idx_blocks_miner ON blocks(miner);
  CREATE INDEX IF NOT EXISTS idx_scores_user ON game_scores(user_id);
`);

// ── Prepared Statements ───────────────────────────────────
const stmts = {
  getWallet: db.prepare("SELECT * FROM wallets WHERE user_id = ?"),
  createWallet: db.prepare(`
    INSERT INTO wallets (user_id, username, balance) VALUES (?, ?, 100)
  `),
  updateBalance: db.prepare(`
    UPDATE wallets SET balance = balance + ?, total_earned = total_earned + MAX(0, ?),
      total_spent = total_spent + MAX(0, -?), updated_at = datetime('now')
    WHERE user_id = ?
  `),
  updateStreak: db.prepare(`
    UPDATE wallets SET streak = ?, last_daily = datetime('now'), updated_at = datetime('now')
    WHERE user_id = ?
  `),
  updateMining: db.prepare(`
    UPDATE wallets SET last_mine = datetime('now'), updated_at = datetime('now') WHERE user_id = ?
  `),
  updateQuiz: db.prepare(`
    UPDATE wallets SET last_quiz = datetime('now'), updated_at = datetime('now') WHERE user_id = ?
  `),
  updateScramble: db.prepare(`
    UPDATE wallets SET last_scramble = datetime('now'), updated_at = datetime('now') WHERE user_id = ?
  `),
  updateTreasure: db.prepare(`
    UPDATE wallets SET last_treasure = datetime('now'), updated_at = datetime('now') WHERE user_id = ?
  `),
  addXP: db.prepare(`
    UPDATE wallets SET xp = xp + ?, level = MAX(1, (xp + ?) / 500 + 1),
      mining_power = MAX(1, (xp + ?) / 1000 + 1), updated_at = datetime('now')
    WHERE user_id = ?
  `),
  updateUsername: db.prepare(`
    UPDATE wallets SET username = ?, updated_at = datetime('now') WHERE user_id = ?
  `),
  leaderboard: db.prepare(`
    SELECT user_id, username, balance, level, total_earned FROM wallets
    ORDER BY balance DESC LIMIT 10
  `),
  insertTx: db.prepare(`
    INSERT INTO transactions (from_user, to_user, amount, type, memo) VALUES (?, ?, ?, ?, ?)
  `),
  getUserTx: db.prepare(`
    SELECT * FROM transactions WHERE from_user = ? OR to_user = ?
    ORDER BY created_at DESC LIMIT 15
  `),
  insertBlock: db.prepare(`
    INSERT INTO blocks (hash, prev_hash, miner, reward, difficulty, nonce, tx_count) VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  lastBlock: db.prepare("SELECT * FROM blocks ORDER BY id DESC LIMIT 1"),
  blockCount: db.prepare("SELECT COUNT(*) as count FROM blocks"),
  totalSupply: db.prepare("SELECT COALESCE(SUM(balance), 0) as total FROM wallets"),
  walletCount: db.prepare("SELECT COUNT(*) as count FROM wallets"),
  txCount: db.prepare("SELECT COUNT(*) as count FROM transactions"),
  insertScore: db.prepare(`
    INSERT INTO game_scores (user_id, game, score, qrn_earned) VALUES (?, ?, ?, ?)
  `),
  topScores: db.prepare(`
    SELECT user_id, SUM(score) as total_score, SUM(qrn_earned) as total_qrn, COUNT(*) as games_played
    FROM game_scores WHERE game = ? GROUP BY user_id ORDER BY total_score DESC LIMIT 10
  `),
  userStats: db.prepare(`
    SELECT game, SUM(score) as total_score, SUM(qrn_earned) as total_qrn, COUNT(*) as games_played
    FROM game_scores WHERE user_id = ? GROUP BY game
  `),
};

// ── Database API ──────────────────────────────────────────
function getOrCreateWallet(userId, username) {
  let wallet = stmts.getWallet.get(userId);
  if (!wallet) {
    stmts.createWallet.run(userId, username);
    stmts.insertTx.run(null, userId, 100, "welcome_bonus", "Welcome to QuranChain! Here's 100 QRN to get started.");
    wallet = stmts.getWallet.get(userId);
  } else if (wallet.username !== username) {
    stmts.updateUsername.run(username, userId);
    wallet.username = username;
  }
  return wallet;
}

function addBalance(userId, amount, type, memo) {
  stmts.updateBalance.run(amount, amount, amount, userId);
  stmts.insertTx.run(type === "transfer" ? memo : null, userId, amount, type, memo);
  stmts.addXP.run(Math.abs(amount), Math.abs(amount), Math.abs(amount), userId);
}

function transfer(fromId, toId, toUsername, amount, memo) {
  const sender = stmts.getWallet.get(fromId);
  if (!sender) return { success: false, error: "You don't have a wallet. Use `/wallet` first." };
  if (sender.balance < amount) return { success: false, error: `Insufficient balance. You have **${sender.balance.toFixed(2)} QRN**.` };
  if (amount <= 0) return { success: false, error: "Amount must be positive." };
  if (fromId === toId) return { success: false, error: "Can't send to yourself." };

  // Ensure recipient has wallet
  getOrCreateWallet(toId, toUsername);

  const doTransfer = db.transaction(() => {
    stmts.updateBalance.run(-amount, -amount, -amount, fromId);
    stmts.updateBalance.run(amount, amount, amount, toId);
    stmts.insertTx.run(fromId, toId, amount, "transfer", memo || "Transfer");
  });
  doTransfer();
  return { success: true };
}

function canDoAction(wallet, field, cooldownMinutes) {
  if (!wallet[field]) return true;
  const last = new Date(wallet[field] + "Z").getTime();
  const diff = Date.now() - last;
  const remaining = cooldownMinutes * 60 * 1000 - diff;
  if (remaining <= 0) return true;
  return Math.ceil(remaining / 60000); // returns minutes remaining
}

module.exports = {
  db, stmts, getOrCreateWallet, addBalance, transfer, canDoAction,
};
