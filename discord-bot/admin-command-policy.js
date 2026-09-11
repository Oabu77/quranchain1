// Central policy for Discord commands that can affect infrastructure,
// operational data, application state, or founder administration.
const ADMIN_ONLY_COMMANDS = new Set([
  "stats",
  "task-create",
  "backups",
  "vms",
  "fleet-health",
  "legal-filings",
  "service",
  "docker",
  "system",
  "deploy",
  "logs",
  "agent",
  "git",
  "bootstrap",
  "revenue",
  "founder",
  "founder-dashboard",
  "founder-deploy",
  "founder-exec",
]);

// Commands that can directly mutate host/application state require both
// Discord Administrator permission and an explicit server-side operator ID.
const OPERATOR_ONLY_COMMANDS = new Set([
  "task-create",
  "service",
  "docker",
  "deploy",
  "agent",
  "git",
  "bootstrap",
  "founder-deploy",
  "founder-exec",
]);

function secureCommandJson(json, administratorPermission) {
  if (!json || typeof json.name !== "string") return json;
  if (!ADMIN_ONLY_COMMANDS.has(json.name)) return json;
  return {
    ...json,
    default_member_permissions: administratorPermission.toString(),
  };
}

function parseOperatorUserIds(raw) {
  const ids = new Set();
  for (const candidate of String(raw || "").split(",")) {
    const value = candidate.trim();
    if (/^\d{15,25}$/.test(value)) ids.add(value);
  }
  return ids;
}

function authorizeSensitiveCommand({ commandName, userId, isAdministrator, operatorIdsRaw }) {
  if (!ADMIN_ONLY_COMMANDS.has(commandName)) {
    return { allowed: true, level: "member", code: "PUBLIC_COMMAND" };
  }

  if (!isAdministrator) {
    return { allowed: false, level: "admin", code: "ADMIN_REQUIRED" };
  }

  if (!OPERATOR_ONLY_COMMANDS.has(commandName)) {
    return { allowed: true, level: "admin", code: "ADMIN_AUTHORIZED" };
  }

  const operatorIds = parseOperatorUserIds(operatorIdsRaw);
  if (operatorIds.size === 0) {
    return { allowed: false, level: "operator", code: "OPERATOR_POLICY_UNCONFIGURED" };
  }

  if (!operatorIds.has(String(userId || ""))) {
    return { allowed: false, level: "operator", code: "OPERATOR_REQUIRED" };
  }

  return { allowed: true, level: "operator", code: "OPERATOR_AUTHORIZED" };
}

module.exports = {
  ADMIN_ONLY_COMMANDS,
  OPERATOR_ONLY_COMMANDS,
  secureCommandJson,
  parseOperatorUserIds,
  authorizeSensitiveCommand,
};
