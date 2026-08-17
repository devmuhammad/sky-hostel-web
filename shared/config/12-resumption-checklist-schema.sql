-- Migration: Phase 12 - Digital Resumption Checklist / Gate Verification
-- Same content as scripts/apply-migration-12.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resumption_verification_status') THEN
    CREATE TYPE resumption_verification_status AS ENUM ('pending', 'cleared', 'denied');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS resumption_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(64) NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS student_resumption_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_label VARCHAR(32) NOT NULL DEFAULT '2026/2027',
  status resumption_verification_status NOT NULL DEFAULT 'pending',
  agreement_submitted BOOLEAN NOT NULL DEFAULT false,
  denied_reason TEXT,
  cleared_at TIMESTAMP WITH TIME ZONE,
  cleared_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (student_id, session_label)
);

CREATE TABLE IF NOT EXISTS student_resumption_item_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_id UUID NOT NULL REFERENCES student_resumption_verifications(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES resumption_checklist_items(id) ON DELETE CASCADE,
  present BOOLEAN,
  sold_at_gate BOOLEAN,
  checked_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (verification_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_resumption_verifications_student
  ON student_resumption_verifications(student_id);
CREATE INDEX IF NOT EXISTS idx_resumption_verifications_status
  ON student_resumption_verifications(status);
CREATE INDEX IF NOT EXISTS idx_resumption_verifications_session
  ON student_resumption_verifications(session_label);
CREATE INDEX IF NOT EXISTS idx_resumption_item_checks_verification
  ON student_resumption_item_checks(verification_id);

INSERT INTO resumption_checklist_items (code, label, sort_order, is_mandatory, active)
VALUES
  ('insecticide', '1 Bottle of Insecticide (Fresh supply for 4 months)', 1, true, true),
  ('bedsheets', '2 Bedsheets', 2, true, true),
  ('bedcovers', '2 Bedcovers', 3, true, true),
  ('pillow_cases', '2 Pillow cases', 4, true, true),
  ('mop', '1 Mop', 5, true, true),
  ('broom', '1 Broom', 6, true, true),
  ('dustbin', '1 Dustbin', 7, true, true),
  ('sponges_brushes', 'Iron Sponges & Wall Scrub Brushes', 8, true, true),
  ('toilet_wash', 'Toilet Wash', 9, true, true),
  ('sink_sieve', 'Kitchen Sink Sieve', 10, true, true),
  ('airtight_container', 'Airtight Food Container (No Sacks, Bags, or Nylons)', 11, true, true),
  ('signed_agreement', 'Signed Resumption Agreement Form submitted', 12, true, true),
  ('blacklist_clear', 'Student name checked against DSA Blacklist — CLEAR', 13, true, true),
  ('no_open_food_packaging', 'No sacks, cellophane bags, or open nylons of food found in luggage', 14, true, true)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_mandatory = EXCLUDED.is_mandatory,
  active = EXCLUDED.active;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_student_resumption_verifications') THEN
      CREATE TRIGGER set_timestamp_student_resumption_verifications
      BEFORE UPDATE ON student_resumption_verifications
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_student_resumption_item_checks') THEN
      CREATE TRIGGER set_timestamp_student_resumption_item_checks
      BEFORE UPDATE ON student_resumption_item_checks
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
  END IF;
END $$;

ALTER TABLE resumption_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_resumption_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_resumption_item_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read checklist items" ON resumption_checklist_items;
CREATE POLICY "Staff can read checklist items" ON resumption_checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid() AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM students WHERE students.email = auth.email()
    )
  );

DROP POLICY IF EXISTS "Staff manage verifications" ON student_resumption_verifications;
CREATE POLICY "Staff manage verifications" ON student_resumption_verifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Students read own verifications" ON student_resumption_verifications;
CREATE POLICY "Students read own verifications" ON student_resumption_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_resumption_verifications.student_id
        AND students.email = auth.email()
    )
  );

DROP POLICY IF EXISTS "Staff manage item checks" ON student_resumption_item_checks;
CREATE POLICY "Staff manage item checks" ON student_resumption_item_checks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Students read own item checks" ON student_resumption_item_checks;
CREATE POLICY "Students read own item checks" ON student_resumption_item_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM student_resumption_verifications v
      JOIN students s ON s.id = v.student_id
      WHERE v.id = student_resumption_item_checks.verification_id
        AND s.email = auth.email()
    )
  );

INSERT INTO student_resumption_verifications (student_id, session_label, status)
SELECT s.id, '2026/2027', 'pending'
FROM students s
ON CONFLICT (student_id, session_label) DO NOTHING;
