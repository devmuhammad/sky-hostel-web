-- =====================================================
-- Sky Student Hostel - Staff Leave Requests & Porter Role
-- Migration Script
-- =====================================================

-- Step 1: Update the admin_users role constraint to current supported roles
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
CHECK (role IN (
  'super_admin',
  'admin',
  'porter',
  'other'
));

-- Step 2: Create Leave Request Status Enum
DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create Leave Requests Table
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

-- Step 4: Add trigger for updated_at
DROP TRIGGER IF EXISTS set_staff_leave_requests_updated_at ON staff_leave_requests;
CREATE TRIGGER set_staff_leave_requests_updated_at
BEFORE UPDATE ON staff_leave_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE staff_leave_requests ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies
-- Staff can view their own requests
CREATE POLICY "Staff can view their own leave requests"
  ON staff_leave_requests FOR SELECT
  USING (
    staff_id = (SELECT id FROM admin_users WHERE email = auth.jwt()->>'email')
    OR
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email' AND role IN ('super_admin', 'admin', 'hostel_manager'))
  );

-- Staff can insert their own requests
CREATE POLICY "Staff can insert their own leave requests"
  ON staff_leave_requests FOR INSERT
  WITH CHECK (
    staff_id = (SELECT id FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Only super admins (or admins) can update/approve requests
CREATE POLICY "Admins can update leave requests"
  ON staff_leave_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email' AND role IN ('super_admin', 'admin', 'hostel_manager'))
  );

-- Verification
SELECT 'Leave requests schema and porter role migration applied successfully' as status;
