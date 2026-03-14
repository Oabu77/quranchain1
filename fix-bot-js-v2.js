#!/usr/bin/env node
// Comprehensive fix: Remove bad insertion, re-insert with correct pattern per bot
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const BOTS = [
  "darcommerce-bot", "dardefi-bot", "daredu-bot", "darenergy-bot",
  "darhealth-bot", "darhr-bot", "darmedia-bot", "darnas-bot",
  "darrealty-bot", "darsecurity-bot", "dartelecom-bot", "dartrade-bot",
  "dartransport-bot", "omarai-bot"
];

// The bad block to remove — from "} else if (cmd === "setup")" to end of upgrade catch
const BAD_START = '    } else if (cmd === "setup") {';

let results = { ok: 0, fail: 0 };

for (const bot of BOTS) {
  const f = path.join("/workspaces/quranchain1", bot, "bot.js");
  try {
    let code = fs.readFileSync(f, "utf8");

    // Step 1: Remove the entire bad insertion
    const startIdx = code.indexOf(BAD_START);
    if (startIdx === -1) {
      console.log(`[SKIP] ${bot} — no bad block`);
      results.ok++;
      continue;
    }

    // Find end: the closing "}" of the upgrade catch
    // Pattern: "      }\n    }\n" after the upgrade section
    let endIdx = code.indexOf('      }\n    }\n', startIdx + BAD_START.length);
    if (endIdx === -1) {
      // Try alternate: "      }\n    }" at end
      endIdx = code.indexOf('      }\n    }', startIdx + BAD_START.length);
    }
    if (endIdx === -1) {
      console.log(`[FAIL] ${bot} — can't find end of bad block`);
      results.fail++;
      continue;
    }
    const endOfBad = endIdx + '      }\n    }\n'.length;
    code = code.slice(0, startIdx) + code.slice(endOfBad);

    // Step 2: Detect pattern — switch/case or if/else
    const isSwitch = code.includes("switch (") || code.includes("switch(");
    
    // Step 3: Detect variable names
    // Find interaction variable name: "async (i)" or "async (interaction)" 
    const interactionMatch = code.match(/client\.on\(["']interactionCreate["'],\s*async\s*\((\w+)\)/);
    const iVar = interactionMatch ? interactionMatch[1] : "interaction";
    
    // Find command variable: "const cmd = " or "commandName"
    const cmdVarMatch = code.match(/const (\w+) = (?:\w+\.)commandName/);
    const cmdVar = cmdVarMatch ? cmdVarMatch[1] : (iVar + ".commandName");

    if (isSwitch) {
      // Insert case statements before the closing of switch
      // Find the last case block closing "}" followed by newline before "} catch"
      // Pattern: "      }\n    }\n  } catch" or similar
      
      // Find the switch's closing bracket + catch
      const switchEndPatterns = [
        /(\n    \})\n  \} catch/,
        /(\n      \})\n    \} catch/,
      ];
      
      let inserted = false;
      for (const pat of switchEndPatterns) {
        const m = code.match(pat);
        if (m) {
          const idx = code.indexOf(m[0]);
          const caseCode = `
      case 'setup': {
        await ${iVar}.deferReply();
        const autoSetup = require("../shared/auto-setup");
        const onboardingDb = require("../shared/onboarding-db");
        onboardingDb.getOrCreateMember(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);
        const results = autoSetup.setupAllServices(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);
        const { embed: sEmbed, row } = autoSetup.createSetupCompleteEmbed(${iVar}.user.tag || ${iVar}.user.username, results);
        await ${iVar}.editReply({ embeds: [sEmbed], components: row ? [row] : [] });
        break;
      }
      case 'my-services': {
        await ${iVar}.deferReply();
        const autoSetup2 = require("../shared/auto-setup");
        const msEmbed = autoSetup2.createServiceStatusEmbed(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);
        await ${iVar}.editReply({ embeds: [msEmbed] });
        break;
      }
      case 'upgrade': {
        await ${iVar}.deferReply();
        const stripe = require("../shared/stripe-integration");
        const plan = ${iVar}.options.getString("plan");
        try {
          const session = await stripe.createCheckoutSession(${iVar}.user.id, plan);
          const upEmbed = new EmbedBuilder().setColor(0x00D4AA).setTitle("⬆️ Upgrade Plan").setDescription("Click below:\\n\\n[🔗 Checkout](" + session.url + ")");
          await ${iVar}.editReply({ embeds: [upEmbed] });
        } catch (e) { await ${iVar}.editReply({ content: "❌ " + e.message }); }
        break;
      }`;
          code = code.slice(0, idx) + m[1] + caseCode + "\n" + m[0].slice(m[1].length) + code.slice(idx + m[0].length);
          inserted = true;
          break;
        }
      }
      
      if (!inserted) {
        console.log(`[FAIL] ${bot} — can't find switch end`);
        results.fail++;
        continue;
      }
    } else {
      // if/else pattern — find  "    }\n  } catch" or "    }\n    } catch"
      const ifEndPatterns = [
        /(\n    \})\n  \} catch/,
        /(\n    \})\n    \} catch/,
      ];
      
      let inserted = false;
      for (const pat of ifEndPatterns) {
        const m = code.match(pat);
        if (m) {
          const idx = code.indexOf(m[0]);
          const elseCode = ` else if (${cmdVar} === "setup") {
      await ${iVar}.deferReply();
      const autoSetup = require("../shared/auto-setup");
      const onboardingDb = require("../shared/onboarding-db");
      onboardingDb.getOrCreateMember(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);
      const results = autoSetup.setupAllServices(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);
      const { embed: sEmbed, row } = autoSetup.createSetupCompleteEmbed(${iVar}.user.tag || ${iVar}.user.username, results);
      await ${iVar}.editReply({ embeds: [sEmbed], components: row ? [row] : [] });

    } else if (${cmdVar} === "my-services") {
      await ${iVar}.deferReply();
      const autoSetup2 = require("../shared/auto-setup");
      const msEmbed = autoSetup2.createServiceStatusEmbed(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);
      await ${iVar}.editReply({ embeds: [msEmbed] });

    } else if (${cmdVar} === "upgrade") {
      await ${iVar}.deferReply();
      const stripe = require("../shared/stripe-integration");
      const plan = ${iVar}.options.getString("plan");
      try {
        const session = await stripe.createCheckoutSession(${iVar}.user.id, plan);
        const upEmbed = new EmbedBuilder().setColor(0x00D4AA).setTitle("⬆️ Upgrade Plan").setDescription("Click below:\\n\\n[🔗 Checkout](" + session.url + ")");
        await ${iVar}.editReply({ embeds: [upEmbed] });
      } catch (e) { await ${iVar}.editReply({ content: "❌ " + e.message }); }
    }`;
          // Replace the closing "}" + newline with the new code
          code = code.slice(0, idx) + "\n    }" + elseCode + "\n" + m[0].slice(m[1].length + 1) + code.slice(idx + m[0].length);
          inserted = true;
          break;
        }
      }
      
      if (!inserted) {
        console.log(`[FAIL] ${bot} — can't find if-else end`);
        results.fail++;
        continue;
      }
    }

    fs.writeFileSync(f, code);

    // Verify syntax
    try {
      execSync(`node -c "${f}"`, { stdio: "pipe" });
      console.log(`[OK] ${bot} (${isSwitch ? "switch" : "if/else"}, var: ${iVar})`);
      results.ok++;
    } catch (e) {
      const errLine = e.stderr.toString().split("\n").slice(0, 3).join(" | ");
      console.log(`[SYNTAX_ERR] ${bot}: ${errLine}`);
      results.fail++;
    }
  } catch (err) {
    console.log(`[ERROR] ${bot}: ${err.message}`);
    results.fail++;
  }
}

console.log(`\nDone: ${results.ok} OK, ${results.fail} failed`);
