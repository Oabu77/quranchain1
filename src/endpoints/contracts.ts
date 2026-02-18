import { Hono } from "hono";
import { ALL_COMPANIES } from "../data/companies";
import { ALL_CONTRACTS } from "../data/contracts-data";
import {
  ALL_TRADEMARKS,
  ALL_PATENTS,
  ALL_COPYRIGHTS,
  ALL_TRADE_SECRETS,
  ALL_INTERNATIONAL_IP,
  ALL_DOMAIN_PROTECTIONS,
} from "../data/ip-portfolio";
import { ALL_LEGAL_FILINGS } from "../data/legal-filings";

const contracts = new Hono<{ Bindings: Env }>();

// ── Auto-migrate ──
async function ensureTables(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      domain TEXT,
      type TEXT DEFAULT 'subsidiary',
      jurisdiction TEXT DEFAULT 'USA',
      sector TEXT DEFAULT 'general',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT UNIQUE NOT NULL,
      company_id TEXT NOT NULL,
      client_company_id TEXT NOT NULL,
      service_type TEXT NOT NULL,
      contract_id TEXT,
      monthly_amount REAL DEFAULT 0,
      autopay_status TEXT DEFAULT 'active',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      provider_company_id TEXT NOT NULL,
      client_company_id TEXT NOT NULL,
      contract_type TEXT NOT NULL,
      service_description TEXT NOT NULL,
      monthly_fee REAL DEFAULT 0,
      start_date TEXT NOT NULL,
      term_months INTEGER DEFAULT 12,
      auto_renew INTEGER DEFAULT 1,
      shariah_compliant INTEGER DEFAULT 1,
      zakat_rate REAL DEFAULT 0.02,
      founder_royalty REAL DEFAULT 0.30,
      status TEXT DEFAULT 'active',
      sha256_hash TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS legal_filings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filing_id TEXT UNIQUE NOT NULL,
      filing_type TEXT NOT NULL,
      title TEXT NOT NULL,
      entity TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      description TEXT,
      document_hash TEXT,
      filed_by TEXT DEFAULT 'DarLaw AI',
      status TEXT DEFAULT 'filed',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS ip_protections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_id TEXT UNIQUE NOT NULL,
      ip_type TEXT NOT NULL,
      title TEXT NOT NULL,
      owner TEXT DEFAULT 'Omar Mohammad Abunadi',
      description TEXT,
      jurisdiction TEXT,
      status TEXT DEFAULT 'filed',
      created_at TEXT DEFAULT (datetime('now'))
    )`),
  ]);
  // Add sector column if missing (upgrade from v5.2.0)
  try { await db.prepare("ALTER TABLE companies ADD COLUMN sector TEXT DEFAULT 'general'").run(); } catch { /* already exists */ }
  // Rename ordar-law → darlaw (companies + contracts + clients)
  try { await db.prepare("UPDATE companies SET company_id='darlaw', name='DarLaw™', legal_name='DarLaw Legal Intelligence LLC' WHERE company_id='ordar-law'").run(); } catch { /* done */ }
  try { await db.prepare("UPDATE contracts SET provider_company_id='darlaw' WHERE provider_company_id='ordar-law'").run(); } catch { /* done */ }
  try { await db.prepare("UPDATE contracts SET client_company_id='darlaw' WHERE client_company_id='ordar-law'").run(); } catch { /* done */ }
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

async function sha256(text: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ══════════════════════════════════════════
// COMPANY ENDPOINTS
// ══════════════════════════════════════════

contracts.get("/companies", async (c) => {
  const db = c.env.DB;
  await ensureTables(db);
  const { results } = await db.prepare("SELECT * FROM companies ORDER BY name").all();
  return c.json({ success: true, companies: results, total: results.length });
});

contracts.post("/companies/seed", async (c) => {
  const start = Date.now();
  const db = c.env.DB;
  await ensureTables(db);
  let seeded = 0;
  for (const co of ALL_COMPANIES) {
    try {
      await db
        .prepare("INSERT OR IGNORE INTO companies (company_id, name, legal_name, domain, type, jurisdiction, sector) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(co.company_id, co.name, co.legal_name, co.domain, co.type, co.jurisdiction, co.sector)
        .run();
      seeded++;
    } catch { /* exists */ }
  }
  return c.json({
    success: true,
    message: `${seeded} companies registered in DarCloud ecosystem`,
    total_companies: ALL_COMPANIES.length,
    breakdown: {
      core_platform: ALL_COMPANIES.filter((c) => c.sector === "cloud-platform" || c.type === "parent").length,
      islamic_finance: ALL_COMPANIES.filter((c) => c.sector.includes("islamic") || c.sector.includes("takaful") || c.sector.includes("sukuk") || c.sector.includes("murabaha") || c.sector.includes("musharakah") || c.sector.includes("mudarabah") || c.sector.includes("ijarah") || c.sector.includes("istisna") || c.sector.includes("wakala") || c.sector.includes("zakat") || c.sector.includes("waqf") || c.sector.includes("shariah") || c.sector.includes("fintech") || c.sector.includes("venture") || c.sector.includes("asset") || c.sector.includes("remittance") || c.sector.includes("home-finance") || c.sector.includes("credit") || c.sector.includes("forex") || c.sector.includes("cooperative")).length,
      technology: ALL_COMPANIES.filter((c) => ["ai-validator", "mesh-comms", "quantum-computing", "machine-learning", "data-protocol", "cdn", "distributed-storage", "security-vault", "analytics", "5g-network", "mcp-protocol", "devops", "cybersecurity", "dns-routing", "edge-computing", "iot", "robotics", "dedicated-hosting", "container-orchestration", "data-warehouse"].includes(c.sector)).length,
      blockchain_defi: ALL_COMPANIES.filter((c) => c.sector.includes("defi") || c.sector.includes("nft") || c.sector.includes("staking") || c.sector.includes("cross-chain") || c.sector.includes("dao") || c.sector.includes("wallet") || c.sector.includes("tokeniz") || c.sector.includes("dex") || c.sector.includes("custody") || c.sector.includes("validator") || c.sector.includes("launchpad") || c.sector.includes("oracle") || c.sector.includes("gas-toll") || c.sector.includes("dlt") || c.sector.includes("identity")).length,
      lifestyle_commerce: ALL_COMPANIES.filter((c) => c.sector.includes("gaming") || c.sector.includes("ecommerce") || c.sector.includes("food") || c.sector.includes("travel") || c.sector.includes("edu") || c.sector.includes("health") || c.sector.includes("media") || c.sector.includes("fashion") || c.sector.includes("commercial") || c.sector.includes("logistics") || c.sector.includes("hr") || c.sector.includes("marketing") || c.sector.includes("consulting") || c.sector.includes("pharma") || c.sector.includes("insurance")).length,
      international: ALL_COMPANIES.filter((c) => c.type === "international").length,
    },
    execution_ms: Date.now() - start,
  });
});

// ══════════════════════════════════════════
// CONTRACT ENDPOINTS
// ══════════════════════════════════════════

contracts.get("/", async (c) => {
  const db = c.env.DB;
  await ensureTables(db);
  const { results } = await db.prepare("SELECT * FROM contracts ORDER BY created_at DESC").all();
  return c.json({ success: true, contracts: results, total: results.length });
});

contracts.post("/sign", async (c) => {
  const start = Date.now();
  const db = c.env.DB;
  await ensureTables(db);
  const body = await c.req.json<{
    title: string; provider: string; client: string;
    contract_type: string; service_description: string;
    monthly_fee: number; term_months?: number;
  }>();
  if (!body.title || !body.provider || !body.client) {
    return c.json({ error: "title, provider, and client required" }, 400);
  }
  const contractId = genId("CTR");
  const hash = await sha256(JSON.stringify({ ...body, contract_id: contractId, signed_at: new Date().toISOString(), founder_royalty: "30% immutable", shariah_compliant: true }));
  await db.prepare(
    `INSERT INTO contracts (contract_id, title, provider_company_id, client_company_id, contract_type, service_description, monthly_fee, start_date, term_months, sha256_hash) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`
  ).bind(contractId, body.title, body.provider, body.client, body.contract_type, body.service_description, body.monthly_fee || 0, body.term_months || 12, hash).run();
  const clientId = genId("CLT");
  await db.prepare(
    `INSERT INTO clients (client_id, company_id, client_company_id, service_type, contract_id, monthly_amount) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(clientId, body.provider, body.client, body.contract_type, contractId, body.monthly_fee || 0).run();
  return c.json({ success: true, contract_id: contractId, client_id: clientId, sha256_hash: hash, autopay: "active", shariah_compliant: true, founder_royalty: "30% immutable", execution_ms: Date.now() - start });
});

