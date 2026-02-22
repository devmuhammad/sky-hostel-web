-- Migration: Phase 2 - Student Reports & Behaviour Tracking System

-- Create an enum for report categories to maintain consistency
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
  reporter_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL, -- the staff member reporting this
  category report_category NOT NULL,
  severity report_severity NOT NULL,
  title VARCHAR(255) NOT NULL,
  comments TEXT,
  evidence_url TEXT, -- Link to a file in Supabase storage if they attached a picture/doc
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
