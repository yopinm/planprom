-- DC-2: TOC sections for template preview
ALTER TABLE templates ADD COLUMN IF NOT EXISTS toc_sections JSONB;
