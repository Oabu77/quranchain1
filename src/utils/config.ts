// ==========================================================
// QuranChain™ / Dar Al-Nas™ Proprietary System
// Founder: Omar Mohammad Abunadi
// All Rights Reserved. Trademark Protected.
// ==========================================================

/**
 * Environment configuration utilities
 * Zero Trust principle: Never hardcode secrets
 */

export interface QuranChainConfig {
environment: "development" | "staging" | "production";
version: string;
founderAddress?: string;
maxRequestSize: number;
enableAuditLogging: boolean;
}

/**
 * Get configuration from environment
 * Falls back to safe defaults
 */
export function getConfig(env: Env): QuranChainConfig {
return {
environment: (env.ENVIRONMENT as QuranChainConfig["environment"]) || "production",
version: env.VERSION || "1.0.0",
founderAddress: env.FOUNDER_ADDRESS,
maxRequestSize: parseInt(env.MAX_REQUEST_SIZE || "2097152"), // 2MB default
enableAuditLogging: env.ENABLE_AUDIT_LOGGING !== "false",
};
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(env: Env): boolean {
const required = ["DB"];

for (const key of required) {
if (!(key in env)) {
console.error(`Missing required environment variable: ${key}`);
return false;
}
}

return true;
}
