#!/usr/bin/env node
// generate-blog-posts.js — Mass SEO Blog Content Generator for DarCloud
// Generates 1000+ blog posts per run across all DarCloud verticals
// Usage: node generate-blog-posts.js [--count 1000] [--batch daily]

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, 'landing-pages', 'blog');
if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

// ── Brand Config ──
const BRAND = {
  bg: '#07090f', s1: '#0d1117', s2: '#161b22', bdr: '#21262d',
  cyan: '#00d4ff', emerald: '#10b981', gold: '#f59e0b', purple: '#8b5cf6',
  txt: '#e6edf3', muted: '#8b949e'
};

// ── SEO Topic Database — 50 categories x 20+ posts each = 1000+ ──
const CATEGORIES = [
  {
    slug: 'islamic-finance',
    name: 'Islamic Finance',
    color: BRAND.gold,
    icon: '💰',
    topics: [
      { title: 'What is Riba and Why Islam Forbids Interest', desc: 'Understanding the Islamic prohibition on interest-based transactions and modern halal alternatives.' },
      { title: 'Murabaha Explained: Cost-Plus Financing in Islam', desc: 'How murabaha contracts work as a Shariah-compliant alternative to conventional loans.' },
      { title: 'Sukuk vs Bonds: The Islamic Investment Alternative', desc: 'Understanding Islamic bonds (sukuk) and how they differ from conventional fixed-income securities.' },
      { title: 'Islamic Banking: How Banks Operate Without Interest', desc: 'A complete guide to how Islamic banks generate revenue without charging riba.' },
      { title: 'Musharakah: Profit-Sharing Partnerships in Islam', desc: 'How musharakah contracts enable fair business partnerships under Islamic law.' },
      { title: 'Takaful vs Insurance: Islamic Risk Management', desc: 'Understanding cooperative insurance models that comply with Shariah principles.' },
      { title: 'Waqf: The Islamic Endowment System Explained', desc: 'How waqf foundations have funded Islamic civilization for centuries.' },
      { title: 'Zakat Calculator: How to Calculate Your Obligation', desc: 'Step-by-step guide to calculating zakat on different asset types.' },
      { title: 'Halal Investing: A Beginners Guide to Ethical Portfolios', desc: 'How to build an investment portfolio that complies with Islamic principles.' },
      { title: 'The $2.7 Trillion Halal Economy Explained', desc: 'Market size, growth trends, and opportunities in the global halal economy.' },
      { title: 'Islamic Microfinance: Banking the Unbanked Ummah', desc: 'How Islamic microfinance institutions serve communities traditional banks ignore.' },
      { title: 'Cryptocurrency and Islam: A Scholarly Analysis', desc: 'What Islamic scholars say about Bitcoin, Ethereum, and digital currencies.' },
      { title: 'Gold Dinar: The Case for Islamic Sound Money', desc: 'Historical and modern arguments for returning to gold-backed Islamic currency.' },
      { title: 'Islamic FinTech: 10 Startups Disrupting Halal Finance', desc: 'The most innovative Shariah-compliant financial technology companies in 2026.' },
      { title: 'How to Start a Shariah-Compliant Business', desc: 'Legal, financial, and operational considerations for halal entrepreneurship.' },
      { title: 'Islamic Venture Capital: Halal Startup Funding', desc: 'How Islamic VC firms structure investments without debt or interest.' },
      { title: 'Hawala: The Ancient Islamic Money Transfer System', desc: 'How hawala networks operated and their influence on modern fintech.' },
      { title: 'Central Bank Digital Currencies and Islamic Finance', desc: 'How CBDCs could transform Shariah-compliant banking infrastructure.' },
      { title: 'ESG vs Islamic Finance: Similarities and Differences', desc: 'Comparing Western ESG standards with Islamic ethical investment principles.' },
      { title: 'The Future of Islamic Finance in Southeast Asia', desc: 'Malaysia, Indonesia, and the ASEAN halal finance revolution.' },
    ]
  },
  {
    slug: 'blockchain-technology',
    name: 'Blockchain Technology',
    color: BRAND.emerald,
    icon: '⛓️',
    topics: [
      { title: 'What is Blockchain Technology: A Complete Guide', desc: 'Everything you need to know about distributed ledger technology in plain language.' },
      { title: 'How Smart Contracts Work: Ethereum to QuranChain', desc: 'Understanding self-executing contracts on blockchain networks.' },
      { title: 'Proof of Stake vs Proof of Work Explained', desc: 'Comparing the two dominant blockchain consensus mechanisms.' },
      { title: 'Cross-Chain Bridges: How They Work and Why They Matter', desc: 'The technology enabling asset transfers between different blockchain networks.' },
      { title: 'Layer 2 Scaling Solutions for Blockchain', desc: 'How sidechains, rollups, and state channels solve blockchain scalability.' },
      { title: 'Blockchain in Supply Chain Management', desc: 'How distributed ledgers are revolutionizing global supply chain tracking.' },
      { title: 'NFTs Explained: Beyond the Hype', desc: 'The real utility of non-fungible tokens in identity, property, and certification.' },
      { title: 'Decentralized Identity: Self-Sovereign ID on Blockchain', desc: 'How blockchain enables identity systems where users control their own data.' },
      { title: 'Blockchain for Healthcare: Medical Records Revolution', desc: 'Securing patient data and enabling interoperability through distributed ledgers.' },
      { title: 'The Environmental Impact of Blockchain Technology', desc: 'Debunking myths and exploring energy-efficient consensus mechanisms.' },
      { title: 'Tokenomics: Designing Sustainable Crypto Economies', desc: 'How token supply, distribution, and utility affect blockchain project success.' },
      { title: 'DAOs: Decentralized Autonomous Organizations Explained', desc: 'How blockchain-based governance is reshaping organizational structure.' },
      { title: 'Blockchain Interoperability: The Multi-Chain Future', desc: 'Why single-chain dominance is dead and interoperability is everything.' },
      { title: 'Zero-Knowledge Proofs: Privacy on the Blockchain', desc: 'How ZK proofs enable private transactions without sacrificing verification.' },
      { title: '47 Blockchain Networks: QuranChain Architecture Deep Dive', desc: 'Inside the world\'s first Islamic multi-chain blockchain ecosystem.' },
      { title: 'How Gas Fees Work and How to Minimize Them', desc: 'Understanding transaction costs on blockchain networks and optimization strategies.' },
      { title: 'Blockchain Regulation: Global Legal Landscape in 2026', desc: 'How different countries regulate cryptocurrency and blockchain technology.' },
      { title: 'DeFi Explained: Decentralized Finance for Beginners', desc: 'Understanding lending, borrowing, and trading without traditional intermediaries.' },
      { title: 'Real World Assets on Blockchain: Tokenizing Everything', desc: 'How real estate, commodities, and art are being represented as tokens.' },
      { title: 'Building Your First dApp: A Developer Guide', desc: 'Step-by-step tutorial for creating decentralized applications.' },
    ]
  },
  {
    slug: 'mesh-networking',
    name: 'Mesh Networking',
    color: BRAND.cyan,
    icon: '🍄',
    topics: [
      { title: 'What is Mesh Networking and Why It Matters', desc: 'Understanding decentralized network topology and its advantages over traditional infrastructure.' },
      { title: 'FungiMesh: 340K Nodes Building the People\'s Internet', desc: 'How DarCloud\'s mycelium-inspired mesh network is creating sovereign internet infrastructure.' },
      { title: 'How to Deploy a Mesh Node in Under 5 Minutes', desc: 'Step-by-step guide to joining the FungiMesh network with consumer hardware.' },
      { title: 'B.A.T.M.A.N. Protocol Deep Dive', desc: 'Understanding the Better Approach to Mobile Ad-hoc Networking protocol.' },
      { title: 'WireGuard VPN on Mesh Networks', desc: 'How FungiMesh uses WireGuard for encrypted peer-to-peer tunnels.' },
      { title: 'Mesh vs WiFi: Why Traditional Networks Are Fragile', desc: 'Single points of failure in centralized networks and how mesh solves them.' },
      { title: 'Community WiFi: Mesh Networks for Rural Connectivity', desc: 'How mesh networking brings internet access to underserved communities.' },
      { title: 'Mesh Networking for Emergency Communications', desc: 'How mesh networks function when traditional infrastructure fails.' },
      { title: 'The Internet of Things and Mesh Topology', desc: 'Why IoT devices need mesh networking for reliable connectivity.' },
      { title: 'Earning Revenue as a Mesh Node Operator', desc: 'How FungiMesh node operators earn passive income by sharing bandwidth.' },
      { title: 'Mesh Network Security: Threats and Mitigations', desc: 'Security considerations for decentralized network deployments.' },
      { title: 'Building a City-Wide Mesh Network: Case Studies', desc: 'Real-world examples of municipal mesh network deployments.' },
      { title: 'Mesh Networking Hardware: Best Devices for 2026', desc: 'Recommended routers, antennas, and embedded devices for mesh deployments.' },
      { title: 'Bandwidth Sharing Economy: The Future of ISPs', desc: 'How decentralized bandwidth markets could replace traditional internet providers.' },
      { title: 'Mycelium Routing: Nature-Inspired Network Algorithms', desc: 'How fungal network patterns inspire more resilient routing protocols.' },
      { title: 'Mesh Networks and Blockchain: A Perfect Match', desc: 'Why decentralized networks need decentralized infrastructure.' },
      { title: 'Setting Up a FungiMesh Gateway on Raspberry Pi', desc: 'Complete guide to running a mesh gateway on low-cost hardware.' },
      { title: 'Mesh Network Monitoring and Analytics', desc: 'Tools and techniques for monitoring mesh network health and performance.' },
      { title: 'The Future of Decentralized Internet Infrastructure', desc: 'Predictions for mesh networking adoption through 2030.' },
      { title: 'Captive Portal Design for Community Mesh Networks', desc: 'How to create welcoming onboarding experiences for mesh network users.' },
    ]
  },
  {
    slug: 'ai-artificial-intelligence',
    name: 'Artificial Intelligence',
    color: BRAND.purple,
    icon: '🤖',
    topics: [
      { title: 'What is GPT-4o and How It Powers 66 AI Agents', desc: 'Understanding the AI model behind DarCloud\'s intelligent agent fleet.' },
      { title: 'AI Agents vs Chatbots: Understanding the Difference', desc: 'Why autonomous AI agents are the next evolution beyond simple chatbots.' },
      { title: 'Building AI Agents with Discord.js and OpenAI', desc: 'Technical guide to creating intelligent Discord bots with GPT-4o.' },
      { title: 'Islamic AI Ethics: Guardrails for Responsible Technology', desc: 'How DarCloud implements Shariah-compliant AI safety measures.' },
      { title: 'Multi-Agent Systems: How 22 Bots Work Together', desc: 'Architecture of coordinated AI agent fleets for business automation.' },
      { title: 'Natural Language Processing for Arabic Text', desc: 'Challenges and solutions for Arabic NLP in AI applications.' },
      { title: 'AI in Healthcare: Diagnosis Support and Drug Discovery', desc: 'How artificial intelligence is transforming medical practice.' },
      { title: 'AI-Powered Quran Study: Technology Meets Tradition', desc: 'Using AI to enhance Quranic learning, memorization, and understanding.' },
      { title: 'The Business Case for AI Agent Automation', desc: 'ROI analysis of deploying AI agents for business processes.' },
      { title: 'Prompt Engineering Best Practices for 2026', desc: 'How to write effective prompts for GPT-4o and other language models.' },
      { title: 'AI and Content Creation: Scaling Media Production', desc: 'Using AI to generate blog posts, videos, and marketing content at scale.' },
      { title: 'Responsible AI: Bias Detection and Mitigation', desc: 'Technical approaches to ensuring AI systems are fair and unbiased.' },
      { title: 'AI for Small Business: Affordable Automation Tools', desc: 'How small businesses can leverage AI without enterprise budgets.' },
      { title: 'Computer Vision: AI That Sees and Understands', desc: 'Applications of visual AI from quality control to autonomous vehicles.' },
      { title: 'Voice AI: Building Multilingual Voice Assistants', desc: 'Creating voice interfaces that work in Arabic, English, and more.' },
      { title: 'AI in Education: Personalized Learning at Scale', desc: 'How AI tutors adapt to individual student needs and learning styles.' },
      { title: 'The AI Agent Economy: How Autonomous Agents Generate Revenue', desc: 'Business models for AI-powered services and agent marketplaces.' },
      { title: 'AI Security: Protecting Against Adversarial Attacks', desc: 'How to defend AI systems from manipulation and exploitation.' },
      { title: 'Edge AI: Running Intelligence on Mesh Nodes', desc: 'How FungiMesh brings AI processing to the network edge.' },
      { title: 'Open Source AI: The Best Free Models and Frameworks', desc: 'Guide to open-source AI tools for developers and startups.' },
    ]
  },
  {
    slug: 'halal-lifestyle',
    name: 'Halal Lifestyle',
    color: '#e11d48',
    icon: '🌙',
    topics: [
      { title: 'What Does Halal Mean: A Complete Guide', desc: 'Understanding halal principles beyond food — in finance, technology, and daily life.' },
      { title: 'Halal Certification: How Products Get Approved', desc: 'The process, standards, and organizations behind halal certification globally.' },
      { title: 'Halal Food Industry: Market Size and Growth Trends', desc: 'The $1.9 trillion halal food market and emerging opportunities.' },
      { title: 'Modest Fashion: The Halal Clothing Revolution', desc: 'How Islamic fashion is becoming a mainstream global industry.' },
      { title: 'Halal Travel: Muslim-Friendly Tourism Guide', desc: 'Best destinations, hotels, and travel tips for Muslim travelers.' },
      { title: 'Halal Cosmetics: Beauty Without Compromise', desc: 'Understanding halal-certified beauty products and skincare.' },
      { title: 'Islamic App Ecosystem: Best Muslim Apps in 2026', desc: 'Top apps for prayer times, Quran, halal food finder, and more.' },
      { title: 'Halal Pharmaceuticals: Medicine Compliance Guide', desc: 'How to verify if medications and supplements are halal.' },
      { title: 'Muslim Consumer Spending: Demographics and Trends', desc: 'How 2 billion Muslim consumers are shaping global markets.' },
      { title: 'Halal E-Commerce: Online Shopping for Muslims', desc: 'Platforms, marketplaces, and strategies for halal online retail.' },
      { title: 'Islamic Interior Design: Creating Halal Spaces', desc: 'Design principles for homes and offices inspired by Islamic aesthetics.' },
      { title: 'Halal Entertainment: Games, Media, and Culture', desc: 'Building entertainment that aligns with Islamic values.' },
      { title: 'Sustainable Halal: Where Islamic and Green Values Meet', desc: 'The overlap between halal standards and environmental sustainability.' },
      { title: 'Ramadan Marketing: Reaching Muslims During Holy Month', desc: 'Best practices for respectful and effective Ramadan campaigns.' },
      { title: 'Halal Supply Chain Technology', desc: 'How blockchain and IoT ensure halal integrity from farm to table.' },
      { title: 'Muslim Millennials: The New Halal Consumer', desc: 'How young Muslims are redefining what halal means in the digital age.' },
      { title: 'Halal Certification Fraud: How to Spot Fakes', desc: 'Protecting consumers from fraudulent halal claims and certifications.' },
      { title: 'The Rise of Halal FinTech in Gulf States', desc: 'How GCC countries are leading Islamic financial technology innovation.' },
      { title: 'Halal Real Estate: Islamic Property Investment', desc: 'Shariah-compliant real estate investment models and platforms.' },
      { title: 'Building a Halal Brand: Marketing to Muslim Consumers', desc: 'Authentic strategies for reaching the 2-billion-strong Muslim market.' },
    ]
  },
  {
    slug: 'cybersecurity',
    name: 'Cybersecurity',
    color: '#ef4444',
    icon: '🛡️',
    topics: [
      { title: 'Zero-Trust Security Architecture Explained', desc: 'Why perimeter-based security is dead and how zero-trust changes everything.' },
      { title: 'JWT Authentication: Security Best Practices', desc: 'How to implement JSON Web Token auth securely in modern applications.' },
      { title: 'PBKDF2 Password Hashing: Why 100K Iterations Matter', desc: 'Understanding key derivation functions and password storage security.' },
      { title: 'API Security: Protecting Your Endpoints from Attack', desc: 'Rate limiting, authentication, input validation, and other API defenses.' },
      { title: 'SQL Injection Prevention: Parameterized Queries Guide', desc: 'How to prevent the most common database attack vector.' },
      { title: 'Stripe Webhook Security: Signature Verification', desc: 'Protecting payment webhooks from replay and spoofing attacks.' },
      { title: 'DDoS Protection with Cloudflare Workers', desc: 'How edge computing and rate limiting defend against denial of service.' },
      { title: 'Encryption at Rest and in Transit: A Complete Guide', desc: 'Understanding data encryption for compliance and security.' },
      { title: 'OWASP Top 10: Web Application Security Risks in 2026', desc: 'The most critical security vulnerabilities and how to prevent them.' },
      { title: 'Social Engineering: The Human Side of Cybersecurity', desc: 'How attackers manipulate people and how to build awareness.' },
      { title: 'Mesh Network Security: Decentralized Defense', desc: 'Security considerations unique to peer-to-peer network topologies.' },
      { title: 'Discord Bot Security: Protecting Your Bots', desc: 'Token management, permission scoping, and command validation for Discord bots.' },
      { title: 'Two-Factor Authentication: Implementation Guide', desc: 'Adding 2FA to your application with TOTP and backup codes.' },
      { title: 'Penetration Testing: Finding Vulnerabilities Before Hackers Do', desc: 'Introduction to ethical hacking and security testing methodologies.' },
      { title: 'Data Privacy Laws: GDPR, CCPA, and Islamic Principles', desc: 'How global privacy regulations align with Islamic data ethics.' },
      { title: 'Incident Response Planning: When Breaches Happen', desc: 'Building an effective security incident response plan.' },
      { title: 'Container Security: Docker and Kubernetes Hardening', desc: 'Securing containerized applications and orchestration platforms.' },
      { title: 'Supply Chain Attacks: Protecting Your Dependencies', desc: 'How to defend against compromised packages and third-party tools.' },
      { title: 'Browser Security: XSS, CSRF, and Content Security Policy', desc: 'Preventing client-side attacks in web applications.' },
      { title: 'Blockchain Security: Smart Contract Auditing', desc: 'Common vulnerabilities in smart contracts and how to prevent them.' },
    ]
  },
  {
    slug: 'cloud-computing',
    name: 'Cloud Computing',
    color: '#06b6d4',
    icon: '☁️',
    topics: [
      { title: 'Cloudflare Workers: The Edge Computing Revolution', desc: 'How serverless edge functions are changing application architecture.' },
      { title: 'Serverless vs Containers: When to Use What', desc: 'Comparing serverless functions, containers, and traditional servers.' },
      { title: 'D1 Database: SQLite at the Edge with Cloudflare', desc: 'How Cloudflare D1 brings relational databases to edge computing.' },
      { title: 'Building APIs with Hono Framework', desc: 'A guide to the ultrafast web framework for Cloudflare Workers.' },
      { title: 'Multi-Tenant SaaS Architecture on Edge', desc: 'Designing SaaS applications that scale globally on edge infrastructure.' },
      { title: 'CDN Architecture: How Content Delivery Networks Work', desc: 'Understanding edge caching, PoPs, and global content distribution.' },
      { title: 'Sovereign Cloud: Why Data Location Matters', desc: 'Data sovereignty, compliance, and building cloud infrastructure you control.' },
      { title: 'Microservices Architecture: Benefits and Trade-offs', desc: 'When to use microservices and when monoliths are better.' },
      { title: 'CI/CD Pipelines for Cloudflare Workers', desc: 'Automating deployments with GitHub Actions and Wrangler.' },
      { title: 'Edge Computing for IoT: Processing Data Where It\'s Generated', desc: 'Why edge computing is essential for Internet of Things applications.' },
      { title: 'Database Migration Strategies for Production Systems', desc: 'Safe approaches to schema changes in live databases.' },
      { title: 'Rate Limiting: Protecting APIs from Abuse', desc: 'Implementing effective rate limiting with token buckets and sliding windows.' },
      { title: 'Webhook Architecture: Event-Driven Integration', desc: 'Designing reliable webhook systems for real-time notifications.' },
      { title: 'Cloud Cost Optimization: Reducing Your Monthly Bill', desc: 'Strategies for minimizing cloud infrastructure costs without sacrificing performance.' },
      { title: 'PM2 Process Management: Running Node.js in Production', desc: 'Complete guide to managing Node.js applications with PM2.' },
      { title: 'Docker Compose: Multi-Container Application Deployment', desc: 'Orchestrating complex applications with Docker Compose.' },
      { title: 'Load Balancing Strategies for Global Applications', desc: 'Geographic, round-robin, and least-connections load balancing explained.' },
      { title: 'Monitoring and Observability for Cloud Applications', desc: 'Logging, metrics, tracing, and alerting for production systems.' },
      { title: 'The JAMstack Architecture for Modern Websites', desc: 'JavaScript, APIs, and Markup — building fast, secure websites.' },
      { title: 'WebSocket vs Server-Sent Events: Real-Time Communication', desc: 'Choosing the right technology for real-time data streaming.' },
    ]
  },
  {
    slug: 'discord-bots',
    name: 'Discord Bots',
    color: '#5865F2',
    icon: '🎮',
    topics: [
      { title: 'Building Discord Bots with Discord.js v14', desc: 'Complete guide to creating powerful Discord bots with the latest API.' },
      { title: 'Discord Slash Commands: Registration and Handling', desc: 'How to register and process slash commands in Discord bots.' },
      { title: 'Discord Bot Architecture: Handler Patterns', desc: 'Comparing command handler patterns for scalable bot development.' },
      { title: 'Multi-Bot Discord Ecosystems: Managing 22 Bots', desc: 'Architecture patterns for running coordinated bot fleets.' },
      { title: 'Discord Bot Monetization: Stripe Integration Guide', desc: 'How to add premium features and payment processing to Discord bots.' },
      { title: 'Discord Embeds: Rich Message Formatting', desc: 'Creating beautiful, informative embed messages in Discord.' },
      { title: 'Discord Bot Auto-Recovery and Watchdog Patterns', desc: 'Building self-healing bots that recover from crashes automatically.' },
      { title: 'Discord API Rate Limits: How to Handle Them', desc: 'Understanding and respecting Discord API rate limits in bot code.' },
      { title: 'Discord Gateway Intents: What Your Bot Needs', desc: 'Configuring gateway intents for optimal bot performance and permissions.' },
      { title: 'Building a Discord Onboarding System', desc: 'Creating automated membership onboarding flows in Discord.' },
      { title: 'Discord Bot Security: Token Management Best Practices', desc: 'Protecting bot tokens and implementing secure command authorization.' },
      { title: 'Discord Webhooks: Sending Automated Notifications', desc: 'Using webhooks for one-way messaging from external services to Discord.' },
      { title: 'Discord Bot IPC: Inter-Process Communication Between Bots', desc: 'How to make multiple Discord bots communicate with each other.' },
      { title: 'Discord Bot Hosting: VPS vs Serverless Options', desc: 'Comparing hosting options for Discord bot deployments.' },
      { title: 'Building a Help Command System for Complex Bots', desc: 'Dynamic help generation for bots with many commands.' },
      { title: 'Discord Bot Analytics: Tracking Usage and Performance', desc: 'Monitoring bot health, command usage, and user engagement.' },
      { title: 'Discord Moderation Bots: Auto-Mod Implementation', desc: 'Building automated moderation systems for Discord communities.' },
      { title: 'Discord Bot Localization: Supporting Multiple Languages', desc: 'Adding multilingual support to your Discord bot.' },
      { title: 'Discord Activity Status: Making Bots Look Professional', desc: 'Setting dynamic status messages and rich presence for bots.' },
      { title: 'A Complete Discord Bot Template for Node.js', desc: 'Full starter template with slash commands, error handling, and database integration.' },
    ]
  },
  {
    slug: 'startup-entrepreneurship',
    name: 'Startup & Entrepreneurship',
    color: '#f97316',
    icon: '🚀',
    topics: [
      { title: 'How to Build a 101-Company Ecosystem from Zero', desc: 'The DarCloud playbook for building a tech conglomerate as a solo founder.' },
      { title: 'Solo Founder Strategy: Doing Everything with AI', desc: 'How one person can build what used to require 100 with AI-powered development.' },
      { title: 'Revenue Models for Tech Startups: A Complete Guide', desc: 'SaaS, marketplace, transaction fees, and hybrid revenue models explained.' },
      { title: 'Bootstrapping vs Fundraising: When to Choose What', desc: 'The trade-offs between self-funding and seeking external investment.' },
      { title: 'Building in Public: The Power of Transparency', desc: 'How sharing your journey builds trust, community, and customers.' },
      { title: 'Platform Business Models: Network Effects Explained', desc: 'How platforms create value through multi-sided markets and network effects.' },
      { title: 'Technical Due Diligence: What Investors Look At', desc: 'How investors evaluate the technical foundation of startups.' },
      { title: 'Pricing Strategy for SaaS Products', desc: 'How to price software subscriptions for maximum growth and revenue.' },
      { title: 'Building Developer Communities Around Your Product', desc: 'Strategies for growing engaged developer ecosystems.' },
      { title: 'The Flywheel Effect: Building Self-Reinforcing Growth', desc: 'How Amazon, DarCloud, and other platforms create compounding growth loops.' },
      { title: 'Minimum Viable Empire: Launch Fast, Scale Smart', desc: 'How to validate and launch multiple products simultaneously.' },
      { title: 'Open Source Strategy for Startups', desc: 'When and how to leverage open source as a competitive advantage.' },
      { title: 'Contractor vs Employee: Building Your First Team', desc: 'Hiring strategies for early-stage startups with limited budgets.' },
      { title: 'Product-Led Growth: Let the Product Sell Itself', desc: 'How free tiers, self-service, and great UX drive organic growth.' },
      { title: 'Vertical SaaS: Dominating a Niche Market', desc: 'Why industry-specific software often beats horizontal competitors.' },
      { title: 'API-First Business Models', desc: 'Building companies where the API is the product.' },
      { title: 'Unit Economics: Understanding LTV, CAC, and Margins', desc: 'The financial metrics every startup founder must track.' },
      { title: 'Launch Playbook: Going from 0 to 1000 Users', desc: 'Tactical steps for launching and getting initial traction.' },
      { title: 'Pivoting Strategy: When and How to Change Direction', desc: 'Recognizing pivot signals and executing direction changes successfully.' },
      { title: 'Tech Stack Decisions for Startups', desc: 'How to choose technologies that scale without over-engineering.' },
    ]
  },
  {
    slug: 'web-development',
    name: 'Web Development',
    color: '#22d3ee',
    icon: '💻',
    topics: [
      { title: 'TypeScript 5.9: New Features and Best Practices', desc: 'What\'s new in TypeScript 5.9 and how to use it effectively.' },
      { title: 'Hono Framework: The Fastest Web Framework for Edge', desc: 'Building ultrafast APIs with Hono on Cloudflare Workers.' },
      { title: 'Building REST APIs with OpenAPI and chanfana', desc: 'Auto-generating API documentation from TypeScript code.' },
      { title: 'CSS Grid and Flexbox: Modern Layout Masterclass', desc: 'Complete guide to building responsive layouts with CSS Grid and Flexbox.' },
      { title: 'Web Performance Optimization: Core Web Vitals Guide', desc: 'How to achieve perfect Lighthouse scores and fast page loads.' },
      { title: 'Progressive Web Apps in 2026: Still Relevant?', desc: 'The state of PWA technology and when to use it.' },
      { title: 'Web Components: Building Reusable UI Elements', desc: 'Creating framework-agnostic components with native web standards.' },
      { title: 'Node.js Best Practices for Production Applications', desc: 'Error handling, logging, security, and performance in Node.js.' },
      { title: 'ESM vs CommonJS: JavaScript Module Systems Explained', desc: 'Understanding the differences and migration path between module systems.' },
      { title: 'Building Landing Pages That Convert', desc: 'Design and copy principles for high-conversion web pages.' },
      { title: 'SEO for Developers: Technical Search Optimization', desc: 'How developers can build SEO-friendly applications from the ground up.' },
      { title: 'Responsive Design Patterns for 2026', desc: 'Modern approaches to building interfaces that work on any screen size.' },
      { title: 'Web Accessibility: Building for Everyone', desc: 'WCAG compliance, screen readers, and inclusive design patterns.' },
      { title: 'HTML Email Development: A Survival Guide', desc: 'Building emails that render correctly across all clients.' },
      { title: 'JavaScript Framework Comparison: React vs Vue vs Svelte', desc: 'Choosing the right frontend framework for your project.' },
      { title: 'Static Site Generation for Content-Heavy Websites', desc: 'Build times, SEO, and deployment strategies for static sites.' },
      { title: 'HTTP/3 and QUIC: The Future of Web Protocols', desc: 'Understanding the next generation of internet protocols.' },
      { title: 'Web Animation: CSS, GSAP, and Framer Motion', desc: 'Creating smooth, performant animations for modern websites.' },
      { title: 'Dark Mode Design: Implementation and Best Practices', desc: 'How to implement dark mode that users actually love.' },
      { title: 'Internationalization: Building Multilingual Websites', desc: 'Handling RTL languages, Unicode, and locale-specific formatting.' },
    ]
  },
  // ── SPORTS (detailed) ──
  {
    slug: 'sports-world',
    name: 'Sports World',
    color: '#16a34a',
    icon: '🏆',
    topics: [
      { title: 'The Rise of Muslim Athletes in Global Sports', desc: 'How Muslim athletes are breaking barriers and inspiring millions worldwide.' },
      { title: 'Mo Salah Effect: Islam in the Premier League', desc: 'How Mohamed Salah changed perceptions of Muslims in world football.' },
      { title: 'Khabib Nurmagomedov: Legacy of an Undefeated Champion', desc: 'The story of MMA\'s greatest lightweight and his Islamic values.' },
      { title: 'World Cup 2026: Everything You Need to Know', desc: 'Complete preview of the FIFA World Cup 2026 in USA, Mexico, and Canada.' },
      { title: 'Olympics 2028 Los Angeles: Sports and Tech Converge', desc: 'How technology will transform the 2028 Olympic Games experience.' },
      { title: 'NBA Analytics Revolution: How Data Changed Basketball', desc: 'The three-point revolution and advanced metrics reshaping the NBA.' },
      { title: 'Cricket World Cup: The Fastest Growing Global Sport', desc: 'How cricket is expanding beyond traditional markets to global audiences.' },
      { title: 'Formula 1 Technology: Engineering at 200mph', desc: 'The cutting-edge technology that makes modern F1 cars the fastest on Earth.' },
      { title: 'Sports Betting and Islamic Ethics', desc: 'Why gambling is haram and what halal alternatives exist for sports fans.' },
      { title: 'Fasting Athletes: How Ramadan Affects Performance', desc: 'Scientific studies on athletic performance during Ramadan fasting.' },
      { title: 'Women in Sports: Breaking Barriers Across Cultures', desc: 'The growing movement for gender equality in professional athletics.' },
      { title: 'Esports Becomes a Billion Dollar Industry', desc: 'How competitive gaming surpassed traditional sports in viewership.' },
      { title: 'Sports Science: Recovery and Performance Technology', desc: 'From cryotherapy to wearable sensors — the tech behind peak performance.' },
      { title: 'Running a Marathon: Complete Training Guide', desc: 'How to train for your first marathon with a science-backed program.' },
      { title: 'The Business of Professional Sports', desc: 'Revenue models, TV deals, and sponsorships driving the sports industry.' },
      { title: 'Youth Sports Development in Muslim Countries', desc: 'Investing in the next generation of athletes across the Islamic world.' },
      { title: 'Archery in Islam: The Prophetic Sport', desc: 'The hadith on archery and why it remains a beloved Muslim tradition.' },
      { title: 'Swimming and Modesty: Halal Athletic Wear Revolution', desc: 'How sportswear brands are designing for Muslim athletes.' },
      { title: 'Sports Psychology: Mental Toughness and Faith', desc: 'How Islamic meditation and prayer enhance athletic mental performance.' },
      { title: 'Stadium Technology: Smart Venues of the Future', desc: 'How AI, IoT, and 5G are transforming the live sports experience.' },
    ]
  },
  // ── SCIENCE (detailed) ──
  {
    slug: 'science-discovery',
    name: 'Science & Discovery',
    color: '#3b82f6',
    icon: '🔬',
    topics: [
      { title: 'CRISPR Gene Editing: The Future of Medicine', desc: 'How CRISPR-Cas9 is revolutionizing genetic disease treatment.' },
      { title: 'James Webb Telescope: New Discoveries in Deep Space', desc: 'The most stunning findings from humanity\'s most powerful space telescope.' },
      { title: 'Quantum Computing Explained Simply', desc: 'Understanding qubits, superposition, and why quantum computers matter.' },
      { title: 'The Human Genome Project: 20 Years Later', desc: 'How mapping human DNA transformed medicine and bioethics.' },
      { title: 'Dark Matter and Dark Energy: The Universe We Cannot See', desc: 'What scientists know (and don\'t know) about 95% of the universe.' },
      { title: 'Nuclear Fusion Breakthrough: Unlimited Clean Energy?', desc: 'The latest progress toward viable fusion power generation.' },
      { title: 'Neuroscience of Learning: How the Brain Acquires Knowledge', desc: 'Scientific insights into memory formation and effective studying.' },
      { title: 'Mars Colonization: The Science Behind Living on Mars', desc: 'Challenges and solutions for establishing a permanent Mars settlement.' },
      { title: 'Islamic Golden Age: Muslim Scientists Who Changed the World', desc: 'Al-Khwarizmi, Ibn Sina, Al-Haytham and their lasting contributions.' },
      { title: 'Artificial Photosynthesis: Fuel from Sunlight', desc: 'How scientists are mimicking plants to create clean energy.' },
      { title: 'The Science of Earthquakes and Tsunami Prediction', desc: 'Modern seismology and early warning systems saving lives.' },
      { title: 'Microplastics in Oceans: The Invisible Pollution Crisis', desc: 'How plastic particles are affecting marine ecosystems and human health.' },
      { title: 'The Mathematics of the Quran: Numerical Patterns', desc: 'Exploring the mathematical structure and symmetry within Quranic verses.' },
      { title: 'Stem Cell Therapy: Promise and Ethical Considerations', desc: 'Current applications and Islamic perspectives on stem cell research.' },
      { title: 'Evolution of Antibiotic Resistance: A Growing Threat', desc: 'Why superbugs are emerging and what science is doing about it.' },
      { title: 'The Physics of Black Holes: Event Horizons and Beyond', desc: 'Understanding the most extreme objects in the known universe.' },
      { title: 'Climate Change: The Scientific Consensus in 2026', desc: 'What the latest IPCC data tells us about our warming planet.' },
      { title: 'Vaccine Science: How mRNA Technology Works', desc: 'The science behind messenger RNA vaccines and future applications.' },
      { title: 'The Deep Ocean: Exploring Earth\'s Last Frontier', desc: 'What we\'re discovering in the deepest parts of our oceans.' },
      { title: 'Brain-Computer Interfaces: Merging Mind and Machine', desc: 'How neural interfaces are enabling paralyzed patients to communicate.' },
    ]
  },
  // ── BREAKING NEWS & CURRENT EVENTS ──
  {
    slug: 'breaking-news',
    name: 'Breaking News',
    color: '#ef4444',
    icon: '🔴',
    topics: [
      { title: 'AI Regulation 2026: Global Policy Landscape', desc: 'How governments worldwide are approaching artificial intelligence regulation.' },
      { title: 'The State of the Global Economy in 2026', desc: 'GDP growth, inflation trends, and economic outlook across major economies.' },
      { title: 'Space Race 2.0: Private Companies Reach New Frontiers', desc: 'SpaceX, Blue Origin, and the commercialization of space exploration.' },
      { title: 'Renewable Energy Surpasses Fossil Fuels in Europe', desc: 'The milestone moment when clean energy became the dominant power source.' },
      { title: 'Global Food Security Crisis and Technology Solutions', desc: 'How vertical farming, lab-grown meat, and AI are addressing food shortages.' },
      { title: '5G and 6G Rollout: The Connected Future is Here', desc: 'Global 5G coverage milestones and early 6G research developments.' },
      { title: 'Cybersecurity Threats 2026: New Attack Vectors', desc: 'The evolving threat landscape and how organizations are responding.' },
      { title: 'Electric Vehicle Market: Adoption Accelerates Globally', desc: 'EV sales data, charging infrastructure growth, and battery breakthroughs.' },
      { title: 'The Rise of Digital Currencies by Central Banks', desc: 'CBDC launches worldwide and their impact on traditional banking.' },
      { title: 'Global Water Crisis: Technology vs Scarcity', desc: 'Desalination, water recycling, and IoT solutions for water management.' },
      { title: 'Autonomous Vehicles: Regulatory Progress in 2026', desc: 'Where self-driving cars are legal and the safety data behind them.' },
      { title: 'Global Health Updates: Pandemic Preparedness', desc: 'WHO initiatives and technological advances in disease surveillance.' },
      { title: 'Tech Layoffs and the Reshaping of Silicon Valley', desc: 'How the tech industry is restructuring around AI and efficiency.' },
      { title: 'The Metaverse in 2026: Reality Check', desc: 'What happened to the metaverse hype and what actually survived.' },
      { title: 'Cryptocurrency Market Analysis: Bitcoin in 2026', desc: 'Market trends, institutional adoption, and regulatory developments.' },
      { title: 'Africa\'s Tech Boom: The Continent\'s Digital Transformation', desc: 'How African startups are solving continental challenges with technology.' },
      { title: 'Indonesia and Malaysia Lead Islamic FinTech Growth', desc: 'Southeast Asian nations becoming the center of halal financial innovation.' },
      { title: 'Quantum Internet: First Intercity Encrypted Networks', desc: 'Breakthroughs in quantum key distribution and unhackable communications.' },
      { title: 'NATO and Global Security: Geopolitical Analysis', desc: 'How shifting alliances are reshaping international security frameworks.' },
      { title: 'The Creator Economy Hits $500 Billion', desc: 'How individual creators are building media empires with AI tools.' },
    ]
  },
  // ── HEALTH & MEDICINE (detailed) ──
  {
    slug: 'health-medicine',
    name: 'Health & Medicine',
    color: '#22c55e',
    icon: '🏥',
    topics: [
      { title: 'Islamic Medicine: Prophetic Remedies and Modern Science', desc: 'How honeys, black seed oil, and fasting align with modern research.' },
      { title: 'Intermittent Fasting: The Science Behind Islamic Fasting', desc: 'How Ramadan-style fasting provides health benefits backed by research.' },
      { title: 'Mental Health in the Muslim Community: Breaking Stigma', desc: 'Addressing depression, anxiety, and seeking help in Islamic context.' },
      { title: 'Telehealth Revolution: Healthcare From Anywhere', desc: 'How telemedicine is expanding access to healthcare globally.' },
      { title: 'AI in Diagnostics: How Machine Learning Finds Disease', desc: 'AI systems that detect cancer, heart disease, and rare conditions.' },
      { title: 'The Gut Microbiome: Your Second Brain', desc: 'How gut bacteria influence mood, immunity, and overall health.' },
      { title: 'Sleep Science: Why 8 Hours Changes Everything', desc: 'Research on sleep stages, circadian rhythms, and health impacts.' },
      { title: 'Halal Pharmaceuticals: Ensuring Medicine Compliance', desc: 'How to verify medications are free from haram ingredients.' },
      { title: 'Wearable Health Tech: From Smartwatches to Biosensors', desc: 'How continuous health monitoring is transforming preventive medicine.' },
      { title: 'Children\'s Health: Vaccination and Islamic Perspectives', desc: 'Scholarly consensus on immunization and child health in Islam.' },
      { title: 'Cancer Research Breakthroughs in 2026', desc: 'Immunotherapy, targeted treatment, and personalized medicine advances.' },
      { title: 'Diabetes Prevention: Lifestyle Changes That Work', desc: 'Evidence-based strategies for preventing and managing Type 2 diabetes.' },
      { title: 'Eye Health: Screen Time and Digital Eye Strain', desc: 'How to protect your vision in the age of constant screen exposure.' },
      { title: 'Heart Disease: The Global Killer and How to Fight It', desc: 'Risk factors, prevention strategies, and latest treatment options.' },
      { title: 'Alzheimer\'s Research: New Hope for Prevention', desc: 'Promising developments in understanding and treating dementia.' },
      { title: 'Yoga and Islamic Contemplation: Finding Overlap', desc: 'Physical wellness practices compatible with Islamic spiritual traditions.' },
      { title: 'Hydration Science: How Much Water Do You Really Need?', desc: 'Debunking myths about water intake with evidence-based guidelines.' },
      { title: 'Dental Health: Prevention is Better Than Treatment', desc: 'The miswak tradition and modern dental hygiene best practices.' },
      { title: 'Pandemic Preparedness Lessons for Future Outbreaks', desc: 'What COVID-19 taught us about global health infrastructure.' },
      { title: 'Traditional Medicine Meets Technology: Best of Both', desc: 'Integrating traditional healing practices with modern medical science.' },
    ]
  },
];

