-- =====================================================
-- Sky Student Hostel - Complete Database Setup
-- =====================================================
-- Run this script in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLES (if they exist)
-- =====================================================
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  invoice_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  block VARCHAR(50) NOT NULL,
  total_beds INTEGER NOT NULL DEFAULT 4,
  available_beds TEXT[] DEFAULT ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, block)
);

-- Create students table (with proper payment_id reference)
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE NOT NULL,
  address TEXT NOT NULL,
  state_of_origin VARCHAR(100) NOT NULL,
  lga VARCHAR(100) NOT NULL,
  marital_status VARCHAR(50) NOT NULL,
  religion VARCHAR(100) NOT NULL,
  
  -- Academic Information
  matric_number VARCHAR(50) UNIQUE NOT NULL,
  course VARCHAR(200) NOT NULL,
  level VARCHAR(50) NOT NULL,
  faculty VARCHAR(200) NOT NULL,
  department VARCHAR(200) NOT NULL,
  
  -- Next of Kin Information
  next_of_kin_name VARCHAR(255) NOT NULL,
  next_of_kin_phone VARCHAR(20) NOT NULL,
  next_of_kin_email VARCHAR(255) NOT NULL,
  next_of_kin_relationship VARCHAR(100) NOT NULL,
  
  -- Accommodation Information
  block VARCHAR(50) NOT NULL,
  room VARCHAR(50) NOT NULL,
  bedspace_label VARCHAR(50) NOT NULL,
  
  -- File Storage
  passport_photo_url TEXT,
  
  -- System Information
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Payments table indexes
CREATE INDEX idx_payments_email ON payments(email);
CREATE INDEX idx_payments_phone ON payments(phone);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Students table indexes
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

-- Rooms table indexes
CREATE INDEX idx_rooms_block ON rooms(block);
CREATE INDEX idx_rooms_available_beds ON rooms USING GIN(available_beds);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- =====================================================
-- CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at 
  BEFORE UPDATE ON students 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at 
  BEFORE UPDATE ON rooms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Insert sample room data
INSERT INTO rooms (name, block, total_beds, available_beds) VALUES
-- Block A
('Room 1', 'Block A', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 2', 'Block A', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 3', 'Block A', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 4', 'Block A', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 5', 'Block A', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),

-- Block B
('Room 1', 'Block B', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 2', 'Block B', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 3', 'Block B', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 4', 'Block B', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 5', 'Block B', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),

-- Block C
('Room 1', 'Block C', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 2', 'Block C', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 3', 'Block C', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 4', 'Block C', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 5', 'Block C', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']);

-- Insert sample payment data for testing
-- NOTE: These are sample amounts for testing - actual payment amounts are configured in PAYMENT_CONFIG
INSERT INTO payments (email, phone, amount_paid, invoice_id, status, paid_at) VALUES
('john.doe@example.com', '08012345678', 219000.00, 'SKY-TEST-001', 'completed', NOW()),
('jane.smith@example.com', '08087654321', 150000.00, 'SKY-TEST-002', 'pending', NULL),
('mike.johnson@example.com', '08098765432', 219000.00, 'SKY-TEST-003', 'completed', NOW() - INTERVAL '1 day');

-- Insert sample student data (using the payment IDs from above)
INSERT INTO students (
  first_name, last_name, email, phone, date_of_birth, address, 
  state_of_origin, lga, marital_status, religion,
  matric_number, course, level, faculty, department,
  next_of_kin_name, next_of_kin_phone, next_of_kin_email, next_of_kin_relationship,
  block, room, bedspace_label, payment_id
) VALUES
(
  'John', 'Doe', 'john.doe@example.com', '08012345678', '2000-05-15',
  '123 Main Street, Lagos', 'Lagos', 'Lagos Island', 'Single', 'Christianity',
  'CSC/2020/001', 'Computer Science', '300 Level', 'Science', 'Computer Science',
  'Mary Doe', '08011111111', 'mary.doe@example.com', 'Mother',
  'Block A', 'Room 1', 'Bed 1 (Top)', 
  (SELECT id FROM payments WHERE email = 'john.doe@example.com')
),
(
  'Mike', 'Johnson', 'mike.johnson@example.com', '08098765432', '1999-12-20',
  '456 University Road, Ibadan', 'Oyo', 'Ibadan North', 'Single', 'Islam',
  'ENG/2019/002', 'Mechanical Engineering', '400 Level', 'Engineering', 'Mechanical Engineering',
  'Ahmed Johnson', '08022222222', 'ahmed.johnson@example.com', 'Father',
  'Block B', 'Room 2', 'Bed 2 (Down)', 
  (SELECT id FROM payments WHERE email = 'mike.johnson@example.com')
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Payments table policies
CREATE POLICY "Enable read access for all users" ON payments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON payments FOR UPDATE USING (auth.role() = 'authenticated');

-- Students table policies
CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON students FOR UPDATE USING (auth.role() = 'authenticated');

-- Rooms table policies
CREATE POLICY "Enable read access for all users" ON rooms FOR SELECT USING (true);
CREATE POLICY "Enable update for authenticated users only" ON rooms FOR UPDATE USING (auth.role() = 'authenticated');

-- Activity logs policies
CREATE POLICY "Enable read access for authenticated users" ON activity_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for all users" ON activity_logs FOR INSERT WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKETS SETUP
-- =====================================================

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true);

-- Storage policies for student photos
CREATE POLICY "Enable read access for all users" ON storage.objects FOR SELECT USING (bucket_id = 'student-photos');
CREATE POLICY "Enable insert for all users" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-photos');
CREATE POLICY "Enable delete for authenticated users" ON storage.objects FOR DELETE USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('payments', 'students', 'rooms', 'activity_logs')
ORDER BY tablename;

-- Verify sample data
SELECT 'Payments' as table_name, COUNT(*) as record_count FROM payments
UNION ALL
SELECT 'Students' as table_name, COUNT(*) as record_count FROM students  
UNION ALL
SELECT 'Rooms' as table_name, COUNT(*) as record_count FROM rooms
UNION ALL
SELECT 'Activity Logs' as table_name, COUNT(*) as record_count FROM activity_logs;

-- Show payment and student relationship
SELECT 
  s.first_name,
  s.last_name,
  s.email,
  p.amount_paid,
  p.status as payment_status,
  s.block,
  s.room,
  s.bedspace_label
FROM students s
JOIN payments p ON s.payment_id = p.id;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

SELECT 'Database setup completed successfully!' as status; 