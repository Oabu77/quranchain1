const assert = require("node:assert/strict");
const {
  ADMIN_ONLY_COMMANDS,
  OPERATOR_ONLY_COMMANDS,
  parseOperatorUserIds,
  authorizeSensitiveCommand,
} = require("../discord-bot/admin-command-policy");

const operator = "123456789012345678";
const otherAdmin = "223456789012345678";

assert.equal(ADMIN_ONLY_COMMANDS.has("stats"), true);
assert.equal(OPERATOR_ONLY_COMMANDS.has("service"), true);
assert.equal(OPERATOR_ONLY_COMMANDS.has("health"), false);

assert.deepEqual(
  authorizeSensitiveCommand({
    commandName: "health",
    userId: otherAdmin,
    isAdministrator: false,
    operatorIdsRaw: "",
  }),
  { allowed: true, level: "member", code: "PUBLIC_COMMAND" },
);

assert.equal(
  authorizeSensitiveCommand({
    commandName: "stats",
    userId: otherAdmin,
    isAdministrator: false,
    operatorIdsRaw: operator,
  }).code,
  "ADMIN_REQUIRED",
);

assert.equal(
  authorizeSensitiveCommand({
    commandName: "stats",
    userId: otherAdmin,
    isAdministrator: true,
    operatorIdsRaw: "",
  }).code,
  "ADMIN_AUTHORIZED",
);

assert.equal(
  authorizeSensitiveCommand({
    commandName: "service",
    userId: otherAdmin,
    isAdministrator: true,
    operatorIdsRaw: "",
  }).code,
  "OPERATOR_POLICY_UNCONFIGURED",
);

assert.equal(
  authorizeSensitiveCommand({
    commandName: "service",
    userId: otherAdmin,
    isAdministrator: true,
    operatorIdsRaw: operator,
  }).code,
  "OPERATOR_REQUIRED",
);

assert.equal(
  authorizeSensitiveCommand({
    commandName: "service",
    userId: operator,
    isAdministrator: true,
    operatorIdsRaw: `${otherAdmin}, ${operator}`,
  }).code,
  "OPERATOR_AUTHORIZED",
);

assert.equal(
  authorizeSensitiveCommand({
    commandName: "service",
    userId: operator,
    isAdministrator: false,
    operatorIdsRaw: operator,
  }).code,
  "ADMIN_REQUIRED",
);

const parsed = parseOperatorUserIds(`bad, 123, ${operator}, ${operator}, abc123456789012345`);
assert.deepEqual([...parsed], [operator]);

console.log("Discord runtime authorization policy: PASS");
