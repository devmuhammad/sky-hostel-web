-- =====================================================
-- Sky Student Hostel - Staff Management Enhancement
-- Migration Script: Expand admin_users roles
-- =====================================================

-- Step 1: Drop the existing CHECK constraint on the role column
-- The default name for the constraint is usually table_column_check
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- Step 2: Add the CHECK constraint with currently supported roles
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
CHECK (role IN (
  'super_admin',
  'admin',
  'porter',
  'other'
));

-- Step 3: Add an index on the role column for faster filtering in the Staff Dashboard
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Verification
SELECT 'Staff management schema migration applied successfully' as status;
