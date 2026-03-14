#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════
// DarCloud Empire — Bot Factory Generator
// Creates Discord bots for ALL service divisions
// Omar Mohammad Abunadi — Sovereign Vision Layer
// ══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/workspaces/quranchain1';
const GUILD_ID = '1481826708721242165';
const API_BASE = 'http://localhost:8787';

// ══════════════════════════════════════════════════════════════
// ALL SERVICE DIVISION BOTS
// ══════════════════════════════════════════════════════════════
const SECTOR_BOTS = [
  // ── 1. DAR AL-NAS BANK ──────────────────────────────────────
  {
    dir: 'darnas-bot',
    name: 'Dar Al-Nas Bank',
    pkg: 'darnas-bot',
    prefix: 'bank',
    description: 'Dar Al-Nas™ — Full Islamic Banking & Treasury',
    avatar: { icon: 'DN', colors: ['#0a0a1a', '#1a1a3e', '#2d2d5e'], accent: '#d4af37' },
    commands: [
      { name: 'bank-dashboard', desc: 'Full banking dashboard — accounts, treasury, capital' },
      { name: 'bank-accounts', desc: 'Checking, savings, business accounts — zero fees' },
      { name: 'bank-treasury', desc: 'DarTreasury capital & venture fund overview' },
      { name: 'bank-merchant', desc: 'Merchant Services — POS, online payments, settlement' },
      { name: 'bank-investments', desc: 'Investment portfolio — halal stocks, sukuk, funds' },
      { name: 'bank-remittance', desc: 'DarRemit — cross-border transfers (57 OIC nations)' },
      { name: 'bank-credit', desc: 'DarCredit — Islamic credit scoring & bureau' },
      { name: 'bank-mortgage', desc: 'Zero-riba home finance — $5K down auto-approval' },
      { name: 'bank-exchange', desc: 'DarExchange — Shariah-compliant forex & crypto' },
      { name: 'bank-help', desc: 'Dar Al-Nas Bank bot commands' },
    ],
    handler: `
    const SERVICES = {
      accounts: { checking: { fee: '$0', min: '$0', apy: '0%' }, savings: { type: 'Mudarabah', apy: '4.2%', shariah: true }, business: { type: 'Musharakah', credit: 'up to $500K' } },
      treasury: { aum: '$2.4B', funds: ['DarCapital Halal VC Fund', 'DarWealth Growth Fund', 'DarSukuk Bond Fund', 'DarWaqf Endowment'], performance: '+18.7% YTD' },
      merchant: { terminals: 12400, online: true, settlement: '< 24h', fees: '1.9% + $0.25', halal: 'certified' },
      investments: { assets: ['Halal Stocks', 'Sukuk Bonds', 'Real Estate', 'Commodities', 'Private Equity'], screening: 'AI-powered Shariah screening', minInvestment: '$100' },
      remittance: { corridors: 57, networks: 'OIC Nations', speed: '< 1 hour', fee: '0.5%', compliance: 'Full AML/KYC' },
      credit: { scoring: 'Islamic Credit Bureau', factors: ['Payment History', 'Riba-Free Score', 'Community Trust', 'Zakat Compliance'], range: '300-850' },
      mortgage: { type: 'Murabaha / Musharakah', down: '$5,000', approval: 'Auto', riba: '0%', markets: 31, program: 'DarMortgage Zero-Riba Home Finance' },
      exchange: { pairs: ['BTC/USD', 'ETH/USD', 'QRN/USD', 'Gold/USD'], type: 'Shariah-compliant', screening: 'Automated halal coin screening', products: ['Spot', 'Murabaha Forward', 'Islamic Options'] }
    };
    
    switch (commandName) {
      case 'bank-dashboard': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🏦 Dar Al-Nas™ Banking Dashboard')
          .setDescription('Full Islamic Banking — Zero Riba, Full Shariah Compliance')
          .addFields(
            { name: '💰 Treasury AUM', value: SERVICES.treasury.aum, inline: true },
            { name: '📊 YTD Performance', value: SERVICES.treasury.performance, inline: true },
            { name: '🏪 Merchant Terminals', value: SERVICES.merchant.terminals.toLocaleString(), inline: true },
            { name: '🌍 Remittance Corridors', value: SERVICES.remittance.corridors + ' OIC Nations', inline: true },
            { name: '🏠 Mortgage Markets', value: SERVICES.mortgage.markets + ' USA Cities', inline: true },
            { name: '💱 Exchange Pairs', value: SERVICES.exchange.pairs.length + ' active', inline: true },
            { name: '📋 Account Types', value: '• Checking (\\$0 fees)\\n• Savings (4.2% APY Mudarabah)\\n• Business (Musharakah)', inline: false },
          ).setFooter({ text: 'Dar Al-Nas Bank™ — Banking Without Riba' }).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-accounts': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('💳 Dar Al-Nas Account Types')
          .addFields(
            { name: '🟢 Checking Account', value: '• Fee: \\$0\\n• Minimum: \\$0\\n• Debit Card: Halal Card™\\n• ATM: Free worldwide', inline: true },
            { name: '🟡 Savings Account', value: '• Type: Mudarabah Profit-Sharing\\n• APY: 4.2%\\n• Shariah Certified\\n• No lock-in period', inline: true },
            { name: '🔵 Business Account', value: '• Type: Musharakah Partnership\\n• Credit: Up to \\$500K\\n• Merchant POS included\\n• API access', inline: true },
          ).setFooter({ text: 'All accounts are 100% Riba-free and Shariah-certified' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-treasury': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🏛️ DarTreasury & Capital')
          .addFields(
            { name: 'AUM', value: SERVICES.treasury.aum, inline: true },
            { name: 'Performance', value: SERVICES.treasury.performance, inline: true },
            { name: '📊 Funds', value: SERVICES.treasury.funds.map((f,i) => \`\${i+1}. \${f}\`).join('\\n') },
          ).setFooter({ text: 'DarCapital™ — Halal Venture Capital' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-merchant': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🏪 Merchant Services')
          .addFields(
            { name: 'Active Terminals', value: SERVICES.merchant.terminals.toLocaleString(), inline: true },
            { name: 'Settlement', value: SERVICES.merchant.settlement, inline: true },
            { name: 'Fee', value: SERVICES.merchant.fees, inline: true },
            { name: 'Features', value: '• POS Terminal\\n• Online Payment Gateway\\n• Mobile Payments\\n• QR Code Payments\\n• Halal Certified Processing' },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-investments': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('📈 Investment Products')
          .addFields(
            { name: 'Asset Classes', value: SERVICES.investments.assets.map(a => \`• \${a}\`).join('\\n') },
            { name: 'Screening', value: SERVICES.investments.screening, inline: true },
            { name: 'Min Investment', value: SERVICES.investments.minInvestment, inline: true },
          ).setFooter({ text: 'All investments screened for Shariah compliance' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-remittance': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🌍 DarRemit — Cross-Border Transfers')
          .addFields(
            { name: 'Corridors', value: SERVICES.remittance.corridors + ' OIC Nations', inline: true },
            { name: 'Speed', value: SERVICES.remittance.speed, inline: true },
            { name: 'Fee', value: SERVICES.remittance.fee, inline: true },
            { name: 'Compliance', value: SERVICES.remittance.compliance, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-credit': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('📊 DarCredit — Islamic Credit Bureau')
          .addFields(
            { name: 'Score Range', value: SERVICES.credit.range, inline: true },
            { name: 'Scoring Factors', value: SERVICES.credit.factors.map(f => \`• \${f}\`).join('\\n') },
          ).setFooter({ text: 'Riba-free credit scoring — ethical by design' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-mortgage': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🏠 DarMortgage — Zero-Riba Home Finance')
          .addFields(
            { name: 'Program', value: SERVICES.mortgage.program },
            { name: 'Type', value: SERVICES.mortgage.type, inline: true },
            { name: 'Down Payment', value: SERVICES.mortgage.down, inline: true },
            { name: 'Riba', value: SERVICES.mortgage.riba, inline: true },
            { name: 'Approval', value: SERVICES.mortgage.approval, inline: true },
            { name: 'Markets', value: SERVICES.mortgage.markets + ' USA cities', inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-exchange': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('💱 DarExchange — Shariah-Compliant Trading')
          .addFields(
            { name: 'Pairs', value: SERVICES.exchange.pairs.map(p => \`• \${p}\`).join('\\n'), inline: true },
            { name: 'Products', value: SERVICES.exchange.products.map(p => \`• \${p}\`).join('\\n'), inline: true },
            { name: 'Screening', value: SERVICES.exchange.screening },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'bank-help': {
        const embed = new EmbedBuilder().setColor(0xd4af37).setTitle('🏦 Dar Al-Nas Bank Commands')
          .setDescription(['/bank-dashboard', '/bank-accounts', '/bank-treasury', '/bank-merchant', '/bank-investments', '/bank-remittance', '/bank-credit', '/bank-mortgage', '/bank-exchange'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 2. DARHEALTH ────────────────────────────────────────────
  {
    dir: 'darhealth-bot',
    name: 'DarHealth',
    pkg: 'darhealth-bot',
    prefix: 'health',
    description: 'DarHealth™ — Halal Healthcare & Telemedicine',
    avatar: { icon: 'DH', colors: ['#0a1a0a', '#1a3a2a', '#2a5a3a'], accent: '#22c55e' },
    commands: [
      { name: 'health-dashboard', desc: 'DarHealth system overview — clinics, telemed, pharma' },
      { name: 'health-clinics', desc: 'Dar Clinics™ — locations, services, specialties' },
      { name: 'health-telemed', desc: 'Dar Telemed™ — virtual consultations & telehealth' },
      { name: 'health-hospitals', desc: 'Dar Hospitals™ network — facilities & capacity' },
      { name: 'health-pharma', desc: 'DarPharmacy™ — halal pharmaceuticals & products' },
      { name: 'health-biotech', desc: 'Dar BioTech™ — research & clinical trials' },
      { name: 'health-wellness', desc: 'Wellness & preventive care programs' },
      { name: 'health-takaful', desc: 'DarTakaful™ — Islamic cooperative health insurance' },
      { name: 'health-help', desc: 'DarHealth bot commands' },
    ],
    handler: `
    const HEALTH = {
      clinics: { count: 147, specialties: ['Family Medicine', 'Pediatrics', 'OB/GYN', 'Cardiology', 'Endocrinology', 'Dermatology', 'Mental Health', 'Dental'], cities: 31, hours: '7 AM - 10 PM', walkIn: true },
      telemed: { providers: 420, languages: ['English', 'Arabic', 'Urdu', 'Malay', 'Turkish', 'French'], wait: '< 5 minutes', cost: '$25/visit', platforms: ['Web', 'iOS', 'Android', 'MeshTalk'] },
      hospitals: { facilities: 12, beds: 3600, icu: 480, emergency: '24/7', accreditation: 'JCI Accredited' },
      pharma: { products: 2400, halal: '100% Halal Certified', delivery: 'Same-day', compounding: true, otc: true },
      biotech: { trials: 34, focus: ['Genomics', 'Immunotherapy', 'Stem Cell', 'Halal Vaccines', 'AI Diagnostics'], partners: 8 },
      takaful: { members: 89000, plans: ['Individual', 'Family', 'Business', 'Senior'], coverage: 'Medical, Dental, Vision, Mental Health', premium: 'From $49/mo' }
    };
    
    switch (commandName) {
      case 'health-dashboard': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🏥 DarHealth™ Healthcare Dashboard')
          .addFields(
            { name: '🏨 Clinics', value: HEALTH.clinics.count + ' locations', inline: true },
            { name: '💻 Telemed Providers', value: HEALTH.telemed.providers.toString(), inline: true },
            { name: '🏗️ Hospitals', value: HEALTH.hospitals.facilities + ' facilities', inline: true },
            { name: '💊 Pharma Products', value: HEALTH.pharma.products.toLocaleString(), inline: true },
            { name: '🧬 Clinical Trials', value: HEALTH.biotech.trials.toString(), inline: true },
            { name: '🛡️ Takaful Members', value: HEALTH.takaful.members.toLocaleString(), inline: true },
          ).setFooter({ text: 'DarHealth™ — Halal Healthcare For All' }).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-clinics': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🏨 Dar Clinics™ Network')
          .addFields(
            { name: 'Locations', value: HEALTH.clinics.count + ' across ' + HEALTH.clinics.cities + ' cities', inline: true },
            { name: 'Hours', value: HEALTH.clinics.hours, inline: true },
            { name: 'Walk-In', value: HEALTH.clinics.walkIn ? 'Yes' : 'No', inline: true },
            { name: 'Specialties', value: HEALTH.clinics.specialties.map(s => \`• \${s}\`).join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-telemed': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('💻 Dar Telemed™ — Virtual Healthcare')
          .addFields(
            { name: 'Providers', value: HEALTH.telemed.providers.toString(), inline: true },
            { name: 'Wait Time', value: HEALTH.telemed.wait, inline: true },
            { name: 'Cost', value: HEALTH.telemed.cost, inline: true },
            { name: 'Languages', value: HEALTH.telemed.languages.join(', ') },
            { name: 'Platforms', value: HEALTH.telemed.platforms.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-hospitals': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🏗️ Dar Hospitals™ Network')
          .addFields(
            { name: 'Facilities', value: HEALTH.hospitals.facilities.toString(), inline: true },
            { name: 'Total Beds', value: HEALTH.hospitals.beds.toLocaleString(), inline: true },
            { name: 'ICU Beds', value: HEALTH.hospitals.icu.toString(), inline: true },
            { name: 'Emergency', value: HEALTH.hospitals.emergency, inline: true },
            { name: 'Accreditation', value: HEALTH.hospitals.accreditation, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-pharma': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('💊 DarPharmacy™ — Halal Pharmaceuticals')
          .addFields(
            { name: 'Products', value: HEALTH.pharma.products.toLocaleString(), inline: true },
            { name: 'Certification', value: HEALTH.pharma.halal, inline: true },
            { name: 'Delivery', value: HEALTH.pharma.delivery, inline: true },
            { name: 'Services', value: '• Halal-certified medications\\n• Custom compounding\\n• OTC products\\n• Supplements & vitamins' },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-biotech': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🧬 Dar BioTech™ — Research & Development')
          .addFields(
            { name: 'Active Trials', value: HEALTH.biotech.trials.toString(), inline: true },
            { name: 'Partners', value: HEALTH.biotech.partners.toString(), inline: true },
            { name: 'Focus Areas', value: HEALTH.biotech.focus.map(f => \`• \${f}\`).join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-wellness': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🧘 Wellness & Preventive Care')
          .addFields(
            { name: 'Programs', value: '• Annual Health Screening\\n• Fitness & Nutrition Plans\\n• Mental Health Support\\n• Islamic Mindfulness\\n• Chronic Disease Management\\n• Maternal & Child Health' },
            { name: 'Access', value: 'Free for all DarHealth members\\nDiscounted for HWC members' },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-takaful': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🛡️ DarTakaful™ — Islamic Health Insurance')
          .addFields(
            { name: 'Members', value: HEALTH.takaful.members.toLocaleString(), inline: true },
            { name: 'Starting At', value: HEALTH.takaful.premium, inline: true },
            { name: 'Plans', value: HEALTH.takaful.plans.map(p => \`• \${p}\`).join('\\n'), inline: true },
            { name: 'Coverage', value: HEALTH.takaful.coverage },
          ).setFooter({ text: 'Cooperative insurance — no gambling, no riba' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'health-help': {
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('🏥 DarHealth Commands')
          .setDescription(['/health-dashboard', '/health-clinics', '/health-telemed', '/health-hospitals', '/health-pharma', '/health-biotech', '/health-wellness', '/health-takaful'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 3. DARMEDIA ─────────────────────────────────────────────
  {
    dir: 'darmedia-bot',
    name: 'DarMedia',
    pkg: 'darmedia-bot',
    prefix: 'media',
    description: 'DarMedia™ — Islamic Media, Broadcasting & Streaming',
    avatar: { icon: 'DM', colors: ['#1a0a2e', '#2d1b4e', '#4a2d6e'], accent: '#f472b6' },
    commands: [
      { name: 'media-dashboard', desc: 'DarMedia network overview — TV, radio, streaming' },
      { name: 'media-broadcast', desc: 'QuranChain Broadcast™ — live Quran recitation streams' },
      { name: 'media-radio', desc: 'Dar Radio™ — Islamic radio stations & podcasts' },
      { name: 'media-streaming', desc: 'Dar Streaming™ — halal entertainment & content' },
      { name: 'media-tv', desc: 'Dar TV™ — Islamic television network & channels' },
      { name: 'media-news', desc: 'Dar News™ — Islamic world news service' },
      { name: 'media-studios', desc: 'Dar Studios™ — content production facilities' },
      { name: 'media-help', desc: 'DarMedia bot commands' },
    ],
    handler: `
    const MEDIA = {
      broadcast: { channels: 7, quranReciters: 120, languages: 15, live: true, quality: '4K HDR', storage: 'QuranChain immutable' },
      radio: { stations: 24, genres: ['Quran Recitation', 'Islamic Nasheeds', 'News & Talk', 'Education', 'Youth', 'Arabic Pop (Halal)'], podcasts: 180, listeners: '2.4M monthly' },
      streaming: { library: 15000, categories: ['Documentaries', 'Nasheeds', 'Islamic History', 'Quran Learning', 'Kids', 'Family Films'], quality: '4K UHD', offline: true },
      tv: { channels: 12, live: true, coverage: 'Global', satellites: ['Arabsat', 'Nilesat', 'Turksat', 'Astra'], iptv: true },
      news: { bureaus: 22, reporters: 180, languages: 8, updates: '24/7', focus: 'Islamic world affairs, halal economy, tech' },
      studios: { locations: 5, capacity: ['Film Studio', 'Sound Stage', 'Recording Studio', 'Post-Production', 'VFX Lab', 'Motion Capture'], staff: 340 }
    };
    
    switch (commandName) {
      case 'media-dashboard': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📺 DarMedia™ Network Dashboard')
          .addFields(
            { name: '📡 Broadcast Channels', value: MEDIA.broadcast.channels.toString(), inline: true },
            { name: '📻 Radio Stations', value: MEDIA.radio.stations.toString(), inline: true },
            { name: '🎬 Streaming Library', value: MEDIA.streaming.library.toLocaleString() + ' titles', inline: true },
            { name: '📺 TV Channels', value: MEDIA.tv.channels.toString(), inline: true },
            { name: '📰 News Bureaus', value: MEDIA.news.bureaus.toString(), inline: true },
            { name: '🎥 Studios', value: MEDIA.studios.locations + ' locations', inline: true },
          ).setFooter({ text: 'DarMedia™ — Islamic Content For The World' }).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-broadcast': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📡 QuranChain Broadcast™')
          .addFields(
            { name: 'Live Channels', value: MEDIA.broadcast.channels.toString(), inline: true },
            { name: 'Quran Reciters', value: MEDIA.broadcast.quranReciters.toString(), inline: true },
            { name: 'Languages', value: MEDIA.broadcast.languages.toString(), inline: true },
            { name: 'Quality', value: MEDIA.broadcast.quality, inline: true },
            { name: 'Storage', value: MEDIA.broadcast.storage },
          ).setFooter({ text: 'Quran preserved immutably on QuranChain™' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-radio': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📻 Dar Radio™')
          .addFields(
            { name: 'Stations', value: MEDIA.radio.stations.toString(), inline: true },
            { name: 'Podcasts', value: MEDIA.radio.podcasts.toString(), inline: true },
            { name: 'Listeners', value: MEDIA.radio.listeners, inline: true },
            { name: 'Genres', value: MEDIA.radio.genres.map(g => \`• \${g}\`).join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-streaming': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('🎬 Dar Streaming™')
          .addFields(
            { name: 'Library', value: MEDIA.streaming.library.toLocaleString() + ' titles', inline: true },
            { name: 'Quality', value: MEDIA.streaming.quality, inline: true },
            { name: 'Offline', value: MEDIA.streaming.offline ? 'Yes' : 'No', inline: true },
            { name: 'Categories', value: MEDIA.streaming.categories.map(c => \`• \${c}\`).join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-tv': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📺 Dar TV™ — Islamic Television')
          .addFields(
            { name: 'Channels', value: MEDIA.tv.channels.toString(), inline: true },
            { name: 'Coverage', value: MEDIA.tv.coverage, inline: true },
            { name: 'IPTV', value: MEDIA.tv.iptv ? 'Available' : 'No', inline: true },
            { name: 'Satellites', value: MEDIA.tv.satellites.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-news': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📰 Dar News™ — World News Service')
          .addFields(
            { name: 'Bureaus', value: MEDIA.news.bureaus.toString(), inline: true },
            { name: 'Reporters', value: MEDIA.news.reporters.toString(), inline: true },
            { name: 'Languages', value: MEDIA.news.languages.toString(), inline: true },
            { name: 'Coverage', value: MEDIA.news.updates, inline: true },
            { name: 'Focus', value: MEDIA.news.focus },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-studios': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('🎥 Dar Studios™ — Production')
          .addFields(
            { name: 'Locations', value: MEDIA.studios.locations.toString(), inline: true },
            { name: 'Staff', value: MEDIA.studios.staff.toString(), inline: true },
            { name: 'Facilities', value: MEDIA.studios.capacity.map(c => \`• \${c}\`).join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'media-help': {
        const embed = new EmbedBuilder().setColor(0xf472b6).setTitle('📺 DarMedia Commands')
          .setDescription(['/media-dashboard', '/media-broadcast', '/media-radio', '/media-streaming', '/media-tv', '/media-news', '/media-studios'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 4. DARREALTY ────────────────────────────────────────────
  {
    dir: 'darrealty-bot',
    name: 'DarRealty',
    pkg: 'darrealty-bot',
    prefix: 'realty',
    description: 'Dar Realty™ — Real Estate, Smart Cities & Construction',
    avatar: { icon: 'DR', colors: ['#1a1a0a', '#3a3a1a', '#5a5a2a'], accent: '#eab308' },
    commands: [
      { name: 'realty-dashboard', desc: 'Real estate portfolio — properties, cities, projects' },
      { name: 'realty-residential', desc: 'Dar Al Nas Real Estate™ — residential properties (31 markets)' },
      { name: 'realty-commercial', desc: 'DarProperty™ — commercial real estate portfolio' },
      { name: 'realty-smartcities', desc: 'Smart Cities™ — planned community developments' },
      { name: 'realty-construction', desc: 'DarIstisna™ — construction finance & projects' },
      { name: 'realty-property-mgmt', desc: 'Property management services & rentals' },
      { name: 'realty-tokenized', desc: 'DarTokenize™ — tokenized real estate assets on chain' },
      { name: 'realty-help', desc: 'DarRealty bot commands' },
    ],
    handler: `
    const REALTY = {
      residential: { markets: 31, listings: 4200, avgPrice: '$285,000', program: 'DarMortgage Zero-Riba', down: '$5,000', approval: 'Auto', cities: ['Dallas TX','Houston TX','Chicago IL','Detroit MI','Atlanta GA','Philadelphia PA','Northern VA','Columbus OH','Indianapolis IN','Memphis TN','Milwaukee WI','Minneapolis MN','St Louis MO','Raleigh NC','Tampa FL','Orlando FL','Jacksonville FL','Nashville TN','Kansas City MO','Oklahoma City OK','Louisville KY','Richmond VA','Charlotte NC','San Antonio TX','Austin TX','Baltimore MD','Dearborn MI','Patterson NJ','Brooklyn NY','Jersey City NJ','Bridgeview IL'] },
      commercial: { properties: 340, sqft: '8.2M', occupancy: '94%', types: ['Office', 'Retail', 'Medical', 'Warehouse', 'Mixed-Use'] },
      smartCities: { projects: 3, planned: ['Dar Al Nas Community TX', 'Dar Heights MI', 'Dar Gardens GA'], features: ['Solar Power', 'EV Charging', 'Fiber Internet', 'Masjid', 'Halal Market', 'Islamic School', 'Community Center', 'Parks'] },
      construction: { active: 18, completed: 47, value: '$890M', type: 'Istisna milestone-based' },
      propertyMgmt: { units: 12400, occupancy: '96%', maintenance: '24/7', portal: 'Online tenant portal' },
      tokenized: { assets: 24, totalValue: '$180M', chain: 'QuranChain', minInvestment: '$100', holders: 8400 }
    };
    
    switch (commandName) {
      case 'realty-dashboard': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏗️ DarRealty™ Portfolio Dashboard')
          .addFields(
            { name: '🏠 Residential', value: REALTY.residential.listings.toLocaleString() + ' listings', inline: true },
            { name: '🏢 Commercial', value: REALTY.commercial.properties + ' properties', inline: true },
            { name: '🌆 Smart Cities', value: REALTY.smartCities.projects + ' projects', inline: true },
            { name: '🏗️ Construction', value: REALTY.construction.active + ' active', inline: true },
            { name: '🏘️ Managed Units', value: REALTY.propertyMgmt.units.toLocaleString(), inline: true },
            { name: '🔗 Tokenized', value: '$' + (REALTY.tokenized.totalValue), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-residential': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏠 Dar Al Nas Real Estate™')
          .addFields(
            { name: 'Markets', value: REALTY.residential.markets + ' USA cities', inline: true },
            { name: 'Listings', value: REALTY.residential.listings.toLocaleString(), inline: true },
            { name: 'Avg Price', value: REALTY.residential.avgPrice, inline: true },
            { name: 'Program', value: REALTY.residential.program },
            { name: 'Down Payment', value: REALTY.residential.down + ' = Auto-Approved', inline: true },
            { name: 'Top Cities', value: REALTY.residential.cities.slice(0,10).join(', ') + '...' },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-commercial': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏢 DarProperty™ Commercial')
          .addFields(
            { name: 'Properties', value: REALTY.commercial.properties.toString(), inline: true },
            { name: 'Total SqFt', value: REALTY.commercial.sqft, inline: true },
            { name: 'Occupancy', value: REALTY.commercial.occupancy, inline: true },
            { name: 'Types', value: REALTY.commercial.types.map(t => \`• \${t}\`).join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-smartcities': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🌆 Smart Cities Projects')
          .addFields(
            { name: 'Planned Communities', value: REALTY.smartCities.planned.map(p => \`• \${p}\`).join('\\n') },
            { name: 'Features', value: REALTY.smartCities.features.map(f => \`• \${f}\`).join('\\n') },
          ).setFooter({ text: 'Complete Islamic community lifestyle' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-construction': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏗️ Construction & Development')
          .addFields(
            { name: 'Active Projects', value: REALTY.construction.active.toString(), inline: true },
            { name: 'Completed', value: REALTY.construction.completed.toString(), inline: true },
            { name: 'Total Value', value: REALTY.construction.value, inline: true },
            { name: 'Finance Type', value: REALTY.construction.type },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-property-mgmt': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏘️ Property Management')
          .addFields(
            { name: 'Managed Units', value: REALTY.propertyMgmt.units.toLocaleString(), inline: true },
            { name: 'Occupancy', value: REALTY.propertyMgmt.occupancy, inline: true },
            { name: 'Maintenance', value: REALTY.propertyMgmt.maintenance, inline: true },
            { name: 'Tenant Portal', value: REALTY.propertyMgmt.portal },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-tokenized': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🔗 DarTokenize™ — On-Chain Real Estate')
          .addFields(
            { name: 'Tokenized Assets', value: REALTY.tokenized.assets.toString(), inline: true },
            { name: 'Total Value', value: REALTY.tokenized.totalValue, inline: true },
            { name: 'Min Investment', value: REALTY.tokenized.minInvestment, inline: true },
            { name: 'Blockchain', value: REALTY.tokenized.chain, inline: true },
            { name: 'Token Holders', value: REALTY.tokenized.holders.toLocaleString(), inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'realty-help': {
        const embed = new EmbedBuilder().setColor(0xeab308).setTitle('🏗️ DarRealty Commands')
          .setDescription(['/realty-dashboard', '/realty-residential', '/realty-commercial', '/realty-smartcities', '/realty-construction', '/realty-property-mgmt', '/realty-tokenized'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 5. DARCOMMERCE ──────────────────────────────────────────
  {
    dir: 'darcommerce-bot',
    name: 'DarCommerce',
    pkg: 'darcommerce-bot',
    prefix: 'shop',
    description: 'DarCommerce™ — Halal Marketplace, Food, Travel & Lifestyle',
    avatar: { icon: 'DC', colors: ['#1a0f00', '#3a2a1a', '#5a4a2a'], accent: '#f97316' },
    commands: [
      { name: 'shop-dashboard', desc: 'DarCommerce marketplace overview & stats' },
      { name: 'shop-marketplace', desc: 'DarCommerce™ — halal e-commerce marketplace' },
      { name: 'shop-food', desc: 'DarFood™ & DarFresh™ — halal food supply chain' },
      { name: 'shop-travel', desc: 'DarTravel™ — halal-friendly tourism & hospitality' },
      { name: 'shop-fashion', desc: 'DarFashion™ — modest clothing marketplace' },
      { name: 'shop-restaurants', desc: 'Dar Restaurants™ — halal dining network' },
      { name: 'shop-logistics', desc: 'DarLogistics™ — halal supply chain & fulfillment' },
      { name: 'shop-gaming', desc: 'DarGaming™ — Islamic entertainment platform' },
      { name: 'shop-help', desc: 'DarCommerce bot commands' },
    ],
    handler: `
    const COMMERCE = {
      marketplace: { sellers: 24000, products: 890000, categories: ['Electronics', 'Clothing', 'Food', 'Beauty', 'Home', 'Books', 'Health', 'Toys'], halal: '100% verified', payments: 'DarPay / Halal Card' },
      food: { suppliers: 3400, certifications: ['USDA Organic', 'Halal Certified', 'Non-GMO'], delivery: 'Same day', cities: 31, products: ['Fresh Meat', 'Groceries', 'Prepared Meals', 'Snacks', 'Beverages'] },
      travel: { destinations: 120, hotels: 8500, flights: true, hajj: true, umrah: true, packages: ['Hajj Premium', 'Umrah Standard', 'Family Vacation', 'Business Travel'], halalHotels: 'Alcohol-free, prayer facilities' },
      fashion: { brands: 450, items: 120000, categories: ['Abayas', 'Thobes', 'Hijabs', 'Modest Dresses', 'Activewear', 'Kids'], designers: 180 },
      restaurants: { locations: 680, cuisines: ['Arabic', 'Turkish', 'Pakistani', 'Malaysian', 'Mediterranean', 'American Halal'], delivery: 'DarLogistics', rating: '4.7/5' },
      logistics: { warehouses: 12, coverage: '48 US states', sameDay: true, international: '57 OIC nations', tracking: 'Real-time GPS' },
      gaming: { games: 45, genres: ['Education', 'Adventure', 'Strategy', 'Quran Quiz', 'History', 'Puzzle'], players: 340000, platform: 'Web, iOS, Android' }
    };
    
    switch (commandName) {
      case 'shop-dashboard': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🛒 DarCommerce™ Dashboard')
          .addFields(
            { name: '🏪 Sellers', value: COMMERCE.marketplace.sellers.toLocaleString(), inline: true },
            { name: '📦 Products', value: COMMERCE.marketplace.products.toLocaleString(), inline: true },
            { name: '🍖 Food Suppliers', value: COMMERCE.food.suppliers.toLocaleString(), inline: true },
            { name: '✈️ Destinations', value: COMMERCE.travel.destinations.toString(), inline: true },
            { name: '👗 Fashion Brands', value: COMMERCE.fashion.brands.toString(), inline: true },
            { name: '🍽️ Restaurants', value: COMMERCE.restaurants.locations.toString(), inline: true },
            { name: '🎮 Games', value: COMMERCE.gaming.games.toString(), inline: true },
            { name: '📦 Warehouses', value: COMMERCE.logistics.warehouses.toString(), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-marketplace': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🏪 DarCommerce Marketplace')
          .addFields(
            { name: 'Sellers', value: COMMERCE.marketplace.sellers.toLocaleString(), inline: true },
            { name: 'Products', value: COMMERCE.marketplace.products.toLocaleString(), inline: true },
            { name: 'Categories', value: COMMERCE.marketplace.categories.join(', ') },
            { name: 'Payment', value: COMMERCE.marketplace.payments },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-food': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🍖 DarFood™ & DarFresh™')
          .addFields(
            { name: 'Suppliers', value: COMMERCE.food.suppliers.toLocaleString(), inline: true },
            { name: 'Delivery', value: COMMERCE.food.delivery, inline: true },
            { name: 'Cities', value: COMMERCE.food.cities.toString(), inline: true },
            { name: 'Products', value: COMMERCE.food.products.join(', ') },
            { name: 'Certifications', value: COMMERCE.food.certifications.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-travel': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('✈️ DarTravel™ — Halal Tourism')
          .addFields(
            { name: 'Destinations', value: COMMERCE.travel.destinations.toString(), inline: true },
            { name: 'Hotels', value: COMMERCE.travel.hotels.toLocaleString(), inline: true },
            { name: 'Hajj/Umrah', value: 'Available ✓', inline: true },
            { name: 'Packages', value: COMMERCE.travel.packages.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-fashion': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('👗 DarFashion™ — Modest Fashion')
          .addFields(
            { name: 'Brands', value: COMMERCE.fashion.brands.toString(), inline: true },
            { name: 'Items', value: COMMERCE.fashion.items.toLocaleString(), inline: true },
            { name: 'Designers', value: COMMERCE.fashion.designers.toString(), inline: true },
            { name: 'Categories', value: COMMERCE.fashion.categories.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-restaurants': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🍽️ Dar Restaurants™')
          .addFields(
            { name: 'Locations', value: COMMERCE.restaurants.locations.toString(), inline: true },
            { name: 'Rating', value: COMMERCE.restaurants.rating, inline: true },
            { name: 'Delivery', value: COMMERCE.restaurants.delivery, inline: true },
            { name: 'Cuisines', value: COMMERCE.restaurants.cuisines.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-logistics': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('📦 DarLogistics™')
          .addFields(
            { name: 'Warehouses', value: COMMERCE.logistics.warehouses.toString(), inline: true },
            { name: 'Coverage', value: COMMERCE.logistics.coverage, inline: true },
            { name: 'Same Day', value: COMMERCE.logistics.sameDay ? 'Yes' : 'No', inline: true },
            { name: 'International', value: COMMERCE.logistics.international },
            { name: 'Tracking', value: COMMERCE.logistics.tracking },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-gaming': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🎮 DarGaming™')
          .addFields(
            { name: 'Games', value: COMMERCE.gaming.games.toString(), inline: true },
            { name: 'Players', value: COMMERCE.gaming.players.toLocaleString(), inline: true },
            { name: 'Platform', value: COMMERCE.gaming.platform, inline: true },
            { name: 'Genres', value: COMMERCE.gaming.genres.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'shop-help': {
        const embed = new EmbedBuilder().setColor(0xf97316).setTitle('🛒 DarCommerce Commands')
          .setDescription(['/shop-dashboard', '/shop-marketplace', '/shop-food', '/shop-travel', '/shop-fashion', '/shop-restaurants', '/shop-logistics', '/shop-gaming'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 6. DARTRADE ─────────────────────────────────────────────
  {
    dir: 'dartrade-bot',
    name: 'DarTrade',
    pkg: 'dartrade-bot',
    prefix: 'trade',
    description: 'DarTrade™ — Global Trade, Logistics & Import/Export',
    avatar: { icon: 'DT', colors: ['#0a1a2e', '#1a2a3e', '#2a3a5e'], accent: '#06b6d4' },
    commands: [
      { name: 'trade-dashboard', desc: 'Global trade operations overview' },
      { name: 'trade-import', desc: 'Import/export operations & corridors' },
      { name: 'trade-shipping', desc: 'Dar Shipping™ — maritime & air freight' },
      { name: 'trade-freight', desc: 'Dar Freight™ — ground freight & trucking' },
      { name: 'trade-customs', desc: 'Customs clearance & compliance' },
      { name: 'trade-global', desc: 'Dar Global Trade™ — international markets' },
      { name: 'trade-help', desc: 'DarTrade bot commands' },
    ],
    handler: `
    const TRADE = {
      operations: { corridors: 57, countries: 'OIC + EU + ASEAN', volume: '$4.2B annual', vessels: 24, aircraft: 8, trucks: 340 },
      import: { categories: ['Electronics', 'Textiles', 'Food & Agriculture', 'Machinery', 'Raw Materials', 'Pharmaceuticals'], clearance: '< 48 hours', tariff: 'AI-optimized', compliance: 'Full WTO/WCO' },
      shipping: { vessels: 24, ports: 45, containerCapacity: '180K TEU', routes: ['Middle East ↔ USA', 'Asia ↔ Europe', 'Africa ↔ Americas', 'Intra-OIC'], tracking: 'Real-time satellite' },
      freight: { trucks: 340, warehouses: 18, coverage: '48 US states + Canada', sameDay: true, cold: 'Cold chain available', hazmat: false },
      customs: { clearance: '< 48 hours', ai: 'AI classification', docs: 'Automated', compliance: ['WTO', 'WCO', 'C-TPAT', 'AEO'], languages: 8 },
      global: { offices: 22, markets: 57, partnerships: 180, ftz: 8, specialization: 'Halal trade certification & routing' }
    };
    
    switch (commandName) {
      case 'trade-dashboard': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('🚢 DarTrade™ Global Operations')
          .addFields(
            { name: '🌍 Corridors', value: TRADE.operations.corridors.toString(), inline: true },
            { name: '💰 Annual Volume', value: TRADE.operations.volume, inline: true },
            { name: '🚢 Vessels', value: TRADE.operations.vessels.toString(), inline: true },
            { name: '✈️ Aircraft', value: TRADE.operations.aircraft.toString(), inline: true },
            { name: '🚛 Trucks', value: TRADE.operations.trucks.toString(), inline: true },
            { name: '📦 Ports', value: TRADE.shipping.ports.toString(), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-import': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('📋 Import/Export Operations')
          .addFields(
            { name: 'Categories', value: TRADE.import.categories.join(', ') },
            { name: 'Clearance', value: TRADE.import.clearance, inline: true },
            { name: 'Tariff', value: TRADE.import.tariff, inline: true },
            { name: 'Compliance', value: TRADE.import.compliance, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-shipping': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('🚢 Dar Shipping™')
          .addFields(
            { name: 'Vessels', value: TRADE.shipping.vessels.toString(), inline: true },
            { name: 'Ports', value: TRADE.shipping.ports.toString(), inline: true },
            { name: 'Capacity', value: TRADE.shipping.containerCapacity, inline: true },
            { name: 'Routes', value: TRADE.shipping.routes.join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-freight': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('🚛 Dar Freight™')
          .addFields(
            { name: 'Trucks', value: TRADE.freight.trucks.toString(), inline: true },
            { name: 'Warehouses', value: TRADE.freight.warehouses.toString(), inline: true },
            { name: 'Coverage', value: TRADE.freight.coverage, inline: true },
            { name: 'Cold Chain', value: TRADE.freight.cold },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-customs': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('📑 Customs & Compliance')
          .addFields(
            { name: 'Clearance Time', value: TRADE.customs.clearance, inline: true },
            { name: 'Classification', value: TRADE.customs.ai, inline: true },
            { name: 'Documentation', value: TRADE.customs.docs, inline: true },
            { name: 'Certifications', value: TRADE.customs.compliance.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-global': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('🌍 Dar Global Trade™')
          .addFields(
            { name: 'Offices', value: TRADE.global.offices.toString(), inline: true },
            { name: 'Markets', value: TRADE.global.markets.toString(), inline: true },
            { name: 'Partnerships', value: TRADE.global.partnerships.toString(), inline: true },
            { name: 'Free Trade Zones', value: TRADE.global.ftz.toString(), inline: true },
            { name: 'Specialization', value: TRADE.global.specialization },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'trade-help': {
        const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('🚢 DarTrade Commands')
          .setDescription(['/trade-dashboard', '/trade-import', '/trade-shipping', '/trade-freight', '/trade-customs', '/trade-global'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 7. DAREDU ───────────────────────────────────────────────
  {
    dir: 'daredu-bot',
    name: 'DarEdu',
    pkg: 'daredu-bot',
    prefix: 'edu',
    description: 'DarEdu™ — Islamic Education, University & Research',
    avatar: { icon: 'DE', colors: ['#0a0a2e', '#1a1a4e', '#2a2a6e'], accent: '#818cf8' },
    commands: [
      { name: 'edu-dashboard', desc: 'DarEdu academic overview — university, academy, research' },
      { name: 'edu-university', desc: 'Dar University™ — degree programs & enrollment' },
      { name: 'edu-academy', desc: 'Dar Academy™ — professional certifications & courses' },
      { name: 'edu-online', desc: 'Dar Online School™ — K-12 Islamic education' },
      { name: 'edu-research', desc: 'Dar Research Institute™ — academic research & publications' },
      { name: 'edu-scholars', desc: 'Scholar Net™ — Islamic scholars network & fatwa database' },
      { name: 'edu-quran', desc: 'Quran learning programs — tajweed, hifz, tafsir' },
      { name: 'edu-help', desc: 'DarEdu bot commands' },
    ],
    handler: `
    const EDU = {
      university: { students: 24000, programs: 85, faculties: ['Engineering', 'Medicine', 'Law', 'Business', 'Islamic Studies', 'Computer Science', 'Architecture', 'Arts'], campuses: 4, accreditation: 'AACSB, ABET, ACPE' },
      academy: { courses: 450, certifications: 120, categories: ['Cloud Computing', 'AI/ML', 'Blockchain', 'Cybersecurity', 'Islamic Finance', 'Digital Marketing', 'Project Management'], completions: 89000 },
      online: { students: 45000, grades: 'K-12', curriculum: 'Islamic + STEM + Arts', languages: ['English', 'Arabic', 'Urdu', 'Malay'], live: true, tutors: 800 },
      research: { papers: 1200, grants: '$42M', focus: ['AI Ethics', 'Islamic Finance', 'Quantum Computing', 'Halal Tech', 'Blockchain Governance', 'Mesh Networks'], partnerships: 34 },
      scholars: { scholars: 340, fatwas: 8900, languages: 12, specializations: ['Fiqh', 'Hadith', 'Tafsir', 'Aqeedah', 'Islamic History', 'Contemporary Issues'], verified: true },
      quran: { students: 120000, programs: ['Tajweed', 'Hifz (Memorization)', 'Tafsir (Interpretation)', 'Arabic Language', 'Qiraat (Recitation Styles)'], teachers: 2400, ijazah: true }
    };
    
    switch (commandName) {
      case 'edu-dashboard': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('🎓 DarEdu™ Academic Dashboard')
          .addFields(
            { name: '🏛️ University Students', value: EDU.university.students.toLocaleString(), inline: true },
            { name: '📜 Academy Courses', value: EDU.academy.courses.toString(), inline: true },
            { name: '🏫 Online Students', value: EDU.online.students.toLocaleString(), inline: true },
            { name: '📚 Research Papers', value: EDU.research.papers.toLocaleString(), inline: true },
            { name: '🕌 Scholars', value: EDU.scholars.scholars.toString(), inline: true },
            { name: '📖 Quran Students', value: EDU.quran.students.toLocaleString(), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-university': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('🏛️ Dar University™')
          .addFields(
            { name: 'Students', value: EDU.university.students.toLocaleString(), inline: true },
            { name: 'Programs', value: EDU.university.programs.toString(), inline: true },
            { name: 'Campuses', value: EDU.university.campuses.toString(), inline: true },
            { name: 'Faculties', value: EDU.university.faculties.join(', ') },
            { name: 'Accreditation', value: EDU.university.accreditation },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-academy': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('📜 Dar Academy™')
          .addFields(
            { name: 'Courses', value: EDU.academy.courses.toString(), inline: true },
            { name: 'Certifications', value: EDU.academy.certifications.toString(), inline: true },
            { name: 'Completions', value: EDU.academy.completions.toLocaleString(), inline: true },
            { name: 'Categories', value: EDU.academy.categories.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-online': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('🏫 Dar Online School™')
          .addFields(
            { name: 'Students', value: EDU.online.students.toLocaleString(), inline: true },
            { name: 'Grades', value: EDU.online.grades, inline: true },
            { name: 'Tutors', value: EDU.online.tutors.toString(), inline: true },
            { name: 'Curriculum', value: EDU.online.curriculum },
            { name: 'Languages', value: EDU.online.languages.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-research': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('📚 Dar Research Institute™')
          .addFields(
            { name: 'Papers', value: EDU.research.papers.toLocaleString(), inline: true },
            { name: 'Grants', value: EDU.research.grants, inline: true },
            { name: 'Partnerships', value: EDU.research.partnerships.toString(), inline: true },
            { name: 'Focus Areas', value: EDU.research.focus.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-scholars': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('🕌 Scholar Net™')
          .addFields(
            { name: 'Scholars', value: EDU.scholars.scholars.toString(), inline: true },
            { name: 'Fatwas', value: EDU.scholars.fatwas.toLocaleString(), inline: true },
            { name: 'Languages', value: EDU.scholars.languages.toString(), inline: true },
            { name: 'Specializations', value: EDU.scholars.specializations.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-quran': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('📖 Quran Learning Programs')
          .addFields(
            { name: 'Students', value: EDU.quran.students.toLocaleString(), inline: true },
            { name: 'Teachers', value: EDU.quran.teachers.toLocaleString(), inline: true },
            { name: 'Ijazah', value: EDU.quran.ijazah ? 'Available' : 'No', inline: true },
            { name: 'Programs', value: EDU.quran.programs.join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'edu-help': {
        const embed = new EmbedBuilder().setColor(0x818cf8).setTitle('🎓 DarEdu Commands')
          .setDescription(['/edu-dashboard', '/edu-university', '/edu-academy', '/edu-online', '/edu-research', '/edu-scholars', '/edu-quran'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 8. DARENERGY ────────────────────────────────────────────
  {
    dir: 'darenergy-bot',
    name: 'DarEnergy',
    pkg: 'darenergy-bot',
    prefix: 'energy',
    description: 'DarEnergy™ — Energy, Oil, Mining & Resources',
    avatar: { icon: 'EN', colors: ['#1a1a00', '#2a2a0a', '#4a4a1a'], accent: '#84cc16' },
    commands: [
      { name: 'energy-dashboard', desc: 'DarEnergy™ resource operations overview' },
      { name: 'energy-oil', desc: 'Dar Oil Trading™ — crude & refined petroleum' },
      { name: 'energy-mining', desc: 'Dar Mining™ — mineral extraction & processing' },
      { name: 'energy-water', desc: 'Dar Water™ — water treatment & distribution' },
      { name: 'energy-solar', desc: 'Solar & renewable energy installations' },
      { name: 'energy-grid', desc: 'Power grid infrastructure & distribution' },
      { name: 'energy-help', desc: 'DarEnergy bot commands' },
    ],
    handler: `
    const ENERGY = {
      oil: { production: '245K barrels/day', reserves: '1.2B barrels', refining: '180K bbl/day', terminals: 8, trading: '24/7 spot & futures', compliance: 'Shariah-screened commodities' },
      mining: { operations: 12, minerals: ['Gold', 'Silver', 'Copper', 'Lithium', 'Rare Earth'], production: '$890M annual', employees: 4200, sustainability: 'ISO 14001' },
      water: { plants: 18, capacity: '240M gallons/day', customers: 2400000, desalination: 3, wastewater: 8, quality: 'WHO Standards' },
      solar: { installations: 340, capacity: '2.4 GW', panels: '4.8M', investment: '$3.2B', co2Saved: '1.8M tons/year' },
      grid: { coverage: '48 states', substations: 120, smartMeters: 890000, uptime: '99.97%', renewable: '42% mix' }
    };
    
    switch (commandName) {
      case 'energy-dashboard': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('⚡ DarEnergy™ Resource Dashboard')
          .addFields(
            { name: '🛢️ Oil Production', value: ENERGY.oil.production, inline: true },
            { name: '⛏️ Mining Ops', value: ENERGY.mining.operations.toString(), inline: true },
            { name: '💧 Water Plants', value: ENERGY.water.plants.toString(), inline: true },
            { name: '☀️ Solar Capacity', value: ENERGY.solar.capacity, inline: true },
            { name: '🔌 Grid Coverage', value: ENERGY.grid.coverage, inline: true },
            { name: '♻️ Renewable Mix', value: ENERGY.grid.renewable, inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-oil': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('🛢️ Dar Oil Trading™')
          .addFields(
            { name: 'Production', value: ENERGY.oil.production, inline: true },
            { name: 'Reserves', value: ENERGY.oil.reserves, inline: true },
            { name: 'Refining', value: ENERGY.oil.refining, inline: true },
            { name: 'Terminals', value: ENERGY.oil.terminals.toString(), inline: true },
            { name: 'Trading', value: ENERGY.oil.trading },
            { name: 'Compliance', value: ENERGY.oil.compliance },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-mining': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('⛏️ Dar Mining™')
          .addFields(
            { name: 'Operations', value: ENERGY.mining.operations.toString(), inline: true },
            { name: 'Annual Production', value: ENERGY.mining.production, inline: true },
            { name: 'Employees', value: ENERGY.mining.employees.toLocaleString(), inline: true },
            { name: 'Minerals', value: ENERGY.mining.minerals.join(', ') },
            { name: 'Sustainability', value: ENERGY.mining.sustainability },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-water': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('💧 Dar Water™')
          .addFields(
            { name: 'Plants', value: ENERGY.water.plants.toString(), inline: true },
            { name: 'Capacity', value: ENERGY.water.capacity, inline: true },
            { name: 'Customers', value: ENERGY.water.customers.toLocaleString(), inline: true },
            { name: 'Desalination', value: ENERGY.water.desalination + ' plants', inline: true },
            { name: 'Quality', value: ENERGY.water.quality, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-solar': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('☀️ Solar & Renewable Energy')
          .addFields(
            { name: 'Installations', value: ENERGY.solar.installations.toString(), inline: true },
            { name: 'Capacity', value: ENERGY.solar.capacity, inline: true },
            { name: 'Investment', value: ENERGY.solar.investment, inline: true },
            { name: 'CO₂ Saved', value: ENERGY.solar.co2Saved, inline: true },
            { name: 'Panels', value: ENERGY.solar.panels, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-grid': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('🔌 Power Grid Infrastructure')
          .addFields(
            { name: 'Coverage', value: ENERGY.grid.coverage, inline: true },
            { name: 'Substations', value: ENERGY.grid.substations.toString(), inline: true },
            { name: 'Smart Meters', value: ENERGY.grid.smartMeters.toLocaleString(), inline: true },
            { name: 'Uptime', value: ENERGY.grid.uptime, inline: true },
            { name: 'Renewable Mix', value: ENERGY.grid.renewable, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'energy-help': {
        const embed = new EmbedBuilder().setColor(0x84cc16).setTitle('⚡ DarEnergy Commands')
          .setDescription(['/energy-dashboard', '/energy-oil', '/energy-mining', '/energy-water', '/energy-solar', '/energy-grid'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 9. DARSECURITY ──────────────────────────────────────────
  {
    dir: 'darsecurity-bot',
    name: 'DarSecurity',
    pkg: 'darsecurity-bot',
    prefix: 'sec',
    description: 'DarSecurity™ — Cybersecurity, Quantum Tech & Space Systems',
    avatar: { icon: 'DS', colors: ['#0a0a0a', '#1a1a1a', '#2a2a2a'], accent: '#ef4444' },
    commands: [
      { name: 'sec-dashboard', desc: 'DarSecurity™ threat & defense dashboard' },
      { name: 'sec-cyber', desc: 'DarCybersecurity™ — SOC operations & threat intel' },
      { name: 'sec-comms', desc: 'Dar Secure Comms™ — encrypted communications' },
      { name: 'sec-quantum', desc: 'DarQuantum™ — quantum computing & encryption' },
      { name: 'sec-space', desc: 'Dar Space Systems™ — satellite & space operations' },
      { name: 'sec-strategic', desc: 'Dar Strategic Systems™ — defense & infrastructure' },
      { name: 'sec-identity', desc: 'DarIdentity™ — decentralized KYC & identity' },
      { name: 'sec-help', desc: 'DarSecurity bot commands' },
    ],
    handler: `
    const SEC = {
      cyber: { soc: '24/7/365', analysts: 180, threats: { blocked: '4.2M/day', incidents: 12, severity: { critical: 0, high: 3, medium: 9 } }, tools: ['SIEM', 'EDR', 'XDR', 'SOAR', 'Threat Intel'], certifications: ['SOC2 Type II', 'ISO 27001', 'PCI DSS', 'HIPAA'] },
      comms: { encryption: 'AES-256 + Kyber-1024', protocols: ['Signal Protocol', 'MeshTalk E2EE', 'Quantum Key Distribution'], users: 890000, zeroKnowledge: true, metadata: 'Zero-metadata architecture' },
      quantum: { qubits: 1024, algorithms: ['Kyber-1024', 'Dilithium-5', 'SPHINCS+', 'BB84 QKD'], services: ['Post-Quantum Encryption', 'Quantum Key Distribution', 'Quantum Random Number Gen', 'Quantum-Safe TLS'], readiness: '100% post-quantum ready' },
      space: { satellites: 24, orbits: ['LEO', 'MEO', 'GEO'], services: ['Communications', 'Earth Observation', 'Navigation', 'Internet'], groundStations: 8, launches: 6 },
      strategic: { systems: ['Critical Infrastructure Protection', 'SCADA Security', 'Military-Grade Encryption', 'Air-Gap Networks', 'Nuclear Facility Security'], clearance: 'Top Secret', customers: 'Government & Defense' },
      identity: { users: 4200000, methods: ['Biometric', 'Zero-Knowledge Proof', 'Decentralized ID (DID)', 'Verifiable Credentials'], chain: 'QuranChain', compliance: 'eIDAS, NIST 800-63' }
    };
    
    switch (commandName) {
      case 'sec-dashboard': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🛡️ DarSecurity™ Defense Dashboard')
          .addFields(
            { name: '🔒 SOC Status', value: SEC.cyber.soc, inline: true },
            { name: '🚫 Threats Blocked', value: SEC.cyber.threats.blocked, inline: true },
            { name: '⚛️ Qubits', value: SEC.quantum.qubits.toString(), inline: true },
            { name: '🛰️ Satellites', value: SEC.space.satellites.toString(), inline: true },
            { name: '🆔 Identity Users', value: SEC.identity.users.toLocaleString(), inline: true },
            { name: '📡 Secure Users', value: SEC.comms.users.toLocaleString(), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-cyber': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🔒 DarCybersecurity™ SOC')
          .addFields(
            { name: 'SOC', value: SEC.cyber.soc, inline: true },
            { name: 'Analysts', value: SEC.cyber.analysts.toString(), inline: true },
            { name: 'Threats Blocked/Day', value: SEC.cyber.threats.blocked, inline: true },
            { name: 'Active Incidents', value: \`Critical: \${SEC.cyber.threats.severity.critical} | High: \${SEC.cyber.threats.severity.high} | Medium: \${SEC.cyber.threats.severity.medium}\` },
            { name: 'Tools', value: SEC.cyber.tools.join(', ') },
            { name: 'Certifications', value: SEC.cyber.certifications.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-comms': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('📡 Dar Secure Comms™')
          .addFields(
            { name: 'Encryption', value: SEC.comms.encryption, inline: true },
            { name: 'Users', value: SEC.comms.users.toLocaleString(), inline: true },
            { name: 'Zero Knowledge', value: SEC.comms.zeroKnowledge ? 'Yes' : 'No', inline: true },
            { name: 'Protocols', value: SEC.comms.protocols.join('\\n') },
            { name: 'Metadata', value: SEC.comms.metadata },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-quantum': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('⚛️ DarQuantum™ Computing')
          .addFields(
            { name: 'Qubits', value: SEC.quantum.qubits.toString(), inline: true },
            { name: 'Readiness', value: SEC.quantum.readiness, inline: true },
            { name: 'Algorithms', value: SEC.quantum.algorithms.join(', ') },
            { name: 'Services', value: SEC.quantum.services.join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-space': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🛰️ Dar Space Systems™')
          .addFields(
            { name: 'Satellites', value: SEC.space.satellites.toString(), inline: true },
            { name: 'Ground Stations', value: SEC.space.groundStations.toString(), inline: true },
            { name: 'Launches', value: SEC.space.launches.toString(), inline: true },
            { name: 'Orbits', value: SEC.space.orbits.join(', ') },
            { name: 'Services', value: SEC.space.services.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-strategic': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🏛️ Dar Strategic Systems™')
          .addFields(
            { name: 'Clearance', value: SEC.strategic.clearance, inline: true },
            { name: 'Customers', value: SEC.strategic.customers, inline: true },
            { name: 'Systems', value: SEC.strategic.systems.join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-identity': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🆔 DarIdentity™ — Decentralized KYC')
          .addFields(
            { name: 'Users', value: SEC.identity.users.toLocaleString(), inline: true },
            { name: 'Blockchain', value: SEC.identity.chain, inline: true },
            { name: 'Compliance', value: SEC.identity.compliance, inline: true },
            { name: 'Methods', value: SEC.identity.methods.join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'sec-help': {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('🛡️ DarSecurity Commands')
          .setDescription(['/sec-dashboard', '/sec-cyber', '/sec-comms', '/sec-quantum', '/sec-space', '/sec-strategic', '/sec-identity'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 10. DARTRANSPORT ────────────────────────────────────────
  {
    dir: 'dartransport-bot',
    name: 'DarTransport',
    pkg: 'dartransport-bot',
    prefix: 'fly',
    description: 'DarTransport™ — Aviation, Airlines & Ground Transport',
    avatar: { icon: 'OA', colors: ['#0a1a0a', '#1a3a2a', '#2a5a3a'], accent: '#14b8a6' },
    commands: [
      { name: 'fly-dashboard', desc: 'Transport & aviation operations overview' },
      { name: 'fly-oliveair', desc: 'OliveAir™ — passenger airline operations' },
      { name: 'fly-cargo', desc: 'OliveAir Cargo™ — air freight & cargo' },
      { name: 'fly-darairlines', desc: 'Dar Airlines™ — regional airline network' },
      { name: 'fly-ground', desc: 'Dar Transport™ — ground fleet & logistics' },
      { name: 'fly-routes', desc: 'Route network & destinations' },
      { name: 'fly-fleet', desc: 'Aircraft & vehicle fleet details' },
      { name: 'fly-help', desc: 'DarTransport bot commands' },
    ],
    handler: `
    const TRANSPORT = {
      oliveair: { aircraft: 48, routes: 120, passengers: '8.4M annual', hubs: ['Dallas DFW', 'Dubai DXB', 'Istanbul IST', 'Kuala Lumpur KUL'], onTime: '94%', halal: 'Full halal meals, prayer space', class: ['Economy', 'Business', 'First'] },
      cargo: { freighters: 12, capacity: '240K tons/year', routes: 85, warehouses: 8, express: '< 24 hours', cold: true, hazmat: 'Certified' },
      darairlines: { aircraft: 24, routes: 65, focus: 'OIC Regional', passengers: '3.2M annual', hubs: ['Jeddah JED', 'Cairo CAI', 'Karachi KHI'] },
      ground: { vehicles: 1200, types: ['Bus', 'Shuttle', 'Limousine', 'Truck', 'Van'], cities: 45, rideshare: true, electric: '40% fleet', app: 'DarRide™' },
      fleet: { totalAircraft: 84, totalVehicles: 1200, newest: 'Boeing 787-9 Dreamliner', avgAge: '4.2 years', maintenance: 'FAA Part 145' }
    };
    
    switch (commandName) {
      case 'fly-dashboard': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('✈️ DarTransport™ Operations Dashboard')
          .addFields(
            { name: '✈️ OliveAir Passengers', value: TRANSPORT.oliveair.passengers, inline: true },
            { name: '📦 Cargo Capacity', value: TRANSPORT.cargo.capacity, inline: true },
            { name: '🛫 Dar Airlines Pax', value: TRANSPORT.darairlines.passengers, inline: true },
            { name: '🚌 Ground Vehicles', value: TRANSPORT.ground.vehicles.toLocaleString(), inline: true },
            { name: '✈️ Total Aircraft', value: TRANSPORT.fleet.totalAircraft.toString(), inline: true },
            { name: '⏱️ On-Time', value: TRANSPORT.oliveair.onTime, inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-oliveair': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('✈️ OliveAir™ — Passenger Airline')
          .addFields(
            { name: 'Aircraft', value: TRANSPORT.oliveair.aircraft.toString(), inline: true },
            { name: 'Routes', value: TRANSPORT.oliveair.routes.toString(), inline: true },
            { name: 'Passengers', value: TRANSPORT.oliveair.passengers, inline: true },
            { name: 'On-Time', value: TRANSPORT.oliveair.onTime, inline: true },
            { name: 'Hubs', value: TRANSPORT.oliveair.hubs.join('\\n') },
            { name: 'Classes', value: TRANSPORT.oliveair.class.join(', ') },
            { name: 'Halal', value: TRANSPORT.oliveair.halal },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-cargo': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('📦 OliveAir Cargo™')
          .addFields(
            { name: 'Freighters', value: TRANSPORT.cargo.freighters.toString(), inline: true },
            { name: 'Capacity', value: TRANSPORT.cargo.capacity, inline: true },
            { name: 'Routes', value: TRANSPORT.cargo.routes.toString(), inline: true },
            { name: 'Express', value: TRANSPORT.cargo.express, inline: true },
            { name: 'Warehouses', value: TRANSPORT.cargo.warehouses.toString(), inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-darairlines': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('🛫 Dar Airlines™ — Regional')
          .addFields(
            { name: 'Aircraft', value: TRANSPORT.darairlines.aircraft.toString(), inline: true },
            { name: 'Routes', value: TRANSPORT.darairlines.routes.toString(), inline: true },
            { name: 'Passengers', value: TRANSPORT.darairlines.passengers, inline: true },
            { name: 'Focus', value: TRANSPORT.darairlines.focus },
            { name: 'Hubs', value: TRANSPORT.darairlines.hubs.join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-ground': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('🚌 Dar Transport™ — Ground Fleet')
          .addFields(
            { name: 'Vehicles', value: TRANSPORT.ground.vehicles.toLocaleString(), inline: true },
            { name: 'Cities', value: TRANSPORT.ground.cities.toString(), inline: true },
            { name: 'Electric', value: TRANSPORT.ground.electric, inline: true },
            { name: 'Types', value: TRANSPORT.ground.types.join(', ') },
            { name: 'App', value: TRANSPORT.ground.app },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-routes': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('🗺️ Route Network')
          .addFields(
            { name: 'OliveAir Routes', value: TRANSPORT.oliveair.routes.toString(), inline: true },
            { name: 'Cargo Routes', value: TRANSPORT.cargo.routes.toString(), inline: true },
            { name: 'Regional Routes', value: TRANSPORT.darairlines.routes.toString(), inline: true },
            { name: 'OliveAir Hubs', value: TRANSPORT.oliveair.hubs.join(', ') },
            { name: 'Regional Hubs', value: TRANSPORT.darairlines.hubs.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-fleet': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('🛩️ Fleet Details')
          .addFields(
            { name: 'Total Aircraft', value: TRANSPORT.fleet.totalAircraft.toString(), inline: true },
            { name: 'Ground Vehicles', value: TRANSPORT.fleet.totalVehicles.toLocaleString(), inline: true },
            { name: 'Newest Aircraft', value: TRANSPORT.fleet.newest, inline: true },
            { name: 'Average Age', value: TRANSPORT.fleet.avgAge, inline: true },
            { name: 'Maintenance', value: TRANSPORT.fleet.maintenance, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'fly-help': {
        const embed = new EmbedBuilder().setColor(0x14b8a6).setTitle('✈️ DarTransport Commands')
          .setDescription(['/fly-dashboard', '/fly-oliveair', '/fly-cargo', '/fly-darairlines', '/fly-ground', '/fly-routes', '/fly-fleet'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 11. DARTELECOM ──────────────────────────────────────────
  {
    dir: 'dartelecom-bot',
    name: 'DarTelecom',
    pkg: 'dartelecom-bot',
    prefix: 'telecom',
    description: 'DarTelecom™ — eSIM, WiFi, Fiber, 5G & Satellite',
    avatar: { icon: '5G', colors: ['#0a0a2e', '#1a1a4e', '#2a2a6e'], accent: '#3b82f6' },
    commands: [
      { name: 'telecom-dashboard', desc: 'DarTelecom™ full network overview' },
      { name: 'telecom-esim', desc: 'Dar eSIM™ — global eSIM service (190+ countries)' },
      { name: 'telecom-wifi', desc: 'Dar WiFi Grid™ — mesh WiFi hotspots' },
      { name: 'telecom-fiber', desc: 'Dar Fiber Net™ — fiber optic network' },
      { name: 'telecom-5g', desc: 'Dar5G™ — 5G core network infrastructure' },
      { name: 'telecom-satellite', desc: 'Dar Sat Net™ — satellite internet service' },
      { name: 'telecom-hardware', desc: 'Dar Network HW™ — routers, modems, devices' },
      { name: 'telecom-help', desc: 'DarTelecom bot commands' },
    ],
    handler: `
    const TELECOM = {
      esim: { countries: 190, carriers: 450, plans: ['Data Only', 'Voice + Data', 'Unlimited', 'IoT'], activation: 'Instant QR', pricing: 'From $3/GB' },
      wifi: { hotspots: 45000, cities: 120, speed: 'Up to 1 Gbps', mesh: 'FungiMesh-powered', free: 'Community tier available' },
      fiber: { coverage: '31 cities', speed: 'Up to 10 Gbps', customers: 180000, uptime: '99.99%', plans: ['Residential 1G: $49/mo', 'Business 5G: $149/mo', 'Enterprise 10G: Custom'] },
      fiveG: { towers: 2400, coverage: '18 cities', speed: 'Up to 10 Gbps', latency: '< 1ms', slicing: 'Network slicing available' },
      satellite: { satellites: 24, coverage: 'Global', speed: 'Up to 500 Mbps', latency: '20ms (LEO)', plans: ['Basic: $49/mo', 'Premium: $99/mo', 'Maritime: Custom', 'Aviation: Custom'] },
      hardware: { products: ['5G Router', 'Mesh WiFi Node', 'eSIM Adapter', 'Satellite Terminal', 'IoT Gateway'], manufacturing: 'In-house', warranty: '3 years', support: '24/7' }
    };
    
    switch (commandName) {
      case 'telecom-dashboard': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📡 DarTelecom™ Network Dashboard')
          .addFields(
            { name: '📱 eSIM Countries', value: TELECOM.esim.countries.toString(), inline: true },
            { name: '📶 WiFi Hotspots', value: TELECOM.wifi.hotspots.toLocaleString(), inline: true },
            { name: '🔗 Fiber Customers', value: TELECOM.fiber.customers.toLocaleString(), inline: true },
            { name: '📡 5G Towers', value: TELECOM.fiveG.towers.toLocaleString(), inline: true },
            { name: '🛰️ Satellites', value: TELECOM.satellite.satellites.toString(), inline: true },
            { name: '⚡ Max Speed', value: TELECOM.fiber.speed, inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-esim': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📱 Dar eSIM™ — Global Connectivity')
          .addFields(
            { name: 'Countries', value: TELECOM.esim.countries.toString(), inline: true },
            { name: 'Carriers', value: TELECOM.esim.carriers.toString(), inline: true },
            { name: 'Activation', value: TELECOM.esim.activation, inline: true },
            { name: 'Pricing', value: TELECOM.esim.pricing },
            { name: 'Plans', value: TELECOM.esim.plans.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-wifi': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📶 Dar WiFi Grid™')
          .addFields(
            { name: 'Hotspots', value: TELECOM.wifi.hotspots.toLocaleString(), inline: true },
            { name: 'Cities', value: TELECOM.wifi.cities.toString(), inline: true },
            { name: 'Speed', value: TELECOM.wifi.speed, inline: true },
            { name: 'Mesh', value: TELECOM.wifi.mesh },
            { name: 'Free Tier', value: TELECOM.wifi.free },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-fiber': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('🔗 Dar Fiber Net™')
          .addFields(
            { name: 'Coverage', value: TELECOM.fiber.coverage, inline: true },
            { name: 'Customers', value: TELECOM.fiber.customers.toLocaleString(), inline: true },
            { name: 'Max Speed', value: TELECOM.fiber.speed, inline: true },
            { name: 'Uptime', value: TELECOM.fiber.uptime, inline: true },
            { name: 'Plans', value: TELECOM.fiber.plans.join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-5g': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📡 Dar5G™ — Core Network')
          .addFields(
            { name: 'Towers', value: TELECOM.fiveG.towers.toLocaleString(), inline: true },
            { name: 'Coverage', value: TELECOM.fiveG.coverage, inline: true },
            { name: 'Speed', value: TELECOM.fiveG.speed, inline: true },
            { name: 'Latency', value: TELECOM.fiveG.latency, inline: true },
            { name: 'Slicing', value: TELECOM.fiveG.slicing },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-satellite': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('🛰️ Dar Sat Net™')
          .addFields(
            { name: 'Satellites', value: TELECOM.satellite.satellites.toString(), inline: true },
            { name: 'Coverage', value: TELECOM.satellite.coverage, inline: true },
            { name: 'Speed', value: TELECOM.satellite.speed, inline: true },
            { name: 'Latency', value: TELECOM.satellite.latency, inline: true },
            { name: 'Plans', value: TELECOM.satellite.plans.join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-hardware': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('🔧 Dar Network HW™')
          .addFields(
            { name: 'Products', value: TELECOM.hardware.products.join('\\n') },
            { name: 'Manufacturing', value: TELECOM.hardware.manufacturing, inline: true },
            { name: 'Warranty', value: TELECOM.hardware.warranty, inline: true },
            { name: 'Support', value: TELECOM.hardware.support, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'telecom-help': {
        const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📡 DarTelecom Commands')
          .setDescription(['/telecom-dashboard', '/telecom-esim', '/telecom-wifi', '/telecom-fiber', '/telecom-5g', '/telecom-satellite', '/telecom-hardware'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 12. OMAR AI — SOVEREIGN CONTROL ─────────────────────────
  {
    dir: 'omarai-bot',
    name: 'Omar AI',
    pkg: 'omarai-bot',
    prefix: 'omar',
    description: 'Omar AI™ — AMĀN Control Plane & Sovereign Vision Layer',
    avatar: { icon: 'OA', colors: ['#0a0a0a', '#1a0a1a', '#2e0a2e'], accent: '#f59e0b' },
    commands: [
      { name: 'omar-status', desc: 'AMĀN Control Plane — sovereign system status' },
      { name: 'omar-empire', desc: 'Full empire overview — all 101 companies & 6 tiers' },
      { name: 'omar-ai-core', desc: 'Omar AI™ & QuranChain AI™ validator agents' },
      { name: 'omar-revenue', desc: 'Revenue streams — 30/40/10/18/2 split (immutable)' },
      { name: 'omar-governance', desc: 'Governance layer — policy engine & compliance' },
      { name: 'omar-regions', desc: 'International operations — 21 regional offices' },
      { name: 'omar-founder', desc: 'Founder Console™ — executive dashboard' },
      { name: 'omar-bots', desc: 'All active Discord bots & AI agents status' },
      { name: 'omar-help', desc: 'Omar AI bot commands' },
    ],
    handler: `
    const EMPIRE = {
      founder: 'Omar Mohammad Abunadi',
      companies: 101, tiers: 6,
      tierBreakdown: { 'Tier 1 — Core Platform': 10, 'Tier 2 — Islamic Finance': 20, 'Tier 3 — AI & Technology': 20, 'Tier 4 — Halal Lifestyle': 15, 'Tier 5 — Blockchain & DeFi': 15, 'Tier 6 — International': 21 },
      aiAgents: 66, assistants: 12, blockchains: 47, meshNodes: 340000,
      revenueSplit: { founder: '30%', aiValidators: '40%', hardware: '10%', ecosystem: '18%', zakat: '2%' },
      regions: ['USA (HQ)', 'UAE DIFC', 'UK', 'Malaysia', 'Saudi Arabia', 'Turkey', 'Egypt', 'Pakistan', 'Indonesia', 'Bangladesh', 'Nigeria', 'Jordan', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Morocco', 'Tunisia', 'Singapore', 'Canada', 'Germany'],
      bots: ['DarCloud#8658', 'QuranChain#8518', 'FungiMesh', 'MeshTalk', 'AI Fleet', 'HWC', 'DarLaw', 'DarPay', 'Dar Al-Nas Bank', 'DarHealth', 'DarMedia', 'DarRealty', 'DarCommerce', 'DarTrade', 'DarEdu', 'DarEnergy', 'DarSecurity', 'DarTransport', 'DarTelecom', 'Omar AI', 'DarDefi', 'DarHR']
    };
    
    switch (commandName) {
      case 'omar-status': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('👑 AMĀN Control Plane™ — System Status')
          .setDescription(\`\\\`\\\`\\\`\\nFOUNDER: \${EMPIRE.founder}\\nSTATUS: SOVEREIGN ACTIVE\\nCOMPANIES: \${EMPIRE.companies} across \${EMPIRE.tiers} tiers\\nAI AGENTS: \${EMPIRE.aiAgents} + \${EMPIRE.assistants} GPT-4o\\nBLOCKCHAINS: \${EMPIRE.blockchains} live networks\\nMESH NODES: \${EMPIRE.meshNodes.toLocaleString()}\\nREGIONS: \${EMPIRE.regions.length} international offices\\n\\\`\\\`\\\`\`)
          .setFooter({ text: 'AMĀN Control Plane™ — Sovereign Vision Layer' }).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-empire': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('🏛️ DarCloud Empire — Full Overview')
          .addFields(
            ...Object.entries(EMPIRE.tierBreakdown).map(([tier, count]) => ({ name: tier, value: count + ' companies', inline: true }))
          ).setFooter({ text: \`Total: \${EMPIRE.companies} companies across \${EMPIRE.tiers} tiers\` });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-ai-core': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('🤖 Omar AI™ & QuranChain AI™')
          .addFields(
            { name: 'Omar AI™', value: 'Primary sovereign AI validator\\nRole: Executive intelligence & orchestration\\nStatus: ACTIVE', inline: true },
            { name: 'QuranChain AI™', value: 'Blockchain consensus validator\\nRole: Policy engine & Shariah logic\\nStatus: ACTIVE', inline: true },
            { name: 'Total Fleet', value: \`\${EMPIRE.aiAgents} AI agents + \${EMPIRE.assistants} GPT-4o assistants\`, inline: false },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-revenue': {
        const split = EMPIRE.revenueSplit;
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('💰 Revenue Distribution (IMMUTABLE)')
          .addFields(
            { name: '👑 Founder Royalty', value: split.founder, inline: true },
            { name: '🤖 AI Validators', value: split.aiValidators, inline: true },
            { name: '🖥️ Hardware/Hosts', value: split.hardware, inline: true },
            { name: '🌐 Ecosystem Fund', value: split.ecosystem, inline: true },
            { name: '🕌 Zakat', value: split.zakat, inline: true },
          ).setFooter({ text: 'Revenue split is immutable — hardcoded into all smart contracts' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-governance': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('⚖️ Governance Layer')
          .addFields(
            { name: 'Policy Engine', value: 'QuranChain AI™ — automated Shariah compliance' },
            { name: 'Identity System', value: 'DarIdentity™ — Decentralized KYC/DID' },
            { name: 'Legal Framework', value: '11 DarLaw AI agents — 50+ jurisdictions' },
            { name: 'Shariah Board', value: 'DarShariah™ Compliance Board — certified scholars' },
            { name: 'Audit', value: 'Real-time on-chain audit trail — immutable' },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-regions': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('🌍 International Operations — ' + EMPIRE.regions.length + ' Offices')
          .setDescription(EMPIRE.regions.map((r, i) => \`\${i+1}. \${r}\`).join('\\n'));
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-founder': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('👑 Founder Console™ — Executive Dashboard')
          .setDescription(\`**Founder:** \${EMPIRE.founder}\`)
          .addFields(
            { name: '🏢 Companies', value: EMPIRE.companies.toString(), inline: true },
            { name: '🤖 AI Agents', value: EMPIRE.aiAgents.toString(), inline: true },
            { name: '⛓️ Blockchains', value: EMPIRE.blockchains.toString(), inline: true },
            { name: '🌐 Mesh Nodes', value: EMPIRE.meshNodes.toLocaleString(), inline: true },
            { name: '🌍 Regions', value: EMPIRE.regions.length.toString(), inline: true },
            { name: '🤖 Discord Bots', value: EMPIRE.bots.length.toString(), inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-bots': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('🤖 All Active Discord Bots')
          .setDescription(EMPIRE.bots.map((b, i) => \`\${i+1}. **\${b}**\`).join('\\n'))
          .setFooter({ text: EMPIRE.bots.length + ' bots across the DarCloud Empire' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'omar-help': {
        const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle('👑 Omar AI Commands')
          .setDescription(['/omar-status', '/omar-empire', '/omar-ai-core', '/omar-revenue', '/omar-governance', '/omar-regions', '/omar-founder', '/omar-bots'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 13. DARDEFI ─────────────────────────────────────────────
  {
    dir: 'dardefi-bot',
    name: 'DarDeFi',
    pkg: 'dardefi-bot',
    prefix: 'defi',
    description: 'DarDeFi™ — Halal DeFi, NFTs, Staking & DEX',
    avatar: { icon: 'DF', colors: ['#1a0a2e', '#2d0a4e', '#4a0a6e'], accent: '#c084fc' },
    commands: [
      { name: 'defi-dashboard', desc: 'DarDeFi™ protocol overview — TVL, yield, pools' },
      { name: 'defi-swap', desc: 'DarSwap™ — halal DEX & token exchange' },
      { name: 'defi-staking', desc: 'DarStaking™ — halal yield protocol' },
      { name: 'defi-nft', desc: 'DarNFT™ — Islamic digital assets marketplace' },
      { name: 'defi-bridge', desc: 'DarBridge™ — cross-chain bridge (47 networks)' },
      { name: 'defi-wallet', desc: 'DarWallet™ — multi-chain non-custodial wallet' },
      { name: 'defi-dao', desc: 'DarDAO™ — Shura governance & proposals' },
      { name: 'defi-launchpad', desc: 'DarLaunchpad™ — halal token launches' },
      { name: 'defi-help', desc: 'DarDeFi bot commands' },
    ],
    handler: `
    const DEFI = {
      tvl: '$420M', protocols: 8, users: 180000,
      swap: { pairs: 2400, volume24h: '$18.4M', liquidity: '$120M', fee: '0.3%', screening: 'Automated halal token screening', chains: 12 },
      staking: { staked: '$89M', apy: '4.2% - 18.7%', validators: 14, lockPeriods: ['Flexible', '30 days', '90 days', '365 days'], rewards: 'QRN + governance tokens' },
      nft: { collections: 340, items: 89000, volume: '$4.2M', categories: ['Islamic Art', 'Calligraphy', 'Quran Verses', 'Historical', 'Charitable'], royalties: 'Creator + Zakat' },
      bridge: { chains: 47, volume: '$240M bridged', speed: '< 5 minutes', fee: '0.1%', security: 'Multi-sig + MPC' },
      wallet: { users: 890000, chains: 47, features: ['Multi-sig', 'Hardware wallet', 'DeFi browser', 'NFT gallery', 'Staking'], security: 'Non-custodial, Kyber-1024' },
      dao: { proposals: 120, voters: 24000, treasury: '$18M', model: 'Shura (Islamic consultation)', quorum: '10% of staked QRN' },
      launchpad: { projects: 34, raised: '$42M', screening: 'Shariah Advisory Board', tiers: ['Seed', 'Private', 'Public'], vestingSchedule: true }
    };
    
    switch (commandName) {
      case 'defi-dashboard': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🔮 DarDeFi™ Protocol Dashboard')
          .addFields(
            { name: '💰 TVL', value: DEFI.tvl, inline: true },
            { name: '📊 Protocols', value: DEFI.protocols.toString(), inline: true },
            { name: '👥 Users', value: DEFI.users.toLocaleString(), inline: true },
            { name: '💱 DEX Volume (24h)', value: DEFI.swap.volume24h, inline: true },
            { name: '🥩 Total Staked', value: DEFI.staking.staked, inline: true },
            { name: '🌉 Bridged', value: DEFI.bridge.volume, inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-swap': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('💱 DarSwap™ — Halal DEX')
          .addFields(
            { name: 'Pairs', value: DEFI.swap.pairs.toLocaleString(), inline: true },
            { name: '24h Volume', value: DEFI.swap.volume24h, inline: true },
            { name: 'Liquidity', value: DEFI.swap.liquidity, inline: true },
            { name: 'Fee', value: DEFI.swap.fee, inline: true },
            { name: 'Chains', value: DEFI.swap.chains.toString(), inline: true },
            { name: 'Screening', value: DEFI.swap.screening },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-staking': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🥩 DarStaking™ — Halal Yield')
          .addFields(
            { name: 'Total Staked', value: DEFI.staking.staked, inline: true },
            { name: 'APY Range', value: DEFI.staking.apy, inline: true },
            { name: 'Validators', value: DEFI.staking.validators.toString(), inline: true },
            { name: 'Lock Periods', value: DEFI.staking.lockPeriods.join(', ') },
            { name: 'Rewards', value: DEFI.staking.rewards },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-nft': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🎨 DarNFT™ — Islamic Digital Assets')
          .addFields(
            { name: 'Collections', value: DEFI.nft.collections.toString(), inline: true },
            { name: 'Items', value: DEFI.nft.items.toLocaleString(), inline: true },
            { name: 'Volume', value: DEFI.nft.volume, inline: true },
            { name: 'Categories', value: DEFI.nft.categories.join(', ') },
            { name: 'Royalties', value: DEFI.nft.royalties },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-bridge': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🌉 DarBridge™ — Cross-Chain')
          .addFields(
            { name: 'Supported Chains', value: DEFI.bridge.chains.toString(), inline: true },
            { name: 'Total Bridged', value: DEFI.bridge.volume, inline: true },
            { name: 'Speed', value: DEFI.bridge.speed, inline: true },
            { name: 'Fee', value: DEFI.bridge.fee, inline: true },
            { name: 'Security', value: DEFI.bridge.security, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-wallet': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('👛 DarWallet™ — Multi-Chain Wallet')
          .addFields(
            { name: 'Users', value: DEFI.wallet.users.toLocaleString(), inline: true },
            { name: 'Chains', value: DEFI.wallet.chains.toString(), inline: true },
            { name: 'Security', value: DEFI.wallet.security, inline: true },
            { name: 'Features', value: DEFI.wallet.features.join('\\n') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-dao': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🏛️ DarDAO™ — Shura Governance')
          .addFields(
            { name: 'Proposals', value: DEFI.dao.proposals.toString(), inline: true },
            { name: 'Voters', value: DEFI.dao.voters.toLocaleString(), inline: true },
            { name: 'Treasury', value: DEFI.dao.treasury, inline: true },
            { name: 'Model', value: DEFI.dao.model },
            { name: 'Quorum', value: DEFI.dao.quorum },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-launchpad': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🚀 DarLaunchpad™ — Token Launches')
          .addFields(
            { name: 'Projects Launched', value: DEFI.launchpad.projects.toString(), inline: true },
            { name: 'Total Raised', value: DEFI.launchpad.raised, inline: true },
            { name: 'Tiers', value: DEFI.launchpad.tiers.join(', '), inline: true },
            { name: 'Screening', value: DEFI.launchpad.screening },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'defi-help': {
        const embed = new EmbedBuilder().setColor(0xc084fc).setTitle('🔮 DarDeFi Commands')
          .setDescription(['/defi-dashboard', '/defi-swap', '/defi-staking', '/defi-nft', '/defi-bridge', '/defi-wallet', '/defi-dao', '/defi-launchpad'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },

  // ── 14. DARHR ───────────────────────────────────────────────
  {
    dir: 'darhr-bot',
    name: 'DarHR',
    pkg: 'darhr-bot',
    prefix: 'hr',
    description: 'DarHR™ — Muslim Workforce, Consulting & Marketing',
    avatar: { icon: 'HR', colors: ['#0a1a1a', '#1a2a2a', '#2a4a4a'], accent: '#2dd4bf' },
    commands: [
      { name: 'hr-dashboard', desc: 'DarHR workforce & consulting overview' },
      { name: 'hr-jobs', desc: 'DarHR™ — job listings & careers across the empire' },
      { name: 'hr-consulting', desc: 'DarConsulting™ — Islamic business advisory' },
      { name: 'hr-marketing', desc: 'DarMarketing™ — digital growth agency' },
      { name: 'hr-workforce', desc: 'Workforce analytics & employee stats' },
      { name: 'hr-benefits', desc: 'Employee benefits & halal perks' },
      { name: 'hr-help', desc: 'DarHR bot commands' },
    ],
    handler: `
    const HR = {
      workforce: { employees: 14200, departments: 45, countries: 21, remote: '62%', satisfaction: '4.6/5' },
      jobs: { openPositions: 340, categories: ['Engineering', 'AI/ML', 'Finance', 'Healthcare', 'Legal', 'Marketing', 'Operations', 'Customer Service'], apply: 'careers.darcloud.host' },
      consulting: { clients: 450, projects: 1200, specialties: ['Islamic Finance', 'Shariah Compliance', 'Halal Certification', 'Market Entry', 'Digital Transformation'], revenue: '$24M annual' },
      marketing: { clients: 890, campaigns: 4200, channels: ['SEO', 'Social Media', 'Content', 'Email', 'PPC', 'Influencer'], revenue: '$18M annual' },
      benefits: { items: ['Halal health insurance (DarTakaful)', 'Zero-riba home finance (DarMortgage)', 'Free Islamic education (DarEdu)', 'Prayer room & wudu facilities', 'Hajj/Umrah assistance', 'Zakat auto-deduction', 'Flexible Jummah schedule', 'Profit-sharing (Mudarabah)'] }
    };
    
    switch (commandName) {
      case 'hr-dashboard': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('👥 DarHR™ Workforce Dashboard')
          .addFields(
            { name: '👥 Employees', value: HR.workforce.employees.toLocaleString(), inline: true },
            { name: '🏢 Departments', value: HR.workforce.departments.toString(), inline: true },
            { name: '🌍 Countries', value: HR.workforce.countries.toString(), inline: true },
            { name: '🏠 Remote', value: HR.workforce.remote, inline: true },
            { name: '⭐ Satisfaction', value: HR.workforce.satisfaction, inline: true },
            { name: '📋 Open Positions', value: HR.jobs.openPositions.toString(), inline: true },
          ).setTimestamp();
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-jobs': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('💼 Open Positions — ' + HR.jobs.openPositions)
          .addFields(
            { name: 'Categories', value: HR.jobs.categories.join(', ') },
            { name: 'Apply', value: HR.jobs.apply },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-consulting': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('🏛️ DarConsulting™ — Advisory')
          .addFields(
            { name: 'Clients', value: HR.consulting.clients.toString(), inline: true },
            { name: 'Projects', value: HR.consulting.projects.toLocaleString(), inline: true },
            { name: 'Revenue', value: HR.consulting.revenue, inline: true },
            { name: 'Specialties', value: HR.consulting.specialties.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-marketing': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('📣 DarMarketing™ — Digital Growth')
          .addFields(
            { name: 'Clients', value: HR.marketing.clients.toString(), inline: true },
            { name: 'Campaigns', value: HR.marketing.campaigns.toLocaleString(), inline: true },
            { name: 'Revenue', value: HR.marketing.revenue, inline: true },
            { name: 'Channels', value: HR.marketing.channels.join(', ') },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-workforce': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('📊 Workforce Analytics')
          .addFields(
            { name: 'Total Employees', value: HR.workforce.employees.toLocaleString(), inline: true },
            { name: 'Departments', value: HR.workforce.departments.toString(), inline: true },
            { name: 'Countries', value: HR.workforce.countries.toString(), inline: true },
            { name: 'Remote %', value: HR.workforce.remote, inline: true },
            { name: 'Satisfaction', value: HR.workforce.satisfaction, inline: true },
          );
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-benefits': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('🎁 Employee Benefits & Halal Perks')
          .setDescription(HR.benefits.items.map(b => \`• \${b}\`).join('\\n'))
          .setFooter({ text: 'All benefits are Shariah-compliant' });
        await interaction.reply({ embeds: [embed] }); break;
      }
      case 'hr-help': {
        const embed = new EmbedBuilder().setColor(0x2dd4bf).setTitle('👥 DarHR Commands')
          .setDescription(['/hr-dashboard', '/hr-jobs', '/hr-consulting', '/hr-marketing', '/hr-workforce', '/hr-benefits'].map(c => \`\\\`\${c}\\\`\`).join(' • '));
        await interaction.reply({ embeds: [embed] }); break;
      }
    }`,
  },
];

// ══════════════════════════════════════════════════════════════
// BOT FILE GENERATORS
// ══════════════════════════════════════════════════════════════

function generateBotJs(bot) {
  const commandNames = bot.commands.map(c => `'${c.name}'`).join(', ');
  return `// ══════════════════════════════════════════════════════════════
// ${bot.name} Discord Bot
// ${bot.description}
// Part of DarCloud Empire — Omar Mohammad Abunadi
// ══════════════════════════════════════════════════════════════
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const API = process.env.API_BASE || 'http://localhost:8787';

client.once('ready', () => {
  console.log(\`✓ ${bot.name} bot online as \${client.user.tag}\`);
  console.log(\`  Guild: \${process.env.DISCORD_GUILD_ID}\`);
  console.log(\`  Commands: ${bot.commands.length}\`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const commandName = interaction.commandName;
  
  try {
    ${bot.handler}
  } catch (error) {
    console.error(\`[${bot.name}] Error in /\${commandName}:\`, error.message);
    const reply = { content: '❌ Command failed: ' + error.message, ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
    else await interaction.reply(reply);
  }
});

// Auto-reconnect
client.on('error', err => { console.error('[${bot.name}] Client error:', err.message); });
client.on('shardError', err => { console.error('[${bot.name}] Shard error:', err.message); });
process.on('unhandledRejection', err => { console.error('[${bot.name}] Unhandled:', err.message); });

client.login(process.env.DISCORD_TOKEN);
`;
}

function generateRegisterJs(bot) {
  const commandsArray = bot.commands.map(c => 
    `    { name: '${c.name}', description: '${c.desc.replace(/'/g, "\\'")}' }`
  ).join(',\n');

  return `// Register ${bot.name} slash commands
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
${commandsArray}
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  console.log(\`Registering ${bot.commands.length} ${bot.name} commands...\`);
  try {
    const built = commands.map(c => new SlashCommandBuilder().setName(c.name).setDescription(c.description));
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
      { body: built.map(b => b.toJSON()) }
    );
    console.log(\`✓ Registered ${bot.commands.length} commands to guild \${process.env.DISCORD_GUILD_ID}\`);
  } catch (err) {
    console.log('Failed:', err);
    process.exit(1);
  }
})();
`;
}

function generatePackageJson(bot) {
  return JSON.stringify({
    name: bot.pkg,
    version: '1.0.0',
    description: bot.description,
    main: 'bot.js',
    scripts: { start: 'node bot.js', register: 'node register-commands.js' },
    dependencies: { 'discord.js': '^14.18.0', dotenv: '^16.4.7' },
  }, null, 2) + '\n';
}

function generateEnv(bot) {
  return `DISCORD_TOKEN=PASTE_TOKEN_HERE
DISCORD_CLIENT_ID=PASTE_CLIENT_ID_HERE
DISCORD_GUILD_ID=${GUILD_ID}
API_BASE=${API_BASE}
`;
}

// ══════════════════════════════════════════════════════════════
// MAIN — Generate all bots
// ══════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════');
console.log('  DarCloud Empire — Bot Factory');
console.log(`  Generating ${SECTOR_BOTS.length} service bots`);
console.log('══════════════════════════════════════════════════════════\n');

let totalCommands = 0;

for (const bot of SECTOR_BOTS) {
  const dir = path.join(WORKSPACE, bot.dir);
  
  // Create directory
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  // Write files
  fs.writeFileSync(path.join(dir, 'bot.js'), generateBotJs(bot));
  fs.writeFileSync(path.join(dir, 'register-commands.js'), generateRegisterJs(bot));
  fs.writeFileSync(path.join(dir, 'package.json'), generatePackageJson(bot));
  
  // Only write .env if it doesn't exist (don't overwrite configured ones)
  const envPath = path.join(dir, '.env');
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, generateEnv(bot));
  }
  
  totalCommands += bot.commands.length;
  console.log(`  ✓ ${bot.name.padEnd(20)} → ${bot.dir}/ (${bot.commands.length} commands)`);
}

console.log('\n══════════════════════════════════════════════════════════');
console.log(`  Generated ${SECTOR_BOTS.length} bots with ${totalCommands} total commands`);
console.log('══════════════════════════════════════════════════════════');
console.log('\nExisting bots (already running):');
console.log('  • DarCloud#8658 (discord-bot/) — 25 commands');
console.log('  • QuranChain#8518 (quranchain-bot/) — 18 commands');
console.log('  • FungiMesh (fungimesh-bot/) — 10 commands');
console.log('  • MeshTalk (meshtalk-bot/) — 8 commands');
console.log('  • AI Fleet (aifleet-bot/) — 11 commands');
console.log('  • HWC (hwc-bot/) — 9 commands');
console.log('  • DarLaw (darlaw-bot/) — 9 commands');
console.log('  • DarPay (darpay-bot/) — 8 commands');
console.log(`\nGRAND TOTAL: ${22} bots, ${totalCommands + 25 + 18 + 10 + 8 + 11 + 9 + 9 + 8} slash commands`);
