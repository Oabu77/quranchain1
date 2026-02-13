# ==========================================================
# QuranChain™ / Dar Al-Nas™ Proprietary System
# Founder: Omar Mohammad Abunadi
# All Rights Reserved. Trademark Protected.
# ==========================================================
#
# Docker container for QuranChain™ development and testing
# This is primarily for local development as production runs on Cloudflare Workers
#

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Development image
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install wrangler globally
RUN npm install -g wrangler

EXPOSE 8787

CMD ["npm", "run", "dev"]

# Builder stage for testing
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run tests
RUN npm run test || true

# Production build (for validation, not actual deployment)
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Validate TypeScript
RUN npx tsc --noEmit

CMD ["echo", "QuranChain™ builds successfully. Deploy with: npm run deploy"]
