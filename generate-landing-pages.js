#!/usr/bin/env node
// Generate all missing DarCloud Empire landing pages as Cloudflare Workers
const { writeFileSync, existsSync } = require("fs");
const { resolve } = require("path");

const PAGES_DIR = resolve(__dirname, "landing-pages");

const BRAND = {
  bg: "#07090f", s1: "#0d1117", s2: "#161b22", bdr: "#21262d",
  cyan: "#00d4ff", emerald: "#10b981", gold: "#f59e0b",
  txt: "#e6edf3", muted: "#8b949e"
};

function css() {
  return `<style>
:root{--bg:${BRAND.bg};--s1:${BRAND.s1};--s2:${BRAND.s2};--bdr:${BRAND.bdr};--cyan:${BRAND.cyan};--emerald:${BRAND.emerald};--gold:${BRAND.gold};--txt:${BRAND.txt};--muted:${BRAND.muted}}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;background:var(--bg);color:var(--txt);line-height:1.6}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
.nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;border-bottom:1px solid var(--bdr);background:var(--s1)}
.nav-brand{font-size:1.3rem;font-weight:700;background:linear-gradient(135deg,var(--cyan),var(--emerald));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links a{margin-left:1.5rem;color:var(--muted);font-size:.9rem}.nav-links a:hover{color:var(--cyan)}
.hero{text-align:center;padding:5rem 2rem 3rem;background:linear-gradient(180deg,var(--s1) 0%,var(--bg) 100%)}
.hero h1{font-size:2.8rem;font-weight:800;margin-bottom:1rem}.hero h1 span{background:linear-gradient(135deg,var(--cyan),var(--emerald));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:var(--muted);font-size:1.15rem;max-width:700px;margin:0 auto 2rem}
.btn{display:inline-block;padding:.75rem 2rem;border-radius:12px;font-weight:600;font-size:1rem;transition:all .3s;cursor:pointer;border:none}
.btn-primary{background:linear-gradient(135deg,var(--emerald),var(--cyan));color:#000}.btn-primary:hover{opacity:.9;transform:translateY(-2px)}
.btn-outline{border:1px solid var(--bdr);color:var(--muted);background:transparent}.btn-outline:hover{border-color:var(--cyan);color:var(--cyan)}
.hero-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;padding:3rem 2rem;max-width:1200px;margin:0 auto}
.card{background:var(--s1);border:1px solid var(--bdr);border-radius:16px;padding:2rem;transition:all .3s}.card:hover{border-color:var(--cyan);transform:translateY(-4px)}
.card h3{font-size:1.2rem;margin-bottom:.5rem}.card p{color:var(--muted);font-size:.9rem}
.card .icon{font-size:2rem;margin-bottom:1rem}
.section{padding:3rem 2rem;max-width:1200px;margin:0 auto}.section h2{font-size:2rem;text-align:center;margin-bottom:.5rem}.section .sub{text-align:center;color:var(--muted);margin-bottom:2rem}
.stats{display:flex;justify-content:center;gap:3rem;flex-wrap:wrap;padding:2rem}.stat{text-align:center}.stat .val{font-size:2.5rem;font-weight:800;color:var(--cyan)}.stat .label{color:var(--muted);font-size:.85rem}
.pricing{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;padding:2rem;max-width:900px;margin:0 auto}
.price-card{background:var(--s1);border:1px solid var(--bdr);border-radius:16px;padding:2rem;text-align:center}
.price-card.featured{border-color:var(--gold)}.price-card h3{margin-bottom:.5rem}.price-card .amount{font-size:2.5rem;font-weight:800;margin:1rem 0}.price-card .amount span{font-size:.9rem;color:var(--muted);font-weight:400}
.price-card ul{list-style:none;text-align:left;margin:1rem 0}.price-card li{padding:.3rem 0;font-size:.9rem;color:var(--muted)}.price-card li::before{content:"\\2713 ";color:var(--emerald)}
footer{text-align:center;padding:2rem;border-top:1px solid var(--bdr);color:var(--muted);font-size:.8rem;margin-top:3rem}
footer a{color:var(--muted);margin:0 .5rem}
</style>`;
}

function nav(name, sub) {
  return `<nav class="nav"><a href="/" class="nav-brand">\\u2601\\uFE0F ${name}</a><div class="nav-links"><a href="https://darcloud.host">DarCloud</a><a href="https://darcloud.net">Network</a><a href="https://api.darcloud.host/api">API</a><a href="https://darcloud.host/checkout/pro">Get Started</a></div></nav>`;
}

