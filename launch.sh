#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$repo_dir"

echo "The legacy bulk launch path is retired."
echo "It must not deploy broad Worker routes, register Discord commands, restart"
echo "processes, or activate telecom prototypes. Running the validation-only gate."

exec ./deploy.sh --validate-only
