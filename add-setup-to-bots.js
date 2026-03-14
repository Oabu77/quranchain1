#!/usr/bin/env node
// Bulk-add /setup, /my-services, /upgrade commands to all sector bots
const fs = require("fs");
const path = require("path");

const BOTS = [
  "aifleet-bot", "darcommerce-bot", "dardefi-bot", "daredu-bot", "darenergy-bot",
  "darhealth-bot", "darhr-bot", "darlaw-bot", "darmedia-bot", "darnas-bot",
  "darpay-bot", "darrealty-bot", "darsecurity-bot", "dartelecom-bot", "dartrade-bot",
  "dartransport-bot", "fungimesh-bot", "hwc-bot", "meshtalk-bot", "omarai-bot", "quranchain-bot"
];

const SETUP_HANDLER_CODE = `

    } else if (cmd === "setup") {
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
      }`;

const SETUP_COMMANDS = `
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("⚡ Auto-install & configure ALL DarCloud services"),

  new SlashCommandBuilder()
    .setName("my-services")
    .setDescription("📋 View all your provisioned DarCloud services"),

  new SlashCommandBuilder()
    .setName("upgrade")
    .setDescription("⬆️ Upgrade your DarCloud plan")
    .addStringOption((opt) =>
      opt.setName("plan").setDescription("Plan to upgrade to").setRequired(true)
        .addChoices(
          { name: "Professional ($49/mo)", value: "pro" },
          { name: "Enterprise ($499/mo)", value: "enterprise" },
          { name: "FungiMesh Node ($19.99/mo)", value: "fungimesh_node" },
          { name: "HWC Premium ($99/mo)", value: "hwc_premium" },
        )),`;

let botResults = { success: [], failed: [] };

for (const bot of BOTS) {
  const botDir = path.join("/workspaces/quranchain1", bot);
  const botFile = path.join(botDir, "bot.js");
  const regFile = path.join(botDir, "register-commands.js");

  try {
    // ─── bot.js: Add setup handlers ─────────────────────────
    let botCode = fs.readFileSync(botFile, "utf8");

    // Skip if already has setup
    if (botCode.includes('"setup"') || botCode.includes("'setup'")) {
      console.log(`[SKIP] ${bot}/bot.js — already has setup`);
    } else {
      // Find the last } catch in the interaction handler
      // Pattern: find "} catch (err)" or "} catch (error)" that's inside interactionCreate
      const catchPatterns = [
        /(\n  \} catch \(err\) \{)/,
        /(\n  \} catch \(error\) \{)/,
        /(\n    \} catch \(err\) \{)/,
        /(\n    \} catch \(error\) \{)/,
      ];

      let inserted = false;
      for (const pattern of catchPatterns) {
        const matches = [...botCode.matchAll(new RegExp(pattern.source, "g"))];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          const insertPos = lastMatch.index;
          botCode = botCode.slice(0, insertPos) + SETUP_HANDLER_CODE + botCode.slice(insertPos);
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        // Fallback: find the closing of the interactionCreate try block
        // Look for pattern like: "}\n  } catch" or just insert before last });
        const altPattern = /(\n  \} catch)/;
        const altMatch = botCode.match(altPattern);
        if (altMatch) {
          const idx = botCode.lastIndexOf(altMatch[0]);
          botCode = botCode.slice(0, idx) + SETUP_HANDLER_CODE + botCode.slice(idx);
          inserted = true;
        }
      }

      if (inserted) {
        fs.writeFileSync(botFile, botCode);
        console.log(`[OK] ${bot}/bot.js — setup handlers added`);
      } else {
        console.log(`[WARN] ${bot}/bot.js — could not find insertion point`);
        botResults.failed.push(bot);
        continue;
      }
    }

    // ─── register-commands.js: Add setup commands ───────────
    let regCode = fs.readFileSync(regFile, "utf8");

    if (regCode.includes('"setup"') || regCode.includes("'setup'")) {
      console.log(`[SKIP] ${bot}/register-commands.js — already has setup`);
    } else {
      // Find the .map((cmd) => cmd.toJSON()) or similar line
      const mapPattern = /\]\.map\(\(?cmd\)?\s*=>\s*cmd\.toJSON\(\)\)/;
      const mapMatch = regCode.match(mapPattern);

      if (mapMatch) {
        const idx = regCode.indexOf(mapMatch[0]);
        regCode = regCode.slice(0, idx) + SETUP_COMMANDS + "\n" + regCode.slice(idx);
        fs.writeFileSync(regFile, regCode);
        console.log(`[OK] ${bot}/register-commands.js — commands added`);
      } else {
        // Alternative: find "].map(" 
        const altIdx = regCode.lastIndexOf("].map(");
        if (altIdx >= 0) {
          regCode = regCode.slice(0, altIdx) + SETUP_COMMANDS + "\n" + regCode.slice(altIdx);
          fs.writeFileSync(regFile, regCode);
          console.log(`[OK] ${bot}/register-commands.js — commands added (alt)`);
        } else {
          console.log(`[WARN] ${bot}/register-commands.js — could not find .map()`);
          botResults.failed.push(bot + "-reg");
          continue;
        }
      }
    }

    botResults.success.push(bot);
  } catch (err) {
    console.log(`[ERROR] ${bot}: ${err.message}`);
    botResults.failed.push(bot);
  }
}

console.log(`\n=== RESULTS ===`);
console.log(`Success: ${botResults.success.length}`);
console.log(`Failed: ${botResults.failed.length}`);
if (botResults.failed.length) console.log(`Failed bots: ${botResults.failed.join(", ")}`);
