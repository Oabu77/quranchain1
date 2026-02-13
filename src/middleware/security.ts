// ==========================================================
// QuranChain™ / Dar Al-Nas™ Proprietary System
// Founder: Omar Mohammad Abunadi
// All Rights Reserved. Trademark Protected.
// ==========================================================

/**
 * Security middleware for QuranChain™
 * Implements defense-in-depth security controls
 */

import type { Context, Next } from "hono";
import { logWarn } from "../utils/logger";

/**
 * Security headers middleware
 * Adds comprehensive security headers to all responses
 */
export async function securityHeaders(c: Context, next: Next): Promise<void> {
await next();

// Content Security Policy
c.header("Content-Security-Policy", "default-src 'self'; script-src 'self'; object-src 'none';");

// Prevent clickjacking
c.header("X-Frame-Options", "DENY");

// Prevent MIME sniffing
c.header("X-Content-Type-Options", "nosniff");

// XSS protection
c.header("X-XSS-Protection", "1; mode=block");

// Referrer policy
c.header("Referrer-Policy", "strict-origin-when-cross-origin");

// Force HTTPS
c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

// Permissions policy
c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
}

/**
 * CORS middleware
 * Configurable CORS policy for API access
 * 
 * SECURITY NOTE: Default is restrictive (null origin = reject all)
 * Override with specific origins for legitimate cross-origin use cases
 */
export function cors(options?: {
origin?: string | string[];
methods?: string[];
allowedHeaders?: string[];
credentials?: boolean;
}) {
// SECURITY: Restrictive default - reject cross-origin requests unless explicitly configured
const defaultOrigin = "null"; // Reject all origins by default
const defaultMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
const defaultHeaders = ["Content-Type", "Authorization"];

return async (c: Context, next: Next): Promise<Response | void> => {
const origin = options?.origin || defaultOrigin;
const methods = options?.methods || defaultMethods;
const headers = options?.allowedHeaders || defaultHeaders;
const credentials = options?.credentials || false;

// Handle preflight requests
if (c.req.method === "OPTIONS") {
c.header("Access-Control-Allow-Origin", Array.isArray(origin) ? origin[0] : origin);
c.header("Access-Control-Allow-Methods", methods.join(", "));
c.header("Access-Control-Allow-Headers", headers.join(", "));
if (credentials) {
c.header("Access-Control-Allow-Credentials", "true");
}
c.header("Access-Control-Max-Age", "86400");
return c.body(null, 204);
}

// Add CORS headers to response
c.header("Access-Control-Allow-Origin", Array.isArray(origin) ? origin[0] : origin);
if (credentials) {
c.header("Access-Control-Allow-Credentials", "true");
}

await next();
};
}

/**
 * Request size limiting middleware
 * Prevents excessive payload attacks
 */
export function requestSizeLimit(maxSizeBytes: number = 1024 * 1024) {
return async (c: Context, next: Next): Promise<Response | void> => {
const contentLength = c.req.header("content-length");

if (contentLength && parseInt(contentLength) > maxSizeBytes) {
logWarn("Request payload too large", {
contentLength: parseInt(contentLength),
maxSize: maxSizeBytes,
path: c.req.path,
});
return c.json(
{
success: false,
errors: [{ code: 413, message: "Request payload too large" }],
},
413,
);
}

await next();
};
}

/**
 * Request ID middleware
 * Adds unique request ID for tracing
 */
export async function requestId(c: Context, next: Next): Promise<void> {
const id = crypto.randomUUID();
c.set("requestId", id);
c.header("X-Request-ID", id);
await next();
}
