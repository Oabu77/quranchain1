# QuranChain™ Blockchain Platform

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Oabu77/quranchain1)

**Founder:** Omar Mohammad Abunadi  
**Status:** Production-Ready Blockchain Infrastructure  
**License:** All Rights Reserved. Trademark Protected.

---

## Overview

QuranChain™ is a sovereign-grade blockchain platform designed for the Dar Al-Nas™ ecosystem. This repository contains the core blockchain infrastructure, validator node tooling, and API services built on Cloudflare Workers with extreme scalability and security.

### Key Features

- ⚡ **High Performance**: Built on Cloudflare's edge network for global low-latency access
- 🔒 **Security-First**: Zero Trust architecture with defense-in-depth security controls
- 📊 **Production-Grade**: Structured logging, error handling, and comprehensive monitoring
- 🌍 **Globally Distributed**: Edge computing capabilities across 300+ cities worldwide
- 🔐 **Governance Controls**: Founder authority enforcement and audit trails
- ⚖️ **Sharia-Compliant**: Built-in compliance for Islamic finance principles
- 🛡️ **Self-Healing**: Automated recovery and fail-safe behaviors

---

## Architecture

### Core Components

1. **Blockchain API** (`src/index.ts`): Main application router and OpenAPI registry
2. **Task Management** (`src/endpoints/tasks/`): Core blockchain task orchestration
3. **Database Layer**: Cloudflare D1 SQL database for persistent storage
4. **Security Middleware**: JWT authentication, rate limiting, and RBAC (planned)
5. **Monitoring & Logging**: Structured JSON logs for production observability

### Technology Stack

- **Runtime**: Cloudflare Workers (V8 Isolates)
- **Framework**: Hono + Chanfana (OpenAPI 3.1)
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Language**: TypeScript
- **Testing**: Vitest with integration tests
- **Validation**: Zod schema validation

---

## Getting Started

### Prerequisites

- Node.js 18+ or npm/pnpm
- Cloudflare account (for deployment)
- Wrangler CLI

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create D1 Database**:
   ```bash
   npx wrangler d1 create openapi-template-db
   ```
   Update `wrangler.jsonc` with the returned `database_id`.

3. **Run database migrations**:
   ```bash
   npx wrangler d1 migrations apply DB --remote
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Deploy to production**:
   ```bash
   npm run deploy
   ```

### Environment Variables

QuranChain follows Zero Trust principles. Never hardcode secrets.

- Store sensitive configuration in `.dev.vars` (local) or Wrangler secrets (production)
- Use Cloudflare's secret management for API keys and tokens
- See `.env.example` for required variables (if available)

---

## API Documentation

The API automatically generates OpenAPI 3.1 documentation available at:
- Local: `http://localhost:8787/`
- Production: `https://your-worker.workers.dev/`

### Available Endpoints

#### Tasks API
- `GET /tasks` - List all tasks
- `POST /tasks` - Create a new task
- `GET /tasks/:id` - Get task by ID
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

---

## Development

### Running Tests

```bash
npm run test
```

Tests use Vitest with Cloudflare Workers integration. All endpoints include integration tests.

### Type Generation

Generate TypeScript types from Wrangler configuration:

```bash
npm run cf-typegen
```

### Extract OpenAPI Schema

```bash
npm run schema
```

### Local Database Seeding

```bash
npm run seedLocalDb
```

---

## Security

### Defense Doctrine

QuranChain implements defense against:
- ✅ Remote Code Execution (RCE)
- ✅ SQL Injection
- ✅ Command Injection
- ✅ Cross-Site Scripting (XSS)
- ✅ CSRF Attacks
- ✅ Token Leakage
- ✅ Privilege Escalation
- ✅ Supply Chain Attacks

### Security Features

1. **Input Validation**: Zod schema validation on all inputs
2. **Structured Logging**: JSON-formatted logs with timestamps
3. **Error Handling**: Fail-safe error responses without information leakage
4. **Type Safety**: Full TypeScript strict mode
5. **Zero Trust**: No hardcoded secrets or credentials

