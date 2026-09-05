#!/usr/bin/env python3
"""Provider-free regression for issue #41.

Uses only an in-memory SQLite database and synthetic identifiers. It models the
ordering used by the current webhook: revenue-ledger insert first, then treasury
increments inside one transaction (matching D1 batch transactional semantics).
No Stripe/network/customer/payment data is used.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "migrations" / "0013_stripe_webhook_idempotency.sql"

ACCOUNTS = {
    "founder": 3000,
    "validators": 4000,
    "hardware": 1000,
    "ecosystem": 1800,
    "zakat": 200,
}


def setup_db() -> sqlite3.Connection:
    db = sqlite3.connect(":memory:")
    db.executescript(
        """
        CREATE TABLE revenue_ledger (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payment_id TEXT NOT NULL,
          stripe_session_id TEXT,
          discord_id TEXT,
          product TEXT NOT NULL,
          gross_amount INTEGER NOT NULL DEFAULT 0,
          founder_amount INTEGER NOT NULL DEFAULT 0,
          validators_amount INTEGER NOT NULL DEFAULT 0,
          hardware_amount INTEGER NOT NULL DEFAULT 0,
          ecosystem_amount INTEGER NOT NULL DEFAULT 0,
          zakat_amount INTEGER NOT NULL DEFAULT 0,
          discord_cut INTEGER NOT NULL DEFAULT 0,
          net_amount INTEGER NOT NULL DEFAULT 0,
          source TEXT DEFAULT 'stripe',
          status TEXT DEFAULT 'pending',
          period TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE treasury_accounts (
          account_type TEXT UNIQUE NOT NULL,
          balance_cents INTEGER NOT NULL DEFAULT 0,
          total_received_cents INTEGER NOT NULL DEFAULT 0
        );
        """
    )
    for account in ACCOUNTS:
        db.execute(
            "INSERT INTO treasury_accounts(account_type) VALUES (?)", (account,)
        )
    db.executescript(MIGRATION.read_text(encoding="utf-8"))
    return db


def apply_checkout(db: sqlite3.Connection, session_id: str) -> bool:
    """Return True if applied; False if duplicate was rejected and rolled back."""
    try:
        db.execute("BEGIN")
        db.execute(
            """
            INSERT INTO revenue_ledger (
              payment_id, stripe_session_id, discord_id, product, gross_amount,
              founder_amount, validators_amount, hardware_amount,
              ecosystem_amount, zakat_amount, discord_cut, net_amount,
              source, status, period
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'stripe', 'confirmed', ?)
            """,
            (
                "pi_synthetic_41",
                session_id,
                "synthetic@example.test",
                "pro",
                10000,
                3000,
                4000,
                1000,
                1800,
                200,
                0,
                10000,
                "2026-09",
            ),
        )
        for account, cents in ACCOUNTS.items():
            db.execute(
                """
                UPDATE treasury_accounts
                   SET balance_cents = balance_cents + ?,
                       total_received_cents = total_received_cents + ?
                 WHERE account_type = ?
                """,
                (cents, cents, account),
            )
        db.commit()
        return True
    except sqlite3.IntegrityError:
        db.rollback()
        return False


def treasury_snapshot(db: sqlite3.Connection) -> list[tuple[str, int, int]]:
    return db.execute(
        """
        SELECT account_type, balance_cents, total_received_cents
          FROM treasury_accounts
         ORDER BY account_type
        """
    ).fetchall()


def main() -> None:
    db = setup_db()

    assert apply_checkout(db, "cs_synthetic_replay_41") is True
    after_first = treasury_snapshot(db)
    assert db.execute(
        "SELECT COUNT(*) FROM revenue_ledger WHERE status='confirmed'"
    ).fetchone()[0] == 1

    # Same synthetic checkout delivered again: must fail before treasury mutation.
    assert apply_checkout(db, "cs_synthetic_replay_41") is False
    assert treasury_snapshot(db) == after_first
    assert db.execute(
        "SELECT COUNT(*) FROM revenue_ledger WHERE status='confirmed'"
    ).fetchone()[0] == 1

    # Failed-invoice accounting is independently de-duplicated.
    db.execute(
        """
        INSERT INTO revenue_ledger (
          payment_id, stripe_session_id, product, gross_amount, source, status, period
        ) VALUES ('pi_failed_41', 'in_synthetic_replay_41', 'failed', 5000,
                  'stripe', 'failed', '2026-09')
        """
    )
    db.commit()
    try:
        db.execute(
            """
            INSERT INTO revenue_ledger (
              payment_id, stripe_session_id, product, gross_amount, source, status, period
            ) VALUES ('pi_failed_41', 'in_synthetic_replay_41', 'failed', 5000,
                      'stripe', 'failed', '2026-09')
            """
        )
        db.commit()
        raise AssertionError("duplicate failed invoice row was not rejected")
    except sqlite3.IntegrityError:
        db.rollback()

    assert db.execute(
        "SELECT COUNT(*) FROM revenue_ledger WHERE status='failed'"
    ).fetchone()[0] == 1

    # Partial indexes do not collapse different lifecycle classes into one row.
    db.execute(
        """
        INSERT INTO revenue_ledger (
          payment_id, stripe_session_id, product, gross_amount, source, status, period
        ) VALUES ('pi_cross_status_41', 'obj_cross_status_41', 'test', 0,
                  'stripe', 'failed', '2026-09')
        """
    )
    db.execute(
        """
        INSERT INTO revenue_ledger (
          payment_id, stripe_session_id, product, gross_amount, source, status, period
        ) VALUES ('pi_cross_status_41', 'obj_cross_status_41', 'test', 0,
                  'stripe', 'confirmed', '2026-09')
        """
    )
    db.commit()

    print("PASS: duplicate Stripe accounting is rejected before treasury mutation")


if __name__ == "__main__":
    main()
