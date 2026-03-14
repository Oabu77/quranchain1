#!/usr/bin/env node
// Fix register-commands.js for bots using the simple {name,description} array pattern
const fs = require("fs");
const path = require("path");

const FAILED_BOTS = [
  "darcommerce-bot", "dardefi-bot", "daredu-bot", "darenergy-bot",
  "darhealth-bot", "darhr-bot", "darmedia-bot", "darnas-bot",
  "darrealty-bot", "darsecurity-bot", "dartelecom-bot", "dartrade-bot",
  "dartransport-bot", "omarai-bot"
];

const SETUP_ENTRIES = `
    { name: 'setup', description: '⚡ Auto-install & configure ALL DarCloud services' },
    { name: 'my-services', description: '📋 View all your provisioned DarCloud services' },
`;

// For the upgrade command, we need to replace the simple build pattern with one that handles options
const UPGRADE_BUILDER = `
    // Upgrade command with plan option
    const upgradeCmd = new SlashCommandBuilder()
      .setName("upgrade")
      .setDescription("⬆️ Upgrade your DarCloud plan")
      .addStringOption((opt) =>
        opt.setName("plan").setDescription("Plan to upgrade to").setRequired(true)
          .addChoices(
            { name: "Professional ($49/mo)", value: "pro" },
            { name: "Enterprise ($499/mo)", value: "enterprise" },
            { name: "FungiMesh Node ($19.99/mo)", value: "fungimesh_node" },
            { name: "HWC Premium ($99/mo)", value: "hwc_premium" },
          ));`;

let results = { ok: 0, fail: 0 };

for (const bot of FAILED_BOTS) {
  const regFile = path.join("/workspaces/quranchain1", bot, "register-commands.js");
  try {
    let code = fs.readFileSync(regFile, "utf8");

    if (code.includes("'setup'") || code.includes('"setup"')) {
      console.log(`[SKIP] ${bot} — already has setup`);
      results.ok++;
      continue;
    }

    // Add setup and my-services to the simple commands array
    // Find the closing bracket of the commands array: "];" or "]\n"
    const arrayEnd = code.indexOf("];\n\nconst rest");
    if (arrayEnd < 0) {
      // try alternative
      const altEnd = code.indexOf("];\n\nconst ");
      if (altEnd < 0) {
        console.log(`[FAIL] ${bot} — can't find commands array end`);
        results.fail++;
        continue;
      }
      code = code.slice(0, altEnd) + SETUP_ENTRIES + code.slice(altEnd);
    } else {
      code = code.slice(0, arrayEnd) + SETUP_ENTRIES + code.slice(arrayEnd);
    }

    // Now replace the simple build+register pattern to also include the upgrade command
    // Pattern: "const built = commands.map(c => new SlashCommandBuilder()..."
    // Replace with: build simple commands + add upgrade builder
    const buildPattern = /const built = commands\.map\(c => new SlashCommandBuilder\(\)\.setName\(c\.name\)\.setDescription\(c\.description\)\);/;
    if (buildPattern.test(code)) {
      code = code.replace(buildPattern, 
        `const built = commands.map(c => new SlashCommandBuilder().setName(c.name).setDescription(c.description));${UPGRADE_BUILDER}\n    built.push(upgradeCmd);`
      );
    } else {
      // Try alternate pattern
      const altBuild = /const built = commands\.map\(c\s*=>\s*new SlashCommandBuilder\(\)\.setName\(c\.name\)\s*\.setDescription\(c\.description\)\s*\);/;
      if (altBuild.test(code)) {
        code = code.replace(altBuild,
          `const built = commands.map(c => new SlashCommandBuilder().setName(c.name).setDescription(c.description));${UPGRADE_BUILDER}\n    built.push(upgradeCmd);`
        );
      } else {
        console.log(`[WARN] ${bot} — could not patch build pattern, adding upgrade to simple array`);
        // Just add upgrade as simple command (without options - fallback)
        code = code.replace(SETUP_ENTRIES, SETUP_ENTRIES + `    { name: 'upgrade', description: '⬆️ Upgrade your DarCloud plan' },\n`);
      }
    }

    // Update the count in console.log
    const countMatch = code.match(/Registering (\d+)/);
    if (countMatch) {
      const oldCount = parseInt(countMatch[1]);
      code = code.replace(`Registering ${oldCount}`, `Registering ${oldCount + 3}`);
      code = code.replace(`Registered ${oldCount}`, `Registered ${oldCount + 3}`);
    }

    fs.writeFileSync(regFile, code);
    console.log(`[OK] ${bot} — patched`);
    results.ok++;
  } catch (err) {
    console.log(`[ERROR] ${bot}: ${err.message}`);
    results.fail++;
  }
}

console.log(`\nDone: ${results.ok} OK, ${results.fail} failed`);
