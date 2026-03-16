// ==========================================================
// QuranChain™ Agent Router — 101-Agent Domain Routing Map
// Routes commands to the correct agent/domain/bot
// ==========================================================

// ── Domain Definitions ──────────────────────────────────────
const DOMAINS = {
  GOVERNANCE:   { id: "governance",   label: "Governance & Legal",   agentRange: [1, 10],   bot: "darlaw-bot" },
  BLOCKCHAIN:   { id: "blockchain",   label: "Blockchain & DeFi",    agentRange: [11, 25],  bot: "quranchain-bot" },
  FINANCE:      { id: "finance",      label: "Finance & Treasury",   agentRange: [26, 40],  bot: "darpay-bot" },
  EXCHANGE:     { id: "exchange",     label: "Exchange & Trading",   agentRange: [41, 50],  bot: "dartrade-bot" },
  CLOUD:        { id: "cloud",        label: "Cloud & Infrastructure", agentRange: [51, 60], bot: "discord-bot" },
  TELECOM:      { id: "telecom",      label: "Telecom & ISP",        agentRange: [61, 75],  bot: "dartelecom-bot" },
  MEMBERSHIP:   { id: "membership",   label: "Membership & Onboarding", agentRange: [76, 85], bot: "hwc-bot" },
  HEALTHCARE:   { id: "healthcare",   label: "Healthcare & Wellness", agentRange: [86, 95], bot: "darhealth-bot" },
  REAL_ESTATE:  { id: "real_estate",  label: "Real Estate",          agentRange: [96, 101], bot: "darrealty-bot" },
  STATUS:       { id: "status",       label: "System Status",        agentRange: null,      bot: "discord-bot" },
  REVENUE:      { id: "revenue",      label: "Revenue & Billing",    agentRange: null,      bot: "darpay-bot" },
  SECURITY:     { id: "security",     label: "Security & Compliance", agentRange: null,     bot: "darsecurity-bot" },
  DEPLOYMENT:   { id: "deployment",   label: "Deployment & DevOps",  agentRange: null,      bot: "discord-bot" },
  REPORTING:    { id: "reporting",    label: "Reporting & Analytics", agentRange: null,      bot: "discord-bot" },
  AUTOMATION:   { id: "automation",   label: "Automation & AI",      agentRange: null,      bot: "omarai-bot" },
};

// ── Bot Registry ────────────────────────────────────────────
const BOT_REGISTRY = {
  "discord-bot":      { name: "DarCloud Main",     sector: "Core Platform",      ipcPort: 9100, domains: ["cloud", "status", "deployment", "reporting"] },
  "quranchain-bot":   { name: "QuranChain",         sector: "Blockchain",         ipcPort: 9101, domains: ["blockchain"] },
  "darpay-bot":       { name: "DarPay",             sector: "Finance",            ipcPort: 9102, domains: ["finance", "revenue"] },
  "dartrade-bot":     { name: "DarTrade",           sector: "Exchange",           ipcPort: 9103, domains: ["exchange"] },
  "darlaw-bot":       { name: "DarLaw",             sector: "Legal",              ipcPort: 9104, domains: ["governance"] },
  "dartelecom-bot":   { name: "DarTelecom",         sector: "Telecom",            ipcPort: 9105, domains: ["telecom"] },
  "hwc-bot":          { name: "HWC",                sector: "Membership",         ipcPort: 9106, domains: ["membership"] },
  "darhealth-bot":    { name: "DarHealth",          sector: "Healthcare",         ipcPort: 9107, domains: ["healthcare"] },
  "darrealty-bot":    { name: "DarRealty",           sector: "Real Estate",        ipcPort: 9108, domains: ["real_estate"] },
  "darsecurity-bot":  { name: "DarSecurity",        sector: "Security",           ipcPort: 9109, domains: ["security"] },
  "omarai-bot":       { name: "Omar AI",            sector: "AI & Automation",    ipcPort: 9110, domains: ["automation"] },
  "aifleet-bot":      { name: "AI Fleet",           sector: "AI Infrastructure",  ipcPort: 9111, domains: [] },
  "darcommerce-bot":  { name: "DarCommerce",        sector: "Commerce",           ipcPort: 9112, domains: [] },
  "dardefi-bot":      { name: "DarDeFi",            sector: "DeFi",               ipcPort: 9113, domains: [] },
  "daredu-bot":       { name: "DarEdu",             sector: "Education",          ipcPort: 9114, domains: [] },
  "darenergy-bot":    { name: "DarEnergy",          sector: "Energy",             ipcPort: 9115, domains: [] },
  "darhr-bot":        { name: "DarHR",              sector: "Human Resources",    ipcPort: 9116, domains: [] },
  "darmedia-bot":     { name: "DarMedia",           sector: "Media",              ipcPort: 9117, domains: [] },
  "darnas-bot":       { name: "DarNAS",             sector: "Storage",            ipcPort: 9118, domains: [] },
  "dartransport-bot": { name: "DarTransport",       sector: "Transport",          ipcPort: 9119, domains: [] },
  "fungimesh-bot":    { name: "FungiMesh",          sector: "Mesh Network",       ipcPort: 9120, domains: [] },
  "meshtalk-bot":     { name: "MeshTalk",           sector: "Communications",     ipcPort: 9121, domains: [] },
};

