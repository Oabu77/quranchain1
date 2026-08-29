#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$repo_dir"

if [[ "${1:-}" != "--validate-only" ]]; then
  echo "Production deployment is intentionally disabled in this pre-release repository."
  echo "Run './deploy.sh --validate-only' for the local safety gate."
  echo "A manual release operator must review D1 migrations, capture a Time Travel bookmark,"
  echo "verify dedicated MeshTalk route ownership, and name the exact target commit."
  exit 78
fi

npm run verify:landing-pages
npx tsc --noEmit
npx wrangler deploy --dry-run
npm run test:integration
git diff --check

echo "Validation passed. No D1, Cloudflare, Discord, Stripe, GitHub, or process state was changed."
