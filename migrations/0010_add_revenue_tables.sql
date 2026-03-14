-- Revenue Ledger — tracks every payment split (immutable audit trail)
CREATE TABLE IF NOT EXISTS revenue_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id TEXT NOT NULL,
  stripe_session_id TEXT,
  discord_id TEXT,
  product TEXT NOT NULL,
  gross_amount INTEGER NOT NULL DEFAULT 0,
  founder_amount INTEGER NOT NULL DEFAULT 0,
  validators_amount INTEGER NOT NULL DEFAULT 0,
  hardware_amount INTEGER NOT NULL DEFAULT 0,
  ecosystem_amount INTEGER NOT NULL DEFAULT 0,
  zakat_amount INTEGER NOT NULL DEFAULT 0,
  discord_cut INTEGER NOT NULL DEFAULT 0,
  net_amount INTEGER NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'stripe',
  status TEXT DEFAULT 'pending',
  period TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Treasury Accounts — tracks running balances for each split recipient
CREATE TABLE IF NOT EXISTS treasury_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_type TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  total_received_cents INTEGER NOT NULL DEFAULT 0,
  total_withdrawn_cents INTEGER NOT NULL DEFAULT 0,
  bank_account TEXT,
  wallet_address TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed treasury accounts
INSERT OR IGNORE INTO treasury_accounts (account_type, label) VALUES
  ('founder',    'DarCloud Holdings — Founder (30%)'),
  ('validators', 'AI Validator Pool (40%)'),
  ('hardware',   'Hardware Host Fund (10%)'),
  ('ecosystem',  'Ecosystem Development Fund (18%)'),
  ('zakat',      'Zakat Distribution Fund (2%)');

-- Zakat Distributions — tracks Islamic charity payouts
CREATE TABLE IF NOT EXISTS zakat_distributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount_cents INTEGER NOT NULL,
  recipient_category TEXT NOT NULL,
  recipient_name TEXT,
  method TEXT DEFAULT 'pending',
  reference TEXT,
  period TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Payout History — tracks actual bank/crypto withdrawals
CREATE TABLE IF NOT EXISTS payout_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  method TEXT NOT NULL DEFAULT 'bank_transfer',
  destination TEXT,
  reference TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Subscription Tracking — active subscriptions by user
CREATE TABLE IF NOT EXISTS active_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id TEXT,
  user_id INTEGER,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  product TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  interval TEXT DEFAULT 'month',
  status TEXT DEFAULT 'active',
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
