# AGENTS.md — DarCloud Empire Codex Context

## Project Overview

**QuranChain™ DarCloud API** — A sovereign AI-powered conglomerate spanning 101 companies across 6 tiers.  
Built on **Cloudflare Workers + D1 + Hono + chanfana OpenAPI**, orchestrated by **22 Discord bots**.

- **Owner**: Omar Abu Nadi (Oabu77)
- **Repo**: `Oabu77/quranchain1`
- **Domains**: `darcloud.host`, `darcloud.net` (apex + wildcard subdomains)
- **Runtime**: Cloudflare Workers (TypeScript), Discord bots (Node.js)
- **Database**: Cloudflare D1 (SQLite), ID `26b921d0-3226-485d-a105-dc820a9abdbc`, 72 tables
- **Payments**: Stripe LIVE — Pro ($49), Enterprise ($499), FungiMesh ($19.99), HWC ($99), Gas Toll (variable)
- **Revenue Split**: 30% Founder, 40% AI Validators, 10% Hardware, 18% Ecosystem, 2% Zakat

## Architecture

### Cloudflare Worker (`src/`)
- **Entry**: `src/index.ts` — Hono app with all API routes
- **Auth**: `src/endpoints/auth.ts` — JWT HMAC-SHA256, PBKDF2 100K iterations, rate limiting
- **Pages**: `src/pages.ts` — Landing page HTML
- **Subdomain Router**: `src/subdomainRouter.ts` — Maps `*.darcloud.host` subdomains
- **Endpoints**: `src/endpoints/` — telecom, mesh, minecraft, multipass, wifi, tasks, backups, ISP, AI, contracts
- **Types**: `src/types.ts`, `worker-configuration.d.ts`

### 22 Discord Bots (`*-bot/` directories)
Each bot has: `bot.js`, `package.json`, `register-commands.js`

**Bots**: aifleet-bot, darcommerce-bot, dardefi-bot, daredu-bot, darenergy-bot, darhealth-bot, darhr-bot, darlaw-bot, darmedia-bot, darnas-bot, darpay-bot, darrealty-bot, darsecurity-bot, dartelecom-bot, dartrade-bot, dartransport-bot, discord-bot, fungimesh-bot, hwc-bot, meshtalk-bot, omarai-bot, quranchain-bot

**Bot Code Patterns** (check before editing):
- `discord-bot` & `quranchain-bot`: Handler-object pattern (`const handlers = {}`)
- 14 bots: Pattern A — commands array + `built.push`
- 8 bots: Pattern B — `SlashCommandBuilder` array `.map(c => c.toJSON())`

### Shared Modules (`shared/`)
`auto-setup.js`, `bot-ipc.js`, `cell-tower.js`, `discord-premium.js`, `founder-agent.js`, `masjid-finder.js`, `mesh-router.js`, `onboarding-db.js`, `onboarding-engine.js`, `openai-agents.js`, `stripe-integration.js`

### Migrations (`migrations/`)
11 migration files (0001–0011). Migration 0007 is a no-op (duplicate moved to 0011). Uses D1 `ALTER TABLE ADD COLUMN` syntax (SQLite, NOT T-SQL).

### Infrastructure
- **PM2**: `ecosystem.config.js` — 24 services
- **Docker**: `docker-compose.yml` — 10 containers (FungiMesh + WiFi gateways)
- **Open5GS**: `open5gs/docker-compose.yml` — Full 5G core network stack
- **FungiMesh**: `docker/fungimesh-gateway/` — WiFi gateway captive portal (Python)

## Key Commands

```bash
# Development
pnpm dev                    # Start local Worker (port 8787)
pnpm deploy                 # Deploy to Cloudflare (runs migrations first)
pnpm test                   # Vitest + Cloudflare Workers pool

# Wrangler
wrangler deploy             # Deploy Worker
wrangler d1 migrations apply DB --remote   # Apply D1 migrations
wrangler types              # Generate TypeScript bindings

# Bots
node register-all-bots.js   # Register all Discord bot commands
node discord-bot/bot.js     # Run main Discord bot
bash setup-all-bots.sh      # Install deps for all bots
bash deploy-all.sh          # Full deployment (Worker + bots + mesh)
bash go-live.sh             # One-command go-live script
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | Hono 4.12.7 + chanfana OpenAPI on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Auth | JWT (HMAC-SHA256), PBKDF2 100K iterations |
| Payments | Stripe (webhook HMAC-SHA256 verified) |
| Bots | Discord.js 14, Node.js |
| Tests | Vitest + @cloudflare/vitest-pool-workers |
| Process Mgmt | PM2 |
| Containers | Docker Compose |
| Mesh Network | FungiMesh (B.A.T.M.A.N. + WireGuard) |
| TypeScript | TS 5.9.3, target esnext, strict mode |

## Important Files

- `src/index.ts` — Main Worker entry (~750 lines, all API routes)
- `src/endpoints/auth.ts` — Auth system (signup, login, JWT, PBKDF2)
- `worker-configuration.d.ts` — Env bindings (JWT_SECRET, STRIPE keys required)
- `wrangler.jsonc` — Worker config, D1 binding, routes
- `ecosystem.config.js` — PM2 process definitions
- `discord-bot/bot.js` — Main DarCloud Discord bot
- `discord-bot/watchdog.js` — Health monitor for all 24 PM2 services
- `shared/founder-agent.js` — NL command parser for founder console
- `shared/stripe-integration.js` — Stripe checkout + webhook handling

## Security Rules

- **NEVER** hardcode credentials — use env vars or Cloudflare secrets
- **NEVER** use string interpolation in SQL — use parameterized queries (`?` placeholders)
- Stripe webhooks MUST verify signatures (STRIPE_WEBHOOK_SECRET required)
- JWT_SECRET is required (no fallbacks)
- Auth required on revenue/treasury/admin endpoints
- Payment writes must be atomic (use `db.batch()`)

## Environment Variables (Worker)

Required in `worker-configuration.d.ts`:
- `JWT_SECRET` — JWT signing key
- `STRIPE_SECRET_KEY` — Stripe API key
- `STRIPE_WEBHOOK_SECRET` — Webhook signature verification
- `DB` — D1 database binding

## Style & Conventions

- This project serves the Muslim Ummah — built on Islamic values
- Use `Bismillah` when starting major operations
- Node.js bots use CommonJS (`require`)
- Worker code uses ESM (`import`)
- No PowerShell — bash only (Chromebook environment)
