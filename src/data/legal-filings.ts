// ══════════════════════════════════════════════════════════════
// DARCLOUD ECOSYSTEM — LEGAL FILINGS
// Filed by: DarLaw™ AI Legal Agent Fleet
// ══════════════════════════════════════════════════════════════

export interface LegalFiling {
  type: string;
  title: string;
  entity: string;
  jurisdiction: string;
  desc: string;
}

export const ALL_LEGAL_FILINGS: LegalFiling[] = [
  // ═══ Corporate Formation (12 domestic) ═══
  { type: "articles-of-organization", title: "DarCloud Platform LLC — Articles of Organization", entity: "DarCloud Platform LLC", jurisdiction: "Delaware", desc: "Parent holding company formation. Omar Mohammad Abunadi sole member/manager. 30% immutable founder royalty." },
  { type: "articles-of-organization", title: "DarCloud Network Services LLC — Articles of Organization", entity: "DarCloud Network Services LLC", jurisdiction: "Delaware", desc: "Consumer cloud network services subsidiary." },
  { type: "articles-of-incorporation", title: "QuranChain Blockchain Corp — Certificate of Incorporation", entity: "QuranChain Blockchain Corp", jurisdiction: "Wyoming", desc: "Wyoming blockchain-optimized corporation. DAO-ready structure for 47-chain network." },
  { type: "articles-of-incorporation", title: "FungiMesh Network Inc — Certificate of Incorporation", entity: "FungiMesh Network Inc", jurisdiction: "Delaware", desc: "Delaware C-Corp for bio-inspired mesh networking with 340K node infrastructure." },
  { type: "articles-of-organization", title: "DarCloud AI LLC — Articles of Organization", entity: "DarCloud Artificial Intelligence LLC", jurisdiction: "Delaware", desc: "71-agent AI fleet operations and GPT-4o assistant services." },
  { type: "articles-of-organization", title: "DarCloud Enterprise LLC — Articles of Organization", entity: "DarCloud Enterprise Solutions LLC", jurisdiction: "Delaware", desc: "Enterprise SLA-backed cloud infrastructure and compliance engine." },
  { type: "articles-of-organization", title: "DarCloud Revenue Corp — Certificate of Incorporation", entity: "DarCloud Revenue & Billing Corp", jurisdiction: "Delaware", desc: "Revenue engine, gas toll distribution, billing and Stripe integration." },
  { type: "articles-of-organization", title: "DarCloud API LLC — Articles of Organization", entity: "DarCloud API Services LLC", jurisdiction: "Delaware", desc: "Centralized API gateway, routing, auth proxy, rate limiting." },
  { type: "articles-of-organization", title: "DarLaw Legal Intelligence LLC — Articles of Organization", entity: "DarLaw Legal Intelligence LLC", jurisdiction: "Texas", desc: "AI-powered legal services, document automation, IP protection." },
  { type: "articles-of-incorporation", title: "DarPay Halal Payments Inc — Certificate of Incorporation", entity: "DarPay Halal Payments Inc", jurisdiction: "Delaware", desc: "Halal payment processing, multi-currency gateway, Stripe Connect." },
  { type: "articles-of-organization", title: "Halal Wealth Club LLC — Articles of Organization", entity: "Halal Wealth Club Private Fund LLC", jurisdiction: "Texas", desc: "Private fund under Texas exemption for Shariah-compliant banking." },
  { type: "articles-of-organization", title: "Dar Al Nas Property Holdings LLC — Articles of Organization", entity: "Dar Al Nas Property Holdings LLC", jurisdiction: "Texas", desc: "Halal real estate acquisition, zero-riba financing in 31 markets." },

  // ═══ Islamic Finance Entities (18) ═══
  { type: "articles-of-incorporation", title: "DarTakaful Islamic Insurance Corp — Certificate of Incorporation", entity: "DarTakaful Islamic Insurance Corp", jurisdiction: "Texas", desc: "Cooperative Islamic insurance (Takaful) — general, family, health, and property coverage." },
  { type: "articles-of-organization", title: "DarSukuk Islamic Bonds LLC — Articles of Organization", entity: "DarSukuk Islamic Bonds LLC", jurisdiction: "Delaware", desc: "Sukuk (Islamic bond) issuance, trading, and management platform." },
  { type: "articles-of-organization", title: "DarMurabaha Trade Finance LLC — Articles of Organization", entity: "DarMurabaha Trade Finance LLC", jurisdiction: "Delaware", desc: "Cost-plus (Murabaha) trade finance and merchandise financing." },
  { type: "articles-of-organization", title: "DarMusharakah Joint Ventures LLC — Articles of Organization", entity: "DarMusharakah Joint Ventures LLC", jurisdiction: "Texas", desc: "Diminishing Musharakah joint venture partnerships and equity financing." },
  { type: "articles-of-organization", title: "DarMudarabah Investment Fund LLC — Articles of Organization", entity: "DarMudarabah Investment Fund LLC", jurisdiction: "Delaware", desc: "Profit-sharing (Mudarabah) investment fund under Reg D exemption." },
  { type: "articles-of-organization", title: "DarIjarah Lease Finance LLC — Articles of Organization", entity: "DarIjarah Lease Finance LLC", jurisdiction: "Texas", desc: "Islamic lease-to-own (Ijarah) financing for equipment, vehicles, property." },
  { type: "articles-of-organization", title: "DarIstisna Construction Finance LLC — Articles of Organization", entity: "DarIstisna Construction Finance LLC", jurisdiction: "Texas", desc: "Islamic construction (Istisna) financing for real estate development." },
  { type: "articles-of-organization", title: "DarWakala Agency Services LLC — Articles of Organization", entity: "DarWakala Agency Services LLC", jurisdiction: "Delaware", desc: "Wakala (agency) investment management and fund administration." },
  { type: "articles-of-organization", title: "DarZakat Charitable Trust — Trust Formation", entity: "DarZakat Charitable Trust", jurisdiction: "Texas", desc: "Charitable trust for automated zakat calculation and distribution." },
  { type: "articles-of-organization", title: "DarWaqf Islamic Endowment — Foundation Formation", entity: "DarWaqf Islamic Endowment Foundation", jurisdiction: "Texas", desc: "Islamic endowment (Waqf) for perpetual charitable fund management." },
  { type: "articles-of-organization", title: "DarShariah Compliance Board LLC — Articles of Organization", entity: "DarShariah Compliance Board LLC", jurisdiction: "Texas", desc: "Shariah advisory and compliance certification body." },
  { type: "articles-of-incorporation", title: "DarFintech Muslim Financial Technology Inc — Certificate of Incorporation", entity: "DarFintech Muslim Financial Technology Inc", jurisdiction: "Delaware", desc: "Muslim fintech platform aggregating all Islamic financial services." },
  { type: "articles-of-organization", title: "DarCapital Halal Venture Capital LLC — Articles of Organization", entity: "DarCapital Halal Venture Capital LLC", jurisdiction: "Delaware", desc: "Shariah-compliant venture capital fund for halal startups." },
  { type: "articles-of-organization", title: "DarWealth Halal Asset Management LLC — Articles of Organization", entity: "DarWealth Halal Asset Management LLC", jurisdiction: "Delaware", desc: "Halal portfolio management, Sukuk ETFs, Islamic index funds." },
  { type: "articles-of-organization", title: "DarRemit Halal Remittance LLC — Articles of Organization", entity: "DarRemit Halal Remittance LLC", jurisdiction: "Delaware", desc: "Cross-border halal remittance to 57 OIC member nations." },
  { type: "articles-of-organization", title: "DarMortgage Zero-Riba LLC — Articles of Organization", entity: "DarMortgage Zero-Riba Home Finance LLC", jurisdiction: "Texas", desc: "Zero-riba home finance using Diminishing Musharakah model." },
  { type: "articles-of-organization", title: "DarCredit Halal Credit Bureau LLC — Articles of Organization", entity: "DarCredit Halal Credit Bureau LLC", jurisdiction: "Delaware", desc: "Alternative credit scoring based on Islamic financial principles." },
  { type: "articles-of-organization", title: "DarExchange Halal Forex & Crypto LLC — Articles of Organization", entity: "DarExchange Halal Forex & Crypto LLC", jurisdiction: "Wyoming", desc: "Shariah-compliant currency exchange and spot crypto trading." },

  // ═══ Technology Entities (20) ═══
  { type: "articles-of-incorporation", title: "Omar AI Validator Systems Inc — Certificate of Incorporation", entity: "Omar AI Validator Systems Inc", jurisdiction: "Delaware", desc: "AI validator agent systems for blockchain consensus." },
  { type: "articles-of-incorporation", title: "MeshTalk Communications Inc — Certificate of Incorporation", entity: "MeshTalk Communications Inc", jurisdiction: "Delaware", desc: "Encrypted mesh communication protocol and hardware." },
  { type: "articles-of-organization", title: "DarQuantum Computing LLC — Articles of Organization", entity: "DarQuantum Computing LLC", jurisdiction: "Delaware", desc: "Quantum computing services and post-quantum cryptography." },
  { type: "articles-of-incorporation", title: "DarML Machine Learning Corp — Certificate of Incorporation", entity: "DarML Machine Learning Corp", jurisdiction: "Delaware", desc: "Machine learning platform and model marketplace." },
  { type: "articles-of-organization", title: "DarOcean Data Protocol LLC — Articles of Organization", entity: "DarOcean Data Protocol LLC", jurisdiction: "Delaware", desc: "Decentralized data marketplace and Ocean Protocol integration." },
  { type: "articles-of-incorporation", title: "DarCDN Content Delivery Inc — Certificate of Incorporation", entity: "DarCDN Content Delivery Inc", jurisdiction: "Delaware", desc: "Global CDN with 200+ PoPs across 6 continents." },
  { type: "articles-of-organization", title: "DarIPFS Distributed Storage LLC — Articles of Organization", entity: "DarIPFS Distributed Storage LLC", jurisdiction: "Delaware", desc: "IPFS pinning, distributed file storage, immutable media hosting." },
  { type: "articles-of-organization", title: "DarVault Secrets & Encryption LLC — Articles of Organization", entity: "DarVault Secrets & Encryption LLC", jurisdiction: "Delaware", desc: "Secret management, key rotation, HSM, and encryption-as-a-service." },
  { type: "articles-of-incorporation", title: "DarAnalytics Intelligence Corp — Certificate of Incorporation", entity: "DarAnalytics Intelligence Corp", jurisdiction: "Delaware", desc: "Business intelligence, real-time analytics, and dashboard platform." },
  { type: "articles-of-incorporation", title: "Dar5G Core Network Inc — Certificate of Incorporation", entity: "Dar5G Core Network Inc", jurisdiction: "Delaware", desc: "5G core network infrastructure for ultra-low-latency services." },
  { type: "articles-of-organization", title: "DarMCP Protocol Services LLC — Articles of Organization", entity: "DarMCP Protocol Services LLC", jurisdiction: "Delaware", desc: "Model Context Protocol services for AI connectivity." },
  { type: "articles-of-organization", title: "DarDevOps CI/CD Automation LLC — Articles of Organization", entity: "DarDevOps CI/CD Automation LLC", jurisdiction: "Delaware", desc: "Automated CI/CD pipelines, infrastructure-as-code." },
  { type: "articles-of-incorporation", title: "DarSecurity Cyber Defense Inc — Certificate of Incorporation", entity: "DarSecurity Cyber Defense Inc", jurisdiction: "Delaware", desc: "SOC-as-a-service, penetration testing, threat intelligence." },
  { type: "articles-of-organization", title: "DarDNS Domain & Routing LLC — Articles of Organization", entity: "DarDNS Domain & Routing LLC", jurisdiction: "Delaware", desc: "Managed DNS, GeoDNS, DDoS-resilient routing." },
  { type: "articles-of-organization", title: "DarEdge Computing LLC — Articles of Organization", entity: "DarEdge Computing LLC", jurisdiction: "Delaware", desc: "Edge compute nodes in 200+ locations globally." },
  { type: "articles-of-organization", title: "DarIoT Internet of Things LLC — Articles of Organization", entity: "DarIoT Internet of Things LLC", jurisdiction: "Delaware", desc: "IoT device platform, sensor networks, smart building." },
  { type: "articles-of-incorporation", title: "DarRobotics Autonomous Systems Inc — Certificate of Incorporation", entity: "DarRobotics Autonomous Systems Inc", jurisdiction: "Delaware", desc: "Autonomous systems, warehouse robots, delivery drones." },
  { type: "articles-of-incorporation", title: "DarServer Bare Metal Hosting Corp — Certificate of Incorporation", entity: "DarServer Bare Metal Hosting Corp", jurisdiction: "Delaware", desc: "Dedicated bare metal servers for high-performance workloads." },
  { type: "articles-of-organization", title: "DarContainer Orchestration LLC — Articles of Organization", entity: "DarContainer Orchestration LLC", jurisdiction: "Delaware", desc: "Kubernetes, Docker orchestration, managed container runtime." },
  { type: "articles-of-organization", title: "DarData Warehouse & Lakes LLC — Articles of Organization", entity: "DarData Warehouse & Lakes LLC", jurisdiction: "Delaware", desc: "Data warehousing, data lakes, ETL pipeline management." },

  // ═══ Lifestyle & Commerce Entities (15) ═══
  { type: "articles-of-organization", title: "DarGaming Islamic Entertainment LLC — Articles of Organization", entity: "DarGaming Islamic Entertainment LLC", jurisdiction: "Delaware", desc: "Islamic gaming, halal esports, educational game platform." },
  { type: "articles-of-incorporation", title: "DarCommerce Halal Marketplace Inc — Certificate of Incorporation", entity: "DarCommerce Halal Marketplace Inc", jurisdiction: "Delaware", desc: "Halal e-commerce marketplace with certified vendor network." },
  { type: "articles-of-organization", title: "DarFood Halal Supply Chain LLC — Articles of Organization", entity: "DarFood Halal Supply Chain LLC", jurisdiction: "Texas", desc: "Halal food certification, supply chain tracking, restaurant marketplace." },
  { type: "articles-of-organization", title: "DarTravel Halal Tourism LLC — Articles of Organization", entity: "DarTravel Halal Tourism & Hospitality LLC", jurisdiction: "Delaware", desc: "Halal-friendly travel booking, Muslim-friendly hotel ratings." },
  { type: "articles-of-organization", title: "DarEdu Islamic Education LLC — Articles of Organization", entity: "DarEdu Islamic Education Platform LLC", jurisdiction: "Texas", desc: "Islamic online education: Quran, Arabic, finance, business." },
  { type: "articles-of-organization", title: "DarHealth Halal Healthcare LLC — Articles of Organization", entity: "DarHealth Halal Healthcare LLC", jurisdiction: "Texas", desc: "Halal telemedicine, Muslim doctor network, halal pharmacy." },
  { type: "articles-of-organization", title: "DarMedia Islamic Content Network LLC — Articles of Organization", entity: "DarMedia Islamic Content Network LLC", jurisdiction: "Delaware", desc: "Islamic streaming, podcasts, documentaries, news platform." },
  { type: "articles-of-organization", title: "DarFashion Modest Clothing LLC — Articles of Organization", entity: "DarFashion Modest Clothing LLC", jurisdiction: "Delaware", desc: "Modest fashion marketplace, hijab designer network, halal cosmetics." },
  { type: "articles-of-organization", title: "DarProperty Commercial Real Estate LLC — Articles of Organization", entity: "DarProperty Commercial Real Estate LLC", jurisdiction: "Texas", desc: "Commercial real estate: masjid development, Islamic centers, halal industrial parks." },
  { type: "articles-of-incorporation", title: "DarLogistics Halal Supply Chain Corp — Certificate of Incorporation", entity: "DarLogistics Halal Supply Chain Corp", jurisdiction: "Delaware", desc: "Halal logistics, cold chain, last-mile delivery for halal products." },
  { type: "articles-of-organization", title: "DarHR Muslim Workforce Solutions LLC — Articles of Organization", entity: "DarHR Muslim Workforce Solutions LLC", jurisdiction: "Texas", desc: "Muslim professional network, halal workplace solutions, prayer-friendly HR." },
  { type: "articles-of-organization", title: "DarMarketing Digital Growth LLC — Articles of Organization", entity: "DarMarketing Digital Growth LLC", jurisdiction: "Delaware", desc: "Digital marketing for Islamic brands, halal SEO, Muslim audience targeting." },
  { type: "articles-of-organization", title: "DarConsulting Islamic Business Advisory LLC — Articles of Organization", entity: "DarConsulting Islamic Business Advisory LLC", jurisdiction: "Texas", desc: "Islamic business consulting, Shariah audit, halal certification advisory." },
  { type: "articles-of-organization", title: "DarPharmacy Halal Pharmaceuticals LLC — Articles of Organization", entity: "DarPharmacy Halal Pharmaceuticals LLC", jurisdiction: "Texas", desc: "Halal pharmaceutical verification, gelatin-free alternatives, Muslim health products." },
  { type: "articles-of-organization", title: "DarInsure Cooperative Insurance LLC — Articles of Organization", entity: "DarInsure Cooperative Insurance LLC", jurisdiction: "Texas", desc: "Cooperative (mutual) insurance for Muslims who prefer non-Takaful cooperative models." },

  // ═══ Blockchain & DeFi Entities (15) ═══
  { type: "articles-of-organization", title: "DarDeFi Halal DeFi LLC — Articles of Organization", entity: "DarDeFi Halal Decentralized Finance LLC", jurisdiction: "Wyoming", desc: "Shariah-compliant DeFi protocols: lending, borrowing, liquidity pools." },
  { type: "articles-of-organization", title: "DarNFT Islamic Digital Assets LLC — Articles of Organization", entity: "DarNFT Islamic Digital Assets LLC", jurisdiction: "Wyoming", desc: "Islamic NFTs: calligraphy, Islamic art, Quran verse collectibles." },
  { type: "articles-of-organization", title: "DarStaking Halal Yield Protocol LLC — Articles of Organization", entity: "DarStaking Halal Yield Protocol LLC", jurisdiction: "Wyoming", desc: "Halal staking with Shariah-verified yield sources." },
  { type: "articles-of-incorporation", title: "DarBridge Cross-Chain Protocol Inc — Certificate of Incorporation", entity: "DarBridge Cross-Chain Protocol Inc", jurisdiction: "Wyoming", desc: "Cross-chain bridge connecting 47 blockchain networks." },
  { type: "articles-of-organization", title: "DarDAO Decentralized Governance LLC — Articles of Organization", entity: "DarDAO Decentralized Governance LLC", jurisdiction: "Wyoming", desc: "DAO tooling with Shura (consultation) governance model." },
  { type: "articles-of-incorporation", title: "DarWallet Multi-Chain Wallet Inc — Certificate of Incorporation", entity: "DarWallet Multi-Chain Wallet Inc", jurisdiction: "Delaware", desc: "Non-custodial multi-chain wallet with halal portfolio filtering." },
  { type: "articles-of-organization", title: "DarTokenize Asset Digitization LLC — Articles of Organization", entity: "DarTokenize Asset Digitization LLC", jurisdiction: "Wyoming", desc: "Real-world asset tokenization: property, Sukuk, commodities." },
  { type: "articles-of-organization", title: "DarSwap Halal DEX Protocol LLC — Articles of Organization", entity: "DarSwap Halal DEX Protocol LLC", jurisdiction: "Wyoming", desc: "Decentralized exchange with automatic haram token screening." },
  { type: "articles-of-organization", title: "DarCustody Digital Asset Trust LLC — Articles of Organization", entity: "DarCustody Digital Asset Trust LLC", jurisdiction: "Wyoming", desc: "Institutional-grade digital asset custody with Shariah oversight." },
  { type: "articles-of-incorporation", title: "DarValidator Consensus Nodes Inc — Certificate of Incorporation", entity: "DarValidator Consensus Nodes Inc", jurisdiction: "Wyoming", desc: "Proof-of-Intelligence validator nodes across 47 chains." },
  { type: "articles-of-organization", title: "DarLaunchpad Halal Token Launch LLC — Articles of Organization", entity: "DarLaunchpad Halal Token Launch LLC", jurisdiction: "Wyoming", desc: "Shariah-approved token launch with vetting and compliance." },
  { type: "articles-of-incorporation", title: "DarOracle Blockchain Data Feeds Inc — Certificate of Incorporation", entity: "DarOracle Blockchain Data Feeds Inc", jurisdiction: "Delaware", desc: "Decentralized oracle network with verified halal data feeds." },
  { type: "articles-of-organization", title: "DarGasToll Revenue Collection LLC — Articles of Organization", entity: "DarGasToll Revenue Collection LLC", jurisdiction: "Wyoming", desc: "Gas toll revenue collection and distribution across 47 chains." },
  { type: "articles-of-organization", title: "DarLedger Distributed Ledger Tech LLC — Articles of Organization", entity: "DarLedger Distributed Ledger Tech LLC", jurisdiction: "Delaware", desc: "Enterprise distributed ledger solutions for Islamic institutions." },
  { type: "articles-of-organization", title: "DarIdentity Decentralized KYC LLC — Articles of Organization", entity: "DarIdentity Decentralized KYC LLC", jurisdiction: "Delaware", desc: "Self-sovereign identity with Shariah-compliant KYC/AML." },

  // ═══ Operating Agreements ═══
  { type: "operating-agreement", title: "DarCloud Ecosystem Master Operating Agreement", entity: "All 101 Companies", jurisdiction: "USA — Multi-state", desc: "Master operating agreement: 30% Founder Royalty immutable, 2% Zakat, revenue distribution 30/40/10/18/2, Shariah Board oversight required." },
  { type: "operating-agreement", title: "DarCloud Islamic Finance Operating Protocol", entity: "All Fintech Subsidiaries", jurisdiction: "USA — Multi-state", desc: "Islamic finance operating standards: zero-riba mandate, Takaful requirements, Sukuk compliance, Murabaha markup caps." },

  // ═══ EIN Applications ═══
  { type: "ein-application", title: "IRS Form SS-4 — All 80 Domestic Companies", entity: "DarCloud Domestic Ecosystem", jurisdiction: "USA — Federal", desc: "EIN applications for all 80 US-domiciled DarCloud companies." },

  // ═══ Business Licenses ═══
  { type: "business-license", title: "Texas Business Licenses — 20 Texas Entities", entity: "Texas Entities", jurisdiction: "Texas", desc: "State business licenses for all 20 Texas-domiciled subsidiaries." },
  { type: "business-license", title: "Delaware Business Licenses — 47 Delaware Entities", entity: "Delaware Entities", jurisdiction: "Delaware", desc: "Annual franchise tax and licenses for 47 Delaware entities." },
  { type: "business-license", title: "Wyoming Business Licenses — 13 Wyoming Entities", entity: "Wyoming Entities", jurisdiction: "Wyoming", desc: "State licenses for 13 Wyoming blockchain-optimized entities." },

  // ═══ Shariah Certifications ═══
  { type: "shariah-certification", title: "AAOIFI Shariah Compliance — All Financial Products", entity: "DarCloud Ecosystem", jurisdiction: "International (AAOIFI)", desc: "Accounting and Auditing Organization for Islamic Financial Institutions compliance for all 101 companies." },
  { type: "shariah-certification", title: "Shariah Board Appointment — 7 Scholar Panel", entity: "DarShariah Board", jurisdiction: "International", desc: "Appointment of 7-member Shariah advisory board from Al-Azhar, Islamic University of Madinah, IIUM, and INCEIF scholars." },

  // ═══ Financial Regulatory Filings ═══
  { type: "sec-filing", title: "SEC Form D — Halal Wealth Club Private Fund", entity: "Halal Wealth Club Private Fund LLC", jurisdiction: "USA — Federal (SEC)", desc: "Regulation D private placement exemption for HWC qualified fund." },
  { type: "sec-filing", title: "SEC Form D — DarMudarabah Investment Fund", entity: "DarMudarabah Investment Fund LLC", jurisdiction: "USA — Federal (SEC)", desc: "Regulation D exemption for Mudarabah profit-sharing fund." },
  { type: "sec-filing", title: "SEC Form D — DarCapital Venture Fund", entity: "DarCapital Halal Venture Capital LLC", jurisdiction: "USA — Federal (SEC)", desc: "Regulation D exemption for halal venture capital fund." },
  { type: "money-transmitter", title: "Money Transmitter Licenses — DarPay (50 States)", entity: "DarPay Halal Payments Inc", jurisdiction: "USA — All 50 States", desc: "State money transmitter licenses for DarPay nationwide operations." },
  { type: "money-transmitter", title: "Money Transmitter Licenses — DarRemit (50 States)", entity: "DarRemit Halal Remittance LLC", jurisdiction: "USA — All 50 States", desc: "State money transmitter licenses for halal cross-border remittance." },
  { type: "insurance-license", title: "Insurance License Applications — DarTakaful (50 States)", entity: "DarTakaful Islamic Insurance Corp", jurisdiction: "USA — All 50 States", desc: "State insurance department filings for Takaful cooperative insurance in all 50 states." },
  { type: "insurance-license", title: "Insurance License Applications — DarInsure (50 States)", entity: "DarInsure Cooperative Insurance LLC", jurisdiction: "USA — All 50 States", desc: "Cooperative insurance license applications for mutual insurance model." },

  // ═══ International Registrations (21) ═══
  { type: "international-registration", title: "UAE DIFC — DarCloud MENA FZ-LLC", entity: "DarCloud MENA FZ-LLC", jurisdiction: "UAE — DIFC", desc: "Dubai International Financial Centre free zone company for MENA operations." },
  { type: "international-registration", title: "UK Companies House — DarCloud UK Limited", entity: "DarCloud UK Limited", jurisdiction: "United Kingdom", desc: "UK limited company for European and British market operations." },
  { type: "international-registration", title: "Malaysia SSM — DarCloud ASEAN Sdn Bhd", entity: "DarCloud ASEAN Sdn Bhd", jurisdiction: "Malaysia", desc: "Malaysian company for ASEAN Islamic finance expansion." },
  { type: "international-registration", title: "Saudi SAGIA — DarCloud KSA LLC", entity: "DarCloud KSA LLC", jurisdiction: "Saudi Arabia — SAGIA", desc: "Saudi foreign investment license for Vision 2030 fintech." },
  { type: "international-registration", title: "Turkey MERSIS — DarCloud Türkiye A.Ş.", entity: "DarCloud Türkiye A.Ş.", jurisdiction: "Turkey", desc: "Turkish joint-stock company for Central Asia expansion." },
  { type: "international-registration", title: "Egypt GAFI — DarCloud Misr LLC", entity: "DarCloud Misr LLC", jurisdiction: "Egypt", desc: "Egyptian company for North Africa operations and Suez corridor." },
  { type: "international-registration", title: "Pakistan SECP — DarCloud Pakistan Pvt Ltd", entity: "DarCloud Pakistan Pvt Ltd", jurisdiction: "Pakistan", desc: "Pakistani company for South Asian Islamic finance market." },
  { type: "international-registration", title: "Indonesia OJK — PT DarCloud Indonesia", entity: "PT DarCloud Indonesia", jurisdiction: "Indonesia", desc: "Indonesian company for world's largest Muslim population market." },
  { type: "international-registration", title: "Bangladesh RJSC — DarCloud Bangladesh Ltd", entity: "DarCloud Bangladesh Ltd", jurisdiction: "Bangladesh", desc: "Bangladeshi company for microfinance and remittance services." },
  { type: "international-registration", title: "Nigeria CAC — DarCloud Nigeria Ltd", entity: "DarCloud Nigeria Ltd", jurisdiction: "Nigeria", desc: "Nigerian company for West African Islamic finance hub." },
  { type: "international-registration", title: "Jordan Companies Controller — DarCloud Jordan LLC", entity: "DarCloud Jordan LLC", jurisdiction: "Jordan", desc: "Jordanian company for Levant region operations." },
  { type: "international-registration", title: "Qatar QFC — DarCloud Qatar WLL", entity: "DarCloud Qatar WLL", jurisdiction: "Qatar — QFC", desc: "Qatar Financial Centre company for Gulf operations." },
  { type: "international-registration", title: "Kuwait MOC — DarCloud Kuwait KSC", entity: "DarCloud Kuwait KSC", jurisdiction: "Kuwait", desc: "Kuwaiti company for Kuwait Islamic finance sector." },
  { type: "international-registration", title: "Bahrain CBB — DarCloud Bahrain BSC", entity: "DarCloud Bahrain BSC", jurisdiction: "Bahrain", desc: "Bahrain company for Gulf Islamic banking hub." },
  { type: "international-registration", title: "Oman MCI — DarCloud Oman SAOC", entity: "DarCloud Oman SAOC", jurisdiction: "Oman", desc: "Omani company for Oman fintech development." },
  { type: "international-registration", title: "Morocco OMPIC — DarCloud Maroc SARL", entity: "DarCloud Maroc SARL", jurisdiction: "Morocco", desc: "Moroccan company for Maghreb market operations." },
  { type: "international-registration", title: "Tunisia RNE — DarCloud Tunisie SARL", entity: "DarCloud Tunisie SARL", jurisdiction: "Tunisia", desc: "Tunisian company for North African tech hub." },
  { type: "international-registration", title: "Singapore ACRA — DarCloud Singapore Pte Ltd", entity: "DarCloud Singapore Pte Ltd", jurisdiction: "Singapore", desc: "Singaporean company for Asia-Pacific fintech operations." },
  { type: "international-registration", title: "Canada BN — DarCloud Canada Inc", entity: "DarCloud Canada Inc", jurisdiction: "Canada — Ontario", desc: "Canadian company for North American Muslim community." },
  { type: "international-registration", title: "Germany HR — DarCloud Deutschland GmbH", entity: "DarCloud Deutschland GmbH", jurisdiction: "Germany", desc: "German company for EU operations and European Islamic finance." },
  { type: "international-registration", title: "France RCS — DarCloud France SAS", entity: "DarCloud France SAS", jurisdiction: "France", desc: "French company for Francophone Islamic market." },
];
