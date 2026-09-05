const assert = require("node:assert/strict");
const { ADMIN_ONLY_COMMANDS, secureCommandJson } = require("../discord-bot/admin-command-policy");

const ADMINISTRATOR = 8n;

for (const name of ADMIN_ONLY_COMMANDS) {
  const secured = secureCommandJson({ name, description: "synthetic" }, ADMINISTRATOR);
  assert.equal(
    secured.default_member_permissions,
    "8",
    `${name} must register as administrator-only`,
  );
}

for (const name of ["health", "masjid", "prayer", "qibla", "join", "membership", "invite"]) {
  const publicCommand = secureCommandJson({ name, description: "synthetic" }, ADMINISTRATOR);
  assert.equal(
    Object.prototype.hasOwnProperty.call(publicCommand, "default_member_permissions"),
    false,
    `${name} should remain member-facing`,
  );
}

assert.equal(secureCommandJson(null, ADMINISTRATOR), null);
console.log(`Discord admin-command policy PASS (${ADMIN_ONLY_COMMANDS.size} restricted commands)`);
