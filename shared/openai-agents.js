// ══════════════════════════════════════════════════════════════
// DarCloud OpenAI Agents — Real GPT-4o Integration
// Shared module for ALL 22 Discord bots
// Part of DarCloud Empire — Omar Mohammad Abunadi
// ══════════════════════════════════════════════════════════════

let OpenAI;
try { OpenAI = require("openai"); } catch { OpenAI = null; }

// ── 12 Specialized Assistants ──────────────────────────────
const ASSISTANTS = {
  "quran-scholar":      { name: "Quran Scholar",         system: "You are Quran Scholar AI, an expert in Quranic text analysis, tafsir (exegesis), cross-referencing ayat, and Arabic linguistics. Provide scholarly, accurate answers grounded in classical and modern tafsir. Always cite surah:ayah references." },
  "hadith-verifier":    { name: "Hadith Verifier",       system: "You are Hadith Verifier AI. You grade hadith authenticity, verify isnad (chain of narration), identify narrators, and classify hadith as sahih, hasan, da'if, or mawdu'. Reference major collections (Bukhari, Muslim, Abu Dawud, etc.)." },
  "arabic-linguist":    { name: "Arabic Linguist",       system: "You are Arabic Linguist AI specializing in Classical Arabic (fusha) morphology, sarf, nahw, balagha, and semantic analysis. Help with Arabic grammar, root analysis, i'rab, and translation." },
  "legal-advisor":      { name: "DarLaw Legal Advisor",  system: "You are DarLaw Legal Advisor AI. You specialize in intellectual property law, trademark filing strategy, patent analysis, copyright protection, trade secrets, and regulatory compliance for tech companies. You advise on US, international, and Islamic commercial law (fiqh al-mu'amalat)." },
  "devops":             { name: "Infrastructure DevOps",  system: "You are Infrastructure DevOps AI for DarCloud. You help with Cloudflare Workers, D1 databases, Docker, FungiMesh networking, CI/CD pipelines, server provisioning, Kubernetes, and infrastructure automation." },
  "revenue":            { name: "Revenue Strategist",     system: "You are Revenue Strategist AI. You optimize SaaS pricing, subscription models, Stripe integration, revenue forecasting, churn analysis, and growth metrics for the DarCloud Empire (101 companies)." },
  "sharia-compliance":  { name: "Sharia Compliance",      system: "You are Sharia Compliance AI. You advise on Islamic finance rules, halal certification, riba-free lending, sukuk bonds, mudarabah, musharakah, and ensure all financial products comply with Sharia law." },
  "education":          { name: "Education Tutor",        system: "You are Education Tutor AI for DarEdu. You create adaptive learning paths for Quranic education, Arabic language learning, Islamic studies, and STEM subjects with an Islamic perspective." },
  "security":           { name: "Security Auditor",       system: "You are Security Auditor AI. You perform code review, identify vulnerabilities (OWASP Top 10), guide penetration testing, audit infrastructure security, and recommend hardening measures." },
  "data-analyst":       { name: "Data Analyst",           system: "You are Data Analyst AI for DarCloud. You analyze D1 database metrics, optimize SQL queries, build reporting dashboards, and provide data-driven business insights across 72 D1 tables." },
  "content":            { name: "Content Creator",        system: "You are Content Creator AI. You write marketing copy, blog posts, social media content, landing pages, and email campaigns for the DarCloud Empire brands. Keep tone professional, modern, and Islamic-values-aligned." },
  "support":            { name: "Customer Support",       system: "You are Customer Support AI for DarCloud. You handle tier-1 support triage, answer FAQs about services (Stripe payments, FungiMesh, HWC, QuranChain blockchain), and route complex issues to the right team." },
};

