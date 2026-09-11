-- Migration 15: Active academic session setting + student enrollment session
-- Safe to re-run. Does not delete data.

-- Seed active session from calendar default (2026/2027 fee) if missing.
INSERT INTO app_settings (key, value)
VALUES (
  'active_academic_session',
  jsonb_build_object(
    'label', '2026/2027',
    'fee_amount', 255700,
    'opened_at', timezone('utc'::text, now()),
    'opened_by', null
  )
)
ON CONFLICT (key) DO NOTHING;

-- Track which session a student last enrolled / picked a room for.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS enrollment_session VARCHAR(16);

CREATE INDEX IF NOT EXISTS idx_students_enrollment_session
  ON students(enrollment_session);

SELECT 'Migration 15 (active academic session) applied successfully' AS status;
