-- DC-1: watermark_text for PDF generator; draft_preview is a new valid status value (no schema change)
ALTER TABLE templates ADD COLUMN IF NOT EXISTS watermark_text TEXT;
