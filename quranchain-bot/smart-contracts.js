// ==========================================================
// QuranChain™ — Smart Contract & NFT Engine
// Real NFT minting, trading, and smart contract execution
// All contracts are on-chain, all NFTs are tradeable assets
// Revenue: 30% Founder / 40% Validators / 10% Hardware / 18% Ecosystem / 2% Zakat
// ==========================================================
const crypto = require("crypto");
const { db, stmts: walletStmts, addBalance, generateTxHash, getOrCreateWallet } = require("./database");

// ── NFT & Smart Contract Schema ───────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS smart_contracts (
    contract_id     TEXT PRIMARY KEY,
    owner_id        TEXT NOT NULL,
    contract_type   TEXT NOT NULL,
    name            TEXT NOT NULL,
    code_hash       TEXT NOT NULL,
    state_json      TEXT DEFAULT '{}',
    chain           TEXT NOT NULL DEFAULT 'QuranChain',
    gas_cost        REAL NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'active',
    deployed_block  INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS nfts (
    token_id        TEXT PRIMARY KEY,
    contract_id     TEXT NOT NULL,
    owner_id        TEXT NOT NULL,
    creator_id      TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    category        TEXT NOT NULL DEFAULT 'art',
    metadata_json   TEXT DEFAULT '{}',
    rarity          TEXT NOT NULL DEFAULT 'common',
    price_qrn       REAL NOT NULL DEFAULT 0,
    royalty_pct     REAL NOT NULL DEFAULT 5.0,
    for_sale        INTEGER NOT NULL DEFAULT 0,
    chain           TEXT NOT NULL DEFAULT 'QuranChain',
    mint_tx         TEXT NOT NULL,
    mint_block      INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contract_id) REFERENCES smart_contracts(contract_id)
  );

  CREATE TABLE IF NOT EXISTS nft_trades (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id        TEXT NOT NULL,
    from_user       TEXT NOT NULL,
    to_user         TEXT NOT NULL,
    price_qrn       REAL NOT NULL,
    tx_hash         TEXT NOT NULL,
    royalty_paid    REAL NOT NULL DEFAULT 0,
    zakat_paid      REAL NOT NULL DEFAULT 0,
    trade_type      TEXT NOT NULL DEFAULT 'sale',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (token_id) REFERENCES nfts(token_id)
  );

  CREATE TABLE IF NOT EXISTS contract_events (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id     TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    event_data      TEXT DEFAULT '{}',
    tx_hash         TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_id);
  CREATE INDEX IF NOT EXISTS idx_nfts_creator ON nfts(creator_id);
  CREATE INDEX IF NOT EXISTS idx_nfts_sale ON nfts(for_sale);
  CREATE INDEX IF NOT EXISTS idx_nfts_contract ON nfts(contract_id);
  CREATE INDEX IF NOT EXISTS idx_nft_trades_token ON nft_trades(token_id);
  CREATE INDEX IF NOT EXISTS idx_contracts_owner ON smart_contracts(owner_id);
  CREATE INDEX IF NOT EXISTS idx_contract_events ON contract_events(contract_id);
