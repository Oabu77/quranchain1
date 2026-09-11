import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { ADMIN_ONLY_COMMANDS, secureCommandJson } = require("../discord-bot/admin-command-policy");

const ADMINISTRATOR = 8n;
const MEMBER_COMMANDS = ["health", "masjid", "prayer", "qibla", "join", "membership", "invite"];

describe("Discord admin-command registration policy", () => {
  it("marks every infrastructure-sensitive command administrator-only", () => {
    for (const name of ADMIN_ONLY_COMMANDS) {
      const secured = secureCommandJson({ name, description: "synthetic" }, ADMINISTRATOR);
      expect(secured.default_member_permissions, `${name} must register as administrator-only`).toBe("8");
    }
  });

  it("keeps intended member-facing commands unrestricted", () => {
    for (const name of MEMBER_COMMANDS) {
      const publicCommand = secureCommandJson({ name, description: "synthetic" }, ADMINISTRATOR);
      expect(
        Object.prototype.hasOwnProperty.call(publicCommand, "default_member_permissions"),
        `${name} should remain member-facing`,
      ).toBe(false);
    }
  });

  it("preserves null command definitions", () => {
    expect(secureCommandJson(null, ADMINISTRATOR)).toBeNull();
  });
});