// ── More categories for volume ──
const EXTRA_CATEGORIES = [
  { slug: 'halal-ecommerce', name: 'Halal E-Commerce', color: BRAND.gold, icon: '🛒', count: 20, prefix: 'How to' },
  { slug: 'islamic-education', name: 'Islamic Education', color: BRAND.emerald, icon: '📚', count: 20, prefix: 'Guide to' },
  { slug: 'health-wellness', name: 'Health & Wellness', color: '#22c55e', icon: '🏥', count: 20, prefix: 'Understanding' },
  { slug: 'real-estate', name: 'Real Estate', color: '#a855f7', icon: '🏠', count: 20, prefix: 'How to' },
  { slug: 'telecom-5g', name: 'Telecom & 5G', color: BRAND.cyan, icon: '📡', count: 20, prefix: 'The Future of' },
  { slug: 'energy-sustainability', name: 'Energy & Green Tech', color: '#22d3ee', icon: '⚡', count: 20, prefix: 'Guide to' },
  { slug: 'legal-compliance', name: 'Legal & Compliance', color: '#6366f1', icon: '⚖️', count: 20, prefix: 'Understanding' },
  { slug: 'media-entertainment', name: 'Media & Entertainment', color: '#ec4899', icon: '🎬', count: 20, prefix: 'How to Build' },
  { slug: 'logistics-transport', name: 'Logistics & Transport', color: '#f97316', icon: '🚚', count: 20, prefix: 'Optimizing' },
  { slug: 'hr-workforce', name: 'HR & Workforce', color: '#14b8a6', icon: '👥', count: 20, prefix: 'Modern' },
  { slug: 'gaming-esports', name: 'Gaming & Esports', color: BRAND.purple, icon: '🎮', count: 20, prefix: 'The Rise of' },
  { slug: 'data-analytics', name: 'Data & Analytics', color: '#0ea5e9', icon: '📊', count: 20, prefix: 'Mastering' },
  { slug: 'devops-infrastructure', name: 'DevOps & Infrastructure', color: '#84cc16', icon: '🔧', count: 20, prefix: 'Automating' },
  { slug: 'mobile-development', name: 'Mobile Development', color: '#f43f5e', icon: '📱', count: 20, prefix: 'Building' },
  { slug: 'open-source', name: 'Open Source', color: '#10b981', icon: '🌐', count: 20, prefix: 'Contributing to' },

  // ── SPORTS ──
  { slug: 'football-soccer', name: 'Football & Soccer', color: '#16a34a', icon: '⚽', count: 20, prefix: 'Inside' },
  { slug: 'basketball', name: 'Basketball', color: '#ea580c', icon: '🏀', count: 20, prefix: 'Breaking Down' },
  { slug: 'cricket', name: 'Cricket', color: '#0284c7', icon: '🏏', count: 20, prefix: 'Analyzing' },
  { slug: 'mma-combat-sports', name: 'MMA & Combat Sports', color: '#dc2626', icon: '🥊', count: 20, prefix: 'The Evolution of' },
  { slug: 'athletics-track-field', name: 'Athletics & Track', color: '#ca8a04', icon: '🏃', count: 20, prefix: 'Training for' },
  { slug: 'swimming-aquatics', name: 'Swimming & Aquatics', color: '#0891b2', icon: '🏊', count: 20, prefix: 'Mastering' },
  { slug: 'tennis', name: 'Tennis', color: '#65a30d', icon: '🎾', count: 20, prefix: 'Understanding' },
  { slug: 'formula-one-motorsport', name: 'F1 & Motorsport', color: '#e11d48', icon: '🏎️', count: 20, prefix: 'The Science of' },
  { slug: 'olympic-sports', name: 'Olympic Sports', color: '#d97706', icon: '🏅', count: 20, prefix: 'Competing in' },
  { slug: 'sports-analytics', name: 'Sports Analytics', color: '#7c3aed', icon: '📈', count: 20, prefix: 'Data-Driven' },
  { slug: 'esports-competitive', name: 'Competitive Esports', color: '#8b5cf6', icon: '🎯', count: 20, prefix: 'Pro Tips for' },
  { slug: 'fitness-training', name: 'Fitness & Training', color: '#059669', icon: '💪', count: 20, prefix: 'Building' },
  { slug: 'martial-arts', name: 'Martial Arts', color: '#b91c1c', icon: '🥋', count: 20, prefix: 'The Art of' },
  { slug: 'horse-racing-equestrian', name: 'Equestrian Sports', color: '#92400e', icon: '🏇', count: 20, prefix: 'Guide to' },
  { slug: 'sports-nutrition', name: 'Sports Nutrition', color: '#15803d', icon: '🥗', count: 20, prefix: 'Fueling' },
  { slug: 'sports-medicine', name: 'Sports Medicine', color: '#b45309', icon: '🩺', count: 20, prefix: 'Advances in' },
  { slug: 'extreme-sports', name: 'Extreme Sports', color: '#dc2626', icon: '🪂', count: 20, prefix: 'Thriving in' },
  { slug: 'winter-sports', name: 'Winter Sports', color: '#0ea5e9', icon: '⛷️', count: 20, prefix: 'Conquering' },
  { slug: 'golf', name: 'Golf', color: '#22c55e', icon: '⛳', count: 20, prefix: 'Perfecting' },
  { slug: 'rugby', name: 'Rugby', color: '#991b1b', icon: '🏉', count: 20, prefix: 'The Strategy of' },

  // ── SCIENCE ──
  { slug: 'physics', name: 'Physics', color: '#3b82f6', icon: '⚛️', count: 20, prefix: 'Exploring' },
  { slug: 'chemistry', name: 'Chemistry', color: '#10b981', icon: '🧪', count: 20, prefix: 'Discovering' },
  { slug: 'biology', name: 'Biology', color: '#22c55e', icon: '🧬', count: 20, prefix: 'Understanding' },
  { slug: 'astronomy-space', name: 'Astronomy & Space', color: '#6366f1', icon: '🔭', count: 20, prefix: 'Gazing at' },
  { slug: 'neuroscience', name: 'Neuroscience', color: '#ec4899', icon: '🧠', count: 20, prefix: 'Decoding' },
  { slug: 'quantum-computing', name: 'Quantum Computing', color: '#8b5cf6', icon: '💠', count: 20, prefix: 'The Promise of' },
  { slug: 'genetics-genomics', name: 'Genetics & Genomics', color: '#14b8a6', icon: '🧬', count: 20, prefix: 'Mapping' },
  { slug: 'climate-science', name: 'Climate Science', color: '#059669', icon: '🌍', count: 20, prefix: 'Confronting' },
  { slug: 'marine-biology', name: 'Marine Biology', color: '#0891b2', icon: '🐠', count: 20, prefix: 'Diving into' },
  { slug: 'geology', name: 'Geology', color: '#a16207', icon: '🪨', count: 20, prefix: 'Uncovering' },
  { slug: 'mathematics', name: 'Mathematics', color: '#2563eb', icon: '📐', count: 20, prefix: 'Solving' },
  { slug: 'aerospace-engineering', name: 'Aerospace Engineering', color: '#475569', icon: '🚀', count: 20, prefix: 'Engineering' },
  { slug: 'materials-science', name: 'Materials Science', color: '#64748b', icon: '🔬', count: 20, prefix: 'Innovating with' },
  { slug: 'environmental-science', name: 'Environmental Science', color: '#16a34a', icon: '🌱', count: 20, prefix: 'Protecting' },
  { slug: 'psychology', name: 'Psychology', color: '#d946ef', icon: '🧠', count: 20, prefix: 'Understanding' },
  { slug: 'robotics', name: 'Robotics', color: '#f59e0b', icon: '🤖', count: 20, prefix: 'Building' },
  { slug: 'nanotechnology', name: 'Nanotechnology', color: '#06b6d4', icon: '🔬', count: 20, prefix: 'The Tiny World of' },
  { slug: 'archaeology', name: 'Archaeology', color: '#92400e', icon: '🏺', count: 20, prefix: 'Excavating' },
  { slug: 'paleontology', name: 'Paleontology', color: '#78350f', icon: '🦕', count: 20, prefix: 'Discovering' },
  { slug: 'biotechnology', name: 'Biotechnology', color: '#4ade80', icon: '🧫', count: 20, prefix: 'Engineering' },

  // ── NEWS & WORLD ──
  { slug: 'world-news', name: 'World News', color: '#ef4444', icon: '📰', count: 20, prefix: 'Breaking' },
  { slug: 'tech-news', name: 'Tech News', color: '#3b82f6', icon: '💻', count: 20, prefix: 'Latest in' },
  { slug: 'business-news', name: 'Business News', color: '#f59e0b', icon: '📊', count: 20, prefix: 'Market Update' },
  { slug: 'muslim-world-news', name: 'Muslim World', color: '#10b981', icon: '🕌', count: 20, prefix: 'Updates from' },
  { slug: 'middle-east', name: 'Middle East', color: '#d97706', icon: '🏜️', count: 20, prefix: 'Developments in' },
  { slug: 'africa-news', name: 'Africa', color: '#84cc16', icon: '🌍', count: 20, prefix: 'Rising' },
  { slug: 'asia-pacific', name: 'Asia Pacific', color: '#06b6d4', icon: '🌏', count: 20, prefix: 'Spotlight on' },
  { slug: 'europe-news', name: 'Europe', color: '#6366f1', icon: '🏰', count: 20, prefix: 'Analyzing' },
  { slug: 'americas-news', name: 'Americas', color: '#ec4899', icon: '🗽', count: 20, prefix: 'Coverage of' },
  { slug: 'opinion-editorial', name: 'Opinion & Editorial', color: '#f97316', icon: '✍️', count: 20, prefix: 'Perspective on' },

  // ── LIFESTYLE & CULTURE ──
  { slug: 'food-cooking', name: 'Food & Cooking', color: '#f97316', icon: '🍳', count: 20, prefix: 'Recipes for' },
  { slug: 'travel-tourism', name: 'Travel & Tourism', color: '#0ea5e9', icon: '✈️', count: 20, prefix: 'Exploring' },
  { slug: 'fashion-style', name: 'Fashion & Style', color: '#ec4899', icon: '👗', count: 20, prefix: 'Trending in' },
  { slug: 'photography', name: 'Photography', color: '#a855f7', icon: '📸', count: 20, prefix: 'Capturing' },
  { slug: 'music-audio', name: 'Music & Audio', color: '#8b5cf6', icon: '🎵', count: 20, prefix: 'The Sound of' },
  { slug: 'film-cinema', name: 'Film & Cinema', color: '#f43f5e', icon: '🎬', count: 20, prefix: 'Reviewing' },
  { slug: 'art-design', name: 'Art & Design', color: '#d946ef', icon: '🎨', count: 20, prefix: 'Creating' },
  { slug: 'books-literature', name: 'Books & Literature', color: '#7c3aed', icon: '📖', count: 20, prefix: 'Reading' },
  { slug: 'parenting-family', name: 'Parenting & Family', color: '#f472b6', icon: '👨‍👩‍👧', count: 20, prefix: 'Guide to' },
  { slug: 'personal-finance', name: 'Personal Finance', color: '#22c55e', icon: '💵', count: 20, prefix: 'Managing' },
  { slug: 'mental-health', name: 'Mental Health', color: '#14b8a6', icon: '🧘', count: 20, prefix: 'Nurturing' },
  { slug: 'home-garden', name: 'Home & Garden', color: '#65a30d', icon: '🏡', count: 20, prefix: 'Designing' },
  { slug: 'pets-animals', name: 'Pets & Animals', color: '#f59e0b', icon: '🐾', count: 20, prefix: 'Caring for' },
  { slug: 'automotive', name: 'Automotive', color: '#dc2626', icon: '🚗', count: 20, prefix: 'Reviewing' },
  { slug: 'diy-crafts', name: 'DIY & Crafts', color: '#84cc16', icon: '🔨', count: 20, prefix: 'Building' },

  // ── BUSINESS & ECONOMICS ──
  { slug: 'global-economics', name: 'Global Economics', color: '#3b82f6', icon: '🌐', count: 20, prefix: 'Analyzing' },
  { slug: 'marketing-growth', name: 'Marketing & Growth', color: '#f97316', icon: '📣', count: 20, prefix: 'Strategies for' },
  { slug: 'leadership-management', name: 'Leadership', color: '#0ea5e9', icon: '👔', count: 20, prefix: 'Principles of' },
  { slug: 'supply-chain', name: 'Supply Chain', color: '#64748b', icon: '📦', count: 20, prefix: 'Optimizing' },
  { slug: 'venture-capital', name: 'Venture Capital', color: '#a855f7', icon: '💰', count: 20, prefix: 'Navigating' },
  { slug: 'product-management', name: 'Product Management', color: '#06b6d4', icon: '📋', count: 20, prefix: 'Executing' },

  // ── EDUCATION ──
  { slug: 'stem-education', name: 'STEM Education', color: '#2563eb', icon: '🔬', count: 20, prefix: 'Teaching' },
  { slug: 'online-learning', name: 'Online Learning', color: '#7c3aed', icon: '💻', count: 20, prefix: 'Mastering' },
  { slug: 'language-learning', name: 'Language Learning', color: '#ec4899', icon: '🗣️', count: 20, prefix: 'Fluency in' },
  { slug: 'career-development', name: 'Career Development', color: '#f59e0b', icon: '📈', count: 20, prefix: 'Advancing' },

  // ── HISTORY & CIVILIZATION ──
  { slug: 'islamic-history', name: 'Islamic History', color: '#10b981', icon: '🕌', count: 20, prefix: 'Chronicles of' },
  { slug: 'ancient-civilizations', name: 'Ancient Civilizations', color: '#92400e', icon: '🏛️', count: 20, prefix: 'Rediscovering' },
  { slug: 'modern-history', name: 'Modern History', color: '#475569', icon: '📜', count: 20, prefix: 'Lessons from' },
  { slug: 'philosophy', name: 'Philosophy', color: '#6366f1', icon: '🤔', count: 20, prefix: 'Exploring' },

  // ── NATURE & ENVIRONMENT ──
  { slug: 'wildlife', name: 'Wildlife', color: '#16a34a', icon: '🦁', count: 20, prefix: 'Protecting' },
  { slug: 'ocean-conservation', name: 'Ocean Conservation', color: '#0891b2', icon: '🌊', count: 20, prefix: 'Saving' },
  { slug: 'renewable-energy', name: 'Renewable Energy', color: '#22d3ee', icon: '☀️', count: 20, prefix: 'Powering with' },
  { slug: 'sustainable-living', name: 'Sustainable Living', color: '#4ade80', icon: '♻️', count: 20, prefix: 'Embracing' },
];

