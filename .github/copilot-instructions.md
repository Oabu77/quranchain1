# Copilot Instructions — DarCloud Empire

## Context
This is the **QuranChain™ DarCloud** monorepo: a Cloudflare Worker API (Hono + chanfana) with 22 Discord bots, Stripe billing, D1 database (72 tables), and FungiMesh networking.

## Rules
- **Security first**: parameterized SQL only (`?` placeholders), no hardcoded secrets, Stripe webhook signatures required, JWT_SECRET required (no fallbacks)
- **Bash only** — never suggest PowerShell
- **Check bot pattern** before editing any `*-bot/bot.js` — there are 3 distinct patterns
- **Worker code** is ESM TypeScript (`src/`). **Bot code** is CommonJS Node.js (`*-bot/`)
- **D1 migrations** use SQLite syntax (`ADD COLUMN`, `IF NOT EXISTS`) — NOT T-SQL
- **Atomic payment writes**: always use `db.batch()` for multi-table financial operations
- **Auth required** on all revenue, treasury, admin, and onboarding endpoints

## Stack
Hono 4.12.7, chanfana 2.8.3, Stripe 17.5, Discord.js 14, Vitest, Wrangler 4.66, TypeScript 5.9.3 (strict, esnext)

## Key Paths
- `src/index.ts` — Worker entry, all API routes
- `src/endpoints/auth.ts` — Auth (JWT, PBKDF2)
- `shared/` — 11 shared Node.js modules used by bots
- `*-bot/` — 22 Discord bots
- `migrations/` — D1 migration SQL files (0001–0011)
- `wrangler.jsonc` — Worker config + D1 binding
