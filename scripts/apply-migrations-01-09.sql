-- =====================================================
-- Sky Student Hostel — INCREMENTAL MIGRATIONS 01-09
--
-- Use this INSTEAD of rebuild-database.sql if you've already applied the
-- base schema (payments, rooms, students, admin_users, activity_logs) to
-- your Supabase project. This script only ADDS new tables/columns/roles on
-- top of what's already there — it contains no DROP TABLE statements, so it
-- will NOT touch your existing data, admin users, or room records.
--
-- FIX APPLIED: defines trigger_set_timestamp(), a function that migrations
-- 02/03/04 call but that was never actually defined anywhere in the repo
-- (it must have only existed by hand in the old Supabase SQL editor).
-- Without this, those migrations would fail with "function does not exist."
--
-- Run this ONCE, top to bottom, in your Supabase SQL editor.
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- #######################################################
-- ##  MIGRATION 01 — Staff Management (expand roles)   ##
-- #######################################################

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
CHECK (role IN ('super_admin', 'admin', 'porter', 'other'));
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);


-- #######################################################
-- ##  MIGRATION 02 — Student Reports & Behaviour       ##
-- #######################################################

CREATE TYPE report_category AS ENUM ('warning', 'misconduct', 'damage', 'late_payment', 'disturbance', 'commendation');
CREATE TYPE report_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE report_status AS ENUM ('resolved', 'unresolved', 'under_review');

CREATE TABLE student_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  category report_category NOT NULL,
  severity report_severity NOT NULL,
  title VARCHAR(255) NOT NULL,
  comments TEXT,
  evidence_url TEXT,
  status report_status DEFAULT 'unresolved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_timestamp_student_reports
BEFORE UPDATE ON student_reports FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX idx_student_reports_student_id ON student_reports(student_id);
CREATE INDEX idx_student_reports_status ON student_reports(status);

ALTER TABLE student_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view student reports" ON student_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);
CREATE POLICY "Staff can create student reports" ON student_reports FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);
CREATE POLICY "Staff or Admins can update reports" ON student_reports FOR UPDATE USING (
  reporter_id = auth.uid() OR
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND role IN ('super_admin', 'admin', 'hostel_manager') AND is_active = true)
);

ALTER TABLE students ADD COLUMN behaviour_status VARCHAR(20) DEFAULT 'good' CHECK (behaviour_status IN ('good', 'warning', 'flagged'));


-- #######################################################
-- ##  MIGRATION 03 — Hostel Inventory Tracking         ##
-- #######################################################

CREATE TYPE inventory_condition AS ENUM ('good', 'needs_repair', 'spoilt', 'destroyed');

CREATE TABLE inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  condition inventory_condition DEFAULT 'good',
  assigned_to UUID REFERENCES students(id) ON DELETE SET NULL,
  price_estimate NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE inventory_damage_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  cost_estimate NUMERIC(10, 2),
  image_url TEXT,
  responsible_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'unresolved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_timestamp_inventory_items
BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_inventory_damage_reports
BEFORE UPDATE ON inventory_damage_reports FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_damage_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view inventory items" ON inventory_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);
CREATE POLICY "Staff can manage inventory items" ON inventory_items FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND role IN ('super_admin', 'admin', 'hostel_manager', 'maintenance', 'cleaner') AND is_active = true)
);
CREATE POLICY "Staff can view damage reports" ON inventory_damage_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);
CREATE POLICY "Staff can create damage reports" ON inventory_damage_reports FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);


-- #######################################################
-- ##  MIGRATION 04 — Staff Daily Activity Logs         ##
-- #######################################################

CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'night');
CREATE TYPE log_status AS ENUM ('pending', 'approved', 'requires_clarification');

CREATE TABLE staff_daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift shift_type NOT NULL,
  duty_type VARCHAR(255) NOT NULL,
  activities TEXT NOT NULL,
  issues_observed TEXT,
  materials_used TEXT,
  supervisor_status log_status DEFAULT 'pending',
  supervisor_comments TEXT,
  supervisor_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_timestamp_staff_daily_logs
BEFORE UPDATE ON staff_daily_logs FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

ALTER TABLE staff_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view their own logs, Supervisors can view all" ON staff_daily_logs FOR SELECT USING (
  staff_id = auth.uid() OR
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND role IN ('super_admin', 'admin', 'hostel_manager') AND is_active = true)
);
CREATE POLICY "Staff can create their own logs" ON staff_daily_logs FOR INSERT WITH CHECK (
  staff_id = auth.uid() AND
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);
CREATE POLICY "Staff can update unapproved, Supervisors can update all" ON staff_daily_logs FOR UPDATE USING (
  (staff_id = auth.uid() AND supervisor_status = 'pending') OR
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND role IN ('super_admin', 'admin', 'hostel_manager') AND is_active = true)
);


-- #######################################################
-- ##  MIGRATION 05 — Staff Leave Requests + porter role ##
-- #######################################################

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
CHECK (role IN ('super_admin', 'admin', 'porter', 'other'));

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS staff_leave_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status leave_status DEFAULT 'pending',
  approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS set_staff_leave_requests_updated_at ON staff_leave_requests;
