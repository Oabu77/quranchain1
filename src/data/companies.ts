// ══════════════════════════════════════════════════════════════
// DARCLOUD ECOSYSTEM — ALL 101 COMPANIES
// Owner: Omar Mohammad Abunadi — 30% Founder Royalty (immutable)
// ══════════════════════════════════════════════════════════════

export interface Company {
  company_id: string;
  name: string;
  legal_name: string;
  domain: string;
  type: string;
  jurisdiction: string;
  sector: string;
}

export const ALL_COMPANIES: Company[] = [
  // ═══════════════════════════════════════
  // TIER 1 — CORE PLATFORM (1-10)
  // ═══════════════════════════════════════
  { company_id: "darcloud-host", name: "DarCloud™", legal_name: "DarCloud Platform LLC", domain: "darcloud.host", type: "parent", jurisdiction: "USA — Delaware", sector: "cloud-platform" },
  { company_id: "darcloud-net", name: "DarCloud.net™", legal_name: "DarCloud Network Services LLC", domain: "darcloud.net", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "cloud-services" },
  { company_id: "quranchain", name: "QuranChain™", legal_name: "QuranChain Blockchain Corp", domain: "blockchain.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "blockchain" },
  { company_id: "fungimesh", name: "FungiMesh™", legal_name: "FungiMesh Network Inc", domain: "mesh.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "mesh-networking" },
  { company_id: "darcloud-ai", name: "DarCloud AI Fleet™", legal_name: "DarCloud Artificial Intelligence LLC", domain: "ai.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "artificial-intelligence" },
  { company_id: "darcloud-enterprise", name: "DarCloud Enterprise™", legal_name: "DarCloud Enterprise Solutions LLC", domain: "enterprise.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "enterprise" },
  { company_id: "darcloud-revenue", name: "DarCloud Revenue Engine™", legal_name: "DarCloud Revenue & Billing Corp", domain: "revenue.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "revenue-billing" },
  { company_id: "darcloud-api", name: "DarCloud API Gateway™", legal_name: "DarCloud API Services LLC", domain: "api.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "api-gateway" },
  { company_id: "darlaw", name: "DarLaw™", legal_name: "DarLaw Legal Intelligence LLC", domain: "law.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "legal-ai" },
  { company_id: "darpay", name: "DarPay™", legal_name: "DarPay Halal Payments Inc", domain: "payments.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "payments" },

  // ═══════════════════════════════════════
  // TIER 2 — ISLAMIC FINANCE & BANKING (11-30)
  // ═══════════════════════════════════════
  { company_id: "hwc", name: "Halal Wealth Club™", legal_name: "Halal Wealth Club Private Fund LLC", domain: "halalwealthclub.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "islamic-banking" },
  { company_id: "dar-al-nas", name: "Dar Al Nas Real Estate™", legal_name: "Dar Al Nas Property Holdings LLC", domain: "realestate.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "real-estate" },
  { company_id: "dartakaful", name: "DarTakaful™", legal_name: "DarTakaful Islamic Insurance Corp", domain: "takaful.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "takaful-insurance" },
  { company_id: "darsukuk", name: "DarSukuk™", legal_name: "DarSukuk Islamic Bonds LLC", domain: "sukuk.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "sukuk-bonds" },
  { company_id: "darmurabaha", name: "DarMurabaha™", legal_name: "DarMurabaha Trade Finance LLC", domain: "murabaha.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "trade-finance" },
  { company_id: "darmusharakah", name: "DarMusharakah™", legal_name: "DarMusharakah Joint Ventures LLC", domain: "musharakah.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "joint-ventures" },
  { company_id: "darmudarabah", name: "DarMudarabah™", legal_name: "DarMudarabah Investment Fund LLC", domain: "mudarabah.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "profit-sharing" },
  { company_id: "darijarah", name: "DarIjarah™", legal_name: "DarIjarah Lease Finance LLC", domain: "ijarah.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "lease-finance" },
  { company_id: "daristisna", name: "DarIstisna™", legal_name: "DarIstisna Construction Finance LLC", domain: "istisna.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "construction-finance" },
  { company_id: "darwakala", name: "DarWakala™", legal_name: "DarWakala Agency Services LLC", domain: "wakala.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "agency-services" },
  { company_id: "darzakat", name: "DarZakat™", legal_name: "DarZakat Charitable Trust", domain: "zakat.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "zakat-charity" },
  { company_id: "darwaqf", name: "DarWaqf™", legal_name: "DarWaqf Islamic Endowment Foundation", domain: "waqf.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "waqf-endowment" },
  { company_id: "darshariah", name: "DarShariah™", legal_name: "DarShariah Compliance Board LLC", domain: "shariah.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "shariah-compliance" },
  { company_id: "darfintech", name: "DarFintech™", legal_name: "DarFintech Muslim Financial Technology Inc", domain: "fintech.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "muslim-fintech" },
  { company_id: "darcapital", name: "DarCapital™", legal_name: "DarCapital Halal Venture Capital LLC", domain: "capital.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "venture-capital" },
  { company_id: "darwealth", name: "DarWealth™", legal_name: "DarWealth Halal Asset Management LLC", domain: "wealth.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "asset-management" },
  { company_id: "darremit", name: "DarRemit™", legal_name: "DarRemit Halal Remittance LLC", domain: "remit.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "remittance" },
  { company_id: "darmortgage", name: "DarMortgage™", legal_name: "DarMortgage Zero-Riba Home Finance LLC", domain: "mortgage.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "home-finance" },
  { company_id: "darcredit", name: "DarCredit™", legal_name: "DarCredit Halal Credit Bureau LLC", domain: "credit.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "credit-bureau" },
  { company_id: "darexchange", name: "DarExchange™", legal_name: "DarExchange Halal Forex & Crypto LLC", domain: "exchange.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "forex-crypto" },

  // ═══════════════════════════════════════
  // TIER 3 — AI & TECHNOLOGY (31-50)
  // ═══════════════════════════════════════
  { company_id: "omar-ai", name: "Omar AI™", legal_name: "Omar AI Validator Systems Inc", domain: "omar.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "ai-validator" },
  { company_id: "meshtalk", name: "MeshTalk™", legal_name: "MeshTalk Communications Inc", domain: "meshtalk.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "mesh-comms" },
  { company_id: "darquantum", name: "DarQuantum™", legal_name: "DarQuantum Computing LLC", domain: "quantum.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "quantum-computing" },
  { company_id: "darml", name: "DarML™", legal_name: "DarML Machine Learning Corp", domain: "ml.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "machine-learning" },
  { company_id: "darocean", name: "DarOcean™", legal_name: "DarOcean Data Protocol LLC", domain: "ocean.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "data-protocol" },
  { company_id: "darcdn", name: "DarCDN™", legal_name: "DarCDN Content Delivery Inc", domain: "cdn.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "cdn" },
  { company_id: "daripfs", name: "DarIPFS™", legal_name: "DarIPFS Distributed Storage LLC", domain: "ipfs.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "distributed-storage" },
  { company_id: "darvault", name: "DarVault™", legal_name: "DarVault Secrets & Encryption LLC", domain: "vault.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "security-vault" },
  { company_id: "daranalytics", name: "DarAnalytics™", legal_name: "DarAnalytics Intelligence Corp", domain: "analytics.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "analytics" },
  { company_id: "dar5g", name: "Dar5G™", legal_name: "Dar5G Core Network Inc", domain: "5g.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "5g-network" },
  { company_id: "darmcp", name: "DarMCP™", legal_name: "DarMCP Protocol Services LLC", domain: "mcp.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "mcp-protocol" },
  { company_id: "dardevops", name: "DarDevOps™", legal_name: "DarDevOps CI/CD Automation LLC", domain: "devops.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "devops" },
  { company_id: "darsecurity", name: "DarSecurity™", legal_name: "DarSecurity Cyber Defense Inc", domain: "security.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "cybersecurity" },
  { company_id: "dardns", name: "DarDNS™", legal_name: "DarDNS Domain & Routing LLC", domain: "dns.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "dns-routing" },
  { company_id: "daredge", name: "DarEdge™", legal_name: "DarEdge Computing LLC", domain: "edge.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "edge-computing" },
  { company_id: "dariot", name: "DarIoT™", legal_name: "DarIoT Internet of Things LLC", domain: "iot.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "iot" },
  { company_id: "darrobotics", name: "DarRobotics™", legal_name: "DarRobotics Autonomous Systems Inc", domain: "robotics.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "robotics" },
  { company_id: "darserver", name: "DarServer™", legal_name: "DarServer Bare Metal Hosting Corp", domain: "server.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "dedicated-hosting" },
  { company_id: "darcontainer", name: "DarContainer™", legal_name: "DarContainer Orchestration LLC", domain: "container.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "container-orchestration" },
  { company_id: "dardata", name: "DarData™", legal_name: "DarData Warehouse & Lakes LLC", domain: "data.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "data-warehouse" },

  // ═══════════════════════════════════════
  // TIER 4 — HALAL LIFESTYLE & COMMERCE (51-65)
  // ═══════════════════════════════════════
  { company_id: "dargaming", name: "DarGaming™", legal_name: "DarGaming Islamic Entertainment LLC", domain: "gaming.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "islamic-gaming" },
  { company_id: "darcommerce", name: "DarCommerce™", legal_name: "DarCommerce Halal Marketplace Inc", domain: "commerce.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "halal-ecommerce" },
  { company_id: "darfood", name: "DarFood™", legal_name: "DarFood Halal Supply Chain LLC", domain: "food.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "halal-food" },
  { company_id: "dartravel", name: "DarTravel™", legal_name: "DarTravel Halal Tourism & Hospitality LLC", domain: "travel.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "halal-travel" },
  { company_id: "daredu", name: "DarEdu™", legal_name: "DarEdu Islamic Education Platform LLC", domain: "edu.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "islamic-education" },
  { company_id: "darhealth", name: "DarHealth™", legal_name: "DarHealth Halal Healthcare LLC", domain: "health.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "halal-healthcare" },
  { company_id: "darmedia", name: "DarMedia™", legal_name: "DarMedia Islamic Content Network LLC", domain: "media.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "islamic-media" },
  { company_id: "darfashion", name: "DarFashion™", legal_name: "DarFashion Modest Clothing LLC", domain: "fashion.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "modest-fashion" },
  { company_id: "darproperty", name: "DarProperty™", legal_name: "DarProperty Commercial Real Estate LLC", domain: "property.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "commercial-realestate" },
  { company_id: "darlogistics", name: "DarLogistics™", legal_name: "DarLogistics Halal Supply Chain Corp", domain: "logistics.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "logistics" },
  { company_id: "darhr", name: "DarHR™", legal_name: "DarHR Muslim Workforce Solutions LLC", domain: "hr.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "hr-workforce" },
  { company_id: "darmarketing", name: "DarMarketing™", legal_name: "DarMarketing Digital Growth LLC", domain: "marketing.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "digital-marketing" },
  { company_id: "darconsulting", name: "DarConsulting™", legal_name: "DarConsulting Islamic Business Advisory LLC", domain: "consulting.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "consulting" },
  { company_id: "darpharmacy", name: "DarPharmacy™", legal_name: "DarPharmacy Halal Pharmaceuticals LLC", domain: "pharmacy.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "halal-pharma" },
  { company_id: "darinsure", name: "DarInsure™", legal_name: "DarInsure Cooperative Insurance LLC", domain: "insure.darcloud.host", type: "subsidiary", jurisdiction: "USA — Texas", sector: "cooperative-insurance" },

  // ═══════════════════════════════════════
  // TIER 5 — BLOCKCHAIN & DEFI (66-80)
  // ═══════════════════════════════════════
  { company_id: "dardefi", name: "DarDeFi™", legal_name: "DarDeFi Halal Decentralized Finance LLC", domain: "defi.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "halal-defi" },
  { company_id: "darnft", name: "DarNFT™", legal_name: "DarNFT Islamic Digital Assets LLC", domain: "nft.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "nft" },
  { company_id: "darstaking", name: "DarStaking™", legal_name: "DarStaking Halal Yield Protocol LLC", domain: "staking.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "halal-staking" },
  { company_id: "darbridge", name: "DarBridge™", legal_name: "DarBridge Cross-Chain Protocol Inc", domain: "bridge.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "cross-chain" },
  { company_id: "dardao", name: "DarDAO™", legal_name: "DarDAO Decentralized Governance LLC", domain: "dao.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "dao-governance" },
  { company_id: "darwallet", name: "DarWallet™", legal_name: "DarWallet Multi-Chain Wallet Inc", domain: "wallet.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "crypto-wallet" },
  { company_id: "dartokenize", name: "DarTokenize™", legal_name: "DarTokenize Asset Digitization LLC", domain: "tokenize.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "asset-tokenization" },
  { company_id: "darswap", name: "DarSwap™", legal_name: "DarSwap Halal DEX Protocol LLC", domain: "swap.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "halal-dex" },
  { company_id: "darcustody", name: "DarCustody™", legal_name: "DarCustody Digital Asset Trust LLC", domain: "custody.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "digital-custody" },
  { company_id: "darvalidator", name: "DarValidator™", legal_name: "DarValidator Consensus Nodes Inc", domain: "validator.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "blockchain-validators" },
  { company_id: "darlaunchpad", name: "DarLaunchpad™", legal_name: "DarLaunchpad Halal Token Launch LLC", domain: "launchpad.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "token-launchpad" },
  { company_id: "daroracle", name: "DarOracle™", legal_name: "DarOracle Blockchain Data Feeds Inc", domain: "oracle.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "blockchain-oracle" },
  { company_id: "dargastoll", name: "DarGasToll™", legal_name: "DarGasToll Revenue Collection LLC", domain: "gastoll.darcloud.host", type: "subsidiary", jurisdiction: "USA — Wyoming", sector: "gas-toll" },
  { company_id: "darledger", name: "DarLedger™", legal_name: "DarLedger Distributed Ledger Tech LLC", domain: "ledger.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "dlt" },
  { company_id: "daridentity", name: "DarIdentity™", legal_name: "DarIdentity Decentralized KYC LLC", domain: "identity.darcloud.host", type: "subsidiary", jurisdiction: "USA — Delaware", sector: "decentralized-identity" },

  // ═══════════════════════════════════════
  // TIER 6 — INTERNATIONAL & REGIONAL (81-101)
  // ═══════════════════════════════════════
  { company_id: "darcloud-uae", name: "DarCloud MENA™", legal_name: "DarCloud MENA FZ-LLC", domain: "mena.darcloud.host", type: "international", jurisdiction: "UAE — DIFC", sector: "mena-operations" },
  { company_id: "darcloud-uk", name: "DarCloud UK™", legal_name: "DarCloud UK Limited", domain: "uk.darcloud.host", type: "international", jurisdiction: "United Kingdom", sector: "uk-operations" },
  { company_id: "darcloud-malaysia", name: "DarCloud ASEAN™", legal_name: "DarCloud ASEAN Sdn Bhd", domain: "asean.darcloud.host", type: "international", jurisdiction: "Malaysia", sector: "asean-operations" },
  { company_id: "darcloud-ksa", name: "DarCloud KSA™", legal_name: "DarCloud KSA LLC", domain: "ksa.darcloud.host", type: "international", jurisdiction: "Saudi Arabia — SAGIA", sector: "ksa-operations" },
  { company_id: "darcloud-turkey", name: "DarCloud Türkiye™", legal_name: "DarCloud Türkiye A.Ş.", domain: "turkiye.darcloud.host", type: "international", jurisdiction: "Turkey", sector: "turkey-operations" },
  { company_id: "darcloud-egypt", name: "DarCloud Egypt™", legal_name: "DarCloud Misr LLC", domain: "egypt.darcloud.host", type: "international", jurisdiction: "Egypt", sector: "egypt-operations" },
  { company_id: "darcloud-pakistan", name: "DarCloud Pakistan™", legal_name: "DarCloud Pakistan Pvt Ltd", domain: "pakistan.darcloud.host", type: "international", jurisdiction: "Pakistan", sector: "pakistan-operations" },
  { company_id: "darcloud-indonesia", name: "DarCloud Indonesia™", legal_name: "PT DarCloud Indonesia", domain: "indonesia.darcloud.host", type: "international", jurisdiction: "Indonesia", sector: "indonesia-operations" },
  { company_id: "darcloud-bangladesh", name: "DarCloud Bangladesh™", legal_name: "DarCloud Bangladesh Ltd", domain: "bangladesh.darcloud.host", type: "international", jurisdiction: "Bangladesh", sector: "bangladesh-operations" },
  { company_id: "darcloud-nigeria", name: "DarCloud Nigeria™", legal_name: "DarCloud Nigeria Ltd", domain: "nigeria.darcloud.host", type: "international", jurisdiction: "Nigeria", sector: "nigeria-operations" },
  { company_id: "darcloud-jordan", name: "DarCloud Jordan™", legal_name: "DarCloud Jordan LLC", domain: "jordan.darcloud.host", type: "international", jurisdiction: "Jordan", sector: "jordan-operations" },
  { company_id: "darcloud-qatar", name: "DarCloud Qatar™", legal_name: "DarCloud Qatar WLL", domain: "qatar.darcloud.host", type: "international", jurisdiction: "Qatar — QFC", sector: "qatar-operations" },
  { company_id: "darcloud-kuwait", name: "DarCloud Kuwait™", legal_name: "DarCloud Kuwait KSC", domain: "kuwait.darcloud.host", type: "international", jurisdiction: "Kuwait", sector: "kuwait-operations" },
  { company_id: "darcloud-bahrain", name: "DarCloud Bahrain™", legal_name: "DarCloud Bahrain BSC", domain: "bahrain.darcloud.host", type: "international", jurisdiction: "Bahrain", sector: "bahrain-operations" },
  { company_id: "darcloud-oman", name: "DarCloud Oman™", legal_name: "DarCloud Oman SAOC", domain: "oman.darcloud.host", type: "international", jurisdiction: "Oman", sector: "oman-operations" },
  { company_id: "darcloud-morocco", name: "DarCloud Morocco™", legal_name: "DarCloud Maroc SARL", domain: "morocco.darcloud.host", type: "international", jurisdiction: "Morocco", sector: "morocco-operations" },
  { company_id: "darcloud-tunisia", name: "DarCloud Tunisia™", legal_name: "DarCloud Tunisie SARL", domain: "tunisia.darcloud.host", type: "international", jurisdiction: "Tunisia", sector: "tunisia-operations" },
  { company_id: "darcloud-singapore", name: "DarCloud Singapore™", legal_name: "DarCloud Singapore Pte Ltd", domain: "singapore.darcloud.host", type: "international", jurisdiction: "Singapore", sector: "singapore-operations" },
  { company_id: "darcloud-canada", name: "DarCloud Canada™", legal_name: "DarCloud Canada Inc", domain: "canada.darcloud.host", type: "international", jurisdiction: "Canada — Ontario", sector: "canada-operations" },
  { company_id: "darcloud-germany", name: "DarCloud Germany™", legal_name: "DarCloud Deutschland GmbH", domain: "germany.darcloud.host", type: "international", jurisdiction: "Germany", sector: "germany-operations" },
  { company_id: "darcloud-france", name: "DarCloud France™", legal_name: "DarCloud France SAS", domain: "france.darcloud.host", type: "international", jurisdiction: "France", sector: "france-operations" },
];