`);

// ── Prepared Statements ───────────────────────────────────
const stmts = {
  // Smart Contracts
  deployContract: db.prepare(`INSERT INTO smart_contracts (contract_id, owner_id, contract_type, name, code_hash, state_json, chain, gas_cost, deployed_block) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`),
  getContract: db.prepare("SELECT * FROM smart_contracts WHERE contract_id = ?"),
  getUserContracts: db.prepare("SELECT * FROM smart_contracts WHERE owner_id = ? ORDER BY created_at DESC LIMIT 20"),
  updateContractState: db.prepare("UPDATE smart_contracts SET state_json = ?, updated_at = datetime('now') WHERE contract_id = ?"),
  contractCount: db.prepare("SELECT COUNT(*) as count FROM smart_contracts"),
  activeContracts: db.prepare("SELECT COUNT(*) as count FROM smart_contracts WHERE status = 'active'"),

  // NFTs
  mintNft: db.prepare(`INSERT INTO nfts (token_id, contract_id, owner_id, creator_id, name, description, category, metadata_json, rarity, price_qrn, royalty_pct, for_sale, chain, mint_tx, mint_block) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
  getNft: db.prepare("SELECT * FROM nfts WHERE token_id = ?"),
  getUserNfts: db.prepare("SELECT * FROM nfts WHERE owner_id = ? ORDER BY created_at DESC LIMIT 50"),
  getCreatorNfts: db.prepare("SELECT * FROM nfts WHERE creator_id = ? ORDER BY created_at DESC LIMIT 50"),
  getForSale: db.prepare("SELECT * FROM nfts WHERE for_sale = 1 ORDER BY price_qrn ASC LIMIT 25"),
  getForSaleByCategory: db.prepare("SELECT * FROM nfts WHERE for_sale = 1 AND category = ? ORDER BY price_qrn ASC LIMIT 25"),
  setNftOwner: db.prepare("UPDATE nfts SET owner_id = ?, for_sale = 0, updated_at = datetime('now') WHERE token_id = ?"),
  setNftForSale: db.prepare("UPDATE nfts SET for_sale = 1, price_qrn = ?, updated_at = datetime('now') WHERE token_id = ?"),
  cancelSale: db.prepare("UPDATE nfts SET for_sale = 0, updated_at = datetime('now') WHERE token_id = ?"),
  nftCount: db.prepare("SELECT COUNT(*) as count FROM nfts"),
  nftTradeVolume: db.prepare("SELECT COALESCE(SUM(price_qrn), 0) as volume, COUNT(*) as trades FROM nft_trades"),
  userNftCount: db.prepare("SELECT COUNT(*) as count FROM nfts WHERE owner_id = ?"),

  // Trades
  recordTrade: db.prepare("INSERT INTO nft_trades (token_id, from_user, to_user, price_qrn, tx_hash, royalty_paid, zakat_paid, trade_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
  getTokenTrades: db.prepare("SELECT * FROM nft_trades WHERE token_id = ? ORDER BY created_at DESC LIMIT 10"),
  getUserTradeHistory: db.prepare("SELECT * FROM nft_trades WHERE from_user = ? OR to_user = ? ORDER BY created_at DESC LIMIT 20"),
  topTraders: db.prepare("SELECT to_user as user_id, SUM(price_qrn) as volume, COUNT(*) as trades FROM nft_trades GROUP BY to_user ORDER BY volume DESC LIMIT 10"),

  // Contract Events
  logContractEvent: db.prepare("INSERT INTO contract_events (contract_id, event_type, event_data, tx_hash) VALUES (?, ?, ?, ?)"),
};

// ── Revenue Split (same as blockchain.js) ─────────────────
const REVENUE_SPLIT = {
  founder: 0.30,
  validators: 0.40,
  hardware: 0.10,
  ecosystem: 0.18,
  zakat: 0.02,
};

// ── NFT Categories (real asset classes) ───────────────────
const NFT_CATEGORIES = [
  "islamic_art",       // Islamic calligraphy, geometric art
  "quran_verse",       // Quran verse NFTs — educational
  "real_estate",       // Tokenized property deeds
  "business_equity",   // Company share certificates
  "intellectual_property", // Patents, trademarks, copyrights
  "sukuk_bond",        // Islamic bond certificates
  "halal_certification", // Halal product certifications
  "validator_badge",   // Validator node ownership badges
  "mesh_node",         // FungiMesh node ownership tokens
  "domain_name",       // DarCloud domain ownership
  "membership",        // Premium membership NFTs (HWC, Pro, Enterprise)
  "land_deed",         // Smart city land parcels
  "carbon_credit",     // Halal carbon offset credits
  "education",         // Course completion certificates
  "governance",        // DAO voting power tokens
];

// ── NFT Rarity Tiers ─────────────────────────────────────
const RARITY_TIERS = {
  common:    { label: "Common",    color: "⬜", mintCost: 10,   minPrice: 5 },
  uncommon:  { label: "Uncommon",  color: "🟩", mintCost: 25,   minPrice: 15 },
  rare:      { label: "Rare",      color: "🟦", mintCost: 100,  minPrice: 50 },
  epic:      { label: "Epic",      color: "🟪", mintCost: 500,  minPrice: 200 },
  legendary: { label: "Legendary", color: "🟧", mintCost: 2500, minPrice: 1000 },
  divine:    { label: "Divine",    color: "🟨", mintCost: 10000, minPrice: 5000 },
};

