-- V15-PACK-1: Pack Credits System
-- Run: psql $DATABASE_URL -f migrations/20260507_pack_credits.sql

CREATE TABLE IF NOT EXISTS pack_credits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT UNIQUE NOT NULL,
  customer_line_id TEXT NOT NULL,
  pack_id          TEXT NOT NULL,
  amount_baht      INTEGER NOT NULL,
  total_credits    INTEGER NOT NULL,
  used_credits     INTEGER DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pending_payment',
  promptpay_ref    TEXT,
  claimed_at       TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pack_credits_line_status
  ON pack_credits (customer_line_id, status);

ALTER TABLE template_orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'promptpay';
