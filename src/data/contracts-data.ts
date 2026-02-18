// ══════════════════════════════════════════════════════════════
// DARCLOUD ECOSYSTEM — INTER-COMPANY CONTRACTS
// All companies are customers of each other 
// 30% Founder Royalty | 2% Zakat | All Shariah-Compliant
// ══════════════════════════════════════════════════════════════

export interface ContractDef {
  title: string;
  provider: string;
  client: string;
  type: string;
  desc: string;
  fee: number;
}

export const ALL_CONTRACTS: ContractDef[] = [
  // ═══════════════════════════════════════
  // DARCLOUD PLATFORM HOSTING (for all subsidiaries)
  // ═══════════════════════════════════════
  { title: "DarCloud — QuranChain Cloud Hosting", provider: "darcloud-host", client: "quranchain", type: "cloud-hosting", desc: "Full cloud infrastructure for QuranChain blockchain nodes, validators, and explorer. 99.99% SLA.", fee: 2499 },
  { title: "DarCloud — FungiMesh Infrastructure", provider: "darcloud-host", client: "fungimesh", type: "cloud-hosting", desc: "Distributed mesh relay hosting across 6 continents. 340K node infrastructure.", fee: 3999 },
  { title: "DarCloud — AI Fleet Compute", provider: "darcloud-host", client: "darcloud-ai", type: "gpu-compute", desc: "GPU compute for 71 AI agents + 12 GPT-4o assistants. Edge inference on 200+ PoPs.", fee: 4999 },
  { title: "DarCloud — HWC Banking Hosting", provider: "darcloud-host", client: "hwc", type: "cloud-hosting", desc: "SOC2-compliant financial infrastructure for HWC banking and lending.", fee: 1999 },
  { title: "DarCloud — Real Estate Platform", provider: "darcloud-host", client: "dar-al-nas", type: "cloud-hosting", desc: "Property database, listing engine, Zillow/Redfin integration for 31 markets.", fee: 1499 },
  { title: "DarCloud — Revenue Engine Hosting", provider: "darcloud-host", client: "darcloud-revenue", type: "cloud-hosting", desc: "Revenue processing, Stripe webhooks, gas toll distribution engine.", fee: 999 },
  { title: "DarCloud — DarLaw AI Hosting", provider: "darcloud-host", client: "darlaw", type: "cloud-hosting", desc: "Legal AI agent hosting, document generation, IP protection systems.", fee: 1999 },
  { title: "DarCloud — DarPay Hosting", provider: "darcloud-host", client: "darpay", type: "cloud-hosting", desc: "Payment processing infrastructure, Stripe integration, multi-currency halal gateway.", fee: 1499 },
  { title: "DarCloud — Enterprise Hosting", provider: "darcloud-host", client: "darcloud-enterprise", type: "cloud-hosting", desc: "Enterprise customer infrastructure, compliance engine, analytics.", fee: 2999 },
  { title: "DarCloud — DarTakaful Hosting", provider: "darcloud-host", client: "dartakaful", type: "cloud-hosting", desc: "Insurance platform infrastructure, risk pool processing, claims automation.", fee: 2499 },
  { title: "DarCloud — DarSukuk Hosting", provider: "darcloud-host", client: "darsukuk", type: "cloud-hosting", desc: "Islamic bond trading platform, tokenization engine, distribution systems.", fee: 1999 },
  { title: "DarCloud — DarFintech Platform", provider: "darcloud-host", client: "darfintech", type: "cloud-hosting", desc: "Muslim fintech aggregation platform, API gateway for all Islamic financial services.", fee: 2499 },
  { title: "DarCloud — DarExchange Trading Platform", provider: "darcloud-host", client: "darexchange", type: "cloud-hosting", desc: "Forex & crypto exchange matching engine, order books, wallet infrastructure.", fee: 3499 },
  { title: "DarCloud — DarCommerce Marketplace", provider: "darcloud-host", client: "darcommerce", type: "cloud-hosting", desc: "Halal marketplace hosting, vendor management, payment rails.", fee: 1999 },
  { title: "DarCloud — DarDeFi Protocol Hosting", provider: "darcloud-host", client: "dardefi", type: "cloud-hosting", desc: "DeFi protocol infrastructure, smart contract hosting, liquidity pool tracking.", fee: 2999 },
  { title: "DarCloud — DarGaming Platform", provider: "darcloud-host", client: "dargaming", type: "cloud-hosting", desc: "Gaming server infrastructure, matchmaking, leaderboards, esports.", fee: 1999 },
  { title: "DarCloud — Islamic Finance Suite", provider: "darcloud-host", client: "darmurabaha", type: "cloud-hosting", desc: "Hosting for Murabaha, Musharakah, Mudarabah, Ijarah, Istisna platforms.", fee: 1499 },
  { title: "DarCloud — DarMortgage Platform", provider: "darcloud-host", client: "darmortgage", type: "cloud-hosting", desc: "Zero-riba mortgage application, underwriting, and servicing platform.", fee: 1999 },
  { title: "DarCloud — DarWealth Platform", provider: "darcloud-host", client: "darwealth", type: "cloud-hosting", desc: "Portfolio management, Islamic index tracking, Sukuk ETF platform.", fee: 1499 },
  { title: "DarCloud — DarEdu Platform", provider: "darcloud-host", client: "daredu", type: "cloud-hosting", desc: "LMS, video streaming, certificate management for Islamic education.", fee: 999 },
  { title: "DarCloud — DarHealth Platform", provider: "darcloud-host", client: "darhealth", type: "cloud-hosting", desc: "Telemedicine, appointment booking, halal pharmacy management.", fee: 1499 },
  { title: "DarCloud — DarMedia Streaming", provider: "darcloud-host", client: "darmedia", type: "cloud-hosting", desc: "Video streaming, podcast hosting, content delivery for Islamic media.", fee: 1999 },

  // ═══════════════════════════════════════
  // QURANCHAIN BLOCKCHAIN SERVICES
  // ═══════════════════════════════════════
  { title: "QuranChain — DarCloud Blockchain Verification", provider: "quranchain", client: "darcloud-host", type: "blockchain-services", desc: "Smart contract verification, transaction logging, immutable audit trail across 47 chains.", fee: 1999 },
  { title: "QuranChain — HWC Smart Contracts", provider: "quranchain", client: "hwc", type: "smart-contracts", desc: "SHA-256 loan smart contracts, Murabaha/Musharakah contract chain.", fee: 2499 },
  { title: "QuranChain — Real Estate Smart Contracts", provider: "quranchain", client: "dar-al-nas", type: "smart-contracts", desc: "Property purchase smart contracts, title verification, $5K auto-approval.", fee: 1999 },
  { title: "QuranChain — Revenue Gas Toll Processing", provider: "quranchain", client: "darcloud-revenue", type: "gas-tolls", desc: "Gas toll collection, distribution across 47 chains, royalty enforcement.", fee: 999 },
  { title: "QuranChain — DarLaw Document Chain", provider: "quranchain", client: "darlaw", type: "blockchain-notary", desc: "Legal document SHA-256 hashing, immutable filing records, verification.", fee: 799 },
  { title: "QuranChain — DarPay Transaction Ledger", provider: "quranchain", client: "darpay", type: "blockchain-ledger", desc: "Payment transaction ledger, audit trail, Shariah compliance on-chain.", fee: 1499 },
  { title: "QuranChain — DarTakaful Claims Chain", provider: "quranchain", client: "dartakaful", type: "smart-contracts", desc: "Takaful claims processing, risk pool management, surplus distribution on-chain.", fee: 1999 },
  { title: "QuranChain — DarSukuk Bond Chain", provider: "quranchain", client: "darsukuk", type: "smart-contracts", desc: "Sukuk issuance, coupon distribution, maturity tracking on blockchain.", fee: 2499 },
  { title: "QuranChain — DarDeFi Protocol Contracts", provider: "quranchain", client: "dardefi", type: "smart-contracts", desc: "Halal DeFi lending pools, liquidity contracts, yield source verification.", fee: 1999 },
  { title: "QuranChain — DarTokenize Asset Chain", provider: "quranchain", client: "dartokenize", type: "smart-contracts", desc: "Real-world asset tokenization contracts, ownership verification, fractionalization.", fee: 1499 },
  { title: "QuranChain — DarWaqf Endowment Chain", provider: "quranchain", client: "darwaqf", type: "smart-contracts", desc: "Waqf endowment immutability, perpetual fund management on blockchain.", fee: 999 },
  { title: "QuranChain — DarZakat Distribution Chain", provider: "quranchain", client: "darzakat", type: "smart-contracts", desc: "Transparent zakat collection and distribution with on-chain audit trail.", fee: 799 },

  // ═══════════════════════════════════════
  // FUNGIMESH NETWORK SERVICES
  // ═══════════════════════════════════════
  { title: "FungiMesh — DarCloud Mesh Backbone", provider: "fungimesh", client: "darcloud-host", type: "mesh-networking", desc: "P2P encrypted mesh backbone for all inter-service communication. Quantum-hardened.", fee: 2999 },
  { title: "FungiMesh — QuranChain Node Mesh", provider: "fungimesh", client: "quranchain", type: "mesh-networking", desc: "Validator node mesh, peer discovery, block propagation across 47 chains.", fee: 1999 },
  { title: "FungiMesh — AI Fleet Distribution Mesh", provider: "fungimesh", client: "darcloud-ai", type: "mesh-networking", desc: "AI agent workload distribution, model routing, inference load balancing.", fee: 2499 },
  { title: "FungiMesh — Enterprise Private Mesh", provider: "fungimesh", client: "darcloud-enterprise", type: "private-mesh", desc: "Dedicated enterprise mesh tunnels, private channels, zero-trust networking.", fee: 3499 },
  { title: "FungiMesh — DarExchange Trading Mesh", provider: "fungimesh", client: "darexchange", type: "mesh-networking", desc: "Ultra-low-latency mesh for trading engine, order matching, price feeds.", fee: 2999 },
  { title: "FungiMesh — DarTakaful Claims Mesh", provider: "fungimesh", client: "dartakaful", type: "mesh-networking", desc: "Secure mesh for claims data, risk assessment sharing, retakaful networks.", fee: 1499 },

  // ═══════════════════════════════════════
  // AI FLEET SERVICES
  // ═══════════════════════════════════════
  { title: "AI Fleet — DarCloud Autonomous Ops", provider: "darcloud-ai", client: "darcloud-host", type: "ai-operations", desc: "24/7 autonomous monitoring, auto-scaling, incident response by AI fleet.", fee: 3999 },
  { title: "AI Fleet — QuranChain AI Validators", provider: "darcloud-ai", client: "quranchain", type: "ai-validation", desc: "Omar AI™ and QuranChain AI™ validators. Gas toll optimization, fraud detection.", fee: 2999 },
  { title: "AI Fleet — HWC Customer Service Bots", provider: "darcloud-ai", client: "hwc", type: "ai-customer-service", desc: "Islamic Finance Bot, Customer Service Bot, Payment Processor Bot.", fee: 1999 },
  { title: "AI Fleet — Real Estate Agent AI", provider: "darcloud-ai", client: "dar-al-nas", type: "ai-sales", desc: "Property matching, market analysis, auto-approval processing.", fee: 1499 },
  { title: "AI Fleet — Revenue Analytics Bots", provider: "darcloud-ai", client: "darcloud-revenue", type: "ai-analytics", desc: "Revenue Analytics Bot, Dynamic Pricing Agent, Optimization fleet.", fee: 1999 },
  { title: "AI Fleet — DarLaw Legal AI Agents", provider: "darcloud-ai", client: "darlaw", type: "ai-legal", desc: "Legal document AI agents, contract analysis, patent search bots.", fee: 2499 },
  { title: "AI Fleet — DarTakaful Underwriting AI", provider: "darcloud-ai", client: "dartakaful", type: "ai-underwriting", desc: "AI-powered Takaful risk assessment, claims adjudication, fraud detection.", fee: 2999 },
  { title: "AI Fleet — DarCredit Scoring AI", provider: "darcloud-ai", client: "darcredit", type: "ai-credit", desc: "Halal credit scoring, alternative data analysis, risk assessment AI.", fee: 1999 },
  { title: "AI Fleet — DarShariah Compliance AI", provider: "darcloud-ai", client: "darshariah", type: "ai-compliance", desc: "Real-time Shariah compliance checking, fatwa analysis, product screening.", fee: 2499 },
  { title: "AI Fleet — DarFood Halal Verification AI", provider: "darcloud-ai", client: "darfood", type: "ai-verification", desc: "AI ingredient analysis, halal certification verification, supply chain.", fee: 1499 },
  { title: "AI Fleet — DarHealth Medical AI", provider: "darcloud-ai", client: "darhealth", type: "ai-medical", desc: "Symptom analysis, appointment scheduling, halal drug interaction checks.", fee: 1999 },
  { title: "AI Fleet — DarEdu Tutoring AI", provider: "darcloud-ai", client: "daredu", type: "ai-education", desc: "Quran recitation AI, Arabic language tutor, Islamic finance course AI.", fee: 999 },

  // ═══════════════════════════════════════
  // HWC FINANCIAL SERVICES
  // ═══════════════════════════════════════
  { title: "HWC — DarCloud Corporate Banking", provider: "hwc", client: "darcloud-host", type: "corporate-banking", desc: "Halal corporate checking, treasury management, payroll processing.", fee: 499 },
  { title: "HWC — QuranChain Treasury", provider: "hwc", client: "quranchain", type: "treasury", desc: "Gas toll revenue treasury, validator reward distribution, Mudarabah.", fee: 499 },
  { title: "HWC — Enterprise Payroll", provider: "hwc", client: "darcloud-enterprise", type: "payroll", desc: "Halal payroll for all subsidiary employees. Zero-riba salary advances.", fee: 299 },
  { title: "HWC — DarTakaful Treasury", provider: "hwc", client: "dartakaful", type: "treasury", desc: "Takaful risk pool treasury, claims reserve management.", fee: 499 },
  { title: "HWC — DarSukuk Revenue Account", provider: "hwc", client: "darsukuk", type: "treasury", desc: "Sukuk coupon collection accounts, distribution escrow.", fee: 399 },

  // ═══════════════════════════════════════
  // DARTAKAFUL INSURANCE SERVICES
  // ═══════════════════════════════════════
  { title: "DarTakaful — DarCloud General Takaful", provider: "dartakaful", client: "darcloud-host", type: "general-takaful", desc: "General Takaful (cooperative insurance) for DarCloud data centers, workers, infrastructure.", fee: 4999 },
  { title: "DarTakaful — Real Estate Property Takaful", provider: "dartakaful", client: "dar-al-nas", type: "property-takaful", desc: "Property Takaful for all 31-market real estate portfolio. Fire, flood, liability.", fee: 3999 },
  { title: "DarTakaful — DarCommerce Merchant Takaful", provider: "dartakaful", client: "darcommerce", type: "merchant-takaful", desc: "Merchant liability Takaful for halal marketplace sellers and buyers.", fee: 1999 },
  { title: "DarTakaful — DarLogistics Cargo Takaful", provider: "dartakaful", client: "darlogistics", type: "cargo-takaful", desc: "Cargo and transit Takaful for halal supply chain shipments.", fee: 2499 },
  { title: "DarTakaful — DarHealth Medical Takaful", provider: "dartakaful", client: "darhealth", type: "medical-takaful", desc: "Medical Takaful for healthcare providers and patients on DarHealth network.", fee: 2999 },
  { title: "DarTakaful — Cyber Takaful All Companies", provider: "dartakaful", client: "darsecurity", type: "cyber-takaful", desc: "Cyber risk Takaful covering data breach, ransomware, business interruption.", fee: 4999 },
  { title: "DarTakaful — DarTravel Travel Takaful", provider: "dartakaful", client: "dartravel", type: "travel-takaful", desc: "Travel Takaful for DarTravel customers — trip cancellation, medical, lost baggage.", fee: 999 },

  // ═══════════════════════════════════════
  // REVENUE ENGINE SERVICES
  // ═══════════════════════════════════════
  { title: "Revenue Engine — DarCloud Billing", provider: "darcloud-revenue", client: "darcloud-host", type: "billing", desc: "Usage-based billing, Stripe integration, invoicing, zakat auto-calculation.", fee: 999 },
  { title: "Revenue Engine — HWC Payment Processing", provider: "darcloud-revenue", client: "hwc", type: "payment-processing", desc: "Mortgage payment processing, loan installments, Stripe subscriptions.", fee: 799 },
  { title: "Revenue Engine — Enterprise Metering", provider: "darcloud-revenue", client: "darcloud-enterprise", type: "metering", desc: "API call metering, usage tracking, custom enterprise invoicing.", fee: 599 },
  { title: "Revenue Engine — DarTakaful Premium Collection", provider: "darcloud-revenue", client: "dartakaful", type: "premium-collection", desc: "Takaful premium collection, contribution processing, surplus distribution.", fee: 799 },
  { title: "Revenue Engine — DarSukuk Coupon Distribution", provider: "darcloud-revenue", client: "darsukuk", type: "coupon-distribution", desc: "Sukuk coupon payment processing and distribution to holders.", fee: 599 },

  // ═══════════════════════════════════════
  // DARPAY PAYMENT SERVICES
  // ═══════════════════════════════════════
  { title: "DarPay — DarCloud Payment Gateway", provider: "darpay", client: "darcloud-host", type: "payment-gateway", desc: "Halal payment gateway, multi-currency, Stripe Connect.", fee: 999 },
  { title: "DarPay — Real Estate Payments", provider: "darpay", client: "dar-al-nas", type: "property-payments", desc: "$5K down payment processing, mortgage subscriptions, escrow.", fee: 1499 },
  { title: "DarPay — Enterprise Payment Rails", provider: "darpay", client: "darcloud-enterprise", type: "enterprise-payments", desc: "Enterprise plan processing, custom invoicing, ACH/wire.", fee: 799 },
  { title: "DarPay — DarTakaful Premium Payments", provider: "darpay", client: "dartakaful", type: "insurance-payments", desc: "Takaful premium collection via card, ACH, and crypto.", fee: 799 },
  { title: "DarPay — DarCommerce Checkout", provider: "darpay", client: "darcommerce", type: "marketplace-payments", desc: "Halal marketplace checkout, seller payouts, buyer protection.", fee: 999 },
  { title: "DarPay — DarRemit Corridor Payments", provider: "darpay", client: "darremit", type: "remittance-payments", desc: "Cross-border remittance settlement, corridor routing, fiat on/off-ramp.", fee: 1499 },

  // ═══════════════════════════════════════
  // DARLAW LEGAL SERVICES (for all companies)
  // ═══════════════════════════════════════
  { title: "DarLaw — DarCloud Corporate Legal", provider: "darlaw", client: "darcloud-host", type: "corporate-legal", desc: "Corporate governance, regulatory filings, SEC compliance, board resolutions.", fee: 4999 },
  { title: "DarLaw — QuranChain IP & Patent", provider: "darlaw", client: "quranchain", type: "ip-protection", desc: "Blockchain patent filings, gas toll IP protection across 47 jurisdictions.", fee: 3999 },
  { title: "DarLaw — FungiMesh Technology Patents", provider: "darlaw", client: "fungimesh", type: "ip-protection", desc: "Mesh network algorithm patents, quantum encryption IP, bio-inspired topology.", fee: 3499 },
  { title: "DarLaw — AI Fleet IP Protection", provider: "darlaw", client: "darcloud-ai", type: "ip-protection", desc: "AI agent architecture patents, model IP, training data rights.", fee: 2999 },
  { title: "DarLaw — HWC Regulatory Compliance", provider: "darlaw", client: "hwc", type: "regulatory-compliance", desc: "Banking license compliance, Shariah board filings, lending compliance 50 states.", fee: 5999 },
  { title: "DarLaw — Real Estate Title & Contracts", provider: "darlaw", client: "dar-al-nas", type: "real-estate-law", desc: "Title searches, purchase agreements, closing documents, deed filings.", fee: 3999 },
  { title: "DarLaw — Revenue Engine Tax", provider: "darlaw", client: "darcloud-revenue", type: "tax-compliance", desc: "Revenue reporting, tax filings, zakat compliance, international tax.", fee: 2999 },
  { title: "DarLaw — DarPay Financial Regulations", provider: "darlaw", client: "darpay", type: "financial-regulations", desc: "Money transmitter licenses, PCI-DSS, payment processor filings.", fee: 3499 },
  { title: "DarLaw — Enterprise Client Agreements", provider: "darlaw", client: "darcloud-enterprise", type: "contract-law", desc: "Enterprise SLA drafting, MSA templates, NDA management.", fee: 2499 },
  { title: "DarLaw — DarTakaful Insurance Regulatory", provider: "darlaw", client: "dartakaful", type: "insurance-regulation", desc: "Insurance department filings in 50 states, Takaful compliance, retakaful.", fee: 5999 },
  { title: "DarLaw — DarSukuk Securities Compliance", provider: "darlaw", client: "darsukuk", type: "securities-compliance", desc: "SEC Sukuk filings, securities compliance, investor protection documentation.", fee: 4999 },
  { title: "DarLaw — DarFintech Banking Licenses", provider: "darlaw", client: "darfintech", type: "banking-compliance", desc: "Fintech charter applications, neobank licensing, open banking compliance.", fee: 3999 },
  { title: "DarLaw — DarExchange CFTC/FinCEN", provider: "darlaw", client: "darexchange", type: "exchange-regulation", desc: "CFTC registration, FinCEN MSB filing, state crypto licenses.", fee: 4999 },
  { title: "DarLaw — DarDeFi Regulatory Framework", provider: "darlaw", client: "dardefi", type: "defi-compliance", desc: "DeFi regulatory compliance, no-action letter requests, compliance automation.", fee: 3499 },
  { title: "DarLaw — DarRemit MSB Compliance", provider: "darlaw", client: "darremit", type: "remittance-compliance", desc: "FinCEN MSB registration, state MTL applications, OFAC compliance.", fee: 3999 },
  { title: "DarLaw — DarMortgage Lending Compliance", provider: "darlaw", client: "darmortgage", type: "lending-compliance", desc: "TILA, RESPA, HMDA compliance for zero-riba mortgage origination.", fee: 3499 },
  { title: "DarLaw — DarCredit FCRA Compliance", provider: "darlaw", client: "darcredit", type: "credit-compliance", desc: "Fair Credit Reporting Act, ECOA, state credit reporting compliance.", fee: 2999 },
  { title: "DarLaw — International All Subsidiaries", provider: "darlaw", client: "darcloud-uae", type: "international-compliance", desc: "International corporate compliance for all 21 international subsidiaries.", fee: 9999 },

  // ═══════════════════════════════════════
  // DARSHARIAH COMPLIANCE SERVICES
  // ═══════════════════════════════════════
  { title: "DarShariah — Full Ecosystem Compliance", provider: "darshariah", client: "darcloud-host", type: "shariah-compliance", desc: "Shariah compliance certification for all 101 companies and products.", fee: 4999 },
  { title: "DarShariah — HWC Banking Products", provider: "darshariah", client: "hwc", type: "shariah-audit", desc: "Quarterly Shariah audit of all banking, lending, and investment products.", fee: 2999 },
  { title: "DarShariah — DarTakaful Product Review", provider: "darshariah", client: "dartakaful", type: "shariah-audit", desc: "Takaful product Shariah review, surplus distribution fatwa, retakaful compliance.", fee: 2499 },
  { title: "DarShariah — DarSukuk Certification", provider: "darshariah", client: "darsukuk", type: "shariah-certification", desc: "Sukuk structure certification, underlying asset Shariah verification.", fee: 1999 },
  { title: "DarShariah — DarDeFi Halal Screening", provider: "darshariah", client: "dardefi", type: "shariah-screening", desc: "Real-time DeFi protocol Shariah screening, haram token blacklisting.", fee: 1999 },
  { title: "DarShariah — DarExchange Token Screening", provider: "darshariah", client: "darexchange", type: "shariah-screening", desc: "Cryptocurrency Shariah screening, token classification (halal/haram/doubtful).", fee: 1499 },
  { title: "DarShariah — DarFood Halal Certification", provider: "darshariah", client: "darfood", type: "halal-certification", desc: "Halal food certification, ingredient verification, supply chain audit.", fee: 999 },
  { title: "DarShariah — DarPharmacy Halal Audit", provider: "darshariah", client: "darpharmacy", type: "halal-audit", desc: "Pharmaceutical halal verification, gelatin-free certification, excipient screening.", fee: 999 },

  // ═══════════════════════════════════════
  // ENTERPRISE, CDN, SECURITY, & INFRA SERVICES
  // ═══════════════════════════════════════
  { title: "Enterprise — DarCloud Compliance Engine", provider: "darcloud-enterprise", client: "darcloud-host", type: "compliance", desc: "Shariah compliance automation engine for all platform services.", fee: 1999 },
  { title: "DarCDN — DarCloud Global Delivery", provider: "darcdn", client: "darcloud-host", type: "cdn-services", desc: "Global content delivery across 200+ PoPs for all DarCloud services.", fee: 2999 },
  { title: "DarSecurity — DarCloud SOC", provider: "darsecurity", client: "darcloud-host", type: "soc-services", desc: "24/7 SOC monitoring, threat detection, incident response for all services.", fee: 4999 },
  { title: "DarVault — DarCloud Secret Management", provider: "darvault", client: "darcloud-host", type: "secret-management", desc: "API keys, certificates, encryption keys for all 101 companies.", fee: 1999 },
  { title: "DarDNS — DarCloud DNS Management", provider: "dardns", client: "darcloud-host", type: "dns-management", desc: "GeoDNS, DNSSEC, DDoS-resilient routing for all 120+ domains.", fee: 999 },
  { title: "API Gateway — All Companies Routing", provider: "darcloud-api", client: "darcloud-host", type: "api-routing", desc: "Centralized gateway routing, rate limiting, auth proxy for all services.", fee: 799 },
  { title: "DarCloud.net — Consumer Marketing", provider: "darcloud-net", client: "darcloud-host", type: "marketing", desc: "Consumer-facing marketing, lead generation, funnel management.", fee: 999 },
  { title: "DarAnalytics — DarCloud BI Platform", provider: "daranalytics", client: "darcloud-host", type: "analytics", desc: "Real-time dashboards, revenue analytics, customer insights for all companies.", fee: 1999 },

  // ═══════════════════════════════════════
  // DARREMIT & CROSS-BORDER SERVICES
  // ═══════════════════════════════════════
  { title: "DarRemit — HWC Member Remittance", provider: "darremit", client: "hwc", type: "remittance", desc: "Halal remittance services for HWC banking customers to 57 OIC nations.", fee: 999 },
  { title: "DarRemit — DarWealth International Transfers", provider: "darremit", client: "darwealth", type: "international-transfers", desc: "Asset repatriation, international fund transfers for wealth management.", fee: 1499 },

  // ═══════════════════════════════════════
  // LIFESTYLE & ADDITIONAL CROSS-SERVICES
  // ═══════════════════════════════════════
  { title: "DarFood — DarCommerce Halal Products", provider: "darfood", client: "darcommerce", type: "halal-supply", desc: "Halal food products supply for DarCommerce marketplace listings.", fee: 999 },
  { title: "DarLogistics — DarCommerce Fulfillment", provider: "darlogistics", client: "darcommerce", type: "fulfillment", desc: "Halal-certified warehousing, pick-pack-ship for marketplace orders.", fee: 1999 },
  { title: "DarLogistics — DarFood Cold Chain", provider: "darlogistics", client: "darfood", type: "cold-chain", desc: "Halal cold chain logistics, temperature monitoring, delivery.", fee: 1499 },
  { title: "DarMarketing — DarCommerce Growth", provider: "darmarketing", client: "darcommerce", type: "digital-marketing", desc: "SEO, PPC, social media marketing for halal marketplace.", fee: 999 },
  { title: "DarMarketing — DarTravel Promotion", provider: "darmarketing", client: "dartravel", type: "digital-marketing", desc: "Halal tourism marketing, destination promotion, influencer campaigns.", fee: 799 },
  { title: "DarHR — DarCloud Workforce", provider: "darhr", client: "darcloud-host", type: "hr-services", desc: "Recruitment, payroll, benefits administration for all 101 companies.", fee: 2999 },
  { title: "DarConsulting — DarCloud Strategy", provider: "darconsulting", client: "darcloud-host", type: "consulting", desc: "Strategic planning, Shariah business advisory, growth strategy.", fee: 4999 },

  // ═══════════════════════════════════════
  // BLOCKCHAIN & DEFI CROSS-SERVICES
  // ═══════════════════════════════════════
  { title: "DarWallet — DarPay Crypto Integration", provider: "darwallet", client: "darpay", type: "wallet-integration", desc: "Non-custodial wallet integration for DarPay crypto payments.", fee: 999 },
  { title: "DarBridge — DarExchange Cross-Chain", provider: "darbridge", client: "darexchange", type: "bridge-services", desc: "Cross-chain asset bridging for exchange listings across 47 networks.", fee: 1999 },
  { title: "DarOracle — DarDeFi Price Feeds", provider: "daroracle", client: "dardefi", type: "oracle-services", desc: "Real-time price feeds, yield rate oracles for DeFi protocols.", fee: 1499 },
  { title: "DarOracle — DarExchange Market Data", provider: "daroracle", client: "darexchange", type: "market-data", desc: "Exchange market data feeds, order book aggregation, analytics.", fee: 1999 },
  { title: "DarValidator — QuranChain Nodes", provider: "darvalidator", client: "quranchain", type: "validation", desc: "Proof-of-Intelligence validator node operations across 47 chains.", fee: 2999 },
  { title: "DarGasToll — QuranChain Gas Collection", provider: "dargastoll", client: "quranchain", type: "gas-collection", desc: "Gas toll collection and founder royalty enforcement across all chains.", fee: 1999 },
  { title: "DarLedger — DarLaw Document Ledger", provider: "darledger", client: "darlaw", type: "ledger-services", desc: "Immutable legal document ledger for court-admissible records.", fee: 999 },
  { title: "DarIdentity — DarCloud KYC", provider: "daridentity", client: "darcloud-host", type: "kyc-services", desc: "Decentralized KYC/AML for all DarCloud customer onboarding.", fee: 1999 },
  { title: "DarCustody — DarSukuk Asset Custody", provider: "darcustody", client: "darsukuk", type: "custody-services", desc: "Institutional custody for Sukuk underlying assets and collateral.", fee: 2999 },
  { title: "DarCustody — DarWealth Asset Custody", provider: "darcustody", client: "darwealth", type: "custody-services", desc: "Digital and traditional asset custody for wealth management.", fee: 2499 },
  { title: "DarLaunchpad — DarCapital Token Launches", provider: "darlaunchpad", client: "darcapital", type: "launchpad-services", desc: "Halal token launch platform for DarCapital portfolio companies.", fee: 1999 },
];
