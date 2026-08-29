#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")" && pwd)"
echo "Bulk bot dependency installation is quarantined. Running validation only."
exec "$repo_dir/deploy.sh" --validate-only
