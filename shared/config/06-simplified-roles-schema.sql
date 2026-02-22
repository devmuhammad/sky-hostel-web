-- =====================================================
-- Sky Student Hostel - Simplified Admin Roles
-- Migration Script
-- =====================================================

-- Keep only the active roles used by the app.
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
CHECK (role IN (
  'super_admin',
  'admin',
  'porter',
  'other'
));

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

SELECT 'Simplified admin role constraint applied successfully' AS status;
