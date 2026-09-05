-- Security containment for issue #41.
--
-- The Stripe webhook inserts a revenue_ledger row first in the same D1 batch that
-- increments treasury balances. D1 batch() is transactional: if the first insert
-- violates one of these uniqueness constraints, the whole accounting batch rolls
-- back and the treasury increments are not applied a second time.
--
-- This migration intentionally does NOT delete or rewrite existing accounting
-- history. If historical duplicates already exist, CREATE UNIQUE INDEX will fail
-- closed and require a read-only duplicate review before an operator decides how
-- to reconcile those records.

CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_ledger_stripe_confirmed_session_unique
  ON revenue_ledger(stripe_session_id)
  WHERE source = 'stripe'
    AND status = 'confirmed'
    AND stripe_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_ledger_stripe_failed_session_unique
  ON revenue_ledger(stripe_session_id)
  WHERE source = 'stripe'
    AND status = 'failed'
    AND stripe_session_id IS NOT NULL;
