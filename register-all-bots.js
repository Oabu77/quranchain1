#!/usr/bin/env node
// Register commands for all 21 sector bots
const { execSync } = require("child_process");

const BOTS = [
  "aifleet-bot", "darcommerce-bot", "dardefi-bot", "daredu-bot", "darenergy-bot",
  "darhealth-bot", "darhr-bot", "darlaw-bot", "darmedia-bot", "darnas-bot",
  "darpay-bot", "darrealty-bot", "darsecurity-bot", "dartelecom-bot", "dartrade-bot",
  "dartransport-bot", "fungimesh-bot", "hwc-bot", "meshtalk-bot", "omarai-bot", "quranchain-bot"
];

let ok = 0, fail = 0;
for (const bot of BOTS) {
  const dir = `/workspaces/quranchain1/${bot}`;
  try {
    const out = execSync(`node register-commands.js`, { cwd: dir, timeout: 30000, stdio: "pipe" }).toString();
    const line = out.split("\n").find(l => l.includes("Registered") || l.includes("Failed")) || out.trim().split("\n").pop();
    console.log(`${bot}: ${line}`);
    if (out.includes("Registered")) ok++;
    else fail++;
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().split("\n")[0] : err.message;
    console.log(`${bot}: FAIL — ${stderr}`);
    fail++;
  }
}
console.log(`\nRegistered: ${ok}/${BOTS.length}, Failed: ${fail}`);
