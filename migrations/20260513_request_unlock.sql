-- J13: Request-only templates + unlock code
ALTER TABLE templates    ADD COLUMN IF NOT EXISTS is_request_only BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE promo_codes  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id);
