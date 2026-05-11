-- PROMO-1/3: Promo Code System
CREATE TABLE IF NOT EXISTS promo_codes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT UNIQUE NOT NULL,
  label          TEXT NOT NULL,
  discount_type  TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_cart_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses       INT,
  used_count     INT NOT NULL DEFAULT 0,
  starts_at      TIMESTAMPTZ NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_code_uses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id    UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  session_id       TEXT,
  discount_applied NUMERIC(10,2) NOT NULL,
  used_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (promo_code_id, order_id)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_baht NUMERIC(10,2) NOT NULL DEFAULT 0;
