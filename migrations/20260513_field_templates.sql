-- EF-registry: custom field templates managed via admin UI
CREATE TABLE IF NOT EXISTS field_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'text',
  icon        TEXT NOT NULL DEFAULT '✏️',
  grp         TEXT NOT NULL DEFAULT 'Custom',
  preset      JSONB NOT NULL DEFAULT '{}',
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS field_templates_grp_idx ON field_templates (grp, sort_order);
