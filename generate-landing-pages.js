#!/usr/bin/env node
// Safety verifier for retired concept landing modules.

const { readFileSync } = require("fs");
const { resolve } = require("path");

const retiredModules = [
  "darcloud-ai-assistant.js",
  "darcloud-api-gateway.js",
  "darcloud-blockchain.js",
  "darcloud-darcommerce.js",
  "darcloud-dardefi.js",
  "darcloud-daredu.js",
  "darcloud-darenergy.js",
  "darcloud-darhealth.js",
  "darcloud-darhr.js",
  "darcloud-darlaw.js",
  "darcloud-darmedia.js",
  "darcloud-darnas.js",
  "darcloud-darpay.js",
  "darcloud-darsecurity.js",
  "darcloud-dartelecom.js",
  "darcloud-dartrade.js",
  "darcloud-enterprise.js",
  "darcloud-mesh-status.js",
  "darcloud-net.js",
  "darcloud-omarai.js",
  "darcloud-revenue.js",
];

const requiredDelegate = 'export { default } from "./darcloud-disabled-preview.js";';
const pagesDirectory = resolve(__dirname, "landing-pages");
const unsafe = retiredModules.filter((name) => {
  const source = readFileSync(resolve(pagesDirectory, name), "utf8");
  return !source.includes(requiredDelegate);
});

if (unsafe.length > 0) {
  console.error(`Retired concept modules must remain fail-closed: ${unsafe.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${retiredModules.length} retired concept modules are fail-closed.`);
}
