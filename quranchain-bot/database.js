// ==========================================================
// QuranChain™ Blockchain Bot — SQLite Database
// Uses REAL ecosystem data: 47 chains, 101 companies,
// real revenue model, real validators
// ==========================================================
const Database = require("better-sqlite3");
const { resolve } = require("path");

const DB_PATH = resolve(__dirname, "quranchain.db");
const db = new Database(DB_PATH);
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
    validator_name TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_hash       TEXT NOT NULL,
    from_user     TEXT,
    to_user       TEXT NOT NULL,
    amount        REAL NOT NULL,
    type          TEXT NOT NULL,
    chain         TEXT NOT NULL DEFAULT 'QuranChain',
    memo          TEXT,
    block_number  INTEGER,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blocks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    block_number  INTEGER NOT NULL,
    hash          TEXT NOT NULL,
    prev_hash     TEXT NOT NULL,
    miner         TEXT NOT NULL,
    validator     TEXT NOT NULL DEFAULT 'Omar AI™',
    reward        REAL NOT NULL,
    gas_collected REAL NOT NULL DEFAULT 0,
    difficulty    INTEGER NOT NULL DEFAULT 1,
    nonce         INTEGER NOT NULL,
    tx_count      INTEGER NOT NULL DEFAULT 0,
    chain         TEXT NOT NULL DEFAULT 'QuranChain',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gas_tolls (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    chain         TEXT NOT NULL,
    amount        REAL NOT NULL,
    founder_share REAL NOT NULL,
    validator_share REAL NOT NULL,
    hardware_share REAL NOT NULL,
    ecosystem_share REAL NOT NULL,
    zakat_share   REAL NOT NULL,
    block_number  INTEGER,
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

  CREATE TABLE IF NOT EXISTS usd_balances (
    user_id       TEXT PRIMARY KEY,
    balance       REAL NOT NULL DEFAULT 0,
    total_bought  REAL NOT NULL DEFAULT 0,
    total_sold    REAL NOT NULL DEFAULT 0,
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trades (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_hash       TEXT NOT NULL,
    user_id       TEXT NOT NULL,
    direction     TEXT NOT NULL,
    qrn_amount    REAL NOT NULL,
    usd_amount    REAL NOT NULL,
    rate          REAL NOT NULL,
    fee_qrn       REAL NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
  CREATE INDEX IF NOT EXISTS idx_tx_hash ON transactions(tx_hash);
  CREATE INDEX IF NOT EXISTS idx_tx_to ON transactions(to_user);
  CREATE INDEX IF NOT EXISTS idx_tx_from ON transactions(from_user);
  CREATE INDEX IF NOT EXISTS idx_blocks_chain ON blocks(chain);
  CREATE INDEX IF NOT EXISTS idx_gas_chain ON gas_tolls(chain);
  CREATE INDEX IF NOT EXISTS idx_scores_user ON game_scores(user_id);
`);

// ── Migrations: add columns that may be missing from older DBs ──
try {
  const cols = db.prepare("PRAGMA table_info(trades)").all().map(c => c.name);
  if (!cols.includes("usd_amount")) db.exec("ALTER TABLE trades ADD COLUMN usd_amount REAL NOT NULL DEFAULT 0");
  if (!cols.includes("rate")) db.exec("ALTER TABLE trades ADD COLUMN rate REAL NOT NULL DEFAULT 0");
  if (!cols.includes("fee_qrn")) db.exec("ALTER TABLE trades ADD COLUMN fee_qrn REAL NOT NULL DEFAULT 0");
} catch (e) { /* table doesn't exist yet — schema above will create it */ }

// ── Prepared Statements ───────────────────────────────────
const stmts = {
  getWallet: db.prepare("SELECT * FROM wallets WHERE user_id = ?"),
  createWallet: db.prepare("INSERT INTO wallets (user_id, username, balance) VALUES (?, ?, 100)"),
  updateBalance: db.prepare(`
    UPDATE wallets SET balance = balance + ?, total_earned = total_earned + MAX(0, ?),
      total_spent = total_spent + MAX(0, -?), updated_at = datetime('now')
    WHERE user_id = ?
  `),
  updateStreak: db.prepare("UPDATE wallets SET streak = ?, last_daily = datetime('now'), updated_at = datetime('now') WHERE user_id = ?"),
  updateField: db.prepare("UPDATE wallets SET updated_at = datetime('now') WHERE user_id = ?"),
  setLastMine: db.prepare("UPDATE wallets SET last_mine = datetime('now'), updated_at = datetime('now') WHERE user_id = ?"),
  setLastQuiz: db.prepare("UPDATE wallets SET last_quiz = datetime('now'), updated_at = datetime('now') WHERE user_id = ?"),
  setLastScramble: db.prepare("UPDATE wallets SET last_scramble = datetime('now'), updated_at = datetime('now') WHERE user_id = ?"),
  setLastTreasure: db.prepare("UPDATE wallets SET last_treasure = datetime('now'), updated_at = datetime('now') WHERE user_id = ?"),
  addXP: db.prepare("UPDATE wallets SET xp = xp + ?, level = MAX(1, (xp + ?) / 500 + 1), mining_power = MAX(1, (xp + ?) / 1000 + 1), updated_at = datetime('now') WHERE user_id = ?"),
  updateUsername: db.prepare("UPDATE wallets SET username = ?, updated_at = datetime('now') WHERE user_id = ?"),
  setValidator: db.prepare("UPDATE wallets SET validator_name = ?, updated_at = datetime('now') WHERE user_id = ?"),
  leaderboard: db.prepare("SELECT user_id, username, balance, level, total_earned, validator_name FROM wallets ORDER BY balance DESC LIMIT 10"),
  insertTx: db.prepare("INSERT INTO transactions (tx_hash, from_user, to_user, amount, type, chain, memo, block_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
  getUserTx: db.prepare("SELECT * FROM transactions WHERE from_user = ? OR to_user = ? ORDER BY created_at DESC LIMIT 15"),
  insertBlock: db.prepare("INSERT INTO blocks (block_number, hash, prev_hash, miner, validator, reward, gas_collected, difficulty, nonce, tx_count, chain) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"),
  lastBlock: db.prepare("SELECT * FROM blocks ORDER BY id DESC LIMIT 1"),
  lastBlockOnChain: db.prepare("SELECT * FROM blocks WHERE chain = ? ORDER BY id DESC LIMIT 1"),
  blockCount: db.prepare("SELECT COUNT(*) as count FROM blocks"),
  blockCountOnChain: db.prepare("SELECT COUNT(*) as count FROM blocks WHERE chain = ?"),
  totalSupply: db.prepare("SELECT COALESCE(SUM(balance), 0) as total FROM wallets"),
  walletCount: db.prepare("SELECT COUNT(*) as count FROM wallets"),
  txCount: db.prepare("SELECT COUNT(*) as count FROM transactions"),
  insertGasToll: db.prepare("INSERT INTO gas_tolls (chain, amount, founder_share, validator_share, hardware_share, ecosystem_share, zakat_share, block_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
  totalGasRevenue: db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM gas_tolls"),
  gasRevenueByChain: db.prepare("SELECT chain, SUM(amount) as total, COUNT(*) as collections FROM gas_tolls GROUP BY chain ORDER BY total DESC LIMIT 10"),
  totalZakat: db.prepare("SELECT COALESCE(SUM(zakat_share), 0) as total FROM gas_tolls"),
  insertScore: db.prepare("INSERT INTO game_scores (user_id, game, score, qrn_earned) VALUES (?, ?, ?, ?)"),
  topScores: db.prepare("SELECT user_id, SUM(score) as total_score, SUM(qrn_earned) as total_qrn, COUNT(*) as games_played FROM game_scores WHERE game = ? GROUP BY user_id ORDER BY total_score DESC LIMIT 10"),
  userStats: db.prepare("SELECT game, SUM(score) as total_score, SUM(qrn_earned) as total_qrn, COUNT(*) as games_played FROM game_scores WHERE user_id = ? GROUP BY game"),

  // ── USD Trading ──
  getUsdBalance: db.prepare("SELECT * FROM usd_balances WHERE user_id = ?"),
  createUsdBalance: db.prepare("INSERT OR IGNORE INTO usd_balances (user_id, balance) VALUES (?, 0)"),
  updateUsd: db.prepare("UPDATE usd_balances SET balance = balance + ?, total_bought = total_bought + MAX(0, ?), total_sold = total_sold + MAX(0, -?), updated_at = datetime('now') WHERE user_id = ?"),
  insertTrade: db.prepare("INSERT INTO trades (tx_hash, user_id, direction, qrn_amount, usd_amount, rate, fee_qrn) VALUES (?, ?, ?, ?, ?, ?, ?)"),
  getUserTrades: db.prepare("SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT 15"),
};

// ── Database API ──────────────────────────────────────────
function getOrCreateWallet(userId, username) {
  let wallet = stmts.getWallet.get(userId);
  if (!wallet) {
    stmts.createWallet.run(userId, username);
    const txHash = generateTxHash();
    stmts.insertTx.run(txHash, null, userId, 100, "welcome_bonus", "QuranChain", "Welcome! 100 QRN from the QuranChain Foundation.", null);
    wallet = stmts.getWallet.get(userId);
  } else if (wallet.username !== username) {
    stmts.updateUsername.run(username, userId);
    wallet.username = username;
  }
  return wallet;
}

function addBalance(userId, amount, type, memo, chain = "QuranChain") {
  stmts.updateBalance.run(amount, amount, amount, userId);
  const txHash = generateTxHash();
  const lastBlock = stmts.lastBlock.get();
  stmts.insertTx.run(txHash, type === "transfer" ? memo : "QuranChain-Foundation", userId, amount, type, chain, memo, lastBlock?.block_number || 0);
  stmts.addXP.run(Math.abs(amount), Math.abs(amount), Math.abs(amount), userId);
  return txHash;
}

function transfer(fromId, toId, toUsername, amount, memo) {
  const sender = stmts.getWallet.get(fromId);
  if (!sender) return { success: false, error: "You don't have a wallet. Use `/wallet` first." };
  if (sender.balance < amount) return { success: false, error: `Insufficient balance. You have **${sender.balance.toFixed(2)} QRN**.` };
  if (amount <= 0) return { success: false, error: "Amount must be positive." };
  if (fromId === toId) return { success: false, error: "Can't send to yourself." };

  getOrCreateWallet(toId, toUsername);

  const txHash = generateTxHash();
  const lastBlock = stmts.lastBlock.get();
  const doTransfer = db.transaction(() => {
    stmts.updateBalance.run(-amount, -amount, -amount, fromId);
    stmts.updateBalance.run(amount, amount, amount, toId);
    stmts.insertTx.run(txHash, fromId, toId, amount, "transfer", "QuranChain", memo || "P2P Transfer", lastBlock?.block_number || 0);
  });
  doTransfer();
  return { success: true, txHash };
}

// QRN/USD exchange rate and fee
const QRN_TO_USD_RATE = 0.47; // 1 QRN = $0.47 USD
const TRADE_FEE_PERCENT = 0.003; // 0.3% fee

function tradeQrnForUsd(userId, username, qrnAmount) {
  if (qrnAmount <= 0) return { success: false, error: "Amount must be positive." };
  const wallet = getOrCreateWallet(userId, username);
  if (wallet.balance < qrnAmount) return { success: false, error: `Insufficient QRN balance. You have **${wallet.balance.toFixed(2)} QRN**.` };

  const feeQrn = qrnAmount * TRADE_FEE_PERCENT;
  const netQrn = qrnAmount - feeQrn;
  const usdAmount = netQrn * QRN_TO_USD_RATE;
  const txHash = generateTxHash();

  const doTrade = db.transaction(() => {
    stmts.updateBalance.run(-qrnAmount, -qrnAmount, -qrnAmount, userId);
    stmts.createUsdBalance.run(userId);
    stmts.updateUsd.run(usdAmount, usdAmount, usdAmount, userId);
    stmts.insertTrade.run(txHash, userId, "QRN_TO_USD", qrnAmount, usdAmount, QRN_TO_USD_RATE, feeQrn);
    stmts.insertTx.run(txHash, userId, "QuranChain-DEX", qrnAmount, "trade_sell", "QuranChain", `Sold ${qrnAmount.toFixed(2)} QRN → $${usdAmount.toFixed(2)} USD`, null);
  });
  doTrade();

  return { success: true, txHash, qrnAmount, usdAmount, feeQrn, rate: QRN_TO_USD_RATE };
}

function tradeUsdForQrn(userId, username, usdAmount) {
  if (usdAmount <= 0) return { success: false, error: "Amount must be positive." };
  getOrCreateWallet(userId, username);
  stmts.createUsdBalance.run(userId);
  const usdBal = stmts.getUsdBalance.get(userId);
  if (!usdBal || usdBal.balance < usdAmount) return { success: false, error: `Insufficient USD balance. You have **$${(usdBal?.balance || 0).toFixed(2)} USD**.` };

  const qrnAmount = usdAmount / QRN_TO_USD_RATE;
  const feeQrn = qrnAmount * TRADE_FEE_PERCENT;
  const netQrn = qrnAmount - feeQrn;
  const txHash = generateTxHash();

  const doTrade = db.transaction(() => {
    stmts.updateUsd.run(-usdAmount, -usdAmount, -usdAmount, userId);
    stmts.updateBalance.run(netQrn, netQrn, netQrn, userId);
    stmts.insertTrade.run(txHash, userId, "USD_TO_QRN", netQrn, usdAmount, QRN_TO_USD_RATE, feeQrn);
    stmts.insertTx.run(txHash, "QuranChain-DEX", userId, netQrn, "trade_buy", "QuranChain", `Bought ${netQrn.toFixed(2)} QRN ← $${usdAmount.toFixed(2)} USD`, null);
  });
  doTrade();

  return { success: true, txHash, qrnAmount: netQrn, usdAmount, feeQrn, rate: QRN_TO_USD_RATE };
}

function getUsdBalance(userId) {
  stmts.createUsdBalance.run(userId);
  return stmts.getUsdBalance.get(userId);
}

function canDoAction(wallet, field, cooldownMinutes) {

  if (!wallet[field]) return true;
  const last = new Date(wallet[field] + "Z").getTime();
  const remaining = cooldownMinutes * 60 * 1000 - (Date.now() - last);
  if (remaining <= 0) return true;
  return Math.ceil(remaining / 60000);
}

function generateTxHash() {
  const crypto = require("crypto");
  return "0x" + crypto.randomBytes(32).toString("hex");
}

module.exports = { db, stmts, getOrCreateWallet, addBalance, transfer, canDoAction, generateTxHash, tradeQrnForUsd, tradeUsdForQrn, getUsdBalance, QRN_TO_USD_RATE, TRADE_FEE_PERCENT };
