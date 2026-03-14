#!/usr/bin/env node
// Final comprehensive fix for all 14 remaining bots
// Strategy: Remove the entire bad "} else if" block, then add proper case statements
const fs = require("fs");
const { execSync } = require("child_process");

const BOTS = [
  "darcommerce-bot", "dardefi-bot", "daredu-bot", "darenergy-bot",
  "darhealth-bot", "darhr-bot", "darmedia-bot", "darnas-bot",
  "darrealty-bot", "darsecurity-bot", "dartelecom-bot", "dartrade-bot",
  "dartransport-bot", "omarai-bot"
];

let ok = 0, fail = 0;

for (const bot of BOTS) {
  const f = `/workspaces/quranchain1/${bot}/bot.js`;
  let code = fs.readFileSync(f, "utf8");
  const lines = code.split("\n");

  // Find the start of bad insertion
  let startLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('else if (cmd === "setup")') || lines[i].includes("else if (cmd === 'setup')")) {
      startLine = i;
      break;
    }
  }
  if (startLine === -1) {
    console.log(`[SKIP] ${bot} — no bad block`);
    ok++;
    continue;
  }

  // Find end: look for the outer catch after upgrade
  let endLine = -1;
  let braceDepth = 0;
  let foundUpgradeCatch = false;
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('} catch (err)') || line.includes('} catch (error)')) {
      if (foundUpgradeCatch) {
        // This is the outer catch — stop before this line
        endLine = i;
        break;
      }
      // Check if this is the upgrade's inner catch
      if (i > startLine + 10) foundUpgradeCatch = true;
    }
  }

  if (endLine === -1) {
    // Fallback: find the line with "} catch" that's at lower indent than the setup block
    const setupIndent = lines[startLine].search(/\S/);
    for (let i = startLine + 5; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.search(/\S/);
      if ((line.trim().startsWith('} catch (err)') || line.trim().startsWith('} catch (error)')) && indent <= setupIndent) {
        endLine = i;
        break;
      }
    }
  }

  if (endLine === -1) {
    console.log(`[FAIL] ${bot} — can't find end of bad block`);
    fail++;
    continue;
  }

  // Remove lines [startLine, endLine)
  const beforeBad = lines.slice(0, startLine);
  const afterBad = lines.slice(endLine);
  
  // Detect the interaction variable name
  const iVarMatch = code.match(/client\.on\(["']interactionCreate["'],\s*async\s*\((\w+)\)/);
  const iVar = iVarMatch ? iVarMatch[1] : "interaction";
  
  // Detect the command variable name: first check for local var, else use property
  const cmdVarMatch = code.match(/const (\w+)\s*=\s*\w+\.commandName/);
  const cmdVar = cmdVarMatch ? cmdVarMatch[1] : `${iVar}.commandName`;
  
  // Detect if it's a switch pattern
  const isSwitch = code.includes("switch (");
  
  let newCode;
  if (isSwitch) {
    // Find the line just before startLine that has the closing "}" of the last case
    // Insert case statements there
    const lastCaseLine = beforeBad[beforeBad.length - 1];
    
    const caseStatements = [
      `      case 'setup': {`,
      `        await ${iVar}.deferReply();`,
      `        const autoSetup = require("../shared/auto-setup");`,
      `        const onboardingDb = require("../shared/onboarding-db");`,
      `        onboardingDb.getOrCreateMember(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);`,
      `        const results = autoSetup.setupAllServices(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);`,
      `        const { embed: sEmbed, row } = autoSetup.createSetupCompleteEmbed(${iVar}.user.tag || ${iVar}.user.username, results);`,
      `        await ${iVar}.editReply({ embeds: [sEmbed], components: row ? [row] : [] });`,
      `        break;`,
      `      }`,
      `      case 'my-services': {`,
      `        await ${iVar}.deferReply();`,
      `        const autoSetup2 = require("../shared/auto-setup");`,
      `        const msEmbed = autoSetup2.createServiceStatusEmbed(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);`,
      `        await ${iVar}.editReply({ embeds: [msEmbed] });`,
      `        break;`,
      `      }`,
      `      case 'upgrade': {`,
      `        await ${iVar}.deferReply();`,
      `        const stripe = require("../shared/stripe-integration");`,
      `        const uPlan = ${iVar}.options.getString("plan");`,
      `        try {`,
      `          const session = await stripe.createCheckoutSession(${iVar}.user.id, uPlan);`,
      `          const upEmbed = new EmbedBuilder().setColor(0x00D4AA).setTitle("⬆️ Upgrade Plan").setDescription("Click below:\\n\\n[🔗 Checkout](" + session.url + ")");`,
      `          await ${iVar}.editReply({ embeds: [upEmbed] });`,
      `        } catch (e) { await ${iVar}.editReply({ content: "❌ " + e.message }); }`,
      `        break;`,
      `      }`,
    ];
    
    newCode = [...beforeBad, ...caseStatements, ...afterBad].join("\n");
  } else {
    // if/else pattern
    const elseIfStatements = [
      `    } else if (${cmdVar} === "setup") {`,
      `      await ${iVar}.deferReply();`,
      `      const autoSetup = require("../shared/auto-setup");`,
      `      const onboardingDb = require("../shared/onboarding-db");`,
      `      onboardingDb.getOrCreateMember(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);`,
      `      const results = autoSetup.setupAllServices(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);`,
      `      const { embed: sEmbed, row } = autoSetup.createSetupCompleteEmbed(${iVar}.user.tag || ${iVar}.user.username, results);`,
      `      await ${iVar}.editReply({ embeds: [sEmbed], components: row ? [row] : [] });`,
      ``,
      `    } else if (${cmdVar} === "my-services") {`,
      `      await ${iVar}.deferReply();`,
      `      const autoSetup2 = require("../shared/auto-setup");`,
      `      const msEmbed = autoSetup2.createServiceStatusEmbed(${iVar}.user.id, ${iVar}.user.tag || ${iVar}.user.username);`,
      `      await ${iVar}.editReply({ embeds: [msEmbed] });`,
      ``,
      `    } else if (${cmdVar} === "upgrade") {`,
      `      await ${iVar}.deferReply();`,
      `      const stripe = require("../shared/stripe-integration");`,
      `      const uPlan = ${iVar}.options.getString("plan");`,
      `      try {`,
      `        const session = await stripe.createCheckoutSession(${iVar}.user.id, uPlan);`,
      `        const upEmbed = new EmbedBuilder().setColor(0x00D4AA).setTitle("⬆️ Upgrade Plan").setDescription("Click below:\\n\\n[🔗 Checkout](" + session.url + ")");`,
      `        await ${iVar}.editReply({ embeds: [upEmbed] });`,
      `      } catch (e) { await ${iVar}.editReply({ content: "❌ " + e.message }); }`,
      `    }`,
    ];
    
    // Need the closing } of the previous if block
    newCode = [...beforeBad, ...elseIfStatements, ...afterBad].join("\n");
  }

  fs.writeFileSync(f, newCode);

  // Verify syntax
  try {
    execSync(`node -c "${f}"`, { stdio: "pipe" });
    console.log(`[OK] ${bot} (${isSwitch ? "switch" : "if/else"}, iVar=${iVar}, cmd=${cmdVar})`);
    ok++;
  } catch (e) {
    const err = e.stderr.toString().split("\n").slice(0, 2).join(" | ");
    console.log(`[ERR] ${bot}: ${err}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} OK, ${fail} failed`);
