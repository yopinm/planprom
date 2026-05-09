-- J18: Cart + Volume Pricing schema
-- carts, cart_items, orders, order_items
-- template_orders เดิมยังอยู่ครบ — ไม่แตะ

-- Guest carts (session_id cookie)
CREATE TABLE carts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);
CREATE INDEX carts_session_idx ON carts(session_id);
CREATE INDEX carts_expires_idx ON carts(expires_at);

-- Items in cart (deduped by template)
CREATE TABLE cart_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID        NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  template_id UUID        NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, template_id)
);
CREATE INDEX cart_items_cart_idx ON cart_items(cart_id);

-- Orders (one per checkout)
CREATE TABLE orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_uid       TEXT        NOT NULL UNIQUE,
  status          TEXT        NOT NULL DEFAULT 'pending_payment'
                              CHECK (status IN ('pending_payment', 'paid', 'revoked')),
  total_baht      INT         NOT NULL CHECK (total_baht >= 0),
  omise_charge_id TEXT        UNIQUE,
  paid_at         TIMESTAMPTZ,
  fraud_flag      TEXT        NOT NULL DEFAULT 'clean',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX orders_uid_idx    ON orders(order_uid);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_omise_idx  ON orders(omise_charge_id) WHERE omise_charge_id IS NOT NULL;

-- Order items (per-template, price snapshot + download token)
CREATE TABLE order_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  template_id         UUID        NOT NULL REFERENCES templates(id),
  unit_price          INT         NOT NULL CHECK (unit_price >= 0),
  download_token      TEXT        UNIQUE,
  download_expires_at TIMESTAMPTZ,
  download_count      INT         NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  UNIQUE (order_id, template_id)
);
CREATE INDEX order_items_order_idx ON order_items(order_id);
CREATE INDEX order_items_token_idx ON order_items(download_token) WHERE download_token IS NOT NULL;