function footer() {
  return `<footer><p>\\u00A9 2026 DarCloud Empire \\u2014 ${new Date().getFullYear()}</p><div><a href="https://darcloud.host">DarCloud.host</a><a href="https://darcloud.net">DarCloud.net</a><a href="https://blockchain.darcloud.host">Blockchain</a><a href="https://mesh.darcloud.host">FungiMesh</a></div><p style="margin-top:.5rem;font-size:.75rem">Shariah-Compliant \\u00B7 Zero-Riba \\u00B7 Revenue Split: 30/40/10/18/2</p></footer>`;
}

const PAGES = [
  {
    file: "darcloud-darpay.js",
    title: "DarPay",
    subtitle: "Islamic Payment Processing & Revenue Engine",
    tagline: "Shariah-compliant payment infrastructure powering the entire DarCloud ecosystem. Stripe integration, crypto on-ramps, and zero-riba transactions.",
    color: BRAND.emerald,
    stats: [
      { val: "47", label: "Blockchain Chains" },
      { val: "$0", label: "Interest Charged" },
      { val: "2%", label: "Zakat Auto-Fund" },
      { val: "99.9%", label: "Uptime SLA" },
    ],
    features: [
      { icon: "\\uD83D\\uDCB3", title: "Stripe Integration", desc: "PCI-compliant card processing with automatic revenue splitting across all DarCloud entities" },
      { icon: "\\u26D3\\uFE0F", title: "Gas Toll Highway", desc: "47-chain blockchain gas toll system with 30% founder royalty on every transaction" },
      { icon: "\\uD83D\\uDD12", title: "Zero-Riba Guarantee", desc: "All transactions are Shariah-certified with no interest, no hidden fees, and full transparency" },
      { icon: "\\uD83E\\uDD32", title: "Zakat Auto-Fund", desc: "2% of all revenue automatically directed to the Zakat fund for community welfare" },
      { icon: "\\uD83D\\uDCCA", title: "Revenue Dashboard", desc: "Real-time revenue tracking with breakdown: 30% Founder, 40% AI, 10% Hardware, 18% Ecosystem, 2% Zakat" },
      { icon: "\\uD83C\\uDF10", title: "Multi-Currency", desc: "Accept fiat (USD, EUR, GBP, SAR) and crypto (QRN, ETH, BTC) with instant conversion" },
    ],
    pricing: [
      { name: "Starter", price: "Free", features: ["Basic payments", "QRN Wallet", "Community support"] },
      { name: "Professional", price: "$49/mo", features: ["Stripe checkout", "Revenue analytics", "API access", "Priority support"], featured: true },
      { name: "Enterprise", price: "$499/mo", features: ["Custom integration", "White-label", "Dedicated manager", "SLA 99.9%"] },
    ],
  },
  {
    file: "darcloud-meshtalk.js",
    title: "MeshTalk",
    subtitle: "Encrypted Mesh Communication OS",
    tagline: "End-to-end encrypted messaging and communication platform built on FungiMesh network. Decentralized, private, unstoppable.",
    color: "#8b5cf6",
    stats: [
      { val: "E2E", label: "Encryption" },
      { val: "P2P", label: "Architecture" },
      { val: "0", label: "Data Stored" },
      { val: "\\u221E", label: "Privacy" },
    ],
    features: [
      { icon: "\\uD83D\\uDD10", title: "E2E Encryption", desc: "Military-grade encryption on all messages, calls, and file transfers. Zero-knowledge architecture" },
      { icon: "\\uD83D\\uDD78\\uFE0F", title: "Mesh Routing", desc: "Messages route through FungiMesh network — no central server, no single point of failure" },
      { icon: "\\uD83D\\uDCDE", title: "Voice & Video", desc: "Crystal-clear encrypted voice and video calls routed through mesh nodes" },
      { icon: "\\uD83D\\uDCC1", title: "Secure Sharing", desc: "End-to-end encrypted file sharing with no size limits through mesh network" },
      { icon: "\\uD83D\\uDC65", title: "Group Channels", desc: "Encrypted group chats with role-based access control and audit logs" },
      { icon: "\\uD83C\\uDF0D", title: "Global Mesh", desc: "Available on 6 continents through FungiMesh node network with auto-healing" },
    ],
    pricing: [
      { name: "Free", price: "Free", features: ["Text messaging", "Voice calls", "Basic groups"] },
      { name: "Pro", price: "$9.99/mo", features: ["Video calls", "Unlimited groups", "File sharing 100GB", "Priority routing"], featured: true },
      { name: "Business", price: "$29.99/mo", features: ["Admin console", "Compliance tools", "API access", "Custom domains"] },
    ],
  },
  {
    file: "darcloud-darnas.js",
    title: "DarAlNas",
    subtitle: "Islamic Community & Social Platform",
    tagline: "The halal social network connecting the global Muslim ummah. Community building, knowledge sharing, and charitable giving.",
    color: BRAND.gold,
    stats: [
      { val: "1.8B", label: "Muslims Worldwide" },
      { val: "100%", label: "Halal Content" },
      { val: "2%", label: "Zakat Fund" },
      { val: "24/7", label: "Moderation" },
    ],
    features: [
      { icon: "\\uD83D\\uDD4C", title: "Community Hub", desc: "Connect with fellow Muslims worldwide. Prayer groups, study circles, and community events" },
      { icon: "\\uD83D\\uDCD6", title: "Islamic Learning", desc: "Quran study, hadith collections, and Islamic scholarship curated by verified scholars" },
      { icon: "\\uD83E\\uDD32", title: "Sadaqah & Zakat", desc: "Transparent charitable giving with blockchain-verified fund distribution" },
      { icon: "\\uD83C\\uDF1F", title: "Halal Marketplace", desc: "Buy and sell halal products and services verified by community standards" },
      { icon: "\\uD83D\\uDCF1", title: "Prayer Times", desc: "Accurate prayer times, Qibla direction, and mosque finder for your location" },
      { icon: "\\uD83C\\uDF10", title: "Multi-Language", desc: "Available in Arabic, English, Urdu, Turkish, Malay, and 20+ languages" },
    ],
    pricing: [
      { name: "Community", price: "Free", features: ["Social feed", "Prayer times", "Mosque finder", "Basic groups"] },
      { name: "Premium", price: "$4.99/mo", features: ["Ad-free", "Priority support", "Advanced learning", "Exclusive content"], featured: true },
      { name: "Organization", price: "$49/mo", features: ["Mosque/org page", "Event management", "Fundraising tools", "Analytics"] },
    ],
  },
  {
    file: "darcloud-darlaw.js",
    title: "DarLaw",
    subtitle: "Islamic Legal & Compliance Platform",
    tagline: "Shariah-compliant legal services, smart contracts, and regulatory compliance for Islamic finance and business.",
    color: "#ef4444",
    stats: [
      { val: "500+", label: "Legal Templates" },
      { val: "47", label: "Jurisdictions" },
      { val: "AI", label: "Contract Review" },
      { val: "100%", label: "Shariah Audit" },
    ],
    features: [
      { icon: "\\u2696\\uFE0F", title: "Smart Contracts", desc: "Shariah-compliant smart contracts with automated execution and dispute resolution" },
      { icon: "\\uD83D\\uDCDC", title: "Legal Templates", desc: "500+ legal document templates for Islamic finance, business, and family law" },
      { icon: "\\uD83E\\uDD16", title: "AI Legal Review", desc: "AI-powered contract analysis ensuring Shariah compliance and risk assessment" },
      { icon: "\\uD83C\\uDFDB\\uFE0F", title: "Regulatory", desc: "Multi-jurisdiction regulatory compliance for Islamic banking and finance" },
      { icon: "\\uD83D\\uDD0D", title: "IP Protection", desc: "Comprehensive intellectual property protection and patent filing services" },
      { icon: "\\uD83D\\uDCBC", title: "Corporate Filing", desc: "Company formation, governance, and annual filing across 47 jurisdictions" },
    ],
    pricing: [
      { name: "Basic", price: "$29/mo", features: ["5 document templates/mo", "Basic AI review", "Email support"] },
      { name: "Professional", price: "$149/mo", features: ["Unlimited templates", "Full AI review", "Priority support", "Smart contracts"], featured: true },
      { name: "Enterprise", price: "$999/mo", features: ["Dedicated counsel", "Custom contracts", "Regulatory filing", "SLA"] },
    ],
  },
  {
    file: "darcloud-darcommerce.js",
    title: "DarCommerce",
    subtitle: "Halal E-Commerce Platform",
    tagline: "End-to-end halal e-commerce infrastructure. From storefront to fulfillment, every transaction is Shariah-compliant.",
    color: "#f97316",
    stats: [
      { val: "$2.7T", label: "Halal Market" },
      { val: "0%", label: "Riba" },
      { val: "100%", label: "Halal Certified" },
      { val: "24/7", label: "Operations" },
    ],
    features: [
      { icon: "\\uD83D\\uDED2", title: "Halal Storefront", desc: "Launch your halal-certified online store in minutes with pre-built templates" },
      { icon: "\\uD83D\\uDCE6", title: "Logistics", desc: "Integrated halal supply chain with cold-chain for food and pharmaceutical products" },
      { icon: "\\uD83D\\uDCB0", title: "DarPay Checkout", desc: "Seamless checkout with DarPay — zero-riba, multi-currency, instant settlement" },
      { icon: "\\uD83D\\uDCCA", title: "Analytics", desc: "Real-time sales analytics, inventory management, and demand forecasting" },
      { icon: "\\u2705", title: "Certification", desc: "Built-in halal certification tracking and compliance documentation" },
      { icon: "\\uD83C\\uDF0D", title: "Global Reach", desc: "Ship worldwide with integrated customs, duties, and halal compliance documentation" },
    ],
    pricing: [
      { name: "Starter", price: "$19/mo", features: ["100 products", "Basic storefront", "DarPay checkout"] },
      { name: "Growth", price: "$79/mo", features: ["Unlimited products", "Custom domain", "Analytics", "API access"], featured: true },
      { name: "Enterprise", price: "$399/mo", features: ["Multi-store", "ERP integration", "Dedicated support", "Custom dev"] },
    ],
  },
  {
    file: "darcloud-dartrade.js",
    title: "DarTrade",
    subtitle: "Islamic Trade & Import-Export Platform",
    tagline: "Shariah-compliant international trade finance, letter of credit, and cross-border commerce infrastructure.",
    color: "#0ea5e9",
    stats: [
      { val: "190+", label: "Countries" },
      { val: "Murabaha", label: "Trade Finance" },
      { val: "$0", label: "Interest" },
      { val: "Blockchain", label: "Verified" },
    ],
    features: [
      { icon: "\\uD83D\\uDEA2", title: "Trade Finance", desc: "Murabaha and Musharakah-based trade financing with transparent cost-plus pricing" },
      { icon: "\\uD83D\\uDCDC", title: "Letter of Credit", desc: "Islamic LC issuance and management across 190+ countries" },
      { icon: "\\uD83D\\uDCE6", title: "Supply Chain", desc: "End-to-end supply chain tracking with blockchain verification" },
      { icon: "\\uD83D\\uDCB1", title: "FX Services", desc: "Competitive forex rates with Shariah-compliant hedging instruments" },
      { icon: "\\uD83D\\uDCC4", title: "Documentation", desc: "Automated trade documentation, customs declarations, and compliance filings" },
      { icon: "\\uD83E\\uDD1D", title: "B2B Matching", desc: "AI-powered buyer-seller matching for halal products and commodities" },
    ],
    pricing: [
      { name: "Trader", price: "$49/mo", features: ["10 transactions/mo", "Basic LC", "Trade docs"] },
      { name: "Business", price: "$199/mo", features: ["Unlimited transactions", "Full LC service", "FX access", "API"], featured: true },
      { name: "Corporate", price: "$999/mo", features: ["Custom limits", "Dedicated trader", "Priority settlement", "White-label"] },
    ],
  },
  {
    file: "darcloud-darhealth.js",
    title: "DarHealth",
    subtitle: "Islamic Healthcare & Telemedicine",
    tagline: "Halal healthcare services, telemedicine, and health records on blockchain. Accessible Islamic medicine for the ummah.",
    color: "#22c55e",
    stats: [
      { val: "100%", label: "Halal Medicine" },
      { val: "E2E", label: "Encrypted Records" },
      { val: "24/7", label: "Telemedicine" },
      { val: "AI", label: "Diagnostics" },
    ],
    features: [
      { icon: "\\uD83C\\uDFE5", title: "Telemedicine", desc: "24/7 access to Muslim doctors and specialists via encrypted video consultations" },
      { icon: "\\uD83D\\uDC8A", title: "Halal Pharmacy", desc: "Verified halal medications and supplements with blockchain-traced ingredients" },
      { icon: "\\uD83D\\uDCCB", title: "Health Records", desc: "Blockchain-secured medical records with patient-controlled access" },
      { icon: "\\uD83E\\uDD16", title: "AI Diagnostics", desc: "AI-assisted health screening and preventive care recommendations" },
      { icon: "\\uD83E\\uDDEC", title: "Genetic Privacy", desc: "Genetic testing with zero-knowledge proofs — your DNA, your data" },
      { icon: "\\uD83E\\uDD32", title: "Charity Care", desc: "Zakat-funded healthcare access for underserved communities worldwide" },
    ],
    pricing: [
      { name: "Basic", price: "Free", features: ["Health records", "Community support", "Prayer wellness"] },
      { name: "Premium", price: "$29/mo", features: ["Telemedicine", "AI screening", "Halal pharmacy", "Priority booking"], featured: true },
      { name: "Family", price: "$79/mo", features: ["Up to 6 members", "Specialist access", "Genetic screening", "Dental/Vision"] },
    ],
  },
  {
    file: "darcloud-daredu.js",
    title: "DarEdu",
    subtitle: "Islamic Education & E-Learning",
    tagline: "World-class Islamic education platform with Quran studies, Arabic language, and modern skills training.",
    color: "#a855f7",
    stats: [
      { val: "1000+", label: "Courses" },
      { val: "50+", label: "Languages" },
      { val: "AI", label: "Tutoring" },
      { val: "Certified", label: "Programs" },
    ],
    features: [
      { icon: "\\uD83D\\uDCD6", title: "Quran Academy", desc: "Interactive Quran learning with tajweed, memorization tools, and certified instructors" },
      { icon: "\\uD83D\\uDD4B", title: "Arabic Mastery", desc: "Modern Standard & Classical Arabic courses from beginner to advanced" },
      { icon: "\\uD83C\\uDF93", title: "Skills Training", desc: "Tech, business, and entrepreneurship courses aligned with Islamic values" },
      { icon: "\\uD83E\\uDD16", title: "AI Tutor", desc: "Personalized AI tutoring that adapts to your learning pace and style" },
      { icon: "\\uD83D\\uDC68\\u200D\\uD83D\\uDCBB", title: "Live Classes", desc: "Live virtual classrooms with scholars and industry professionals" },
      { icon: "\\uD83C\\uDFC6", title: "Certifications", desc: "Accredited certificates recognized by Islamic universities and employers" },
    ],
    pricing: [
      { name: "Learner", price: "Free", features: ["Basic Quran courses", "Community forums", "Mobile app"] },
      { name: "Scholar", price: "$19/mo", features: ["All courses", "AI tutor", "Certificates", "Live classes"], featured: true },
      { name: "Institution", price: "$299/mo", features: ["LMS platform", "Custom courses", "Analytics", "API access"] },
    ],
  },
  {
    file: "darcloud-darenergy.js",
    title: "DarEnergy",
    subtitle: "Clean Energy & Sustainability",
    tagline: "Islamic-aligned clean energy solutions. Solar, wind, and sustainable infrastructure with Shariah-compliant financing.",
    color: "#eab308",
    stats: [
      { val: "100%", label: "Renewable" },
      { val: "0", label: "Carbon" },
      { val: "Sukuk", label: "Financing" },
      { val: "Global", label: "Operations" },
    ],
    features: [
      { icon: "\\u2600\\uFE0F", title: "Solar Projects", desc: "Mosque and community solar installations with Sukuk-based financing" },
      { icon: "\\uD83D\\uDCA8", title: "Wind Energy", desc: "Distributed wind energy generation integrated with FungiMesh monitoring" },
      { icon: "\\uD83D\\uDD0B", title: "Energy Storage", desc: "Community battery storage and microgrid solutions for energy independence" },
      { icon: "\\uD83D\\uDCB0", title: "Green Sukuk", desc: "Shariah-compliant green bonds for sustainable energy project financing" },
      { icon: "\\uD83D\\uDCCA", title: "Smart Grid", desc: "AI-optimized energy distribution through mesh-connected smart grid" },
      { icon: "\\uD83C\\uDF31", title: "Carbon Credits", desc: "Blockchain-verified carbon offset credits and sustainability certificates" },
    ],
    pricing: [
      { name: "Monitor", price: "Free", features: ["Energy tracking", "Carbon calculator", "Community stats"] },
      { name: "Producer", price: "$99/mo", features: ["Solar dashboard", "Grid management", "Energy trading", "Credits"], featured: true },
      { name: "Developer", price: "$999/mo", features: ["Project financing", "Sukuk issuance", "Full analytics", "API"] },
    ],
  },
  {
    file: "darcloud-darsecurity.js",
    title: "DarSecurity",
    subtitle: "Islamic Cybersecurity & Data Protection",
    tagline: "Enterprise-grade cybersecurity infrastructure with Islamic ethical standards. Protect your data, protect your ummah.",
    color: "#ef4444",
    stats: [
      { val: "24/7", label: "SOC" },
      { val: "AI", label: "Threat Detection" },
      { val: "Zero", label: "Trust" },
      { val: "Quantum", label: "Ready" },
    ],
    features: [
      { icon: "\\uD83D\\uDEE1\\uFE0F", title: "SOC-as-a-Service", desc: "24/7 Security Operations Center with AI-powered threat detection and response" },
      { icon: "\\uD83D\\uDD10", title: "Zero Trust", desc: "Complete zero-trust architecture implementation for organizations" },
      { icon: "\\uD83E\\uDDEC", title: "Quantum Security", desc: "Post-quantum cryptography ready — future-proof your data today" },
      { icon: "\\uD83D\\uDC1B", title: "Penetration Testing", desc: "Ethical penetration testing and vulnerability assessments by certified professionals" },
      { icon: "\\uD83D\\uDCCB", title: "Compliance", desc: "GDPR, ISO 27001, SOC2, and Shariah compliance audit and certification" },
      { icon: "\\uD83C\\uDFEB", title: "Training", desc: "Cybersecurity awareness training tailored for Islamic organizations" },
    ],
    pricing: [
      { name: "Essential", price: "$99/mo", features: ["Vulnerability scan", "Basic monitoring", "Email alerts"] },
      { name: "Professional", price: "$499/mo", features: ["24/7 SOC", "Incident response", "Pen testing", "Compliance"], featured: true },
      { name: "Enterprise", price: "$2499/mo", features: ["Dedicated team", "Quantum security", "Custom SLA", "Red team"] },
    ],
  },
  {
    file: "darcloud-dartelecom.js",
    title: "DarTelecom",
    subtitle: "Islamic Telecommunications Network",
    tagline: "Mesh-powered telecom infrastructure. Decentralized connectivity, encrypted communications, community ownership.",
    color: "#06b6d4",
    stats: [
      { val: "6", label: "Continents" },
      { val: "Mesh", label: "Network" },
      { val: "E2E", label: "Encrypted" },
      { val: "P2P", label: "Calls" },
    ],
    features: [
      { icon: "\\uD83D\\uDCF6", title: "Mesh Connectivity", desc: "FungiMesh-powered internet access with self-healing network topology" },
      { icon: "\\uD83D\\uDCDE", title: "VoIP Calling", desc: "E2E encrypted voice calls routed through decentralized mesh nodes" },
      { icon: "\\uD83D\\uDCE1", title: "IoT Gateway", desc: "Connect and manage IoT devices through secure mesh infrastructure" },
      { icon: "\\uD83C\\uDF10", title: "CDN", desc: "Edge content delivery through FungiMesh nodes on 6 continents" },
      { icon: "\\uD83D\\uDDA5\\uFE0F", title: "Virtual PBX", desc: "Cloud-based phone system for businesses with Islamic IVR options" },
      { icon: "\\uD83D\\uDCCA", title: "Network Analytics", desc: "Real-time network monitoring and traffic optimization dashboard" },
    ],
    pricing: [
      { name: "Personal", price: "$9.99/mo", features: ["Mesh access", "VoIP calls", "10GB data"] },
      { name: "Business", price: "$49/mo", features: ["Unlimited data", "PBX system", "IoT gateway", "Analytics"], featured: true },
      { name: "Carrier", price: "$499/mo", features: ["White-label", "Custom network", "SLA 99.99%", "API access"] },
    ],
  },
  {
    file: "darcloud-dartransport.js",
    title: "DarTransport",
    subtitle: "Halal Logistics & Transportation",
    tagline: "Shariah-compliant logistics, ride-sharing, and freight management connecting Muslim communities worldwide.",
    color: "#0284c7",
    stats: [
      { val: "190+", label: "Countries" },
      { val: "100%", label: "Halal Chain" },
      { val: "AI", label: "Route Optimization" },
      { val: "Live", label: "Tracking" },
    ],
    features: [
      { icon: "\\uD83D\\uDE9A", title: "Halal Freight", desc: "Dedicated halal logistics with certified handling for food and pharmaceutical products" },
      { icon: "\\uD83D\\uDE95", title: "Ride Sharing", desc: "Muslim-friendly ride-sharing with prayer break scheduling and gender preferences" },
      { icon: "\\uD83D\\uDCE6", title: "Last Mile", desc: "Community-based last-mile delivery through local mesh network couriers" },
      { icon: "\\uD83D\\uDDFA\\uFE0F", title: "Route AI", desc: "AI-optimized routing with mosque stops, halal rest areas, and prayer times" },
      { icon: "\\uD83D\\uDCCA", title: "Fleet Management", desc: "Real-time fleet tracking, maintenance scheduling, and driver management" },
      { icon: "\\u2693", title: "Shipping", desc: "International shipping and customs clearance for halal commerce" },
    ],
    pricing: [
      { name: "Sender", price: "Pay per use", features: ["Domestic shipping", "Live tracking", "Basic insurance"] },
      { name: "Business", price: "$149/mo", features: ["Volume discounts", "Fleet tools", "API access", "Priority"], featured: true },
      { name: "Logistics", price: "$699/mo", features: ["Full fleet mgmt", "Custom routes", "Cold chain", "SLA"] },
    ],
  },
  {
    file: "darcloud-darhr.js",
    title: "DarHR",
    subtitle: "Islamic Human Resources & Workforce",
    tagline: "Shariah-compliant HR management. Halal payroll, Islamic benefits, and workforce solutions for Muslim organizations.",
    color: "#ec4899",
    stats: [
      { val: "0%", label: "Riba Payroll" },
      { val: "AI", label: "Recruiting" },
      { val: "100%", label: "Compliant" },
      { val: "Global", label: "Workforce" },
    ],
    features: [
      { icon: "\\uD83D\\uDCBC", title: "Halal Payroll", desc: "Zero-riba payroll processing with Zakat auto-calculation and DarPay integration" },
      { icon: "\\uD83D\\uDD0D", title: "AI Recruiting", desc: "AI-powered talent matching with Islamic values alignment screening" },
      { icon: "\\uD83D\\uDDD3\\uFE0F", title: "Prayer Scheduling", desc: "Automatic prayer break scheduling and Jummah accommodation" },
      { icon: "\\uD83C\\uDFC6", title: "Islamic Benefits", desc: "Takaful insurance, Hajj savings plans, and Islamic retirement programs" },
      { icon: "\\uD83D\\uDCCA", title: "Performance", desc: "Islamic values-based performance reviews with 360-degree feedback" },
      { icon: "\\uD83C\\uDF93", title: "Training", desc: "DarEdu-integrated professional development and Islamic leadership programs" },
    ],
    pricing: [
      { name: "Startup", price: "$29/mo", features: ["Up to 10 employees", "Basic payroll", "Prayer scheduling"] },
      { name: "Business", price: "$99/mo", features: ["Up to 100 employees", "Full HR suite", "AI recruiting", "Benefits"], featured: true },
      { name: "Enterprise", price: "$499/mo", features: ["Unlimited", "Dedicated support", "Custom workflows", "API"] },
    ],
  },
  {
    file: "darcloud-darmedia.js",
    title: "DarMedia",
    subtitle: "Islamic Media & Content Platform",
    tagline: "Halal streaming, publishing, and content creation tools for Islamic media professionals and organizations.",
    color: "#d946ef",
    stats: [
      { val: "100%", label: "Halal Content" },
      { val: "4K", label: "Streaming" },
      { val: "AI", label: "Production" },
      { val: "Global", label: "Distribution" },
    ],
    features: [
      { icon: "\\uD83C\\uDFA5", title: "Halal Streaming", desc: "Ad-free Islamic content streaming — lectures, documentaries, nasheeds, and family entertainment" },
      { icon: "\\uD83C\\uDFA4", title: "Podcast Hub", desc: "Islamic podcast hosting and distribution with monetization tools" },
      { icon: "\\uD83D\\uDCF0", title: "News Platform", desc: "Curated Islamic news from verified sources with fact-checking AI" },
      { icon: "\\uD83C\\uDFA8", title: "Content Studio", desc: "AI-powered content creation tools for Islamic media professionals" },
      { icon: "\\uD83D\\uDCF1", title: "Social Sharing", desc: "Integrated with DarAlNas for community distribution and engagement" },
      { icon: "\\uD83D\\uDCB0", title: "Creator Economy", desc: "Monetize halal content with DarPay — transparent revenue sharing" },
    ],
    pricing: [
      { name: "Viewer", price: "Free", features: ["Basic streaming", "News feed", "Community content"] },
      { name: "Creator", price: "$14.99/mo", features: ["Unlimited streaming", "Podcast hosting", "Content tools", "Monetization"], featured: true },
      { name: "Studio", price: "$199/mo", features: ["Multi-channel", "AI production", "Analytics", "White-label"] },
    ],
  },
  {
    file: "darcloud-dardefi.js",
    title: "DarDeFi",
    subtitle: "Islamic Decentralized Finance",
    tagline: "Shariah-compliant DeFi protocols. Yield farming without riba, liquidity pools with ethical standards, and transparent governance.",
    color: "#14b8a6",
    stats: [
      { val: "0%", label: "Interest" },
      { val: "47", label: "Chains" },
      { val: "Mudarabah", label: "Yield" },
      { val: "DAO", label: "Governance" },
    ],
    features: [
      { icon: "\\uD83C\\uDFE6", title: "Halal Yield", desc: "Mudarabah-based yield generation — profit sharing, not interest charging" },
      { icon: "\\uD83D\\uDCA7", title: "Liquidity Pools", desc: "Shariah-certified liquidity pools with transparent fee distribution" },
      { icon: "\\uD83D\\uDD04", title: "Token Swap", desc: "Decentralized token exchange across 47 chains with best-rate routing" },
      { icon: "\\uD83C\\uDFDB\\uFE0F", title: "DAR Governance", desc: "Decentralized governance with Shura-inspired community voting" },
      { icon: "\\uD83D\\uDCB0", title: "Staking", desc: "Stake QRN tokens for network validation rewards — no riba, pure profit sharing" },
      { icon: "\\uD83D\\uDD12", title: "Audit", desc: "All smart contracts audited for both security and Shariah compliance" },
    ],
    pricing: [
      { name: "Holder", price: "Free", features: ["Token swap", "Basic staking", "Portfolio view"] },
      { name: "Trader", price: "$29/mo", features: ["Advanced swaps", "Yield farming", "Analytics", "API"], featured: true },
      { name: "Institutional", price: "$999/mo", features: ["OTC desk", "Custom pools", "Compliance reports", "SLA"] },
    ],
  },
  {
    file: "darcloud-omarai.js",
    title: "OmarAI",
    subtitle: "Islamic Artificial Intelligence",
    tagline: "Ethical AI built on Islamic principles. From NLP to computer vision, advancing technology with faith-based values.",
    color: "#6366f1",
    stats: [
      { val: "LLM", label: "Models" },
      { val: "100+", label: "Languages" },
      { val: "Ethical", label: "AI Standards" },
      { val: "Open", label: "Source" },
    ],
    features: [
      { icon: "\\uD83E\\uDDE0", title: "Islamic LLM", desc: "Large language model trained on Islamic scholarship with Shariah-aware reasoning" },
      { icon: "\\uD83D\\uDDE3\\uFE0F", title: "Arabic NLP", desc: "State-of-the-art Arabic natural language processing including Classical Arabic" },
      { icon: "\\uD83D\\uDC41\\uFE0F", title: "Vision AI", desc: "Halal food recognition, Arabic OCR, and Islamic art generation" },
      { icon: "\\uD83E\\uDD16", title: "AI Agents", desc: "Autonomous AI agents for business automation with ethical guardrails" },
      { icon: "\\uD83D\\uDCCA", title: "ML Platform", desc: "End-to-end machine learning platform on DarCloud infrastructure" },
      { icon: "\\uD83D\\uDD12", title: "AI Ethics", desc: "Built-in Islamic ethics framework preventing harmful or haram outputs" },
    ],
    pricing: [
      { name: "Developer", price: "Free", features: ["API access (100 calls/day)", "Basic models", "Community support"] },
      { name: "Professional", price: "$79/mo", features: ["Unlimited API", "Advanced models", "Fine-tuning", "Priority"], featured: true },
      { name: "Enterprise", price: "$799/mo", features: ["Custom models", "On-premises", "Dedicated GPU", "SLA"] },
    ],
  },
];

