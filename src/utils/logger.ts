// ==========================================================
// QuranChain™ / Dar Al-Nas™ Proprietary System
// Founder: Omar Mohammad Abunadi
// All Rights Reserved. Trademark Protected.
// ==========================================================

/**
 * Structured logging utilities for QuranChain™
 * All logs are JSON-formatted for production observability
 */

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRITICAL";

export interface LogContext {
requestId?: string;
userId?: string;
action?: string;
[key: string]: unknown;
}

/**
 * Core logging function with structured JSON output
 */
export function log(
level: LogLevel,
message: string,
context?: LogContext,
): void {
const logEntry = {
timestamp: new Date().toISOString(),
level,
message,
...(context && { context }),
};

console.log(JSON.stringify(logEntry));
}

/**
 * Debug-level logging (development only)
 */
export function logDebug(message: string, context?: LogContext): void {
log("DEBUG", message, context);
}

/**
 * Info-level logging
 */
export function logInfo(message: string, context?: LogContext): void {
log("INFO", message, context);
}

/**
 * Warning-level logging
 */
export function logWarn(message: string, context?: LogContext): void {
log("WARN", message, context);
}

/**
 * Error-level logging
 */
export function logError(message: string, error?: Error, context?: LogContext): void {
const errorContext = {
...context,
...(error && {
error: error.message,
stack: error.stack,
}),
};
log("ERROR", message, errorContext);
}

/**
 * Critical-level logging (system failures)
 */
export function logCritical(message: string, error?: Error, context?: LogContext): void {
const errorContext = {
...context,
...(error && {
error: error.message,
stack: error.stack,
}),
};
log("CRITICAL", message, errorContext);
}

/**
 * Audit logging for security and governance
 * Creates immutable audit trail entries
 */
export function logAudit(
action: string,
userId: string,
context?: Record<string, unknown>,
): void {
log("INFO", `AUDIT: ${action}`, {
audit: true,
userId,
action,
...context,
});
}

/**
 * Performance logging for monitoring
 */
export function logPerformance(
operation: string,
durationMs: number,
context?: LogContext,
): void {
log("INFO", `PERF: ${operation}`, {
performance: true,
operation,
durationMs,
...context,
});
}
