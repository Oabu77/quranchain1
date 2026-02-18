// ══════════════════════════════════════════════════════════════
// DARCLOUD ECOSYSTEM — COMPLETE IP PORTFOLIO
// Owner: Omar Mohammad Abunadi
// Filed by: DarLaw™ AI
// ══════════════════════════════════════════════════════════════

export interface IPProtection {
  type: string;
  title: string;
  desc: string;
  jurisdiction: string;
}

export const ALL_TRADEMARKS: IPProtection[] = [
  // ═══ Core Platform Marks ═══
  { type: "trademark", title: "DarCloud™", desc: "Cloud computing platform. Classes: 9, 35, 42 (computer software, SaaS, cloud hosting).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "QuranChain™", desc: "Blockchain network. Classes: 9, 36, 42 (cryptocurrency, financial services, software).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "FungiMesh™", desc: "Bio-inspired mesh networking. Classes: 9, 38, 42 (networking, telecom, software).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarLaw™", desc: "Legal AI services. Classes: 9, 42, 45 (AI software, legal services, legal tech).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarPay™", desc: "Halal payment processing. Classes: 9, 36, 42 (payment software, financial, SaaS).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "Omar AI™", desc: "AI validator agent. Classes: 9, 42 (AI software, machine learning services).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "MeshTalk™", desc: "Encrypted mesh communication. Classes: 9, 38 (telecom software, messaging).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarCloud.net™", desc: "Consumer cloud network. Classes: 9, 38, 42 (network services, telecom, SaaS).", jurisdiction: "USPTO + Madrid Protocol (international)" },

  // ═══ Islamic Finance / Fintech Marks ═══
  { type: "trademark", title: "Halal Wealth Club™", desc: "Islamic private fund & banking. Classes: 36, 42 (banking, insurance, financial, SaaS).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarTakaful™", desc: "Islamic cooperative insurance. Classes: 36 (insurance services, risk management).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarSukuk™", desc: "Islamic bond platform. Classes: 36, 42 (financial instruments, securities, SaaS).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarMurabaha™", desc: "Cost-plus trade finance. Classes: 36 (trade finance, banking, lending).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarMusharakah™", desc: "Joint venture partnerships. Classes: 36 (venture capital, joint ventures, investments).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarMudarabah™", desc: "Profit-sharing investment fund. Classes: 36 (investment management, profit-sharing).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarIjarah™", desc: "Islamic lease finance. Classes: 36, 37 (lease-to-own, construction, property).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarIstisna™", desc: "Islamic construction finance. Classes: 36, 37 (construction finance, building).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarWakala™", desc: "Islamic agency services. Classes: 36, 42 (financial agency, SaaS).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarZakat™", desc: "Automated zakat calculation & distribution. Classes: 36, 42 (charity, financial, SaaS).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarWaqf™", desc: "Islamic endowment management. Classes: 36 (endowment, trust, charitable).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarShariah™", desc: "Shariah compliance certification. Classes: 42, 45 (compliance, certification, legal).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarFintech™", desc: "Muslim financial technology platform. Classes: 9, 36, 42 (fintech, banking software).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarCapital™", desc: "Halal venture capital. Classes: 36 (venture capital, investment management).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarWealth™", desc: "Halal asset management. Classes: 36 (wealth management, financial planning).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarRemit™", desc: "Halal remittance network. Classes: 36 (money transfer, remittance, currency exchange).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarMortgage™", desc: "Zero-riba home finance. Classes: 36 (mortgage lending, home finance).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarCredit™", desc: "Halal credit bureau & scoring. Classes: 36, 42 (credit reporting, financial data).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarExchange™", desc: "Halal forex & crypto exchange. Classes: 36, 42 (currency exchange, crypto trading).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarInsure™", desc: "Cooperative Islamic insurance. Classes: 36 (cooperative insurance, mutual coverage).", jurisdiction: "USPTO + Madrid Protocol (international)" },

  // ═══ Real Estate Marks ═══
  { type: "trademark", title: "Dar Al Nas™", desc: "Halal real estate holdings. Classes: 36, 37 (real estate services, construction).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarProperty™", desc: "Commercial real estate platform. Classes: 36 (commercial real estate, property mgmt).", jurisdiction: "USPTO + Madrid Protocol (international)" },

  // ═══ Technology Marks ═══
  { type: "trademark", title: "DarQuantum™", desc: "Quantum computing services. Classes: 9, 42 (quantum hardware/software).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarML™", desc: "Machine learning platform. Classes: 9, 42 (ML software, data science).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarCDN™", desc: "Content delivery network. Classes: 38, 42 (CDN, hosting, telecom).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarIPFS™", desc: "Distributed storage. Classes: 9, 42 (storage software, decentralized systems).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarVault™", desc: "Secrets & encryption management. Classes: 9, 42 (security software, encryption).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarEdge™", desc: "Edge computing platform. Classes: 9, 42 (edge computing, distributed processing).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "Dar5G™", desc: "5G core network services. Classes: 9, 38 (5G technology, telecom network).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarIoT™", desc: "Internet of Things platform. Classes: 9, 42 (IoT devices, connected systems).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarServer™", desc: "Bare metal hosting. Classes: 42 (server hosting, dedicated computing).", jurisdiction: "USPTO + Madrid Protocol (international)" },

  // ═══ Blockchain & DeFi Marks ═══
  { type: "trademark", title: "DarDeFi™", desc: "Halal decentralized finance. Classes: 36, 42 (DeFi, crypto finance, SaaS).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarNFT™", desc: "Islamic digital assets. Classes: 9, 42 (NFTs, digital collectibles).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarStaking™", desc: "Halal yield protocol. Classes: 36, 42 (staking, yield, crypto).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarBridge™", desc: "Cross-chain bridge protocol. Classes: 9, 42 (blockchain interoperability).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarDAO™", desc: "Decentralized governance. Classes: 9, 42 (DAO tooling, governance protocols).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarWallet™", desc: "Multi-chain crypto wallet. Classes: 9, 36 (wallet software, digital assets).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarSwap™", desc: "Halal DEX protocol. Classes: 36, 42 (decentralized exchange, trading).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarGasToll™", desc: "Blockchain gas toll collection. Classes: 9, 36 (transaction fees, revenue).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarOracle™", desc: "Blockchain data feeds. Classes: 9, 42 (oracle network, data services).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarLedger™", desc: "Distributed ledger technology. Classes: 9, 42 (DLT, immutable records).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarIdentity™", desc: "Decentralized KYC/identity. Classes: 42, 45 (identity verification, compliance).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarTokenize™", desc: "Asset digitization platform. Classes: 36, 42 (tokenization, real-world assets).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarCustody™", desc: "Digital asset custody. Classes: 36 (custody, safekeeping, trust).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarLaunchpad™", desc: "Halal token launch platform. Classes: 36, 42 (ICO/IDO, token sales).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarValidator™", desc: "Consensus node operations. Classes: 9, 42 (blockchain validation, node infrastructure).", jurisdiction: "USPTO + Madrid Protocol (international)" },

  // ═══ Lifestyle Marks ═══
  { type: "trademark", title: "DarGaming™", desc: "Islamic gaming platform. Classes: 9, 41 (entertainment software, gaming).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarCommerce™", desc: "Halal marketplace. Classes: 35 (e-commerce, online marketplace).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarFood™", desc: "Halal food supply chain. Classes: 29, 35 (halal food, supply chain).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarTravel™", desc: "Halal tourism. Classes: 39, 43 (travel services, hospitality).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarEdu™", desc: "Islamic education platform. Classes: 41, 42 (education, e-learning, SaaS).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarHealth™", desc: "Halal healthcare. Classes: 44 (healthcare, telemedicine, wellness).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarMedia™", desc: "Islamic content network. Classes: 38, 41 (media, broadcasting, content).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarFashion™", desc: "Modest clothing brand. Classes: 25, 35 (clothing, retail, fashion).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarPharmacy™", desc: "Halal pharmaceuticals. Classes: 5, 35 (pharmaceuticals, health products).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarLogistics™", desc: "Halal supply chain logistics. Classes: 39 (logistics, transportation, warehousing).", jurisdiction: "USPTO + Madrid Protocol (international)" },

  // ═══ Service Marks ═══
  { type: "trademark", title: "DarHR™", desc: "Muslim workforce solutions. Classes: 35 (HR services, recruitment, staffing).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarMarketing™", desc: "Digital growth agency. Classes: 35 (advertising, digital marketing).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarConsulting™", desc: "Islamic business advisory. Classes: 35 (consulting, business management).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarDevOps™", desc: "CI/CD automation. Classes: 42 (software development, DevOps).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarSecurity™", desc: "Cyber defense services. Classes: 42, 45 (cybersecurity, protection).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarAnalytics™", desc: "Business intelligence. Classes: 42 (data analytics, reporting, BI).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarMCP™", desc: "Model Context Protocol. Classes: 9, 42 (protocol software, API).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarOcean™", desc: "Data marketplace protocol. Classes: 42 (data exchange, marketplace).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarDNS™", desc: "Domain & routing services. Classes: 38, 42 (DNS, routing, network).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarRobotics™", desc: "Autonomous systems. Classes: 9, 42 (robotics, automation systems).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarContainer™", desc: "Container orchestration. Classes: 42 (container management, Kubernetes).", jurisdiction: "USPTO + Madrid Protocol (international)" },
  { type: "trademark", title: "DarData™", desc: "Data warehouse services. Classes: 42 (data warehousing, data lakes).", jurisdiction: "USPTO + Madrid Protocol (international)" },
];

export const ALL_PATENTS: IPProtection[] = [
  // ═══ Blockchain Patents ═══
  { type: "patent", title: "Gas Toll Revenue Collection System for Multi-Chain Blockchain Networks", desc: "Method and system for automated gas fee toll collection and revenue distribution across 47+ heterogeneous blockchain networks with immutable royalty splits. SHA-256 contract locking with 30% founder royalty enforcement.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Shariah-Compliant Smart Contract System for Zero-Riba Islamic Finance", desc: "Blockchain-based smart contract framework for Murabaha, Musharakah, Mudarabah, Ijarah, Istisna, Wakala, and Takaful products with on-chain Shariah compliance verification and automatic zakat calculation.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "AI Validator Consensus for Proof-of-Intelligence Blockchain Networks", desc: "System using GPT-4o-class AI agents as consensus validators with fraud detection, gas optimization, autonomous governance, and Shariah compliance verification on-chain.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Cross-Chain Islamic DeFi Bridge with Halal Yield Verification", desc: "Protocol for bridging assets across 47 blockchain networks with real-time Shariah compliance checking, automatic riba filtering, and halal yield certification.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Decentralized Takaful (Islamic Insurance) Smart Contract Protocol", desc: "Cooperative insurance protocol using blockchain smart contracts for risk-sharing pools, claims processing, surplus distribution per Shariah principles.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Sukuk (Islamic Bond) Tokenization and Distribution System", desc: "System for tokenizing Sukuk structures (Ijarah, Murabaha, Wakala Sukuk) on blockchain with automated profit distribution and compliance tracking.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Blockchain-Based Waqf (Endowment) Management and Distribution System", desc: "Immutable Islamic endowment management using smart contracts for perpetual charitable fund administration with transparent distribution.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Automated Zakat Calculation and Distribution via Blockchain", desc: "System for real-time zakat obligation calculation on digital assets, automated distribution to eligible recipients via blockchain with Shariah board verification.", jurisdiction: "USPTO (Provisional) + PCT International" },

  // ═══ Networking & Infrastructure Patents ═══
  { type: "patent", title: "Bio-Inspired Self-Healing Mesh Network Topology (FungiMesh)", desc: "Network architecture based on mycelial growth patterns for distributed mesh networks with quantum-resistant encrypted P2P communication. 340K node self-repair algorithm.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Quantum-Encrypted Edge Computing Revenue Distribution Engine", desc: "Post-quantum cryptographic system for real-time revenue distribution with immutable founder royalty enforcement across 200+ distributed edge nodes.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "5G-Integrated Mesh Relay System for Islamic Financial Networks", desc: "5G core network integration with FungiMesh topology for ultra-low-latency financial transaction processing across Muslim-majority markets.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Decentralized DNS with Blockchain-Verified Domain Ownership", desc: "DNS routing system using blockchain verification for domain ownership, anti-censorship routing, and Shariah-compliant content filtering.", jurisdiction: "USPTO (Provisional) + PCT International" },

  // ═══ AI & Machine Learning Patents ═══
  { type: "patent", title: "Autonomous AI Agent Fleet Orchestration Architecture", desc: "System for deploying, managing, and orchestrating 71+ specialized AI agents with tier-based hierarchy, workload distribution, and revenue sharing across edge nodes.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Shariah Compliance AI Verification Engine", desc: "AI system for real-time verification of financial product compliance with Islamic law, using NLP processing of fatwas, scholarly opinions, and AAOIFI standards.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "AI-Powered Halal Supply Chain Verification System", desc: "Machine learning system for real-time verification of halal compliance in food, pharmaceutical, and consumer product supply chains using IoT sensors and blockchain.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Multi-Agent Legal Document Generation with Islamic Law Integration", desc: "AI system for automated generation of legally binding documents incorporating Islamic jurisprudence (fiqh), including contracts, wills, and corporate filings.", jurisdiction: "USPTO (Provisional) + PCT International" },

  // ═══ Fintech Patents ═══
  { type: "patent", title: "Auto-Approval Mortgage System with $5K Universal Halal Down Payment", desc: "Automated property purchase approval using blockchain smart contracts, Stripe subscription mortgages, and AI-driven risk assessment for zero-riba home loans.", jurisdiction: "USPTO (Provisional)" },
  { type: "patent", title: "Halal Credit Scoring System Based on Islamic Financial Principles", desc: "Credit evaluation system that scores individuals on Shariah-compliant criteria: trust (amanah), asset-backed wealth, community standing, and transaction history.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Real-Time Halal Remittance Corridor Optimization System", desc: "System for optimizing cross-border remittance routing through halal corridors, minimizing fees while maintaining Shariah compliance across 57 OIC member nations.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Cooperative Takaful Risk Pool Management via Smart Contracts", desc: "AI-driven risk assessment and pool management for Takaful (Islamic insurance) with transparent surplus distribution and retakaful automation.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Islamic Microfinance Platform with Blockchain-Verified Murabaha", desc: "Micro-lending platform using cost-plus (Murabaha) financing model with blockchain verification, targeting underbanked Muslim communities globally.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Multi-Currency Halal Payment Gateway with Instant Settlement", desc: "Payment processing system supporting 180+ currencies with real-time Shariah compliance filtering, automatic riba exclusion, and instant fiat/crypto settlement.", jurisdiction: "USPTO (Provisional) + PCT International" },

  // ═══ Real Estate & Property Patents ═══
  { type: "patent", title: "Blockchain Property Title Verification and Transfer System", desc: "Immutable property title registry using blockchain smart contracts for deed recording, title insurance, and instant ownership transfer verification.", jurisdiction: "USPTO (Provisional)" },
  { type: "patent", title: "AI-Driven Halal Real Estate Valuation with Market Prediction", desc: "Machine learning system for property valuation incorporating halal investment criteria, community demographics, and mosque/school proximity scoring.", jurisdiction: "USPTO (Provisional)" },

  // ═══ IoT & Hardware Patents ═══
  { type: "patent", title: "IoT-Enabled Halal Certification Sensor Network", desc: "Network of IoT sensors for continuous monitoring of halal compliance in food processing, storage, and transportation with blockchain-verified certificates.", jurisdiction: "USPTO (Provisional) + PCT International" },
  { type: "patent", title: "Quantum-Resistant Cryptographic Module for Islamic Financial Transactions", desc: "Hardware security module implementing post-quantum cryptographic algorithms optimized for high-frequency Islamic financial transaction processing.", jurisdiction: "USPTO (Provisional) + PCT International" },
];

export const ALL_COPYRIGHTS: IPProtection[] = [
  { type: "copyright", title: "DarCloud Platform Complete Source Code", desc: "All source code for DarCloud Workers, API endpoints, mesh networking, blockchain validators, AI fleet, revenue engine, and all 101 subsidiary systems.", jurisdiction: "US Copyright Office" },
  { type: "copyright", title: "QuranChain Blockchain Implementation", desc: "QuranChain blockchain validator code, gas toll algorithms, smart contract templates, consensus protocol, and immutable Quran preservation system.", jurisdiction: "US Copyright Office" },
  { type: "copyright", title: "FungiMesh Network Protocol Implementation", desc: "FungiMesh P2P mesh protocol, relay algorithms, quantum encryption layer, bio-inspired topology generator, and self-healing network code.", jurisdiction: "US Copyright Office" },
  { type: "copyright", title: "DarLaw AI Legal Document Templates", desc: "Complete library of Shariah-compliant legal document templates: contracts, articles of organization, operating agreements, patent applications.", jurisdiction: "US Copyright Office" },
  { type: "copyright", title: "DarTakaful Insurance Product Architecture", desc: "Cooperative insurance product designs, risk pool algorithms, claims processing workflows, and surplus distribution formulas.", jurisdiction: "US Copyright Office" },
  { type: "copyright", title: "DarFintech Islamic Banking Interface Designs", desc: "UI/UX designs for all Islamic banking products: checking, savings, mortgages, loans, credit scoring, remittance, and investment interfaces.", jurisdiction: "US Copyright Office" },
  { type: "copyright", title: "DarEdu Islamic Curriculum Content", desc: "Islamic education content library: Quran studies, Arabic language, Islamic finance courses, halal business training materials.", jurisdiction: "US Copyright Office" },
  { type: "copyright", title: "DarMedia Content Library", desc: "Islamic media content: documentaries, educational videos, podcast scripts, and digital content produced by DarMedia network.", jurisdiction: "US Copyright Office" },
];

export const ALL_TRADE_SECRETS: IPProtection[] = [
  { type: "trade-secret", title: "DarCloud Revenue Distribution Algorithm", desc: "Proprietary algorithm for 30/40/10/18/2 revenue distribution with real-time gas toll optimization across 47 chains. Founder royalty calculation engine.", jurisdiction: "USA — Federal (DTSA)" },
  { type: "trade-secret", title: "AI Agent Training Data & Fine-Tuning Configurations", desc: "Proprietary training data, fine-tuning configs, agent personality templates, and system prompts for all 71 AI agents and 12 core assistants.", jurisdiction: "USA — Federal (DTSA)" },
  { type: "trade-secret", title: "FungiMesh Mycelial Growth Algorithm", desc: "Bio-inspired network topology optimization algorithm based on proprietary mycelial growth simulation with quantum-resistant path selection.", jurisdiction: "USA — Federal (DTSA)" },
  { type: "trade-secret", title: "DarTakaful Actuarial Models", desc: "Proprietary Shariah-compliant actuarial models for cooperative insurance risk assessment, pricing, and surplus distribution formulas.", jurisdiction: "USA — Federal (DTSA)" },
  { type: "trade-secret", title: "Halal Credit Scoring Formula", desc: "Proprietary credit scoring methodology based on Islamic financial principles, community trust metrics, and asset-backed wealth evaluation.", jurisdiction: "USA — Federal (DTSA)" },
  { type: "trade-secret", title: "QuranChain Consensus Protocol Parameters", desc: "Validator selection weights, block finality thresholds, AI consensus voting algorithms, and fork-resolution strategies across 47 chains.", jurisdiction: "USA — Federal (DTSA)" },
];

export const ALL_INTERNATIONAL_IP: IPProtection[] = [
  { type: "international-ip", title: "GCC Intellectual Property — All 101 DarCloud Brands", desc: "Trademark, patent, and copyright filings in UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman for all DarCloud ecosystem brands and technologies.", jurisdiction: "GCC Patent Office" },
  { type: "international-ip", title: "EU Intellectual Property — All 101 DarCloud Brands", desc: "EUTM and unitary patent filings for all DarCloud ecosystem brands and technologies including Islamic fintech innovations.", jurisdiction: "EUIPO + European Patent Office" },
  { type: "international-ip", title: "WIPO — All International Patent Applications (PCT)", desc: "PCT international patent applications for all 27 provisional patents. 153-country coverage via Patent Cooperation Treaty.", jurisdiction: "WIPO (PCT)" },
  { type: "international-ip", title: "OIC Member States — Islamic Finance IP Portfolio", desc: "Intellectual property filings across all 57 Organisation of Islamic Cooperation member states for Islamic finance technologies.", jurisdiction: "OIC Member States (57 countries)" },
  { type: "international-ip", title: "ASEAN IP Registry — Southeast Asian Markets", desc: "Trademark and patent filings in Malaysia, Indonesia, Singapore, Brunei, and other ASEAN member states.", jurisdiction: "ASEAN IP Offices" },
  { type: "international-ip", title: "African Regional IP — North & West Africa", desc: "OAPI and ARIPO trademark and patent filings covering 38 African nations for DarCloud ecosystem.", jurisdiction: "OAPI + ARIPO" },
  { type: "international-ip", title: "South Asian IP Registration — Pakistan, Bangladesh, India", desc: "Trademark and patent filings in South Asian markets with significant Muslim populations.", jurisdiction: "Pakistan IPO + DPDT + Indian Patent Office" },
];

export const ALL_DOMAIN_PROTECTIONS: IPProtection[] = [
  { type: "domain-portfolio", title: "DarCloud Master Domain Portfolio — 120+ Domains", desc: "darcloud.host, darcloud.net, and all 101 subsidiary subdomains. UDRP protection, registrar lock, WHOIS privacy, DNSSEC enabled.", jurisdiction: "ICANN / International" },
];
