# QuranChain™ — DarCloud API

**v5.4.0** · Production API powering the DarCloud infrastructure stack.

> بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

## Overview

| Metric | Value |
|--------|-------|
| Companies | 101 |
| Inter-company contracts | 175+ |
| Monthly revenue | $402K+ |
| AI agents | 77 (66 fleet + 11 DarLaw) |
| D1 tables | 59 |
| Tests | 41 passing |

## Stack

- **Runtime:** Cloudflare Workers (ESM)
- **Framework:** [Hono](https://hono.dev) v4.10.7 + [chanfana](https://chanfana.com) v2.8.3 (OpenAPI 3.1)
- **Database:** Cloudflare D1 (SQLite)
- **Auth:** JWT HMAC-SHA256 with 24h expiry + IP-based rate limiting
- **Validation:** Zod v3.25.67
- **Tests:** Vitest + @cloudflare/vitest-pool-workers
- **CI/CD:** GitHub Actions → TypeScript check → Tests → D1 migrations → Wrangler deploy

## Domains

| Domain | Service |
|--------|---------|
| `darcloud.host` | Main API + auth pages |
| `ai.darcloud.host` | AI fleet (77 agents) |
| `mesh.darcloud.host` | FungiMesh encrypted network |
| `blockchain.darcloud.host` | QuranChain explorer |
| `halalwealthclub.darcloud.host` | Halal Wealth Club |
| `enterprise.darcloud.host` | Enterprise landing |
| `realestate.darcloud.host` | DarEstate |
| `darcloud.net` | Public landing |

## API Endpoints

### Auth & Pages
| Method | Path | Description |
|--------|------|-------------|
| GET | `/signup` | Signup page |
| GET | `/login` | Login page |
| GET | `/dashboard` | User dashboard (JWT-protected client) |
| GET | `/admin` | Admin panel (JWT-protected client) |
| GET | `/onboarding` | Onboarding flow |
| GET | `/checkout/:plan` | DarPay™ checkout |
| POST | `/api/auth/signup` | Create account → JWT token |
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/auth/me` | Current user info (Bearer token) |
| GET | `/api/admin/stats` | Admin dashboard stats (Bearer token) |

### Contracts & DarLaw
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/contracts` | List all contracts |
| GET | `/api/contracts/companies` | List 101 companies |
| GET | `/api/contracts/revenue` | Revenue breakdown by company |
| GET | `/api/contracts/darlaw/agents` | 11 DarLaw AI agents |
| GET | `/api/contracts/legal/filings` | Legal filings |
| GET | `/api/contracts/legal/ip` | IP portfolio (75 TM, 27 patents, 8 ©) |
| POST | `/api/contracts/bootstrap` | Bootstrap full ecosystem |

### Infrastructure (OpenAPI)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | System health check |
| GET | `/docs` | Interactive OpenAPI explorer |
| * | `/tasks` | Task management CRUD |
| * | `/backups` | Backup registry |
| * | `/mesh` | FungiMesh nodes |
| * | `/ai` | AI fleet management |
| * | `/minecraft` | Minecraft servers |
| * | `/multipass` | VM fleet |

## Quick Start

```bash
# Install
npm install

# Local dev
npm run dev

# Run tests
npx vitest run --config tests/vitest.config.mts

# Deploy
npm run deploy
```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
CLOUDFLARE_API_TOKEN=     # Workers Scripts:Edit, D1:Edit
CLOUDFLARE_ACCOUNT_ID=    # From Workers dashboard
JWT_SECRET=               # Set via: npx wrangler secret put JWT_SECRET
```

## Project Structure

```
src/
├── index.ts              # Hono app, routes, OpenAPI registry
├── pages.ts              # Server-rendered HTML (signup, login, dashboard, admin)
├── types.ts              # Shared types
├── endpoints/
│   ├── auth.ts           # JWT auth, rate limiting, signup/login/me/admin
│   ├── contracts.ts      # 101 companies, 175 contracts, DarLaw AI, IP
│   ├── systemHealth.ts   # Health check with component monitoring
│   └── tasks/            # OpenAPI task CRUD
├── data/
│   ├── companies.ts      # 101 company definitions
│   ├── contracts-data.ts # 175 contract templates
│   ├── ip-portfolio.ts   # IP protections (trademarks, patents, etc.)
│   └── legal-filings.ts  # Legal filing templates
tests/
├── integration/
│   ├── auth.test.ts      # 17 auth tests (signup, login, JWT, admin)
│   ├── contracts.test.ts # 12 contract tests (CRUD, DarLaw, migration)
│   ├── tasks.test.ts     # 11 task CRUD tests
│   └── dummyEndpoint.test.ts  # Health check test
migrations/               # D1 SQL migrations
```

## Islamic Finance

All financial operations are Shariah-compliant:
- **Zakat:** 2% auto-calculated on all revenue
- **Founder Royalty:** 30% immutable on all contracts
- **Autopay:** Monthly on all 175 contracts
- **DarPay™:** Zero-riba payment processing

## Owner

**Omar Mohammad Abunadi** · [GitHub](https://github.com/Oabu77)

---

*Built with Cloudflare Workers + D1 + Hono + chanfana OpenAPI*
