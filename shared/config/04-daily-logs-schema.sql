-- Migration: Phase 4 - Staff Daily Activity Update System

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
  duty_type VARCHAR(255) NOT NULL, -- e.g., 'Routine Cleaning', 'Gate Security', 'Plumbing Repair'
  activities TEXT NOT NULL,
  issues_observed TEXT,
  materials_used TEXT,
  supervisor_status log_status DEFAULT 'pending',
  supervisor_comments TEXT,
  supervisor_id UUID REFERENCES admin_users(id) ON DELETE SET NULL, -- Who reviewed it
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