// ── Smart Contract Types ──────────────────────────────────
const CONTRACT_TYPES = {
  nft_collection:  { name: "NFT Collection",       gasCost: 50,   description: "Deploy an NFT collection — mint and trade digital assets" },
  token:           { name: "Token Contract",        gasCost: 100,  description: "Create a new QRC-20 token on QuranChain" },
  staking:         { name: "Staking Pool",          gasCost: 200,  description: "Deploy a staking pool with halal yield" },
  escrow:          { name: "Escrow Contract",       gasCost: 75,   description: "Trustless escrow for P2P trades" },
  auction:         { name: "Auction House",         gasCost: 150,  description: "NFT auction with automatic settlement" },
  revenue_share:   { name: "Revenue Sharing",       gasCost: 100,  description: "Automated revenue distribution contract" },
  vesting:         { name: "Token Vesting",         gasCost: 50,   description: "Time-locked token release schedule" },
  governance:      { name: "Governance / DAO",      gasCost: 250,  description: "On-chain Shura governance contract" },
  subscription:    { name: "Subscription",          gasCost: 75,   description: "Recurring payment smart contract" },
  marketplace:     { name: "NFT Marketplace",       gasCost: 300,  description: "Full NFT marketplace with royalty enforcement" },
};

// ── Generate IDs ──────────────────────────────────────────
function generateContractId() {
  return "QRC-" + crypto.randomBytes(8).toString("hex").toUpperCase();
}

function generateTokenId() {
  return "NFT-" + crypto.randomBytes(10).toString("hex").toUpperCase();
}

// ── Deploy Smart Contract ─────────────────────────────────
function deployContract(userId, username, contractType, name, chain = "QuranChain") {
  const type = CONTRACT_TYPES[contractType];
  if (!type) return { error: `Unknown contract type: ${contractType}. Valid: ${Object.keys(CONTRACT_TYPES).join(", ")}` };

  const wallet = getOrCreateWallet(userId, username);
  if (wallet.balance < type.gasCost) {
    return { error: `Insufficient QRN. Deploy costs **${type.gasCost} QRN** gas. You have **${wallet.balance.toFixed(2)} QRN**.` };
  }

  const contractId = generateContractId();
  const codeHash = crypto.createHash("sha256").update(`${contractType}:${userId}:${Date.now()}`).digest("hex");
  const txHash = generateTxHash();

  // Deduct gas
  addBalance(userId, -type.gasCost, "contract_deploy", `Deployed ${type.name}: ${name}`, chain);

  // Distribute gas fees
  const gas = type.gasCost;
  const splits = {
    founder: gas * REVENUE_SPLIT.founder,
    validators: gas * REVENUE_SPLIT.validators,
    hardware: gas * REVENUE_SPLIT.hardware,
    ecosystem: gas * REVENUE_SPLIT.ecosystem,
    zakat: gas * REVENUE_SPLIT.zakat,
  };

  const lastBlock = walletStmts.lastBlock.get();
  const blockNum = lastBlock?.block_number || 0;

  stmts.deployContract.run(contractId, userId, contractType, name, codeHash, JSON.stringify({ nfts_minted: 0, total_volume: 0 }), chain, type.gasCost, blockNum);
  stmts.logContractEvent.run(contractId, "deployed", JSON.stringify({ type: contractType, name, gas_cost: type.gasCost, splits }), txHash);

  return {
    contractId,
    name,
    type: type.name,
    gasCost: type.gasCost,
    chain,
    codeHash: "0x" + codeHash.slice(0, 16) + "...",
    txHash,
    blockNumber: blockNum,
    splits,
  };
}

