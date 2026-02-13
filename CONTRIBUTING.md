# Contributing to QuranChain™

**Founder:** Omar Mohammad Abunadi

---

## ⚠️ Important Notice

QuranChain™ is a **proprietary system** under the Dar Al-Nas™ ecosystem. Contributions are only accepted from authorized team members.

For security vulnerabilities, see [SECURITY.md](SECURITY.md).

---

## Contribution Guidelines

### Before You Start

1. **Authorization Required**
   - Only authorized Dar Al-Nas™ team members may contribute
   - All contributors must sign a Contributor Agreement
   - Contact the Founder for authorization

2. **Read Documentation**
   - [README.md](README.md) - Project overview
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
   - [SECURITY.md](SECURITY.md) - Security policies
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment procedures

---

## Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/Oabu77/quranchain1.git
cd quranchain1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .dev.vars
# Edit .dev.vars with your configuration
```

### 4. Initialize Database

```bash
npm run seedLocalDb
```

### 5. Start Development Server

```bash
npm run dev
```

---

## Code Standards

### TypeScript Standards

- **Strict Mode**: Always use TypeScript strict mode
- **No `any`**: Avoid `any` types; use proper typing
- **Explicit Returns**: Always specify return types
- **Imports**: Use named imports when possible

### Code Style

```typescript
// Good
export function calculateProfit(
revenue: number,
costs: number,
): number {
return revenue - costs;
}

// Bad
export function calculateProfit(revenue, costs) {
return revenue - costs;
}
```

### File Headers

All source files must include the QuranChain™ header:

```typescript
// ==========================================================
// QuranChain™ / Dar Al-Nas™ Proprietary System
// Founder: Omar Mohammad Abunadi
// All Rights Reserved. Trademark Protected.
// ==========================================================
```

---

## Security Requirements

### Never Commit

- ❌ API keys or secrets
- ❌ Passwords or tokens
- ❌ Private keys
- ❌ `.env` or `.dev.vars` files
- ❌ Personal information

### Always Include

- ✅ Input validation (Zod schemas)
- ✅ Error handling
- ✅ Audit logging for sensitive operations
- ✅ Type safety
- ✅ Security headers

### Security Checklist

Before submitting code:

- [ ] No hardcoded secrets
- [ ] All inputs validated
- [ ] Error handling with safe messages
- [ ] Audit logging where appropriate
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] TypeScript strict mode passes
- [ ] Tests pass

---

## Testing Requirements

### Unit Tests

Write unit tests for:
- Utility functions
- Business logic
- Data transformations

### Integration Tests

Write integration tests for:
- API endpoints
- Database operations
- Error scenarios

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- tests/integration/tasks.test.ts
```

---

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `security/description` - Security patches
- `docs/description` - Documentation

### Commit Messages

Use conventional commits format:

```
type(scope): description

- Detailed explanation if needed
- Multiple lines for complex changes
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `security`: Security fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:
```
feat(blockchain): add validator node support
fix(auth): resolve JWT token expiration issue
security(api): patch SQL injection vulnerability
```

### Pull Requests

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**
   - Follow code standards
   - Add tests
   - Update documentation

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push Branch**
   ```bash
   git push origin feature/my-feature
   ```

5. **Open Pull Request**
   - Descriptive title
   - Detailed description
   - Reference related issues
   - Request review from team

---

## Code Review Process

### For Authors

- Ensure all tests pass
- Self-review your code
- Respond to feedback promptly
- Make requested changes

### For Reviewers

Check for:
- Code quality and style
- Security vulnerabilities
- Test coverage
- Documentation updates
- Performance implications

---

## Sharia Compliance

When implementing financial features:

### Required Checks

- ✅ No riba (interest)
- ✅ No gharar (excessive uncertainty)
- ✅ No haram business involvement
- ✅ Transparent pricing
- ✅ Fair profit-sharing

### Use Utilities

```typescript
import { validateShariaCompliance } from './utils/sharia';

const result = validateShariaCompliance({
type: 'profit-sharing',
principal: 1000,
termsKnown: true,
priceKnown: true,
deliveryKnown: true,
});

if (!result.compliant) {
throw new Error(`Not Sharia compliant: ${result.issues.join(', ')}`);
}
```

---

## Performance Guidelines

### Best Practices

- Use caching where appropriate
- Optimize database queries
- Minimize external API calls
- Use async/await properly
- Avoid blocking operations

### Performance Targets

- API latency < 100ms (p99)
- Database queries < 50ms
- Cold start < 10ms

---

## Documentation

### Code Documentation

```typescript
/**
 * Calculate profit from transaction
 * 
 * @param revenue - Total revenue in currency units
 * @param costs - Total costs in currency units
 * @returns Net profit after costs
 */
export function calculateProfit(
revenue: number,
costs: number,
): number {
return revenue - costs;
}
```

### API Documentation

All endpoints must include OpenAPI schema:

```typescript
public schema = {
tags: ["Category"],
summary: "Short description",
operationId: "unique-operation-id",
request: { /* ... */ },
responses: { /* ... */ },
};
```

---

## Release Process

### Version Numbering

Follow Semantic Versioning (semver):
- `MAJOR.MINOR.PATCH`
- Example: `1.2.3`

### Release Checklist

- [ ] All tests pass
- [ ] Security scan passed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version number bumped
- [ ] Founder approval obtained

---

## Getting Help

### Internal Resources

- Architecture Docs: [ARCHITECTURE.md](ARCHITECTURE.md)
- Security Policies: [SECURITY.md](SECURITY.md)
- Deployment Guide: [DEPLOYMENT.md](DEPLOYMENT.md)

### Contact

- **Technical Questions**: tech@quranchain.com
- **Security Issues**: security@quranchain.com
- **Founder**: Omar Mohammad Abunadi

---

## License & Trademark

QuranChain™ and Dar Al-Nas™ are registered trademarks.

All code is proprietary and confidential. Unauthorized use, reproduction, or distribution is strictly prohibited.

Copyright © 2025 Omar Mohammad Abunadi. All Rights Reserved.
