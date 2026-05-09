-- DC-4: Engine columns for text-to-PDF (checklist / planner)
ALTER TABLE templates ADD COLUMN IF NOT EXISTS engine_type TEXT;
ALTER TABLE templates ADD COLUMN IF NOT EXISTS engine_data JSONB;
