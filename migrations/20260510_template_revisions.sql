CREATE TABLE IF NOT EXISTS template_revisions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID        NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  revision_number INT         NOT NULL,
  engine_data     JSONB       NOT NULL,
  pdf_path        TEXT        NOT NULL,
  preview_path    TEXT,
  change_note     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_template_revisions_template_id
  ON template_revisions(template_id);
