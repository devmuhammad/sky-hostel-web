# Sky Hostel Management Module - Database Migrations

This document contains all the necessary SQL commands to update your Supabase database for the new Staff Management, Student Reports, and Inventory Tracking features. 

Please copy the SQL blocks below and execute them in your Supabase SQL Editor.

## 1. Phase 1: Staff Management Schema Update
Updates the existing `admin_users` table to support the new roles.

```sql
-- Step 1: Drop the existing CHECK constraint on the role column
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- Step 2: Add the new CHECK constraint with all supported roles
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
CHECK (role IN (
  'super_admin',
  'admin',
  'security',
  'cleaner',
  'maintenance',
  'front_desk',
  'hostel_manager',
  'accountant'
));

-- Step 3: Add an index on the role column for faster filtering in the Staff Dashboard
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
```

---

## 2. Phase 2: Student Reports & Behaviour Tracking System
Creates the tables and logic required for logging student behaviour and auto-flagging.

```sql
-- Create an enum for report categories
CREATE TYPE report_category AS ENUM (
  'warning', 
  'misconduct', 
  'damage', 
  'late_payment', 
  'disturbance', 
  'commendation'
);

-- Create an enum for severity levels
CREATE TYPE report_severity AS ENUM (
  'low', 
  'medium', 
  'high'
);

-- Create an enum for resolution statuses
CREATE TYPE report_status AS ENUM (
  'resolved', 
  'unresolved',
  'under_review'
);

-- Creating the student_reports table
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

-- Add updated_at trigger for student_reports
CREATE TRIGGER set_timestamp_student_reports
BEFORE UPDATE ON student_reports
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Create Indexes for faster lookups
CREATE INDEX idx_student_reports_student_id ON student_reports(student_id);
CREATE INDEX idx_student_reports_status ON student_reports(status);

-- RLS Policies
ALTER TABLE student_reports ENABLE ROW LEVEL SECURITY;

-- Allow all active staff to view reports
CREATE POLICY "Staff can view student reports" ON student_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND is_active = true
    )
  );

-- Allow all active staff to insert reports
CREATE POLICY "Staff can create student reports" ON student_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND is_active = true
    )
  );

-- Allow staff who created the report OR super admins to update it
CREATE POLICY "Staff or Admins can update reports" ON student_reports
  FOR UPDATE
  USING (
    reporter_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'hostel_manager')
      AND is_active = true
    )
  );

-- Add behaviour_status to students table for auto-flagging
ALTER TABLE students ADD COLUMN behaviour_status VARCHAR(20) DEFAULT 'good' CHECK (behaviour_status IN ('good', 'warning', 'flagged'));
```

---

## 3. Phase 3: Hostel Inventory Tracking System
Creates the tables for tracking items and reporting damage.

```sql
-- Create an enum for inventory condition
CREATE TYPE inventory_condition AS ENUM (
  'good',
  'needs_repair',
  'spoilt',
  'destroyed'
);

-- Creating the inventory_items table
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

-- Creating the inventory_damage_reports table
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

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_inventory_items
BEFORE UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_inventory_damage_reports
BEFORE UPDATE ON inventory_damage_reports
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policies
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_damage_reports ENABLE ROW LEVEL SECURITY;

-- Allow active staff to read/update inventory
CREATE POLICY "Staff can view inventory items" ON inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Staff can manage inventory items" ON inventory_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'hostel_manager', 'maintenance', 'cleaner')
      AND is_active = true
    )
  );

CREATE POLICY "Staff can view damage reports" ON inventory_damage_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Staff can create damage reports" ON inventory_damage_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND is_active = true
```

---

## 4. Phase 4: Staff Daily Activity Update System
Creates the tables for tracking daily staff activity logs.

```sql
-- Create an enum for shift types
CREATE TYPE shift_type AS ENUM (
  'morning',
  'afternoon',
  'night'
);

-- Create an enum for supervisor review status
CREATE TYPE log_status AS ENUM (
  'pending',
  'approved',
  'requires_clarification'
);

-- Creating the staff_daily_logs table
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

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_staff_daily_logs
BEFORE UPDATE ON staff_daily_logs
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policies
ALTER TABLE staff_daily_logs ENABLE ROW LEVEL SECURITY;

-- Staff can view their own logs, supervisors can view all
CREATE POLICY "Staff can view their own logs, Supervisors can view all" ON staff_daily_logs
  FOR SELECT
  USING (
    staff_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'hostel_manager')
      AND is_active = true
    )
  );

-- Active staff can create their own logs
CREATE POLICY "Staff can create their own logs" ON staff_daily_logs
  FOR INSERT
  WITH CHECK (
    staff_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND is_active = true
    )
  );

-- Only supervisors or the creator (before approval) can update
CREATE POLICY "Staff can update unapproved, Supervisors can update all" ON staff_daily_logs
  FOR UPDATE
  USING (
    (staff_id = auth.uid() AND supervisor_status = 'pending') OR
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'hostel_manager')
      AND is_active = true
    )
  );
```
