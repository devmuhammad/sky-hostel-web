-- Migration: Phase 3 - Hostel Inventory Tracking System

-- Create an enum for inventory condition
CREATE TYPE inventory_condition AS ENUM (
  'good',
  'needs_repair',
  'spoilt',
  'destroyed'
);

-- Creating the inventory_items table
CREATE TABLE inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., 'furniture', 'electronics', 'plumbing'
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL, -- Can be null if it's in a general area or storage
  condition inventory_condition DEFAULT 'good',
  assigned_to UUID REFERENCES students(id) ON DELETE SET NULL, -- Optional: Tie an item to a specific student (e.g. mattress)
  price_estimate NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Creating the inventory_damage_reports table
CREATE TABLE inventory_damage_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  cost_estimate NUMERIC(10, 2),
  image_url TEXT,
  responsible_student_id UUID REFERENCES students(id) ON DELETE SET NULL, -- If a student broke it
  status VARCHAR(50) DEFAULT 'unresolved', -- e.g., 'unresolved', 'in_progress', 'resolved'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Triggers for updated_at
CREATE TRIGGER set_timestamp_inventory_items
BEFORE UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_inventory_damage_reports
BEFORE UPDATE ON inventory_damage_reports
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policies

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_damage_reports ENABLE ROW LEVEL SECURITY;

-- Allow active staff to read/update inventory
CREATE POLICY "Staff can view inventory items" ON inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Staff can manage inventory items" ON inventory_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'hostel_manager', 'maintenance', 'cleaner')
      AND is_active = true
    )
  );

CREATE POLICY "Staff can view damage reports" ON inventory_damage_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Staff can create damage reports" ON inventory_damage_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND is_active = true
    )
  );
