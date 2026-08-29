/**
 * Production process startup is intentionally empty during pre-release
 * remediation. Discord bots, telecom prototypes, payment integrations, and
 * autonomous process controls are quarantined and must not be started by PM2.
 */
module.exports = { apps: [] };
