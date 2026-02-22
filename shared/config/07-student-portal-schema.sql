-- Migration: Phase 7 - Student Portal (Support Tickets + Feedback)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_ticket_status') THEN
    CREATE TYPE student_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_ticket_priority') THEN
    CREATE TYPE student_ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS student_support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  priority student_ticket_priority NOT NULL DEFAULT 'medium',
  status student_ticket_status NOT NULL DEFAULT 'open',
  room_label VARCHAR(50),
  image_url TEXT,
  assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS student_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_support_tickets_student_id ON student_support_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_student_support_tickets_status ON student_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_student_support_tickets_assigned_to ON student_support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_student_feedback_student_id ON student_feedback(student_id);

-- Backward-compatible patch for projects that created the table before image support
ALTER TABLE IF EXISTS student_support_tickets
ADD COLUMN IF NOT EXISTS image_url TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'set_timestamp_student_support_tickets'
    ) THEN
      CREATE TRIGGER set_timestamp_student_support_tickets
      BEFORE UPDATE ON student_support_tickets
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
  END IF;
END $$;

ALTER TABLE student_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view support tickets" ON student_support_tickets;
CREATE POLICY "Staff can view support tickets" ON student_support_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Staff can update support tickets" ON student_support_tickets;
CREATE POLICY "Staff can update support tickets" ON student_support_tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Students can create own tickets" ON student_support_tickets;
CREATE POLICY "Students can create own tickets" ON student_support_tickets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_support_tickets.student_id
      AND students.email = auth.email()
    )
  );

DROP POLICY IF EXISTS "Students can read own tickets" ON student_support_tickets;
CREATE POLICY "Students can read own tickets" ON student_support_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_support_tickets.student_id
      AND students.email = auth.email()
    )
  );

DROP POLICY IF EXISTS "Students can create feedback" ON student_feedback;
CREATE POLICY "Students can create feedback" ON student_feedback
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = student_feedback.student_id
      AND students.email = auth.email()
    )
  );

DROP POLICY IF EXISTS "Staff can view feedback" ON student_feedback;
CREATE POLICY "Staff can view feedback" ON student_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND is_active = true
    )
  );