// Auto-generate topics for extra categories
const EXTRA_TOPIC_TEMPLATES = [
  '{prefix} {name}: A Complete Beginners Guide for 2026',
  '{prefix} {name} with AI: Automation Strategies',
  '{prefix} {name} on Blockchain: Decentralized Approaches',
  '{prefix} {name} in the Halal Economy: Opportunities',
  '{prefix} {name}: Best Tools and Platforms in 2026',
  '{prefix} {name}: Industry Trends and Predictions',
  '{prefix} {name}: Case Studies from Leading Companies',
  '{prefix} {name}: Cost Optimization Strategies',
  '{prefix} {name}: Security Best Practices',
  '{prefix} {name}: Open Source Solutions and Frameworks',
  '{prefix} {name}: Getting Started with FungiMesh Integration',
  '{prefix} {name}: Revenue Generation and Monetization',
  '{prefix} {name}: Scaling from 0 to 1 Million Users',
  '{prefix} {name}: Performance Optimization Techniques',
  '{prefix} {name}: Regulatory Compliance in 47 Jurisdictions',
  '{prefix} {name}: The Muslim Consumer Perspective',
  '{prefix} {name}: Enterprise vs SMB Solutions',
  '{prefix} {name}: Building Teams and Culture',
  '{prefix} {name}: Metrics That Matter for Growth',
  '{prefix} {name}: DarCloud Ecosystem Integration Guide',
];

