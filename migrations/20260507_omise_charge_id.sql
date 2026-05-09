-- V15-PAY-5: Omise charge ID columns
ALTER TABLE template_orders ADD COLUMN IF NOT EXISTS omise_charge_id TEXT;
ALTER TABLE pack_credits     ADD COLUMN IF NOT EXISTS omise_charge_id TEXT;