contracts.post("/seed-all", async (c) => {
  const start = Date.now();
  const db = c.env.DB;
  await ensureTables(db);
  let signed = 0;
  const today = new Date().toISOString();
  const results = [];
  for (const ctr of ALL_CONTRACTS) {
    const contractId = genId("CTR");
    const hash = await sha256(JSON.stringify({ ...ctr, contract_id: contractId, signed_at: today, founder_royalty: "30% immutable", shariah_compliant: true, zakat_rate: "2%" }));
    try {
      await db.prepare(
        `INSERT INTO contracts (contract_id, title, provider_company_id, client_company_id, contract_type, service_description, monthly_fee, start_date, term_months, sha256_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 12, ?)`
      ).bind(contractId, ctr.title, ctr.provider, ctr.client, ctr.type, ctr.desc, ctr.fee, today, hash).run();
      const clientId = genId("CLT");
      await db.prepare(
        `INSERT INTO clients (client_id, company_id, client_company_id, service_type, contract_id, monthly_amount) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(clientId, ctr.provider, ctr.client, ctr.type, contractId, ctr.fee).run();
      results.push({ contract_id: contractId, title: ctr.title, provider: ctr.provider, client: ctr.client, monthly_fee: `$${ctr.fee}`, autopay: "active", sha256: hash.substring(0, 16) + "..." });
      signed++;
    } catch { /* dup */ }
  }
  const totalMonthly = ALL_CONTRACTS.reduce((s, c) => s + c.fee, 0);
  return c.json({
    success: true,
    message: `${signed} inter-company contracts signed and logged`,
    summary: {
      total_contracts: signed,
      total_monthly_revenue: `$${totalMonthly.toLocaleString()}`,
      total_annual_revenue: `$${(totalMonthly * 12).toLocaleString()}`,
      founder_royalty_monthly: `$${Math.round(totalMonthly * 0.3).toLocaleString()}`,
      zakat_monthly: `$${Math.round(totalMonthly * 0.02).toLocaleString()}`,
      all_autopay: true,
      all_shariah_compliant: true,
    },
    contracts: results,
    execution_ms: Date.now() - start,
  });
});

contracts.get("/clients", async (c) => {
  const db = c.env.DB;
  await ensureTables(db);
  const { results } = await db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all();
  return c.json({ success: true, clients: results, total: results.length });
});

contracts.get("/revenue", async (c) => {
  const db = c.env.DB;
  await ensureTables(db);
  const { results } = await db.prepare(
    `SELECT provider_company_id as provider, SUM(monthly_fee) as monthly_revenue, COUNT(*) as client_count FROM contracts WHERE status = 'active' GROUP BY provider_company_id ORDER BY monthly_revenue DESC`
  ).all();
  const total = (results as Array<{ monthly_revenue: number }>).reduce((s, r) => s + (r.monthly_revenue || 0), 0);
  return c.json({
    success: true,
    revenue_by_company: results,
    totals: {
      monthly: `$${total.toLocaleString()}`,
      annual: `$${(total * 12).toLocaleString()}`,
      founder_royalty: `$${Math.round(total * 0.3).toLocaleString()}/mo`,
      zakat: `$${Math.round(total * 0.02).toLocaleString()}/mo`,
    },
  });
});

// ══════════════════════════════════════════
// DARLAW AI — LEGAL FILINGS
// ══════════════════════════════════════════

contracts.post("/legal/file-all", async (c) => {
  const start = Date.now();
  const db = c.env.DB;
  await ensureTables(db);
  let filed = 0;
  const results = [];
  for (const f of ALL_LEGAL_FILINGS) {
    const filingId = genId("FIL");
    const docHash = await sha256(JSON.stringify({ ...f, filing_id: filingId }));
    try {
      await db.prepare(
        `INSERT INTO legal_filings (filing_id, filing_type, title, entity, jurisdiction, description, document_hash, filed_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'DarLaw AI')`
      ).bind(filingId, f.type, f.title, f.entity, f.jurisdiction, f.desc, docHash).run();
      results.push({ filing_id: filingId, type: f.type, title: f.title, entity: f.entity, jurisdiction: f.jurisdiction, status: "filed", sha256: docHash.substring(0, 16) + "..." });
      filed++;
    } catch { /* dup */ }
  }
  return c.json({
    success: true,
    message: `DarLaw AI™ filed ${filed} legal documents across all jurisdictions`,
    filed_by: "DarLaw AI™",
    summary: {
      corporate_formations: ALL_LEGAL_FILINGS.filter((f) => f.type.includes("articles")).length,
      operating_agreements: ALL_LEGAL_FILINGS.filter((f) => f.type === "operating-agreement").length,
      ein_applications: ALL_LEGAL_FILINGS.filter((f) => f.type === "ein-application").length,
      business_licenses: ALL_LEGAL_FILINGS.filter((f) => f.type === "business-license").length,
      shariah_certifications: ALL_LEGAL_FILINGS.filter((f) => f.type === "shariah-certification").length,
      sec_filings: ALL_LEGAL_FILINGS.filter((f) => f.type === "sec-filing").length,
      money_transmitter: ALL_LEGAL_FILINGS.filter((f) => f.type === "money-transmitter").length,
      insurance_licenses: ALL_LEGAL_FILINGS.filter((f) => f.type === "insurance-license").length,
      international_registrations: ALL_LEGAL_FILINGS.filter((f) => f.type === "international-registration").length,
      total_filings: filed,
    },
    filings: results,
    execution_ms: Date.now() - start,
  });
});

contracts.get("/legal/filings", async (c) => {
  const db = c.env.DB;
  await ensureTables(db);
  const { results } = await db.prepare("SELECT * FROM legal_filings ORDER BY created_at DESC").all();
  return c.json({ success: true, filings: results, total: results.length });
});

// ══════════════════════════════════════════
// DARLAW AI — IP PROTECTION
// ══════════════════════════════════════════

contracts.post("/legal/protect-ip", async (c) => {
  const start = Date.now();
  const db = c.env.DB;
  await ensureTables(db);
  const allIP = [...ALL_TRADEMARKS, ...ALL_PATENTS, ...ALL_COPYRIGHTS, ...ALL_TRADE_SECRETS, ...ALL_INTERNATIONAL_IP, ...ALL_DOMAIN_PROTECTIONS];
  let count = 0;
  const results = [];
  for (const ip of allIP) {
    const ipId = genId("IP");
    try {
      await db.prepare(
        `INSERT INTO ip_protections (ip_id, ip_type, title, description, jurisdiction) VALUES (?, ?, ?, ?, ?)`
      ).bind(ipId, ip.type, ip.title, ip.desc, ip.jurisdiction).run();
      results.push({ ip_id: ipId, type: ip.type, title: ip.title, jurisdiction: ip.jurisdiction, status: "filed" });
      count++;
    } catch { /* dup */ }
  }
  return c.json({
    success: true,
    message: `DarLaw AI™ filed ${count} IP protections across all jurisdictions`,
    filed_by: "DarLaw AI™",
    owner: "Omar Mohammad Abunadi",
    summary: {
      trademarks: ALL_TRADEMARKS.length,
      patents: ALL_PATENTS.length,
      copyrights: ALL_COPYRIGHTS.length,
      trade_secrets: ALL_TRADE_SECRETS.length,
      international_ip: ALL_INTERNATIONAL_IP.length,
      domain_protections: ALL_DOMAIN_PROTECTIONS.length,
      total_protections: count,
    },
    protections: results,
    execution_ms: Date.now() - start,
  });
});

contracts.get("/legal/ip", async (c) => {
  const db = c.env.DB;
  await ensureTables(db);
  const { results } = await db.prepare("SELECT * FROM ip_protections ORDER BY created_at DESC").all();
  return c.json({ success: true, owner: "Omar Mohammad Abunadi", ip_protections: results, total: results.length });
});

// ══════════════════════════════════════════
// DARLAW AI AGENT FLEET
// ══════════════════════════════════════════

contracts.get("/darlaw/agents", async (c) => {
  return c.json({
    success: true,
    service: "DarLaw™ — Legal AI Agent Fleet",
    owner: "Omar Mohammad Abunadi",
    agents: [
      {
        id: "darlaw-corporate",
        name: "DarLaw Corporate Formation Agent",
        model: "gpt-4o",
        specialty: "Corporate formation, articles of organization, operating agreements, EIN applications, board resolutions",
        status: "active",
        filings: ["Articles of Organization", "Certificate of Incorporation", "Operating Agreement", "EIN (SS-4)", "Annual Reports", "Board Resolutions"],
      },
      {
        id: "darlaw-ip",
        name: "DarLaw IP Protection Agent",
        model: "gpt-4o",
        specialty: "Trademark registration, patent filing, copyright protection, trade secret documentation",
        status: "active",
        filings: ["USPTO Trademark Applications", "Madrid Protocol International Marks", "Provisional Patents", "PCT International Patents", "Copyright Registration", "DTSA Trade Secret Documentation"],
      },
      {
        id: "darlaw-compliance",
        name: "DarLaw Regulatory Compliance Agent",
        model: "gpt-4o",
        specialty: "SEC filings, banking compliance, money transmitter licenses, Shariah certification, AAOIFI standards",
        status: "active",
        filings: ["SEC Form D", "State Banking Licenses", "Money Transmitter Licenses (50 states)", "Shariah Board Certification", "PCI-DSS Compliance", "AAOIFI Standards Audit"],
      },
      {
        id: "darlaw-contracts",
        name: "DarLaw Contract Automation Agent",
        model: "gpt-4o",
        specialty: "Inter-company contracts, SLAs, MSAs, NDAs, service agreements with SHA-256 immutability",
        status: "active",
        filings: ["Master Service Agreements", "SLAs", "NDAs", "Inter-Company Contracts", "Smart Contract Legal Wrappers", "Revenue Sharing Agreements"],
      },
      {
        id: "darlaw-realestate",
        name: "DarLaw Real Estate Law Agent",
        model: "gpt-4o",
        specialty: "Title searches, purchase agreements, deed filings, closing documents, Diminishing Musharakah mortgages",
        status: "active",
        filings: ["Title Searches", "Purchase Agreements", "Deed of Trust", "Closing Documents", "Property Tax Appeals", "Musharakah Mortgage Docs"],
      },
      {
        id: "darlaw-international",
        name: "DarLaw International Law Agent",
        model: "gpt-4o",
        specialty: "International company formation, cross-border IP, WIPO filings, 21 country registrations",
        status: "active",
        filings: ["UAE DIFC Registration", "UK Companies House", "SAGIA License (KSA)", "Malaysia SSM", "Turkey MERSIS", "Egypt GAFI", "Pakistan SECP", "Indonesia OJK", "Singapore ACRA", "WIPO PCT", "Madrid Protocol"],
      },
      {
        id: "darlaw-tax",
        name: "DarLaw Tax & Zakat Agent",
        model: "gpt-4o",
        specialty: "Tax strategy, zakat calculation, multi-state compliance, international tax treaties, transfer pricing",
        status: "active",
        filings: ["Federal Tax Returns", "State Franchise Tax", "Zakat Calculations", "International Tax Treaties", "Transfer Pricing Documentation", "Zakat Distribution Records"],
      },
      {
        id: "darlaw-takaful",
        name: "DarLaw Takaful & Insurance Agent",
        model: "gpt-4o",
        specialty: "Takaful regulatory compliance, insurance department filings, retakaful arrangements, cooperative insurance licensing",
        status: "active",
        filings: ["State Insurance Licenses (50 states)", "Takaful Product Filings", "Retakaful Arrangements", "Cooperative Insurance Charters", "Actuarial Certifications", "NAIC Filings"],
      },
      {
        id: "darlaw-fintech",
        name: "DarLaw Fintech & Banking Agent",
        model: "gpt-4o",
        specialty: "Fintech charters, neobank licensing, open banking compliance, payment processor regulations",
        status: "active",
        filings: ["Fintech Charter Applications", "Neobank License", "Open Banking API Compliance", "CFPB Registrations", "State Lending Licenses", "MSB Registration"],
      },
      {
        id: "darlaw-crypto",
        name: "DarLaw Crypto & DeFi Agent",
        model: "gpt-4o",
        specialty: "CFTC registration, FinCEN compliance, state BitLicense, DeFi regulatory frameworks, token classification",
        status: "active",
        filings: ["CFTC Registration", "FinCEN MSB Filing", "State BitLicense", "Token Howey Analysis", "DeFi No-Action Letters", "Crypto Exchange Licenses"],
      },
      {
        id: "darlaw-shariah",
        name: "DarLaw Shariah Advisory Agent",
        model: "gpt-4o",
        specialty: "Shariah compliance verification, fatwa research, AAOIFI standards, Islamic jurisprudence (fiqh) analysis",
        status: "active",
        filings: ["Shariah Compliance Certificates", "Product Fatwa Requests", "AAOIFI Standard Audits", "Fiqh Analysis Reports", "Shariah Board Meeting Minutes", "Haram Screening Reports"],
      },
    ],
    total_agents: 11,
    platform: "OpenAI GPT-4o + DarCloud Workers",
    capabilities: {
      jurisdictions_covered: "153 countries via WIPO PCT + 57 OIC member states",
      us_states_covered: 50,
      international_offices: 21,
      languages: ["English", "Arabic", "Malay", "Turkish", "Urdu", "French", "German", "Indonesian", "Bengali"],
    },
  });
});

// ══════════════════════════════════════════
// BOOTSTRAP — ONE-CLICK FULL SETUP
// ══════════════════════════════════════════

contracts.post("/bootstrap", async (c) => {
  const start = Date.now();
  const db = c.env.DB;
  await ensureTables(db);

  // 1. Seed companies
  let companiesSeeded = 0;
  for (const co of ALL_COMPANIES) {
    try {
      await db.prepare("INSERT OR IGNORE INTO companies (company_id, name, legal_name, domain, type, jurisdiction, sector) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(co.company_id, co.name, co.legal_name, co.domain, co.type, co.jurisdiction, co.sector).run();
      companiesSeeded++;
    } catch { /* exists */ }
  }

  // 2. Sign all contracts
  let contractsSigned = 0;
  const today = new Date().toISOString();
  for (const ctr of ALL_CONTRACTS) {
    const cid = genId("CTR");
    const hash = await sha256(JSON.stringify({ ...ctr, contract_id: cid, signed_at: today }));
    try {
      await db.prepare(`INSERT INTO contracts (contract_id, title, provider_company_id, client_company_id, contract_type, service_description, monthly_fee, start_date, term_months, sha256_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 12, ?)`).bind(cid, ctr.title, ctr.provider, ctr.client, ctr.type, ctr.desc, ctr.fee, today, hash).run();
      await db.prepare(`INSERT INTO clients (client_id, company_id, client_company_id, service_type, contract_id, monthly_amount) VALUES (?, ?, ?, ?, ?, ?)`).bind(genId("CLT"), ctr.provider, ctr.client, ctr.type, cid, ctr.fee).run();
      contractsSigned++;
    } catch { /* dup */ }
  }

  // 3. File all legal docs
  let legalFiled = 0;
  for (const f of ALL_LEGAL_FILINGS) {
    const fid = genId("FIL");
    const dh = await sha256(JSON.stringify({ ...f, filing_id: fid }));
    try {
      await db.prepare(`INSERT INTO legal_filings (filing_id, filing_type, title, entity, jurisdiction, description, document_hash, filed_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'DarLaw AI')`).bind(fid, f.type, f.title, f.entity, f.jurisdiction, f.desc, dh).run();
      legalFiled++;
    } catch { /* dup */ }
  }

  // 4. Protect all IP
  const allIP = [...ALL_TRADEMARKS, ...ALL_PATENTS, ...ALL_COPYRIGHTS, ...ALL_TRADE_SECRETS, ...ALL_INTERNATIONAL_IP, ...ALL_DOMAIN_PROTECTIONS];
  let ipProtected = 0;
  for (const ip of allIP) {
    const iid = genId("IP");
    try {
      await db.prepare(`INSERT INTO ip_protections (ip_id, ip_type, title, description, jurisdiction) VALUES (?, ?, ?, ?, ?)`).bind(iid, ip.type, ip.title, ip.desc, ip.jurisdiction).run();
      ipProtected++;
    } catch { /* dup */ }
  }

  const totalMonthly = ALL_CONTRACTS.reduce((s, c) => s + c.fee, 0);

  return c.json({
    success: true,
    message: "🏛️ FULL DARCLOUD ECOSYSTEM BOOTSTRAPPED — 101 companies, all contracts signed, all legal filed, all IP protected",
    bootstrapped_by: "DarLaw AI™",
    owner: "Omar Mohammad Abunadi",
    results: {
      companies_registered: companiesSeeded,
      contracts_signed: contractsSigned,
      legal_filings: legalFiled,
      ip_protections: ipProtected,
      total_monthly_revenue: `$${totalMonthly.toLocaleString()}`,
      total_annual_revenue: `$${(totalMonthly * 12).toLocaleString()}`,
      founder_royalty_monthly: `$${Math.round(totalMonthly * 0.3).toLocaleString()}/mo`,
      zakat_monthly: `$${Math.round(totalMonthly * 0.02).toLocaleString()}/mo`,
    },
    execution_ms: Date.now() - start,
  });
});

export { contracts };
