// ==========================================================
// QuranChain™ / Dar Al-Nas™ Proprietary System
// Founder: Omar Mohammad Abunadi
// All Rights Reserved. Trademark Protected.
// ==========================================================

/**
 * Sharia-compliant finance utilities for Dar Al-Nas™
 * Ensures all financial operations comply with Islamic principles
 */

/**
 * Check if a transaction involves riba (interest)
 * Returns true if transaction is compliant (no riba)
 */
export function isRibaFree(
principal: number,
returned: number,
profitSharing?: boolean,
): boolean {
// If profit sharing model (Musharakah/Mudarabah), it's compliant
if (profitSharing) {
return true;
}

// Otherwise, returned amount must equal principal (no interest)
return returned === principal;
}

/**
 * Check if transaction has excessive uncertainty (gharar)
 * Returns true if transaction is compliant (no gharar)
 */
export function isGhararFree(options: {
termsKnown: boolean;
priceKnown: boolean;
deliveryKnown: boolean;
}): boolean {
// All terms must be clearly known to avoid gharar
return options.termsKnown && options.priceKnown && options.deliveryKnown;
}

/**
 * Calculate Zakat (2.5% on eligible wealth held for one year)
 */
export function calculateZakat(eligibleWealth: number): number {
const ZAKAT_RATE = 0.025; // 2.5%
return Math.floor(eligibleWealth * ZAKAT_RATE * 100) / 100; // Round to 2 decimals
}

/**
 * Validate if a business activity is halal
 * Checks against prohibited industries
 */
export function isHalalBusiness(industry: string): boolean {
const prohibitedIndustries = [
"alcohol",
"gambling",
"pork",
"conventional-banking",
"adult-entertainment",
"weapons",
"tobacco",
];

return !prohibitedIndustries.includes(industry.toLowerCase());
}

/**
 * Profit-sharing calculation (Musharakah model)
 * Returns profit distribution based on capital contribution ratio
 */
export function calculateProfitSharing(options: {
totalProfit: number;
party1Capital: number;
party2Capital: number;
}): { party1Share: number; party2Share: number } {
const totalCapital = options.party1Capital + options.party2Capital;
const party1Ratio = options.party1Capital / totalCapital;
const party2Ratio = options.party2Capital / totalCapital;

return {
party1Share: Math.floor(options.totalProfit * party1Ratio * 100) / 100,
party2Share: Math.floor(options.totalProfit * party2Ratio * 100) / 100,
};
}

/**
 * Validate Sharia-compliant transaction
 * Comprehensive check for Islamic finance compliance
 */
export function validateShariaCompliance(transaction: {
type: "sale" | "partnership" | "profit-sharing" | "lease";
principal: number;
returned?: number;
termsKnown: boolean;
priceKnown: boolean;
deliveryKnown: boolean;
industry?: string;
}): { compliant: boolean; issues: string[] } {
const issues: string[] = [];

// Check for riba if applicable
if (transaction.returned !== undefined && transaction.type !== "profit-sharing") {
if (!isRibaFree(transaction.principal, transaction.returned)) {
issues.push("Transaction involves riba (interest)");
}
}

// Check for gharar
if (!isGhararFree({
termsKnown: transaction.termsKnown,
priceKnown: transaction.priceKnown,
deliveryKnown: transaction.deliveryKnown,
})) {
issues.push("Transaction has gharar (excessive uncertainty)");
}

// Check industry if provided
if (transaction.industry && !isHalalBusiness(transaction.industry)) {
issues.push(`Industry "${transaction.industry}" is not halal`);
}

return {
compliant: issues.length === 0,
issues,
};
}
