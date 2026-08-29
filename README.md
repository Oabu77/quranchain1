# DarCloud pre-release Worker

This repository contains restricted DarCloud software previews built with Cloudflare Workers, Hono, chanfana, and D1. It is not evidence of operating companies, contracts, licenses, filings, revenue, infrastructure, users, financial products, token activity, logistics fulfillment, or telecom service.

## Current public scope

| Surface | Current status |
|---|---|
| Main account | Registration, login, sessions, profile access, and account APIs are closed |
| MeshTalk | Separate live beta Worker at `https://darcloud.host/meshtalk`; direct/group text only, with blocking, reporting, and account deletion |
| QuranChain Tracker | Device-only prayer and Quran-reading tracker; no account sync, location, token, mining, or rewards |
| Wallet | Research and budgeting concept; no financial account or money movement |
| Logistics | Internal interface preview using fictional records; no booking, dispatch, tracking, shipment, payment, or fulfillment |
| Other named concepts | Fail-closed “not live” page |

Checkout, subscriptions, financial services, contract/legal automation, revenue reporting, operational infrastructure APIs, legacy messaging, user lookup, and administrator statistics are disabled.

## Local validation

```bash
npm ci
npm test
npx tsc --noEmit
```

`npm test` verifies retired landing modules, performs a validation-only Worker dry run, and runs the integration suite inside the Cloudflare Workers test runtime. The committed Wrangler configuration has no public URL, route, production account identifier, or remote D1 binding.

## Release safety

Production deployment is intentionally not automatic, and the production Worker name, routes, credentials, and remote D1 binding are deliberately absent from this repository. The currently deployed broad DarCloud Worker and the separate `quranchain` MeshTalk Worker have historically shared a D1 database; that architecture must be disentangled or reviewed before any release.

Before any manual production deployment:

1. Run the complete validation gate.
2. Confirm the exact commit under review.
3. Supply a separate, operator-controlled production configuration; do not copy the validation UUID.
4. Inspect remote pending D1 migrations; do not auto-apply them.
5. Capture a D1 Time Travel bookmark and inventory any legacy personal data.
6. Verify both `darcloud.host/meshtalk*` and `darcloud.host/api/meshtalk*` still map to the `quranchain` Worker.
7. Confirm any Stripe webhook registered to this Worker is removed because webhook processing is retired.
8. Deploy only the reviewed Worker bundle through an approved production environment.
9. Purge the Cloudflare edge cache for the affected apex and `www` hosts.
10. Confirm `/sw.js` serves the cleanup worker on `darcloud.host`, `www.darcloud.host`, and `darcloud.net`; allow existing root-scope registrations to update, then verify the legacy `quranchain-*` browser caches and registrations are gone. Keep the cleanup route deployed until that lifecycle has been observed on each origin.
11. Recheck route ownership, CORS/security headers, disabled checkout/auth gates, the replacement manifest, and MeshTalk health.

The legacy `deploy.sh` and `deploy-all.sh` entry points are retired and perform validation only. They do not mutate D1, Cloudflare, Discord, Stripe, or production processes.

## Android wrappers

The `play-apps/` source builds separate Wallet, Logistics, MeshTalk, and QuranChain Tracker variants. Store copy and URLs must match the current scopes above. A build artifact is not a license, approval, production launch, or proof that a backend capability exists.

## Legal and financial boundary

DarCloud LLC status, an EIN, a private membership structure, or an overseas entity does not by itself authorize banking, custody, money transmission, securities, token exchange, insurance, credit, or other regulated activity. Such features remain disabled unless and until a qualified licensed provider and counsel approve the exact product, jurisdictions, disclosures, and operating model.
