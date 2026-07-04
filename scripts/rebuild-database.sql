-- =====================================================
-- Sky Student Hostel — FULL DATABASE REBUILD
--
-- Sources combined, in order:
--   1. shared/config/database-schema.sql        (base schema: payments, rooms, students, activity_logs)
--   2. admin-setup.sql                          (admin_users table — deleted from repo in commit 42bc116,
--                                                 recovered from git history at commit e068deb; still
--                                                 required by app/api/admin/users/route.ts and /admin/setup)
--   3. shared/config/01-staff-management-schema.sql  through
--      shared/config/09-room-availability-controls.sql
--      (staff roles, student reports, inventory tracking, daily logs,
--       leave requests, student portal, inventory categories, room availability)
--
-- FIX APPLIED: migrations 02/03/04 call trigger_set_timestamp(), a function
-- that is referenced everywhere but never defined anywhere in the repo (it
-- must have only ever existed by hand in the old Supabase SQL editor). It's
-- defined below, right after update_updated_at_column(), so nothing breaks.
--
-- Run this ONCE, top to bottom, in the SQL editor of a NEW Supabase project.
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLES (safe on a brand-new project — nothing to drop)
-- =====================================================
DROP TABLE IF EXISTS student_feedback CASCADE;
DROP TABLE IF EXISTS student_support_tickets CASCADE;
DROP TABLE IF EXISTS room_inventory_category_templates CASCADE;
DROP TABLE IF EXISTS inventory_categories CASCADE;
DROP TABLE IF EXISTS inventory_damage_reports CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS staff_leave_requests CASCADE;
DROP TABLE IF EXISTS staff_daily_logs CASCADE;
DROP TABLE IF EXISTS student_reports CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- =====================================================
-- CREATE BASE TABLES
-- =====================================================

-- Payments
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  amount_to_pay DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  invoice_id VARCHAR(255) UNIQUE NOT NULL,
  paycashless_invoice_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'partially_paid')),
  paid_at TIMESTAMP,
  last_webhook_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Rooms
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  block VARCHAR(10) NOT NULL,
  total_beds INTEGER NOT NULL,
  bed_type VARCHAR(20) NOT NULL CHECK (bed_type IN ('4_bed', '6_bed')),
  available_beds TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, block)
);

-- Students
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  address TEXT NOT NULL,
  state_of_origin VARCHAR(100) NOT NULL,
  lga VARCHAR(100) NOT NULL,
  marital_status VARCHAR(50) NOT NULL,
  religion VARCHAR(100) NOT NULL,
  matric_number VARCHAR(50) UNIQUE NOT NULL,
  course VARCHAR(200) NOT NULL,
  level VARCHAR(50) NOT NULL,
  faculty VARCHAR(200) NOT NULL,
  department VARCHAR(200) NOT NULL,
  weight DECIMAL(5,2) NOT NULL CHECK (weight >= 30.0 AND weight <= 200.0),
  next_of_kin_name VARCHAR(255) NOT NULL,
  next_of_kin_phone VARCHAR(20) NOT NULL,
  next_of_kin_email VARCHAR(255) NOT NULL,
  next_of_kin_relationship VARCHAR(100) NOT NULL,
  block VARCHAR(10) NOT NULL,
  room VARCHAR(100) NOT NULL,
  bedspace_label VARCHAR(50) NOT NULL,
  passport_photo_url TEXT,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin users (recovered — required by app/api/admin/users and /admin/setup)
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity logs (admin_user_id added after admin_users exists)
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INSERT ROOM DATA — 110 ROOMS, 447 BED SPACES
-- =====================================================

INSERT INTO rooms (name, block, total_beds, bed_type, available_beds)
SELECT 'A' || generate_series(1, 24), 'A', 4, '4_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

INSERT INTO rooms (name, block, total_beds, bed_type, available_beds)
SELECT 'B' || generate_series(1, 24), 'B', 4, '4_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

INSERT INTO rooms (name, block, total_beds, bed_type, available_beds)
SELECT 'C' || generate_series(1, 3), 'C', 6, '6_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)', 'Bed 3 (Top)', 'Bed 3 (Down)'];

INSERT INTO rooms (name, block, total_beds, bed_type, available_beds)
SELECT 'C' || generate_series(4, 14), 'C', 4, '4_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

INSERT INTO rooms (name, block, total_beds, bed_type, available_beds)
SELECT 'D' || generate_series(1, 24), 'D', 4, '4_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

INSERT INTO rooms (name, block, total_beds, bed_type, available_beds)
SELECT 'E' || generate_series(1, 24), 'E', 4, '4_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

-- =====================================================
-- BASE INDEXES
-- =====================================================

CREATE INDEX idx_payments_email ON payments(email);
CREATE INDEX idx_payments_phone ON payments(phone);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_paycashless_invoice_id ON payments(paycashless_invoice_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_phone ON students(phone);
CREATE INDEX idx_students_matric ON students(matric_number);
CREATE INDEX idx_students_first_name ON students(first_name);
CREATE INDEX idx_students_last_name ON students(last_name);
CREATE INDEX idx_students_faculty ON students(faculty);
CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_students_level ON students(level);
CREATE INDEX idx_students_state ON students(state_of_origin);
CREATE INDEX idx_students_payment_id ON students(payment_id);
CREATE INDEX idx_students_room ON students(block, room);

CREATE INDEX idx_rooms_block ON rooms(block);
CREATE INDEX idx_rooms_bed_type ON rooms(bed_type);
CREATE INDEX idx_rooms_available_beds ON rooms USING GIN(available_beds);
CREATE INDEX idx_rooms_name_block ON rooms(name, block);

CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

-- =====================================================
-- TIMESTAMP FUNCTIONS + TRIGGERS
-- Both names are used interchangeably across the repo's migration files.
-- trigger_set_timestamp() is the one that was MISSING from the repo entirely.
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BASE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON payments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON payments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON students FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON rooms FOR SELECT USING (true);
CREATE POLICY "Enable update for authenticated users only" ON rooms FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON activity_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON admin_users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for super admins only" ON admin_users FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Enable update for super admins only" ON admin_users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin')
);

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Enable read access for all users" ON storage.objects FOR SELECT USING (bucket_id = 'student-photos');
CREATE POLICY "Enable insert for all users" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-photos');
CREATE POLICY "Enable delete for authenticated users" ON storage.objects FOR DELETE USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');


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

SELECT block, bed_type, COUNT(*) AS room_count, SUM(total_beds) AS total_beds
FROM rooms GROUP BY block, bed_type ORDER BY block, bed_type;

SELECT 'Total Rooms' AS metric, COUNT(*) AS count FROM rooms
UNION ALL
SELECT 'Total Bed Spaces' AS metric, SUM(total_beds) AS count FROM rooms
UNION ALL
SELECT 'Available Bed Spaces' AS metric, SUM(array_length(available_beds, 1)) AS count FROM rooms;

SELECT 'Database rebuild complete — base schema + admin_users + migrations 01-09 applied' AS status;
