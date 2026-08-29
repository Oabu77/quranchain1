#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")" && pwd)"
echo "The legacy go-live workflow is retired; it cannot commit, push, set secrets, migrate D1, deploy, or start bots."
exec "$repo_dir/deploy.sh" "$@"
