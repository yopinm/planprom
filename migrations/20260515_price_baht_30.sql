-- Update price_baht constraint: free(0) · standard(30) · request(50)
ALTER TABLE templates DROP CONSTRAINT templates_price_baht_check;
ALTER TABLE templates ADD CONSTRAINT templates_price_baht_check
  CHECK (price_baht = ANY (ARRAY[0, 30, 50]));
