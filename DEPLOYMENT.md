# QuranChain™ Deployment Guide

**Founder:** Omar Mohammad Abunadi  
**Last Updated:** 2025-01-01

---

## Deployment Overview

QuranChain™ is deployed on Cloudflare Workers, a globally distributed serverless platform. This guide covers deployment procedures, best practices, and troubleshooting.

---

## Prerequisites

Before deploying, ensure you have:

1. **Cloudflare Account**
   - Sign up at https://dash.cloudflare.com/
   - Workers plan (free tier available)

2. **Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

3. **Authentication**
   ```bash
   wrangler login
   ```

4. **D1 Database**
   ```bash
   npx wrangler d1 create openapi-template-db
   ```
   Update `database_id` in `wrangler.jsonc`

---

## Environment Setup

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create Local Environment**
   ```bash
   cp .env.example .dev.vars
   # Edit .dev.vars with your configuration
   ```

3. **Initialize Database**
   ```bash
   npm run seedLocalDb
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   Access at: http://localhost:8787

### Production Secrets

Set production secrets using Wrangler:

```bash
# Set JWT secret
npx wrangler secret put JWT_SECRET

# Set Founder address
npx wrangler secret put FOUNDER_ADDRESS

# List all secrets
npx wrangler secret list
```

---

## Deployment Process

### 1. Pre-Deployment Checks

```bash
# Run type check
npx tsc --noEmit

# Run tests
npm run test

# Validate configuration
cat wrangler.jsonc
```

### 2. Database Migration

```bash
# Apply migrations to remote database
npx wrangler d1 migrations apply DB --remote
```

### 3. Deploy to Production

```bash
# Deploy with automatic migration
npm run deploy

# Or manual deployment
npx wrangler deploy
```

### 4. Verify Deployment

```bash
# Check worker status
npx wrangler tail

# Test health endpoint
curl https://your-worker.workers.dev/health

# Test readiness
curl https://your-worker.workers.dev/ready
```

---

## Deployment Environments

### Development
- Local development with `wrangler dev`
- Local D1 database
- Hot reload enabled
- Debug logging

### Staging (Preview)
- Preview deployments via GitHub integration
- Separate D1 database
- Production-like environment
- Integration testing

### Production
- Global Cloudflare edge deployment
- Production D1 database
- Rate limiting enabled
- Full monitoring

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy QuranChain™

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## Rollback Procedure

### Quick Rollback

```bash
# List deployments
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback [deployment-id]
```

### Database Rollback

D1 migrations are forward-only. To rollback database changes:

1. Create a new migration to undo changes
2. Test thoroughly in staging
3. Deploy to production

---

## Monitoring

### Real-Time Logs

```bash
# Stream worker logs
npx wrangler tail

# Filter by status
npx wrangler tail --status error

# Filter by method
npx wrangler tail --method POST
```

### Metrics

Access metrics in Cloudflare Dashboard:
- https://dash.cloudflare.com/
- Select your Worker
- View Analytics tab

Key metrics:
- Request rate
- Error rate
- Latency (p50, p95, p99)
- CPU time
- Data transfer

---

## Performance Optimization

### Caching Strategy

```typescript
// Cache API responses
c.header('Cache-Control', 'public, max-age=300');

// Cache static assets
c.header('Cache-Control', 'public, max-age=31536000, immutable');
```

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_tasks_slug ON tasks(slug);
CREATE INDEX idx_tasks_completed ON tasks(completed);
```

---

## Security Hardening

### Pre-Deployment Security Checklist

- [ ] No hardcoded secrets in code
- [ ] All secrets stored in Wrangler secrets
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers applied
- [ ] Input validation on all endpoints
- [ ] Error messages sanitized
- [ ] Audit logging enabled

### Post-Deployment Security

```bash
# Rotate secrets periodically
npx wrangler secret put JWT_SECRET

# Review access logs
npx wrangler tail --format json | grep audit

# Monitor for suspicious activity
npx wrangler tail --status 401,403
```

---

## Troubleshooting

### Common Issues

**Issue: Database not found**
```bash
# Check D1 bindings
npx wrangler d1 list

# Verify wrangler.jsonc configuration
cat wrangler.jsonc | grep database_id
```

**Issue: Worker won't deploy**
```bash
# Check for syntax errors
npx tsc --noEmit

# Verify wrangler.toml
npx wrangler deploy --dry-run
```

**Issue: High error rate**
```bash
# Check error logs
npx wrangler tail --status error

# Review recent changes
git log -5 --oneline
```

---

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - D1 automatic backups (Cloudflare managed)
   - Manual exports as needed
   
2. **Code Backups**
   - Git repository (primary)
   - Tagged releases
   
3. **Configuration Backups**
   - Document all Wrangler secrets
   - Store environment configs securely

### Recovery Procedure

1. Identify the issue
2. Roll back to last known good deployment
3. Restore database from backup if needed
4. Verify system health
5. Post-mortem analysis

---

## Scaling Considerations

Cloudflare Workers auto-scale automatically, but consider:

- **Database**: D1 limits (10GB, millions of rows)
- **Request Rate**: Free tier limits
- **CPU Time**: 50ms limit per request
- **Memory**: 128MB per request

For extreme scale:
- Upgrade to Workers Paid plan
- Implement caching strategies
- Optimize database queries
- Consider sharding for massive datasets

---

## Support & Contacts

**Deployment Issues**: devops@quranchain.com  
**Security Incidents**: security@quranchain.com  
**Founder**: Omar Mohammad Abunadi

---

**QuranChain™** and **Dar Al-Nas™** are registered trademarks.  
All Rights Reserved. Proprietary and Confidential.
