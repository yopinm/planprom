-- intel_fulfilled: track when admin creates template from analytics suggestion
CREATE TABLE IF NOT EXISTS intel_fulfilled (
  id           SERIAL PRIMARY KEY,
  idea_text    TEXT NOT NULL,
  catalog_slug TEXT,
  engine_type  TEXT,
  fulfilled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intel_fulfilled_at ON intel_fulfilled(fulfilled_at);

-- intel_snapshots: daily priority score snapshot for trend tracking
CREATE TABLE IF NOT EXISTS intel_snapshots (
  id            SERIAL PRIMARY KEY,
  idea_text     TEXT NOT NULL,
  engine_type   TEXT NOT NULL,
  catalog_slug  TEXT,
  score         INT  NOT NULL,
  demand_count  INT  NOT NULL DEFAULT 1,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_intel_snapshots_unique
  ON intel_snapshots(idea_text, engine_type, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_intel_snapshots_date ON intel_snapshots(snapshot_date);
