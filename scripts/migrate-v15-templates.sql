-- V15 Template Store Migration
-- Tasks: V15-DB-1, V15-DB-2, V15-DB-3
-- Run: psql "$DATABASE_URL" -f scripts/migrate-v15-templates.sql

BEGIN;

-- ─── V15-DB-1: Core catalog tables ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS template_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  parent_id  UUID REFERENCES template_categories(id),
  sort_order INTEGER DEFAULT 0,
  emoji      TEXT
);

CREATE TABLE IF NOT EXISTS templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  tier            TEXT CHECK (tier IN ('free','lite','standard','premium')),
  price_baht      INTEGER NOT NULL CHECK (price_baht IN (0,10,20,50)),
  pdf_path        TEXT NOT NULL,
  preview_path    TEXT,
  thumbnail_path  TEXT,
  page_count      INTEGER,
  has_form_fields BOOLEAN DEFAULT false,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  view_count      INTEGER DEFAULT 0,
  download_count  INTEGER DEFAULT 0,
  sale_count      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS template_category_links (
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  category_id UUID REFERENCES template_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, category_id)
);

CREATE TABLE IF NOT EXISTS template_tags (
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL CHECK (tag IN ('bestseller','trending','staple','new','premium','free')),
  scored_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (template_id, tag)
);

CREATE TABLE IF NOT EXISTS template_searches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query        TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  session_id   TEXT,
  searched_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── V15-DB-2: Orders + free grants ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS template_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        TEXT UNIQUE NOT NULL,
  template_id         UUID REFERENCES templates(id),
  customer_email      TEXT,
  customer_line_id    TEXT,
  amount_baht         INTEGER NOT NULL,
  promptpay_ref       TEXT,
  slip_image_path     TEXT,
  status              TEXT DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment','pending_verify','paid','rejected','refunded','expired'
  )),
  paid_at             TIMESTAMPTZ,
  verified_by         TEXT,
  download_token      TEXT UNIQUE,
  download_expires_at TIMESTAMPTZ,
  download_count      INTEGER DEFAULT 0,
  reject_reason       TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS free_template_grants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_line_id TEXT NOT NULL,
  template_id      UUID REFERENCES templates(id),
  granted_at       TIMESTAMPTZ DEFAULT NOW(),
  download_token   TEXT UNIQUE,
  UNIQUE (customer_line_id, template_id)
);

-- ─── V15-DB-3: Seed categories ───────────────────────────────────────────────

INSERT INTO template_categories (slug, name, emoji, sort_order) VALUES
  ('business',  'ธุรกิจ / เปิดร้าน',       '🏪', 1),
  ('finance',   'การเงิน',                 '💰', 2),
  ('learning',  'เรียนรู้ / พัฒนาตัวเอง',  '📚', 3),
  ('family',    'ครอบครัว / ไลฟ์สไตล์',   '🏠', 4),
  ('career',    'อาชีพ / ออฟฟิศ',          '💼', 5)
ON CONFLICT (slug) DO NOTHING;

-- ─── Indexes for query performance ───────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_templates_status ON templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_tier ON templates(tier);
CREATE INDEX IF NOT EXISTS idx_templates_published_at ON templates(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_orders_status ON template_orders(status);
CREATE INDEX IF NOT EXISTS idx_template_orders_created ON template_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_free_grants_line_id ON free_template_grants(customer_line_id);
CREATE INDEX IF NOT EXISTS idx_template_searches_query ON template_searches(query);

COMMIT;