// ── Blog Post HTML Template ──
function blogCSS() {
  return `<style>
:root{--bg:#07090f;--s1:#0d1117;--s2:#161b22;--bdr:#21262d;--cyan:#00d4ff;--emerald:#10b981;--gold:#f59e0b;--purple:#8b5cf6;--txt:#e6edf3;--muted:#8b949e}
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--txt)}
a{color:var(--cyan);text-decoration:none}a:hover{text-decoration:underline}
nav{position:sticky;top:0;z-index:100;background:rgba(7,9,15,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--bdr);padding:.75rem 2rem;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.3rem;font-weight:700;background:linear-gradient(135deg,#00d4ff,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.nav-links{display:flex;gap:1.5rem;font-size:.85rem;align-items:center}.nav-links a{color:var(--muted)}.nav-links a:hover{color:var(--cyan)}
.btn{display:inline-block;padding:.5rem 1.2rem;border-radius:8px;font-weight:600;font-size:.85rem;transition:all .3s;border:none;cursor:pointer}
.btn-primary{background:linear-gradient(135deg,#00d4ff,#10b981);color:#000}
article{max-width:800px;margin:0 auto;padding:3rem 1.5rem}
.breadcrumb{font-size:.8rem;color:var(--muted);margin-bottom:1.5rem}
.breadcrumb a{color:var(--muted)}.breadcrumb a:hover{color:var(--cyan)}
article h1{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;line-height:1.15;margin-bottom:1rem}
.meta{display:flex;gap:1rem;align-items:center;color:var(--muted);font-size:.85rem;margin-bottom:2rem;flex-wrap:wrap}
.meta .cat{padding:.2rem .6rem;border-radius:4px;font-size:.75rem;font-weight:600;color:#000}
.toc{background:var(--s1);border:1px solid var(--bdr);border-radius:12px;padding:1.5rem 2rem;margin-bottom:2rem}
.toc h4{font-size:.9rem;margin-bottom:.75rem;color:var(--txt)}.toc ol{padding-left:1.2rem}.toc li{margin-bottom:.4rem}
.toc a{color:var(--muted);font-size:.85rem}.toc a:hover{color:var(--cyan)}
article h2{font-size:1.6rem;font-weight:700;margin:2.5rem 0 1rem;padding-top:1rem;border-top:1px solid var(--bdr)}
article h3{font-size:1.2rem;font-weight:600;margin:1.5rem 0 .75rem}
article p{color:var(--muted);font-size:1.05rem;line-height:1.8;margin-bottom:1.5rem}
article ul,article ol{color:var(--muted);font-size:1rem;line-height:1.8;margin-bottom:1.5rem;padding-left:1.5rem}
article li{margin-bottom:.5rem}
article blockquote{border-left:3px solid var(--gold);padding:1rem 1.5rem;margin:1.5rem 0;background:var(--s1);border-radius:0 8px 8px 0;color:var(--muted);font-style:italic}
article code{background:var(--s2);padding:.15rem .4rem;border-radius:4px;font-size:.9rem;font-family:'Courier New',monospace}
article pre{background:var(--s2);border:1px solid var(--bdr);border-radius:8px;padding:1.5rem;overflow-x:auto;margin-bottom:1.5rem;font-size:.85rem;line-height:1.5}
article img{max-width:100%;border-radius:12px;border:1px solid var(--bdr);margin:1.5rem 0}
.video-embed{margin:2rem 0;border-radius:12px;overflow:hidden;border:1px solid var(--bdr)}
.video-embed .placeholder{width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,var(--s1),var(--s2));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;cursor:pointer}
.video-embed .play{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#00d4ff,#10b981);display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 0 30px rgba(0,212,255,.2);transition:transform .3s}
.video-embed .play:hover{transform:scale(1.1)}
.cta-box{background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:2rem;text-align:center;margin:2.5rem 0}
.cta-box h3{font-size:1.2rem;margin-bottom:.5rem}.cta-box p{color:var(--muted);margin-bottom:1rem;font-size:.9rem}
.share{display:flex;gap:.75rem;margin:2rem 0;flex-wrap:wrap}
.share a{padding:.4rem 1rem;border:1px solid var(--bdr);border-radius:6px;font-size:.8rem;color:var(--muted);transition:all .2s}
.share a:hover{border-color:var(--cyan);color:var(--cyan);text-decoration:none}
.related{margin:3rem 0}
.related h3{font-size:1.3rem;margin-bottom:1.5rem}
.related-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem}
.related-card{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:1.5rem;transition:all .2s}
.related-card:hover{border-color:var(--cyan);transform:translateY(-2px);text-decoration:none}
.related-card h4{font-size:.95rem;margin-bottom:.3rem;color:var(--txt)}.related-card p{color:var(--muted);font-size:.8rem}
.ad-unit{background:var(--s1);border:1px solid var(--bdr);border-radius:10px;padding:1.5rem;text-align:center;margin:2rem 0;min-height:90px;display:flex;align-items:center;justify-content:center}
.ad-unit .ad-label{color:var(--muted);font-size:.7rem;text-transform:uppercase;letter-spacing:.1em}
footer{padding:2rem;border-top:1px solid var(--bdr);text-align:center;margin-top:3rem}
.footer-links{display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap;margin-bottom:1rem}.footer-links a{color:var(--muted);font-size:.8rem}
@media(max-width:768px){.nav-links{display:none}article{padding:2rem 1rem}article h1{font-size:1.8rem}.related-grid{grid-template-columns:1fr}}
</style>`;
}

