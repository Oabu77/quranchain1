#!/usr/bin/env python3
"""Fail closed when the contracts/DarLaw control plane lacks its auth boundary."""
from __future__ import annotations

import argparse
from pathlib import Path
import sys

MOUNT = 'app.route("/api/contracts", contracts);'
MUTATION_MARKERS = (
    'contracts.post("/companies/seed"',
    'contracts.post("/sign"',
    'contracts.post("/seed-all"',
    'contracts.post("/legal/file-all"',
    'contracts.post("/legal/protect-ip"',
    'contracts.post("/bootstrap"',
)


def evaluate(index: str, contracts: str) -> tuple[bool, str]:
    if MOUNT not in index:
        return False, "Expected /api/contracts mount was not found; routing requires security review."

    before_mount = index.split(MOUNT, 1)[0]
    has_mutations = any(marker in contracts for marker in MUTATION_MARKERS)
    has_route_gate = (
        'app.use("/api/contracts/*"' in before_mount
        and "DARCLOUD_CONTRACTS_READ_TOKEN" in before_mount
        and "DARCLOUD_CONTRACTS_MUTATION_TOKEN" in before_mount
    )

    if has_mutations and not has_route_gate:
        return False, (
            "/api/contracts contains D1-mutating contract/legal/IP handlers without "
            "the required fail-closed read/mutation authorization boundary."
        )
    return True, "Contracts control-plane deployment gate passed."


def self_test() -> int:
    vulnerable_index = f'const app = 1;\n{MOUNT}\n'
    protected_index = (
        'app.use("/api/contracts/*", async () => {{}});\n'
        'const DARCLOUD_CONTRACTS_READ_TOKEN = "configured-at-runtime";\n'
        'const DARCLOUD_CONTRACTS_MUTATION_TOKEN = "configured-at-runtime";\n'
        f'{MOUNT}\n'
    )
    mutations = 'contracts.post("/sign", async () => {{}});\n'

    ok, _ = evaluate(vulnerable_index, mutations)
    if ok:
        print("self-test failed: vulnerable sample was not blocked", file=sys.stderr)
        return 1

    ok, _ = evaluate(protected_index, mutations)
    if not ok:
        print("self-test failed: protected sample was blocked", file=sys.stderr)
        return 1

    ok, _ = evaluate("const app = 1;", mutations)
    if ok:
        print("self-test failed: unexpected routing change was not blocked", file=sys.stderr)
        return 1

    print("contracts control-plane checker self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        return self_test()

    index = Path("src/index.ts").read_text(encoding="utf-8")
    contracts = Path("src/endpoints/contracts.ts").read_text(encoding="utf-8")
    ok, message = evaluate(index, contracts)
    if not ok:
        print(f"::error::{message}")
        print("Remediate issue #38 before deploying this Worker.")
        return 1
    print(message)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
