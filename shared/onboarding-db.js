// ══════════════════════════════════════════════════════════════
// DarCloud Empire — Shared Onboarding Database
// Central member management for ALL bots
// Stores on QuranChain blockchain (SQLite + blockchain records)
// ══════════════════════════════════════════════════════════════
const Database = require("better-sqlite3");
const crypto = require("crypto");
const { resolve } = require("path");

const DB_PATH = resolve(__dirname, "..", "quranchain-bot", "quranchain.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// ── Extended Schema for Member Onboarding ─────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    discord_id      TEXT PRIMARY KEY,
    discord_tag     TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    full_name       TEXT,
    darcloud_email  TEXT,
    meshtalk_id     TEXT,
    fungimesh_node  TEXT,
    wallet_address  TEXT,
    hwc_tier        TEXT DEFAULT 'free',
    stripe_customer TEXT,
    services_json   TEXT DEFAULT '{}',
    onboard_step    INTEGER DEFAULT 0,
    onboard_complete INTEGER DEFAULT 0,
    referral_code   TEXT,
    referred_by     TEXT,
    kyc_verified    INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS member_services (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id      TEXT NOT NULL,
    service_name    TEXT NOT NULL,
    service_type    TEXT NOT NULL,
    status          TEXT DEFAULT 'pending',
    config_json     TEXT DEFAULT '{}',
    provisioned_at  TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (discord_id) REFERENCES members(discord_id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id      TEXT NOT NULL,
    stripe_session  TEXT,
    stripe_payment  TEXT,
    amount          INTEGER NOT NULL,
    currency        TEXT DEFAULT 'usd',
    product         TEXT NOT NULL,
    status          TEXT DEFAULT 'pending',
    metadata_json   TEXT DEFAULT '{}',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (discord_id) REFERENCES members(discord_id)
  );

  CREATE TABLE IF NOT EXISTS onboarding_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id      TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    event_data      TEXT DEFAULT '{}',
    bot_source      TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
  CREATE INDEX IF NOT EXISTS idx_members_referral ON members(referral_code);
  CREATE INDEX IF NOT EXISTS idx_member_services_user ON member_services(discord_id);
  CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(discord_id);
  CREATE INDEX IF NOT EXISTS idx_payments_stripe ON payments(stripe_session);
  CREATE INDEX IF NOT EXISTS idx_onboarding_events_user ON onboarding_events(discord_id);
`);

// ── Prepared Statements ───────────────────────────────────
const stmts = {
  getMember: db.prepare("SELECT * FROM members WHERE discord_id = ?"),
  getMemberByEmail: db.prepare("SELECT * FROM members WHERE email = ?"),
  getMemberByReferral: db.prepare("SELECT * FROM members WHERE referral_code = ?"),
  createMember: db.prepare(`
    INSERT OR IGNORE INTO members (discord_id, discord_tag, referral_code, wallet_address)
    VALUES (?, ?, ?, ?)
  `),
  updateMember: db.prepare(`
    UPDATE members SET discord_tag = ?, updated_at = datetime('now') WHERE discord_id = ?
  `),
  setEmail: db.prepare("UPDATE members SET email = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  setFullName: db.prepare("UPDATE members SET full_name = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  setPhone: db.prepare("UPDATE members SET phone = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  setDarCloudEmail: db.prepare("UPDATE members SET darcloud_email = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  setMeshTalkId: db.prepare("UPDATE members SET meshtalk_id = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  setFungiMeshNode: db.prepare("UPDATE members SET fungimesh_node = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  setStripeCustomer: db.prepare("UPDATE members SET stripe_customer = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  setHwcTier: db.prepare("UPDATE members SET hwc_tier = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  setServices: db.prepare("UPDATE members SET services_json = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  setOnboardStep: db.prepare("UPDATE members SET onboard_step = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  completeOnboarding: db.prepare("UPDATE members SET onboard_complete = 1, onboard_step = 7, updated_at = datetime('now') WHERE discord_id = ?"),
  setReferredBy: db.prepare("UPDATE members SET referred_by = ?, updated_at = datetime('now') WHERE discord_id = ?"),
  setKycVerified: db.prepare("UPDATE members SET kyc_verified = 1, updated_at = datetime('now') WHERE discord_id = ?"),
  memberCount: db.prepare("SELECT COUNT(*) as count FROM members"),
  onboardedCount: db.prepare("SELECT COUNT(*) as count FROM members WHERE onboard_complete = 1"),
  recentMembers: db.prepare("SELECT * FROM members ORDER BY created_at DESC LIMIT ?"),
  // Services
  addService: db.prepare("INSERT INTO member_services (discord_id, service_name, service_type, status, config_json) VALUES (?, ?, ?, ?, ?)"),
  getUserServices: db.prepare("SELECT * FROM member_services WHERE discord_id = ?"),
  updateServiceStatus: db.prepare("UPDATE member_services SET status = ?, provisioned_at = datetime('now') WHERE id = ?"),
  // Payments
  addPayment: db.prepare("INSERT INTO payments (discord_id, stripe_session, amount, currency, product, status, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?)"),
  getPayment: db.prepare("SELECT * FROM payments WHERE stripe_session = ?"),
  getUserPayments: db.prepare("SELECT * FROM payments WHERE discord_id = ? ORDER BY created_at DESC LIMIT 20"),
  updatePaymentStatus: db.prepare("UPDATE payments SET status = ?, stripe_payment = ? WHERE stripe_session = ?"),
  totalRevenue: db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'"),
  // Events
  logEvent: db.prepare("INSERT INTO onboarding_events (discord_id, event_type, event_data, bot_source) VALUES (?, ?, ?, ?)"),
  getUserEvents: db.prepare("SELECT * FROM onboarding_events WHERE discord_id = ? ORDER BY created_at DESC LIMIT 30"),
};

// ── Member API ────────────────────────────────────────────
function generateReferralCode(discordId) {
  return "DAR-" + crypto.createHash("sha256").update(discordId + Date.now()).digest("hex").slice(0, 8).toUpperCase();
}

function generateWalletAddress(discordId) {
  return "0xDAR" + crypto.createHash("sha256").update("wallet:" + discordId).digest("hex").slice(0, 36);
}

function getOrCreateMember(discordId, discordTag) {
  let member = stmts.getMember.get(discordId);
  if (!member) {
    const referralCode = generateReferralCode(discordId);
    const walletAddress = generateWalletAddress(discordId);
    stmts.createMember.run(discordId, discordTag, referralCode, walletAddress);
    stmts.logEvent.run(discordId, "member_created", JSON.stringify({ tag: discordTag }), "system");
    member = stmts.getMember.get(discordId);
  } else if (member.discord_tag !== discordTag) {
    stmts.updateMember.run(discordTag, discordId);
    member.discord_tag = discordTag;
  }
  return member;
}

function provisionService(discordId, serviceName, serviceType, config = {}) {
  stmts.addService.run(discordId, serviceName, serviceType, "provisioned", JSON.stringify(config));
  stmts.logEvent.run(discordId, "service_provisioned", JSON.stringify({ service: serviceName, type: serviceType }), serviceType);

  // Update member services JSON
  const member = stmts.getMember.get(discordId);
  const services = JSON.parse(member.services_json || "{}");
  services[serviceType] = { name: serviceName, status: "active", provisioned: new Date().toISOString() };
  stmts.setServices.run(JSON.stringify(services), discordId);
}

function recordPayment(discordId, sessionId, amount, product, metadata = {}) {
  stmts.addPayment.run(discordId, sessionId, amount, "usd", product, "pending", JSON.stringify(metadata));
  stmts.logEvent.run(discordId, "payment_created", JSON.stringify({ amount, product }), "darpay");
}

function confirmPayment(sessionId, paymentId) {
  stmts.updatePaymentStatus.run("paid", paymentId, sessionId);
  const payment = stmts.getPayment.get(sessionId);
  if (payment) {
    stmts.logEvent.run(payment.discord_id, "payment_confirmed", JSON.stringify({ amount: payment.amount, product: payment.product }), "darpay");
  }
  return payment;
}

function getMemberDashboard(discordId) {
  const member = stmts.getMember.get(discordId);
  if (!member) return null;
  const services = stmts.getUserServices.all(discordId);
  const payments = stmts.getUserPayments.all(discordId);
  const events = stmts.getUserEvents.all(discordId);
  return { member, services, payments, events };
}

module.exports = {
  db, stmts,
  getOrCreateMember,
  provisionService,
  recordPayment,
  confirmPayment,
  getMemberDashboard,
  generateReferralCode,
  generateWalletAddress,
};