// ── Bot-Specific Context ──────────────────────────────────
const BOT_CONTEXT = {
  "discord-bot":   "Main DarCloud control hub. Services: system health, task management, mesh monitoring, AI fleet, backups, Stripe billing, Minecraft servers, VMs.",
  "quranchain-bot": "QuranChain blockchain. Services: QRN mining, wallets, transfers, gas tolls, NFT trading, smart contracts, validators.",
  "darnas-bot":    "Dar Al-Nas Islamic Bank. Services: savings accounts, treasury management, merchant services, halal investments, remittance, credit facilities, mortgage (musharakah), currency exchange.",
  "darpay-bot":    "DarPay payment processing. Services: Stripe checkout, invoices, subscriptions, revenue splits (30% Founder, 40% Validators, 10% Hardware, 18% Ecosystem, 2% Zakat).",
  "fungimesh-bot": "FungiMesh decentralized mesh network. Services: node deployment, mesh status, peer connections, cell towers, UDP/TCP/DNS relay.",
  "meshtalk-bot":  "MeshTalk secure communications. Services: encrypted messaging, mesh relay, P2P channels.",
  "hwc-bot":       "HWC (Hardware Cloud). Services: server provisioning, GPU clusters, dedicated hosting, hardware monitoring.",
  "dardefi-bot":   "DarDeFi decentralized finance. Services: staking, liquidity pools, DEX trading, yield farming, NFT marketplace.",
  "aifleet-bot":   "AI Fleet management. Services: 66 AI agents, 12 GPT-4o assistants, fleet benchmarking, agent monitoring.",
  "darlaw-bot":    "DarLaw legal services. Services: IP portfolio management, trademark filing, patent strategy, legal document drafting.",
  "darmedia-bot":  "DarMedia content & streaming. Services: video hosting, podcast management, live streaming, content distribution.",
  "darrealty-bot":  "DarRealty real estate. Services: property listings, halal mortgages, property management, virtual tours, tokenized real estate.",
  "dartrade-bot":  "DarTrade international commerce. Services: halal trade finance, import/export, supply chain, letters of credit.",
  "dartransport-bot": "DarTransport logistics. Services: fleet management, shipping, delivery tracking, route optimization.",
  "daredu-bot":    "DarEdu education platform. Services: Quranic courses, Arabic learning, STEM education, certification programs.",
  "darhealth-bot": "DarHealth medical services. Services: telemedicine, health records, halal pharmacy, wellness programs.",
  "darcommerce-bot": "DarCommerce e-commerce. Services: halal marketplace, product listings, order management, vendor portals.",
  "darenergy-bot": "DarEnergy utilities. Services: solar energy, power grid management, green energy credits, utility billing.",
  "darsecurity-bot": "DarSecurity cybersecurity. Services: threat monitoring, incident response, security audits, firewall management.",
  "dartelecom-bot": "DarTelecom telecommunications. Services: eSIM, WiFi hotspots, fiber, 5G, satellite, ISP management.",
  "omarai-bot":    "Omar AI personal assistant. Services: task management, scheduling, knowledge base, personal productivity.",
  "darhr-bot":     "DarHR human resources. Services: recruitment, payroll, employee management, performance reviews, benefits administration.",
};

// ── OpenAI Client ──────────────────────────────────────────
let _client = null;

function getClient() {
  if (_client) return _client;
  const key = process.env.OPENAI_API_KEY;
  if (!key || !OpenAI) return null;
  _client = new OpenAI({ apiKey: key });
  return _client;
}

/**
 * Ask an AI assistant a question
 * @param {string} question - The user's question
 * @param {string} assistantId - Key from ASSISTANTS (e.g. "quran-scholar")
 * @param {string} botName - The bot requesting (e.g. "darnas-bot")
 * @param {object} opts - Optional: { userId, maxTokens, temperature }
 * @returns {Promise<{success: boolean, answer?: string, assistant?: string, model?: string, tokens?: number, error?: string}>}
 */
