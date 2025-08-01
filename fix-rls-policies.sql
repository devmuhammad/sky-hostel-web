-- Fix RLS Policies for admin_users table
-- This script makes the admin_users table accessible to authenticated users

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admin_users';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for super admins only" ON admin_users;
DROP POLICY IF EXISTS "Enable update for super admins only" ON admin_users;

-- Create a simple policy that allows authenticated users to read admin_users
CREATE POLICY "Enable read access for authenticated users" ON admin_users 
FOR SELECT USING (auth.role() = 'authenticated');

-- Create a policy for inserting admin users (only for super admins)
CREATE POLICY "Enable insert for super admins only" ON admin_users 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email' AND role = 'super_admin'
  )
);

-- Create a policy for updating admin users (only for super admins)
CREATE POLICY "Enable update for super admins only" ON admin_users 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = auth.jwt() ->> 'email' AND role = 'super_admin'
  )
);

-- Alternative: If the above policies are too restrictive, use this simpler approach
-- DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
-- CREATE POLICY "Enable read access for authenticated users" ON admin_users 
-- FOR SELECT USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admin_users'; 