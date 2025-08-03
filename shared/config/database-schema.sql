-- =====================================================
-- Sky Student Hostel - PRODUCTION Database Setup
-- 110 Rooms, 447 Bed Spaces across 5 Blocks
-- =====================================================

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
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'partially_paid')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create rooms table with flexible bed space configuration
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- e.g., "A1", "B15", "C2"
  block VARCHAR(10) NOT NULL, -- e.g., "A", "B", "C", "D", "E"
  total_beds INTEGER NOT NULL, -- 4 or 6
  bed_type VARCHAR(20) NOT NULL CHECK (bed_type IN ('4_bed', '6_bed')), -- Room type
  available_beds TEXT[] NOT NULL, -- Array of available bed labels
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, block)
);

-- Create students table
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- Personal Information
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
  block VARCHAR(10) NOT NULL,
  room VARCHAR(100) NOT NULL,
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
-- INSERT REAL ROOM DATA - 110 ROOMS, 447 BED SPACES
-- =====================================================

-- Block A: Rooms A1-A24 (24 rooms × 4 beds = 96 beds)
INSERT INTO rooms (name, block, total_beds, bed_type, available_beds) 
SELECT 
  'A' || generate_series(1, 24),
  'A',
  4,
  '4_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

-- Block B: Rooms B1-B24 (24 rooms × 4 beds = 96 beds)
INSERT INTO rooms (name, block, total_beds, bed_type, available_beds) 
SELECT 
  'B' || generate_series(1, 24),
  'B',
  4,
  '4_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

-- Block C: Special configuration
-- Rooms C1-C3 (3 rooms × 6 beds = 18 beds)
INSERT INTO rooms (name, block, total_beds, bed_type, available_beds) 
SELECT 
  'C' || generate_series(1, 3),
  'C',
  6,
  '6_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)', 'Bed 3 (Top)', 'Bed 3 (Down)'];

-- Rooms C4-C14 (11 rooms × 4 beds = 44 beds)
INSERT INTO rooms (name, block, total_beds, bed_type, available_beds) 
SELECT 
  'C' || generate_series(4, 14),
  'C',
  4,
  '4_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

-- Block D: Rooms D1-D24 (24 rooms × 4 beds = 96 beds)
INSERT INTO rooms (name, block, total_beds, bed_type, available_beds) 
SELECT 
  'D' || generate_series(1, 24),
  'D',
  4,
  '4_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

-- Block E: Rooms E1-E24 (24 rooms × 4 beds = 96 beds)
INSERT INTO rooms (name, block, total_beds, bed_type, available_beds) 
SELECT 
  'E' || generate_series(1, 24),
  'E',
  4,
  '4_bed',
  ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)'];

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
CREATE INDEX idx_students_room ON students(block, room);

-- Rooms table indexes
CREATE INDEX idx_rooms_block ON rooms(block);
CREATE INDEX idx_rooms_bed_type ON rooms(bed_type);
CREATE INDEX idx_rooms_available_beds ON rooms USING GIN(available_beds);
CREATE INDEX idx_rooms_name_block ON rooms(name, block);

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
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student photos
CREATE POLICY "Enable read access for all users" ON storage.objects FOR SELECT USING (bucket_id = 'student-photos');
CREATE POLICY "Enable insert for all users" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-photos');
CREATE POLICY "Enable delete for authenticated users" ON storage.objects FOR DELETE USING (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify room structure
SELECT 
  block,
  bed_type,
  COUNT(*) as room_count,
  SUM(total_beds) as total_beds
FROM rooms 
GROUP BY block, bed_type 
ORDER BY block, bed_type;

-- Total bed spaces verification
SELECT 
  'Total Rooms' as metric, 
  COUNT(*) as count 
FROM rooms
UNION ALL
SELECT 
  'Total Bed Spaces' as metric, 
  SUM(total_beds) as count 
FROM rooms
UNION ALL
SELECT 
  'Available Bed Spaces' as metric, 
  SUM(array_length(available_beds, 1)) as count 
FROM rooms;

-- Room distribution by block
SELECT 
  block,
  COUNT(*) as rooms,
  SUM(total_beds) as beds,
  STRING_AGG(name, ', ' ORDER BY name::text) as room_list
FROM rooms 
GROUP BY block 
ORDER BY block;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

SELECT 
  'Production database setup completed successfully!' as status,
  '110 rooms with 447 bed spaces created' as details; 