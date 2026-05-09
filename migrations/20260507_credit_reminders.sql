-- credit_reminders: one row per user, upserted on each reminder request
CREATE TABLE IF NOT EXISTS credit_reminders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_line_id TEXT NOT NULL UNIQUE,
  remind_at        TIMESTAMPTZ NOT NULL,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS credit_reminders_pending
  ON credit_reminders (remind_at)
  WHERE sent_at IS NULL;