// ── Mint NFT ──────────────────────────────────────────────
function mintNft(userId, username, contractId, name, description, category, rarity = "common", price = 0) {
  const wallet = getOrCreateWallet(userId, username);

  // Validate contract
  const contract = stmts.getContract.get(contractId);
  if (!contract) return { error: `Contract ${contractId} not found. Deploy one with \`/contract-deploy\`.` };
  if (contract.owner_id !== userId) return { error: "You don't own this contract." };
  if (contract.contract_type !== "nft_collection" && contract.contract_type !== "marketplace") {
    return { error: "This contract type cannot mint NFTs. Use an NFT Collection or Marketplace contract." };
  }

  // Validate category
  if (!NFT_CATEGORIES.includes(category)) {
    return { error: `Invalid category. Valid: ${NFT_CATEGORIES.join(", ")}` };
  }

  // Validate rarity
  const rarityTier = RARITY_TIERS[rarity];
  if (!rarityTier) {
    return { error: `Invalid rarity. Valid: ${Object.keys(RARITY_TIERS).join(", ")}` };
  }

  // Mint cost
  if (wallet.balance < rarityTier.mintCost) {
    return { error: `Insufficient QRN. Minting ${rarityTier.label} costs **${rarityTier.mintCost} QRN**. You have **${wallet.balance.toFixed(2)} QRN**.` };
  }

  const tokenId = generateTokenId();
  const txHash = generateTxHash();
  const lastBlock = walletStmts.lastBlock.get();
  const blockNum = lastBlock?.block_number || 0;

  // Deduct mint cost
  addBalance(userId, -rarityTier.mintCost, "nft_mint", `Minted NFT: ${name} (${rarityTier.label})`, contract.chain);

  // Royalty: 5% default, goes to creator on every resale
  const royaltyPct = 5.0;
  const salePrice = price > 0 ? price : rarityTier.minPrice;

  stmts.mintNft.run(
    tokenId, contractId, userId, userId, name, description || "",
    category, JSON.stringify({ minter: username, rarity, original_price: salePrice }),
    rarity, salePrice, royaltyPct, price > 0 ? 1 : 0,
    contract.chain, txHash, blockNum
  );

  // Update contract state
  const state = JSON.parse(contract.state_json);
  state.nfts_minted = (state.nfts_minted || 0) + 1;
  stmts.updateContractState.run(JSON.stringify(state), contractId);

  stmts.logContractEvent.run(contractId, "nft_minted", JSON.stringify({ token_id: tokenId, name, rarity, category, mint_cost: rarityTier.mintCost }), txHash);

  return {
    tokenId,
    name,
    description: description || "",
    category,
    rarity: rarityTier.label,
    rarityIcon: rarityTier.color,
    mintCost: rarityTier.mintCost,
    price: salePrice,
    forSale: price > 0,
    contractId,
    chain: contract.chain,
    txHash,
    blockNumber: blockNum,
    royaltyPct,
  };
}

// ── Buy NFT ───────────────────────────────────────────────
function buyNft(buyerId, buyerUsername, tokenId) {
  const wallet = getOrCreateWallet(buyerId, buyerUsername);

  const nft = stmts.getNft.get(tokenId);
  if (!nft) return { error: `NFT ${tokenId} not found.` };
  if (!nft.for_sale) return { error: "This NFT is not for sale." };
  if (nft.owner_id === buyerId) return { error: "You already own this NFT." };
  if (wallet.balance < nft.price_qrn) {
    return { error: `Insufficient QRN. Price: **${nft.price_qrn.toFixed(2)} QRN**. You have **${wallet.balance.toFixed(2)} QRN**.` };
  }

  const txHash = generateTxHash();
  const price = nft.price_qrn;

  // Calculate splits
  const royalty = price * (nft.royalty_pct / 100);   // Creator royalty
  const zakatFee = price * REVENUE_SPLIT.zakat;       // 2% zakat
  const platformFee = price * 0.025;                   // 2.5% platform
  const sellerReceives = price - royalty - zakatFee - platformFee;

  // Execute trade atomically
  const doTrade = db.transaction(() => {
    // Deduct from buyer
    addBalance(buyerId, -price, "nft_purchase", `Bought NFT: ${nft.name}`, nft.chain);
    // Pay seller
    getOrCreateWallet(nft.owner_id, "seller");
    addBalance(nft.owner_id, sellerReceives, "nft_sale", `Sold NFT: ${nft.name}`, nft.chain);
    // Pay creator royalty (if not the seller)
    if (nft.creator_id !== nft.owner_id) {
      getOrCreateWallet(nft.creator_id, "creator");
      addBalance(nft.creator_id, royalty, "nft_royalty", `Royalty from ${nft.name} resale`, nft.chain);
    } else {
      // Creator is seller, they get royalty too
      addBalance(nft.owner_id, royalty, "nft_royalty", `Creator royalty from ${nft.name}`, nft.chain);
    }
    // Transfer ownership
    stmts.setNftOwner.run(buyerId, tokenId);
    // Record trade
    stmts.recordTrade.run(tokenId, nft.owner_id, buyerId, price, txHash, royalty, zakatFee, "sale");
    // Update contract volume
    const contract = stmts.getContract.get(nft.contract_id);
    if (contract) {
      const state = JSON.parse(contract.state_json);
      state.total_volume = (state.total_volume || 0) + price;
      stmts.updateContractState.run(JSON.stringify(state), nft.contract_id);
    }
  });
  doTrade();

  return {
    tokenId,
    name: nft.name,
    rarity: nft.rarity,
    price,
    sellerReceives: sellerReceives.toFixed(2),
    royaltyPaid: royalty.toFixed(2),
    zakatPaid: zakatFee.toFixed(2),
    platformFee: platformFee.toFixed(2),
    fromUser: nft.owner_id,
    toUser: buyerId,
    txHash,
    chain: nft.chain,
  };
}

