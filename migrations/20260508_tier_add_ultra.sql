-- Remove lite (฿10) tier, add ultra (฿100) tier
-- No existing lite templates to migrate (verified 2026-05-08)

ALTER TABLE templates DROP CONSTRAINT templates_tier_check;
ALTER TABLE templates DROP CONSTRAINT templates_price_baht_check;

ALTER TABLE templates
  ADD CONSTRAINT templates_tier_check
  CHECK (tier = ANY (ARRAY['free', 'standard', 'premium', 'ultra']));

ALTER TABLE templates
  ADD CONSTRAINT templates_price_baht_check
  CHECK (price_baht = ANY (ARRAY[0, 20, 50, 100]));
