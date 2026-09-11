-- Mirror of scripts/apply-migration-15.sql

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

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS enrollment_session VARCHAR(16);

CREATE INDEX IF NOT EXISTS idx_students_enrollment_session
  ON students(enrollment_session);