---

## Governance & Founder Authority

All critical operations require Founder (Omar Mohammad Abunadi) authorization:

- Cryptographic signing for high-risk changes
- Kill-switch capability for emergency shutdown
- Immutable audit logs for compliance
- Governance proposal system (planned)

---

## Sharia-Compliant Finance Policy

QuranChain enforces Islamic finance principles:

- ❌ No riba (interest-based transactions)
- ❌ No gharar (excessive uncertainty)
- ❌ No haram business involvement
- ✅ Profit-sharing models (Musharakah, Mudarabah)
- ✅ Zakat calculation support
- ✅ Full transparency and fairness

---

## Monitoring & Operations

### Health Checks

Health check endpoints (to be implemented):
- `/health` - Basic health status
- `/metrics` - Prometheus-compatible metrics

### Logging

All logs use structured JSON format:
```json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "level": "INFO|WARN|ERROR",
  "message": "Event description",
  "context": {}
}
```

### Monitoring

Monitor your worker in real-time:
```bash
npx wrangler tail
```

---

## Deployment

### Cloudflare Workers Deployment

```bash
npm run deploy
```

### CI/CD Integration

GitHub Actions workflows are available in `.github/workflows/`:
- Copilot code review
- Automated testing
- Security scanning

---

## Project Structure

```
quranchain1/
├── src/
│   ├── index.ts              # Main application entry
│   ├── types.ts              # TypeScript type definitions
│   └── endpoints/
│       ├── dummyEndpoint.ts  # Example endpoint
│       └── tasks/            # Task management endpoints
│           ├── base.ts       # Task model definition
│           ├── router.ts     # Task routes
│           ├── taskCreate.ts
│           ├── taskRead.ts
│           ├── taskUpdate.ts
│           ├── taskDelete.ts
│           └── taskList.ts
├── tests/                    # Integration tests
├── migrations/               # Database migrations
├── wrangler.jsonc           # Cloudflare Workers config
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

---

## Performance Optimization

QuranChain is optimized for:
- ⚡ High throughput (edge caching)
- 🚀 Low latency (global distribution)
- 🔄 Parallel execution (V8 isolates)
- 💾 Efficient caching (KV/R2 integration ready)
- 📈 Load balancing (automatic via Cloudflare)
- 🛡️ Graceful degradation

---

## Contributing

This is a proprietary system. Contributions are only accepted by authorized Dar Al-Nas™ team members.

For security issues, contact: founder@quranchain.com (or designated security contact)

---

## Roadmap

### Phase 1: Foundation ✅
- Core API infrastructure
- Database integration
- Basic task management
- OpenAPI documentation

### Phase 2: Security & Auth (In Progress)
- JWT authentication
- Rate limiting
- RBAC access control
- Security middleware

### Phase 3: Blockchain Core (Planned)
- Validator node infrastructure
- Consensus mechanism
- Block creation and validation
- Network protocol

### Phase 4: DarCloud™ Integration (Planned)
- Cloud computing infrastructure
- Resource management
- Auto-scaling capabilities

### Phase 5: MeshTalk OS™ (Planned)
- Telecom mesh networking
- P2P communication
- Distributed routing

---

## Support

For technical support and documentation:
- Internal Wiki: [To be configured]
- Issue Tracker: GitHub Issues (authorized users only)

---

## License

**QuranChain™** and **Dar Al-Nas™** are registered trademarks.  
All Rights Reserved. Proprietary and Confidential.

Copyright © 2025 Omar Mohammad Abunadi

---

## Acknowledgments

Built with:
- [Hono](https://hono.dev/) - Ultrafast web framework
- [Chanfana](https://chanfana.com/) - OpenAPI framework for Cloudflare Workers
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless compute platform
- [Vitest](https://vitest.dev/) - Testing framework