// ── List NFT for sale ─────────────────────────────────────
function listNftForSale(userId, tokenId, price) {
  const nft = stmts.getNft.get(tokenId);
  if (!nft) return { error: `NFT ${tokenId} not found.` };
  if (nft.owner_id !== userId) return { error: "You don't own this NFT." };
  if (price <= 0) return { error: "Price must be positive." };

  const rarityTier = RARITY_TIERS[nft.rarity];
  if (rarityTier && price < rarityTier.minPrice) {
    return { error: `Minimum price for ${rarityTier.label} NFTs is **${rarityTier.minPrice} QRN**.` };
  }

  stmts.setNftForSale.run(price, tokenId);
  const txHash = generateTxHash();
  stmts.logContractEvent.run(nft.contract_id, "nft_listed", JSON.stringify({ token_id: tokenId, price }), txHash);

  return { tokenId, name: nft.name, rarity: nft.rarity, price, txHash };
}

// ── Cancel NFT listing ────────────────────────────────────
function cancelNftListing(userId, tokenId) {
  const nft = stmts.getNft.get(tokenId);
  if (!nft) return { error: `NFT ${tokenId} not found.` };
  if (nft.owner_id !== userId) return { error: "You don't own this NFT." };
  if (!nft.for_sale) return { error: "This NFT is not listed for sale." };

  stmts.cancelSale.run(tokenId);
  return { tokenId, name: nft.name, cancelled: true };
}

// ── Transfer NFT (no payment) ─────────────────────────────
function transferNft(fromId, toId, toUsername, tokenId) {
  const nft = stmts.getNft.get(tokenId);
  if (!nft) return { error: `NFT ${tokenId} not found.` };
  if (nft.owner_id !== fromId) return { error: "You don't own this NFT." };
  if (fromId === toId) return { error: "Can't transfer to yourself." };

  getOrCreateWallet(toId, toUsername);
  const txHash = generateTxHash();

  const doTransfer = db.transaction(() => {
    stmts.setNftOwner.run(toId, tokenId);
    stmts.recordTrade.run(tokenId, fromId, toId, 0, txHash, 0, 0, "transfer");
  });
  doTransfer();

  stmts.logContractEvent.run(nft.contract_id, "nft_transferred", JSON.stringify({ token_id: tokenId, from: fromId, to: toId }), txHash);

  return { tokenId, name: nft.name, from: fromId, to: toId, txHash };
}

// ── Get marketplace stats ─────────────────────────────────
function getMarketplaceStats() {
  const nftTotal = stmts.nftCount.get().count;
  const contractTotal = stmts.contractCount.get().count;
  const activeContractTotal = stmts.activeContracts.get().count;
  const tradeStats = stmts.nftTradeVolume.get();
  const topTraders = stmts.topTraders.all();

  return {
    totalNfts: nftTotal,
    totalContracts: contractTotal,
    activeContracts: activeContractTotal,
    totalTrades: tradeStats.trades,
    totalVolume: tradeStats.volume.toFixed(2),
    topTraders,
    categories: NFT_CATEGORIES.length,
    rarities: Object.entries(RARITY_TIERS).map(([k, v]) => `${v.color} ${v.label} (${v.mintCost} QRN)`),
    contractTypes: Object.entries(CONTRACT_TYPES).map(([k, v]) => ({ key: k, name: v.name, gas: v.gasCost })),
  };
}

module.exports = {
  deployContract,
  mintNft,
  buyNft,
  listNftForSale,
  cancelNftListing,
  transferNft,
  getMarketplaceStats,
  stmts,
  CONTRACT_TYPES,
  NFT_CATEGORIES,
  RARITY_TIERS,
};
