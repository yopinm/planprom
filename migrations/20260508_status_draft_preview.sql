-- DC-1: add draft_preview as valid template status
ALTER TABLE templates DROP CONSTRAINT templates_status_check;
ALTER TABLE templates ADD CONSTRAINT templates_status_check
  CHECK (status = ANY (ARRAY['draft', 'published', 'archived', 'draft_preview']));
