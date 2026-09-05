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

function secureCommandJson(json, administratorPermission) {
  if (!json || typeof json.name !== "string") return json;
  if (!ADMIN_ONLY_COMMANDS.has(json.name)) return json;
  return {
    ...json,
    default_member_permissions: administratorPermission.toString(),
  };
}

module.exports = {
  ADMIN_ONLY_COMMANDS,
  secureCommandJson,
};
