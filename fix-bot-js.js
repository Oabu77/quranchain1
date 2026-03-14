#!/usr/bin/env node
// Fix all 20 sector bot.js files — remove bad insertion and re-insert correctly
const fs = require("fs");
const path = require("path");

const BOTS = [
  "aifleet-bot", "darcommerce-bot", "dardefi-bot", "daredu-bot", "darenergy-bot",
  "darhealth-bot", "darhr-bot", "darlaw-bot", "darmedia-bot", "darnas-bot",
  "darpay-bot", "darrealty-bot", "darsecurity-bot", "dartelecom-bot", "dartrade-bot",
  "dartransport-bot", "fungimesh-bot", "hwc-bot", "meshtalk-bot", "omarai-bot"
];

// The exact bad block to remove (everything from the setup handler to end of upgrade)
const BAD_BLOCK_START = `    } else if (cmd === "setup") {`;
const BAD_BLOCK_END_MARKER = `await i.editReply({ content: "❌ " + err.message });
      }`;

// The correct block to insert — properly structured with closing braces
const GOOD_BLOCK = `    } else if (cmd === "setup") {
      await i.deferReply();
      const autoSetup = require("../shared/auto-setup");
      const onboardingDb = require("../shared/onboarding-db");
      onboardingDb.getOrCreateMember(i.user.id, i.user.tag || i.user.username);
      const results = autoSetup.setupAllServices(i.user.id, i.user.tag || i.user.username);
      const { embed, row } = autoSetup.createSetupCompleteEmbed(i.user.tag || i.user.username, results);
      await i.editReply({ embeds: [embed], components: row ? [row] : [] });

    } else if (cmd === "my-services") {
      await i.deferReply();
      const autoSetup = require("../shared/auto-setup");
      const embed = autoSetup.createServiceStatusEmbed(i.user.id, i.user.tag || i.user.username);
      await i.editReply({ embeds: [embed] });

    } else if (cmd === "upgrade") {
      await i.deferReply();
      const stripeIntegration = require("../shared/stripe-integration");
      const plan = i.options.getString("plan");
      try {
        const session = await stripeIntegration.createCheckoutSession(i.user.id, plan);
        const { EmbedBuilder } = require("discord.js");
        const embed = new EmbedBuilder().setColor(0x00D4AA).setTitle("⬆️ Upgrade Plan").setDescription("Click below to upgrade:\\n\\n[🔗 Secure Checkout](" + session.url + ")");
        await i.editReply({ embeds: [embed] });
      } catch (err) {
        await i.editReply({ content: "❌ " + err.message });
      }
    }`;

let results = { ok: 0, fail: 0 };

for (const bot of BOTS) {
  const botFile = path.join("/workspaces/quranchain1", bot, "bot.js");
  try {
    let code = fs.readFileSync(botFile, "utf8");

    // Step 1: Remove the bad insertion
    const startIdx = code.indexOf(BAD_BLOCK_START);
    if (startIdx === -1) {
      console.log(`[SKIP] ${bot} — no bad block found`);
      results.ok++;
      continue;
    }

    const endIdx = code.indexOf(BAD_BLOCK_END_MARKER, startIdx);
    if (endIdx === -1) {
      console.log(`[FAIL] ${bot} — found start but not end of bad block`);
      results.fail++;
      continue;
    }

    const endOfBad = endIdx + BAD_BLOCK_END_MARKER.length;
    code = code.slice(0, startIdx) + code.slice(endOfBad);

    // Step 2: Find the right insertion point
    // Look for the pattern: closing of last if-else block followed by catch
    // Pattern 1: "    }\n  } catch" (2-space outer indent)
    // Pattern 2: "    }\n    } catch" (4-space outer indent)

    // Find the catch block that belongs to the interactionCreate handler
    const catchPatterns = [
      { regex: /    \}\n  \} catch \((err|error)\) \{/, indent: "  " },
      { regex: /    \}\n    \} catch \((err|error)\) \{/, indent: "    " },
    ];

    let inserted = false;
    for (const { regex } of catchPatterns) {
      const match = code.match(regex);
      if (match) {
        const idx = code.indexOf(match[0]);
        // Insert right after the closing "}" of the last if block (position: idx + 5 for "    }")
        // We replace "    }\n  } catch" with "    }\n[GOOD_BLOCK]\n  } catch"
        const closingBrace = match[0].slice(0, 5); // "    }"
        const restOfCatch = match[0].slice(5); // "\n  } catch (err) {"
        code = code.slice(0, idx) + GOOD_BLOCK + restOfCatch + code.slice(idx + match[0].length);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      console.log(`[FAIL] ${bot} — could not find catch insertion point`);
      results.fail++;
      continue;
    }

    fs.writeFileSync(botFile, code);

    // Verify syntax
    try {
      require("child_process").execSync(`node -c "${botFile}"`, { stdio: "pipe" });
      console.log(`[OK] ${bot}`);
      results.ok++;
    } catch (e) {
      console.log(`[SYNTAX_ERR] ${bot} — ${e.stderr.toString().split("\n")[0]}`);
      results.fail++;
    }
  } catch (err) {
    console.log(`[ERROR] ${bot}: ${err.message}`);
    results.fail++;
  }
}

console.log(`\nResults: ${results.ok} OK, ${results.fail} failed`);
