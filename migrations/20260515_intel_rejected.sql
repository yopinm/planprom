-- Admin Feedback Loop: ideas marked "ไม่ใช่ template" by admin
CREATE TABLE IF NOT EXISTS intel_rejected (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_text  TEXT        NOT NULL,
  rejected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(idea_text)
);

-- Allow admin to un-reject (soft-delete the reject record)
-- un-reject = DELETE FROM intel_rejected WHERE idea_text = ?
-- (done via revertRejectedAction in actions.ts)