let created = 0;

for (const page of PAGES) {
  const filePath = resolve(PAGES_DIR, page.file);
  if (existsSync(filePath)) {
    console.log(`⏭  Skip: ${page.file} (exists)`);
    continue;
  }

  const statsHtml = page.stats.map(s => `<div class="stat"><div class="val">${s.val}</div><div class="label">${s.label}</div></div>`).join("");
  const featuresHtml = page.features.map(f => `<div class="card"><div class="icon">${f.icon}</div><h3>${f.title}</h3><p>${f.desc}</p></div>`).join("");
  const pricingHtml = page.pricing.map(p => {
    const featList = p.features.map(f => `<li>${f}</li>`).join("");
    return `<div class="price-card${p.featured ? " featured" : ""}"><h3>${p.name}</h3><div class="amount">${p.price.includes("/") ? p.price.split("/")[0] + "<span>/" + p.price.split("/")[1] + "</span>" : p.price}</div><ul>${featList}</ul><a class="btn btn-primary" href="https://darcloud.host/checkout/pro" style="display:block;margin-top:1rem">${p.price === "Free" || p.price === "Pay per use" ? "Get Started" : "Subscribe"}</a></div>`;
  }).join("");

  const html = `// ${page.title} — DarCloud Empire Landing Page (Cloudflare Worker)
var src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    if (url.pathname === "/health") return new Response(JSON.stringify({ status: "healthy", service: "${page.title}", platform: "Cloudflare Workers" }), { headers: { "Content-Type": "application/json" } });
    return new Response(\`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${page.title} | ${page.subtitle} | DarCloud Empire</title>
<meta name="description" content="${page.tagline}">
${css()}
</head><body>
${nav(page.title)}
<section class="hero">
  <p style="color:${page.color};font-weight:600;margin-bottom:.5rem">${page.subtitle}</p>
  <h1><span>${page.title}</span></h1>
  <p>${page.tagline}</p>
  <div class="hero-btns">
    <a class="btn btn-primary" href="https://darcloud.host/checkout/pro">Get Started</a>
    <a class="btn btn-outline" href="https://darcloud.host">Back to DarCloud</a>
  </div>
</section>
<div class="stats">${statsHtml}</div>
<section class="section">
  <h2>Features</h2>
  <p class="sub">Everything you need, built on Islamic principles</p>
  <div class="grid">${featuresHtml}</div>
</section>
<section class="section">
  <h2>Pricing</h2>
  <p class="sub">Transparent, Shariah-compliant pricing</p>
  <div class="pricing">${pricingHtml}</div>
</section>
${footer()}
</body></html>\`, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};
export { src_default as default };
`;

  writeFileSync(filePath, html);
  console.log(`✅ Created: ${page.file}`);
  created++;
}

console.log(`\n✅ Generated ${created} new landing pages (${PAGES.length - created} skipped)`);
