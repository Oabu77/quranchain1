#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")" && pwd)"
echo "Bulk bot token setup, global command registration, and process startup are retired."
echo "No Discord, credential, payment, or process state will be changed."
exec "$repo_dir/deploy.sh" "$@"
