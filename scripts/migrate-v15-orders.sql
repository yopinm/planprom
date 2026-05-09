-- V15 Orders migration — trust-based payment flow
-- Tasks: V15-PAY-1 (claim-paid columns + anti-fraud)

BEGIN;

ALTER TABLE template_orders
  ADD COLUMN IF NOT EXISTS claimed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fraud_flag       TEXT DEFAULT 'clean'
    CHECK (fraud_flag IN ('clean','suspicious','revoked')),
  ADD COLUMN IF NOT EXISTS is_verified      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS revoked_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoke_reason    TEXT;

-- Index for anti-fraud lookups
CREATE INDEX IF NOT EXISTS idx_orders_line_claimed
  ON template_orders(customer_line_id, claimed_at DESC)
  WHERE customer_line_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_fraud_flag
  ON template_orders(fraud_flag)
  WHERE fraud_flag <> 'clean';

CREATE INDEX IF NOT EXISTS idx_orders_download_token
  ON template_orders(download_token)
  WHERE download_token IS NOT NULL;

COMMIT;
