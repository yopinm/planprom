-- DC-3: DB sequence for order ID + order_type column
CREATE SEQUENCE IF NOT EXISTS order_seq START 1000 INCREMENT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'cart';