CREATE TRIGGER set_staff_leave_requests_updated_at
BEFORE UPDATE ON staff_leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE staff_leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view their own leave requests" ON staff_leave_requests FOR SELECT USING (
  staff_id = (SELECT id FROM admin_users WHERE email = auth.jwt()->>'email')
  OR EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email' AND role IN ('super_admin', 'admin', 'hostel_manager'))
);
CREATE POLICY "Staff can insert their own leave requests" ON staff_leave_requests FOR INSERT WITH CHECK (
  staff_id = (SELECT id FROM admin_users WHERE email = auth.jwt()->>'email')
);
CREATE POLICY "Admins can update leave requests" ON staff_leave_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email' AND role IN ('super_admin', 'admin', 'hostel_manager'))
);


-- #######################################################
-- ##  MIGRATION 06 — Simplified Admin Roles            ##
-- #######################################################

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
CHECK (role IN ('super_admin', 'admin', 'porter', 'other'));
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);


-- #######################################################
-- ##  MIGRATION 07 — Student Portal (Tickets + Feedback)##
-- #######################################################

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

ALTER TABLE IF EXISTS student_support_tickets ADD COLUMN IF NOT EXISTS image_url TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_student_support_tickets') THEN
      CREATE TRIGGER set_timestamp_student_support_tickets
      BEFORE UPDATE ON student_support_tickets FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
  END IF;
END $$;

ALTER TABLE student_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view support tickets" ON student_support_tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);
CREATE POLICY "Staff can update support tickets" ON student_support_tickets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);
CREATE POLICY "Students can create own tickets" ON student_support_tickets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = student_support_tickets.student_id AND students.email = auth.email())
);
CREATE POLICY "Students can read own tickets" ON student_support_tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = student_support_tickets.student_id AND students.email = auth.email())
);
CREATE POLICY "Students can create feedback" ON student_feedback FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = student_feedback.student_id AND students.email = auth.email())
);
CREATE POLICY "Staff can view feedback" ON student_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);


-- #######################################################
-- ##  MIGRATION 08 — Inventory Categories + Templates  ##
-- #######################################################

CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  is_room_template BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS room_inventory_category_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES inventory_categories(id) ON DELETE CASCADE,
  expected_quantity INTEGER NOT NULL DEFAULT 1 CHECK (expected_quantity > 0),
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(room_id, category_id)
);

ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS inventory_damage_reports ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE IF EXISTS inventory_damage_reports ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS inventory_damage_reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_room_inventory_template_room_id ON room_inventory_category_templates(room_id);
CREATE INDEX IF NOT EXISTS idx_room_inventory_template_category_id ON room_inventory_category_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_damage_reports_item_id ON inventory_damage_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_damage_reports_status ON inventory_damage_reports(status);

INSERT INTO inventory_categories (name, slug, is_room_template, sort_order)
VALUES
  ('Bed Frames', 'bed_frames', true, 10),
  ('Mattresses', 'mattresses', true, 20),
  ('Wardrobes', 'wardrobes', true, 30),
  ('Ceiling Fans', 'ceiling_fans', true, 40),
  ('Lighting', 'lighting', true, 50),
  ('Curtains', 'curtains', true, 60),
  ('Door Locks', 'door_locks', true, 70),
  ('Electrical Sockets', 'electrical_sockets', true, 80),
  ('Plumbing Fixtures', 'plumbing_fixtures', true, 90),
  ('General Furniture', 'general_furniture', false, 100)
ON CONFLICT (slug) DO NOTHING;

UPDATE inventory_items ii
SET category_id = ic.id
FROM inventory_categories ic
WHERE ii.category_id IS NULL
  AND lower(trim(ii.category)) = replace(ic.slug, '_', ' ');

CREATE TRIGGER set_timestamp_inventory_categories
BEFORE UPDATE ON inventory_categories FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_room_inventory_category_templates
BEFORE UPDATE ON room_inventory_category_templates FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_inventory_category_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view inventory categories" ON inventory_categories FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);
CREATE POLICY "Staff can manage inventory categories" ON inventory_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND role IN ('super_admin', 'admin', 'hostel_manager', 'maintenance', 'porter', 'other') AND is_active = true)
);
CREATE POLICY "Staff can view room inventory templates" ON room_inventory_category_templates FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND is_active = true)
);
CREATE POLICY "Staff can manage room inventory templates" ON room_inventory_category_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND role IN ('super_admin', 'admin', 'hostel_manager', 'maintenance', 'porter', 'other') AND is_active = true)
);


-- #######################################################
-- ##  MIGRATION 09 — Room Availability Controls        ##
-- #######################################################

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_availability_status') THEN
    CREATE TYPE room_availability_status AS ENUM ('open', 'reserved', 'locked');
  END IF;
END $$;

ALTER TABLE IF EXISTS rooms
ADD COLUMN IF NOT EXISTS room_availability_status room_availability_status NOT NULL DEFAULT 'open';

CREATE INDEX IF NOT EXISTS idx_rooms_availability_status ON rooms(room_availability_status);


-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Migrations 01-09 applied successfully on top of existing base schema' AS status;
