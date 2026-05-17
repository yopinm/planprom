-- INTEL-EXCEL: admin-uploaded market research ideas
CREATE TABLE IF NOT EXISTS intel_excel_ideas (
  id           SERIAL PRIMARY KEY,
  idea_text    TEXT NOT NULL,
  title_en     TEXT,
  ranking_need INTEGER NOT NULL CHECK (ranking_need BETWEEN 1 AND 10),
  engine_type  TEXT NOT NULL CHECK (engine_type IN ('checklist','form','report','planner','pipeline')),
  uploaded_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (idea_text, engine_type)
);

CREATE INDEX IF NOT EXISTS idx_intel_excel_engine ON intel_excel_ideas (engine_type);
CREATE INDEX IF NOT EXISTS idx_intel_excel_ranking ON intel_excel_ideas (ranking_need DESC);
