-- Add customer_line_id to orders table for buyer LINE notification
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_line_id TEXT;
