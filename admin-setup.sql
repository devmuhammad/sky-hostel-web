-- Admin Users Setup Script
-- Run this script to set up the admin_users table and create the first admin user

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
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

-- Create indexes for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
CREATE POLICY "Enable read access for authenticated users" ON admin_users FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for super admins only" ON admin_users;
CREATE POLICY "Enable insert for super admins only" ON admin_users FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

DROP POLICY IF EXISTS "Enable update for super admins only" ON admin_users;
CREATE POLICY "Enable update for super admins only" ON admin_users FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update activity_logs table to include admin_user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' AND column_name = 'admin_user_id'
    ) THEN
        ALTER TABLE activity_logs ADD COLUMN admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create policy for activity_logs to allow admin user tracking
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON activity_logs;
CREATE POLICY "Enable insert for authenticated users" ON activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Note: To create the first admin user, use the web interface at /admin/setup
-- or manually insert a record like this:
-- INSERT INTO admin_users (email, first_name, last_name, role) 
-- VALUES ('admin@skyhotel.com', 'Admin', 'User', 'super_admin'); 