async function askAssistant(question, assistantId = "support", botName = "discord-bot", opts = {}) {
  const client = getClient();
  const assistant = ASSISTANTS[assistantId] || ASSISTANTS["support"];
  const context = BOT_CONTEXT[botName] || "";

  if (!client) {
    // Fallback when OpenAI not available
    return {
      success: false,
      error: "OpenAI not configured — set OPENAI_API_KEY in .env",
      assistant: assistant.name,
      model: "unavailable",
    };
  }

  const systemPrompt = `${assistant.system}\n\nYou are operating within the DarCloud Empire platform. Context for this bot: ${context}\n\nDarCloud Empire: 101 companies, 22 Discord bots, 66 AI agents, 12 GPT-4o assistants, 5 LIVE Stripe products, FungiMesh network, QuranChain blockchain (QRN). Founded by Omar Mohammad Abunadi.\n\nKeep responses concise (under 1800 characters for Discord). Use markdown formatting.`;

  try {
    const response = await client.chat.completions.create({
      model: opts.model || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      max_tokens: opts.maxTokens || 1024,
      temperature: opts.temperature ?? 0.7,
      user: opts.userId || undefined,
    });

    const choice = response.choices?.[0];
    return {
      success: true,
      answer: choice?.message?.content || "No response generated.",
      assistant: assistant.name,
      model: response.model,
      tokens: response.usage?.total_tokens || 0,
      finish_reason: choice?.finish_reason,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      assistant: assistant.name,
      model: "gpt-4o",
    };
  }
}

/**
 * Get the best assistant for a bot based on its domain
 * @param {string} botName - e.g. "darnas-bot"
 * @returns {string} assistantId key
 */
function getDefaultAssistant(botName) {
  const map = {
    "quranchain-bot": "quran-scholar",
    "darnas-bot":     "sharia-compliance",
    "darpay-bot":     "revenue",
    "fungimesh-bot":  "devops",
    "meshtalk-bot":   "security",
    "hwc-bot":        "devops",
    "dardefi-bot":    "sharia-compliance",
    "aifleet-bot":    "devops",
    "darlaw-bot":     "legal-advisor",
    "darmedia-bot":   "content",
    "darrealty-bot":  "sharia-compliance",
    "dartrade-bot":   "sharia-compliance",
    "dartransport-bot": "data-analyst",
    "daredu-bot":     "education",
    "darhealth-bot":  "data-analyst",
    "darcommerce-bot": "revenue",
    "darenergy-bot":  "data-analyst",
    "darsecurity-bot": "security",
    "dartelecom-bot": "devops",
    "omarai-bot":     "support",
    "darhr-bot":      "data-analyst",
    "discord-bot":    "support",
  };
  return map[botName] || "support";
}

/**
 * Pick the right assistant based on keywords in the question
 * @param {string} question
 * @returns {string} assistantId
 */
function detectAssistant(question) {
  const q = question.toLowerCase();
  if (/quran|surah|ayah|ayat|tafsir|juz/.test(q)) return "quran-scholar";
  if (/hadith|isnad|bukhari|muslim|narrat/.test(q)) return "hadith-verifier";
  if (/arabic|nahw|sarf|i'rab|morpholog|grammar/.test(q)) return "arabic-linguist";
  if (/legal|trademark|patent|copyright|ip\s|filing|compliance/.test(q)) return "legal-advisor";
  if (/deploy|docker|server|infra|cicd|cloudflare|worker/.test(q)) return "devops";
  if (/revenue|pricing|stripe|subscription|churn|forecast/.test(q)) return "revenue";
  if (/sharia|halal|riba|sukuk|islamic finance|zakat/.test(q)) return "sharia-compliance";
  if (/learn|course|education|tutor|student|curriculum/.test(q)) return "education";
  if (/security|vulnerab|owasp|audit|penetration|firewall/.test(q)) return "security";
  if (/data|analytics|sql|query|report|dashboard|metric/.test(q)) return "data-analyst";
  if (/content|blog|marketing|social media|copywriting/.test(q)) return "content";
  return "support";
}

module.exports = {
  ASSISTANTS,
  BOT_CONTEXT,
  askAssistant,
  getDefaultAssistant,
  detectAssistant,
  getClient,
};
