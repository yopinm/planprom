-- PROMO: is_secret (Facebook-only codes) + comeback_text (expired display)
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS is_secret     BOOLEAN DEFAULT false;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS comeback_text TEXT;
