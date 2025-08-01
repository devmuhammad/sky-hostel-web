-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin_users table
CREATE TABLE admin_users (
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

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,  -- Unique: One payment per email
  phone VARCHAR(20) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  invoice_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create students table (COMPLETE VERSION with all registration fields)
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,  -- Unique: One registration per email
  phone VARCHAR(20) UNIQUE NOT NULL,   -- Unique: One registration per phone
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

-- Create activity_logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

CREATE INDEX idx_payments_email ON payments(email);
CREATE INDEX idx_payments_phone ON payments(phone);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_phone ON students(phone);
CREATE INDEX idx_students_matric ON students(matric_number);
CREATE INDEX idx_students_first_name ON students(first_name);
CREATE INDEX idx_students_last_name ON students(last_name);
CREATE INDEX idx_students_faculty ON students(faculty);
CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_students_level ON students(level);
CREATE INDEX idx_students_state ON students(state_of_origin);

CREATE INDEX idx_rooms_block ON rooms(block);
CREATE INDEX idx_rooms_available_beds ON rooms USING GIN(available_beds);

CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample room data
INSERT INTO rooms (name, block, total_beds, available_beds) VALUES
('Room 1', 'Block A', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 2', 'Block A', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 3', 'Block A', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 4', 'Block A', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 5', 'Block A', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),

('Room 1', 'Block B', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 2', 'Block B', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 3', 'Block B', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 4', 'Block B', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 5', 'Block B', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),

('Room 1', 'Block C', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 2', 'Block C', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 3', 'Block C', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 4', 'Block C', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']),
('Room 5', 'Block C', 4, ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']);

-- Set up Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users table
CREATE POLICY "Enable read access for authenticated users" ON admin_users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for super admins only" ON admin_users FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
CREATE POLICY "Enable update for super admins only" ON admin_users FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Create policies for payments table
CREATE POLICY "Enable read access for authenticated users" ON payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON payments FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for students table  
CREATE POLICY "Enable read access for authenticated users" ON students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON students FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for rooms table
CREATE POLICY "Enable read access for all users" ON rooms FOR SELECT USING (true);
CREATE POLICY "Enable update for authenticated users only" ON rooms FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for activity_logs table
CREATE POLICY "Enable read access for authenticated users" ON activity_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON activity_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 