function blogNav() {
  return `<nav>
  <a class="logo" href="https://darcloud.host">☁️ DarCloud Blog</a>
  <div class="nav-links">
    <a href="https://darcloud.host">Home</a>
    <a href="https://darcloud.host/blog">Blog</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://demo.darcloud.host">Demo</a>
    <a href="https://darcloud.host/checkout/pro" class="btn btn-primary">Start Free</a>
  </div>
</nav>`;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

function generateSections(title, catName) {
  // Generate 5-7 article sections based on the title
  const sections = [
    { h: `What is ${catName}?`, p: `${catName} represents one of the fastest-growing sectors in the global technology landscape. Understanding its fundamentals is critical for anyone looking to participate in the $2.7 trillion halal economy. In this comprehensive guide, we break down everything you need to know about ${catName} and how it intersects with Islamic values and modern technology.` },
    { h: 'Why It Matters in 2026', p: `The landscape of ${catName} has changed dramatically. With AI-powered automation, blockchain verification, and decentralized mesh infrastructure, the possibilities have expanded exponentially. DarCloud\'s 101-company ecosystem is positioned at the intersection of all these trends, creating unprecedented opportunities for builders, investors, and users alike.` },
    { h: 'How DarCloud Approaches This', p: `At DarCloud, we believe technology should serve humanity\'s highest values. Our approach to ${catName} is rooted in Islamic principles: zero riba, full transparency, and fair distribution. Every transaction flows through QuranChain\'s 47-network blockchain with an immutable 30/40/10/18/2 revenue split — including a mandatory 2% Zakat fund that cannot be disabled.` },
    { h: 'Technical Architecture', p: `The technical foundation of our ${catName} solution runs on Cloudflare Workers at the edge, backed by D1 database with 72 tables, and secured with JWT authentication (HMAC-SHA256) and PBKDF2 password hashing with 100,000 iterations. Our 22 Discord bots powered by 66 AI agents handle real-time operations across 15 business domains.` },
    { h: 'Getting Started', p: `Ready to dive into ${catName} with DarCloud? Start with our Pro plan at $49/month which gives you full API access, AI agent integration, and mesh network connectivity. Enterprise customers ($499/month) get white-label capabilities, dedicated support, and custom AI agent deployment. Join 340,000 mesh node operators already participating in the ecosystem.` },
    { h: 'The Future Outlook', p: `The future of ${catName} is bright, especially within the Islamic tech ecosystem. With 2 billion Muslims worldwide and a $2.7 trillion halal economy growing at 15% annually, the demand for Shariah-compliant technology solutions will only accelerate. DarCloud is building the infrastructure to capture this generational opportunity — and you can be part of it.` },
  ];
  return sections;
}

function generateBlogPost(title, desc, catSlug, catName, catColor, catIcon, relatedPosts) {
  const slug = slugify(title);
  const sections = generateSections(title, catName);
  const readTime = Math.floor(5 + Math.random() * 8);
  const day = Math.floor(1 + Math.random() * 28);
  const month = ['Jan', 'Feb', 'Mar'][Math.floor(Math.random() * 3)];
  const toc = sections.map((s, i) => `<li><a href="#s${i}">${s.h}</a></li>`).join('\n          ');
  const body = sections.map((s, i) => `
      <h2 id="s${i}">${s.h}</h2>
      <p>${s.p}</p>${i === 1 ? `
      <div class="video-embed">
        <div class="placeholder" onclick="this.innerHTML='<iframe src=\\'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0\\' style=\\'width:100%;aspect-ratio:16/9;border:none\\' allow=\\'autoplay;encrypted-media\\' allowfullscreen></iframe>'">
          <div class="play">▶️</div>
          <p style="color:var(--muted);font-size:.85rem">${catIcon} Watch: ${title} — Video Explainer</p>
        </div>
      </div>` : ''}${i === 3 ? `
      <div class="ad-unit"><span class="ad-label">Advertisement</span></div>` : ''}`).join('');

  const relatedHtml = relatedPosts.slice(0, 3).map(r => 
    `<a class="related-card" href="/blog/${slugify(r.title)}"><h4>${r.title}</h4><p>${r.desc.substring(0, 80)}...</p></a>`
  ).join('\n        ');

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | DarCloud Blog</title>
<meta name="description" content="${desc}">
<meta name="keywords" content="${catName}, DarCloud, halal tech, Islamic technology, ${catSlug.replace(/-/g, ', ')}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="DarCloud Blog">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<link rel="canonical" href="https://darcloud.host/blog/${slug}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☁️</text></svg>">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Article","headline":"${title.replace(/"/g, '\\"')}","description":"${desc.replace(/"/g, '\\"')}","author":{"@type":"Organization","name":"DarCloud","url":"https://darcloud.host"},"publisher":{"@type":"Organization","name":"DarCloud","url":"https://darcloud.host"},"datePublished":"2026-${String(Math.floor(1 + Math.random() * 3)).padStart(2, '0')}-${String(day).padStart(2, '0')}","mainEntityOfPage":"https://darcloud.host/blog/${slug}"}
</script>
${blogCSS()}
</head><body>
${blogNav()}

<article>
  <div class="breadcrumb"><a href="https://darcloud.host">Home</a> / <a href="https://darcloud.host/blog">Blog</a> / <a href="https://darcloud.host/blog/category/${catSlug}">${catName}</a></div>
  <h1>${title}</h1>
  <div class="meta">
    <span class="cat" style="background:${catColor}">${catIcon} ${catName}</span>
    <span>📅 ${month} ${day}, 2026</span>
    <span>⏱️ ${readTime} min read</span>
    <span>✍️ DarCloud Editorial</span>
  </div>

  <p><strong>${desc}</strong></p>

  <div class="ad-unit"><span class="ad-label">Advertisement</span></div>

  <div class="toc">
    <h4>📋 Table of Contents</h4>
    <ol>
      ${toc}
    </ol>
  </div>
  ${body}

  <div class="cta-box">
    <h3>🚀 Ready to Build on DarCloud?</h3>
    <p>Join the 101-company Islamic tech ecosystem. Free tier available.</p>
    <a class="btn btn-primary" href="https://darcloud.host/checkout/pro">Start Free Trial →</a>
  </div>

  <div class="share">
    <span style="color:var(--muted);font-size:.85rem">Share:</span>
    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=https://darcloud.host/blog/${slug}" target="_blank" rel="noopener">Twitter/X</a>
    <a href="https://www.linkedin.com/shareArticle?mini=true&url=https://darcloud.host/blog/${slug}&title=${encodeURIComponent(title)}" target="_blank" rel="noopener">LinkedIn</a>
    <a href="https://www.reddit.com/submit?url=https://darcloud.host/blog/${slug}&title=${encodeURIComponent(title)}" target="_blank" rel="noopener">Reddit</a>
  </div>

  <div class="related">
    <h3>📖 Related Articles</h3>
    <div class="related-grid">
      ${relatedHtml}
    </div>
  </div>
</article>

<footer>
  <div class="footer-links">
    <a href="https://darcloud.host">DarCloud</a>
    <a href="https://darcloud.host/blog">Blog</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://demo.darcloud.host">Demo</a>
    <a href="https://about.darcloud.host">About</a>
    <a href="https://discord.gg/darcloud">Discord</a>
  </div>
  <p style="color:var(--muted);font-size:.8rem">© 2026 DarCloud Empire by Omar Abu Nadi. All rights reserved.</p>
</footer>

</body></html>`;
  return { slug, html };
}

// ── Blog Index Page ──
function generateBlogIndex(allPosts) {
  const catCards = CATEGORIES.map(c => {
    const count = allPosts.filter(p => p.catSlug === c.slug).length;
    return `<a class="cat-card" href="/blog/category/${c.slug}" style="border-color:${c.color}20">
        <span class="cat-icon">${c.icon}</span>
        <span class="cat-name">${c.name}</span>
        <span class="cat-count">${count} articles</span>
      </a>`;
  }).join('\n      ');

  const latestCards = allPosts.slice(0, 12).map(p =>
    `<a class="post-card" href="/blog/${p.slug}">
        <div class="post-cat" style="background:${p.catColor}">${p.catIcon} ${p.catName}</div>
        <h3>${p.title}</h3>
        <p>${p.desc.substring(0, 100)}...</p>
      </a>`
  ).join('\n      ');

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DarCloud Blog — Islamic Tech, Blockchain, AI & Halal Economy</title>
<meta name="description" content="Articles on Islamic finance, blockchain, AI, mesh networking, cybersecurity, and building the $2.7T halal economy. By the DarCloud team.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☁️</text></svg>">
${blogCSS()}
<style>
.blog-hero{text-align:center;padding:4rem 1.5rem 2rem}
.blog-hero h1{font-size:2.5rem;font-weight:800;margin-bottom:1rem}
.blog-hero h1 span{background:linear-gradient(135deg,#00d4ff,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.blog-hero p{color:var(--muted);font-size:1.1rem;max-width:600px;margin:0 auto}
.categories{display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center;padding:2rem 1.5rem;max-width:1000px;margin:0 auto}
.cat-card{display:flex;flex-direction:column;align-items:center;gap:.3rem;padding:1rem 1.5rem;background:var(--s1);border:1px solid var(--bdr);border-radius:10px;transition:all .2s;text-decoration:none}
.cat-card:hover{transform:translateY(-2px);border-color:var(--cyan)}
.cat-icon{font-size:1.5rem}.cat-name{font-size:.85rem;font-weight:600;color:var(--txt)}.cat-count{font-size:.7rem;color:var(--muted)}
.posts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;max-width:1200px;margin:0 auto;padding:2rem 1.5rem}
.post-card{background:var(--s1);border:1px solid var(--bdr);border-radius:12px;padding:1.5rem;transition:all .2s;text-decoration:none;display:block}
.post-card:hover{border-color:var(--cyan);transform:translateY(-2px)}
.post-card .post-cat{display:inline-block;padding:.15rem .5rem;border-radius:4px;font-size:.7rem;font-weight:600;color:#000;margin-bottom:.75rem}
.post-card h3{font-size:1rem;font-weight:600;color:var(--txt);margin-bottom:.4rem;line-height:1.3}
.post-card p{color:var(--muted);font-size:.8rem;line-height:1.5}
.total-stat{text-align:center;padding:1rem;color:var(--muted);font-size:.9rem}
</style>
</head><body>
${blogNav()}

<div class="blog-hero">
  <h1>The <span>DarCloud</span> Blog</h1>
  <p>Deep dives into Islamic finance, blockchain, AI, mesh networking, and building the $2.7 trillion halal economy.</p>
</div>

<p class="total-stat">📝 ${allPosts.length} articles across ${CATEGORIES.length + EXTRA_CATEGORIES.length} categories</p>

<div class="categories">
  ${catCards}
</div>

<h2 style="text-align:center;margin:2rem 0 0;font-size:1.5rem">Latest Articles</h2>
<div class="posts-grid">
  ${latestCards}
</div>

<div style="text-align:center;padding:3rem">
  <a class="btn btn-primary" href="https://darcloud.host/checkout/pro" style="font-size:1rem;padding:.75rem 2rem">Start Building on DarCloud →</a>
</div>

<footer>
  <div class="footer-links">
    <a href="https://darcloud.host">DarCloud</a>
    <a href="https://investors.darcloud.host">Investors</a>
    <a href="https://about.darcloud.host">About</a>
    <a href="https://discord.gg/darcloud">Discord</a>
  </div>
  <p style="color:var(--muted);font-size:.8rem">© 2026 DarCloud Empire. All rights reserved.</p>
</footer>
</body></html>`;
}

// ── Sitemap Generator ──
function generateSitemap(allPosts) {
  const urls = [
    { loc: 'https://darcloud.host/', priority: '1.0' },
    { loc: 'https://darcloud.host/blog', priority: '0.9' },
    ...allPosts.map(p => ({ loc: `https://darcloud.host/blog/${p.slug}`, priority: '0.7' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
}

// ── Main Generator ──
function main() {
  const allPosts = [];
  let generated = 0;

  console.log('🚀 DarCloud Blog Generator — Mass SEO Content Engine');
  console.log('='.repeat(60));

  // Generate from detailed categories (200 posts)
  for (const cat of CATEGORIES) {
    for (const topic of cat.topics) {
      const related = cat.topics.filter(t => t.title !== topic.title).slice(0, 3);
      const { slug, html } = generateBlogPost(
        topic.title, topic.desc, cat.slug, cat.name, cat.color, cat.icon, related
      );
      allPosts.push({ slug, title: topic.title, desc: topic.desc, catSlug: cat.slug, catName: cat.name, catColor: cat.color, catIcon: cat.icon });

      const filePath = path.join(BLOG_DIR, `${slug}.html`);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, html);
        generated++;
      }
    }
    console.log(`  ✅ ${cat.icon} ${cat.name}: ${cat.topics.length} posts`);
  }

  // Generate from extra categories (300 posts)
  for (const cat of EXTRA_CATEGORIES) {
    for (const tpl of EXTRA_TOPIC_TEMPLATES) {
      const title = tpl.replace(/{prefix}/g, cat.prefix).replace(/{name}/g, cat.name);
      const desc = `Comprehensive guide to ${cat.name.toLowerCase()} in the DarCloud ecosystem. Learn strategies, tools, and best practices for ${cat.name.toLowerCase()} in the $2.7T halal economy.`;
      const related = EXTRA_TOPIC_TEMPLATES.slice(0, 3).map(t => ({
        title: t.replace(/{prefix}/g, cat.prefix).replace(/{name}/g, cat.name),
        desc: `Guide to ${cat.name.toLowerCase()}`
      }));
      const { slug, html } = generateBlogPost(title, desc, cat.slug, cat.name, cat.color, cat.icon, related);
      allPosts.push({ slug, title, desc, catSlug: cat.slug, catName: cat.name, catColor: cat.color, catIcon: cat.icon });

      const filePath = path.join(BLOG_DIR, `${slug}.html`);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, html);
        generated++;
      }
    }
    console.log(`  ✅ ${cat.icon} ${cat.name}: ${EXTRA_TOPIC_TEMPLATES.length} posts`);
  }

  // Write blog index
  const indexHtml = generateBlogIndex(allPosts);
  fs.writeFileSync(path.join(BLOG_DIR, '_index.html'), indexHtml);
  console.log('  ✅ Blog index page generated');

  // Write sitemap
  const sitemap = generateSitemap(allPosts);
  fs.writeFileSync(path.join(BLOG_DIR, '_sitemap.xml'), sitemap);
  console.log('  ✅ Sitemap generated');

  // Write manifest (for Worker routing)
  const manifest = allPosts.map(p => ({ slug: p.slug, cat: p.catSlug, title: p.title, desc: p.desc, catName: p.catName }));
  fs.writeFileSync(path.join(BLOG_DIR, '_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('  ✅ Blog manifest generated');

  console.log('='.repeat(60));
  console.log(`📊 Total: ${allPosts.length} posts (${generated} new)`);
  console.log(`📁 Output: ${BLOG_DIR}`);
}

main();
