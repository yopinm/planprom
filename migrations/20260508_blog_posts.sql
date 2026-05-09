-- Blog posts table — for admin-uploaded docx articles
CREATE TABLE IF NOT EXISTS blog_posts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        UNIQUE NOT NULL,
  title           TEXT        NOT NULL,
  description     TEXT        NOT NULL DEFAULT '',
  content         TEXT        NOT NULL DEFAULT '',
  author_name     TEXT        NOT NULL DEFAULT 'ทีมคูปองคุ้ม',
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  category        TEXT        NOT NULL DEFAULT 'guide'
                              CHECK (category IN ('guide','review','news','tips')),
  reading_time_min INT        NOT NULL DEFAULT 3,
  status          TEXT        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','published')),
  pinned          BOOLEAN     NOT NULL DEFAULT false,
  pinned_order    INT         NOT NULL DEFAULT 0,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blog_posts_status_pinned_idx
  ON blog_posts (status, pinned, pinned_order);