// ── Keyword → Domain Mapping ────────────────────────────────
const DOMAIN_KEYWORDS = [
  { domain: "status",      keywords: /\b(status|health|uptime|online|offline|check system|overview|dashboard)\b/i },
  { domain: "revenue",     keywords: /\b(revenue|billing|invoice|payment|stripe|subscription|income|earnings|zakat|profit)\b/i },
  { domain: "deployment",  keywords: /\b(deploy|redeploy|push|release|rollback|wrangler|build|ci|cd|pipeline)\b/i },
  { domain: "blockchain",  keywords: /\b(blockchain|qrn|token|chain|block|mining|validator|consensus|wallet|ledger|smart.?contract|gas.?toll)\b/i },
  { domain: "finance",     keywords: /\b(finance|treasury|bank|transfer|payout|receivable|payable|accounting|halal.?wealth|hwc)\b/i },
  { domain: "exchange",    keywords: /\b(exchange|trade|trading|market|order|buy|sell|pair|liquidity|swap)\b/i },
  { domain: "cloud",       keywords: /\b(cloud|server|worker|api|endpoint|d1|database|infrastructure|compute|storage)\b/i },
  { domain: "telecom",     keywords: /\b(telecom|isp|tower|signal|bandwidth|sim|esim|5g|lte|cell|antenna|spectrum)\b/i },
  { domain: "membership",  keywords: /\b(member|onboard|signup|register|tier|plan|premium|enterprise|pro|starter|join)\b/i },
  { domain: "healthcare",  keywords: /\b(health|medical|patient|clinic|pharmacy|telemedicine|wellness|diagnosis)\b/i },
  { domain: "real_estate", keywords: /\b(real.?estate|property|listing|rent|lease|mortgage|building|tenant|realty)\b/i },
  { domain: "governance",  keywords: /\b(legal|law|contract|compliance|regulation|filing|ip|trademark|patent|copyright|shariah|sharia)\b/i },
  { domain: "security",    keywords: /\b(security|auth|permission|access|firewall|intrusion|audit|vulnerability|encrypt)\b/i },
  { domain: "automation",  keywords: /\b(automate|automation|ai.?agent|bot|cron|schedule|workflow|pipeline|omar.?ai)\b/i },
  { domain: "reporting",   keywords: /\b(report|analytics|metric|chart|graph|summary|benchmark|kpi|insight)\b/i },
];

// ── Route Resolution ────────────────────────────────────────

/**
 * Resolve a command string to the target domain and bot
 * @param {string} command - The parsed command text (after wake phrase removed)
 * @returns {{ domain: object, bot: object, confidence: number }}
 */
function resolveRoute(command) {
  const lower = command.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of DOMAIN_KEYWORDS) {
    const matches = lower.match(entry.keywords);
    if (matches) {
      // Score by number of keyword matches and position
      const score = matches.length + (matches.index < 20 ? 2 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry.domain;
      }
    }
  }

  if (!bestMatch) {
    // Default to status domain if no match
    bestMatch = "status";
    bestScore = 0;
  }

  const domain = Object.values(DOMAINS).find(d => d.id === bestMatch);
  const bot = domain ? BOT_REGISTRY[domain.bot] : BOT_REGISTRY["discord-bot"];
  const confidence = Math.min(bestScore / 4, 1);

  return {
    domain: domain || DOMAINS.STATUS,
    bot: { key: domain?.bot || "discord-bot", ...bot },
    confidence,
  };
}

/**
 * Get all agents within a domain range
 * @param {string} domainId
 * @returns {{ start: number, end: number, count: number } | null}
 */
function getAgentRange(domainId) {
  const domain = Object.values(DOMAINS).find(d => d.id === domainId);
  if (!domain || !domain.agentRange) return null;
  return {
    start: domain.agentRange[0],
    end: domain.agentRange[1],
    count: domain.agentRange[1] - domain.agentRange[0] + 1,
  };
}

/**
 * List all domains with their bot assignments
 * @returns {Array<{ id: string, label: string, bot: string, agents: string }>}
 */
function listDomains() {
  return Object.values(DOMAINS).map(d => ({
    id: d.id,
    label: d.label,
    bot: d.bot,
    agents: d.agentRange ? `#${d.agentRange[0]}–#${d.agentRange[1]}` : "system",
  }));
}

/**
 * Get bot info by name
 * @param {string} botKey - e.g. "discord-bot"
 * @returns {object|null}
 */
function getBotInfo(botKey) {
  const bot = BOT_REGISTRY[botKey];
  if (!bot) return null;
  return { key: botKey, ...bot };
}

module.exports = {
  DOMAINS,
  BOT_REGISTRY,
  DOMAIN_KEYWORDS,
  resolveRoute,
  getAgentRange,
  listDomains,
  getBotInfo,
};
