-- Permanent reject: ไม่แสดงใน recovery list อีก แต่ยังถูก filter ออกจากทุก card
ALTER TABLE intel_rejected ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN NOT NULL DEFAULT false;

-- Index เพื่อ query เร็ว (rejectedSet fetch all, rejectedRaw fetch is_permanent=false)
CREATE INDEX IF NOT EXISTS idx_intel_rejected_permanent ON intel_rejected(is_permanent);
