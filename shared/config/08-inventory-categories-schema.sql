-- Migration: Phase 8 - Inventory Categories + Room Templates + Repair Progress

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'inventory_categories'
  ) THEN
    CREATE TABLE inventory_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(120) NOT NULL UNIQUE,
      slug VARCHAR(120) NOT NULL UNIQUE,
      is_room_template BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'room_inventory_category_templates'
  ) THEN
    CREATE TABLE room_inventory_category_templates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      category_id UUID NOT NULL REFERENCES inventory_categories(id) ON DELETE CASCADE,
      expected_quantity INTEGER NOT NULL DEFAULT 1 CHECK (expected_quantity > 0),
      created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      UNIQUE(room_id, category_id)
    );
  END IF;
END $$;

-- Keep inventory_items backward compatible while linking to canonical categories
ALTER TABLE IF EXISTS inventory_items
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL;

-- Track actions carried out on repair requests and who handled them
ALTER TABLE IF EXISTS inventory_damage_reports
ADD COLUMN IF NOT EXISTS action_taken TEXT;

ALTER TABLE IF EXISTS inventory_damage_reports
ADD COLUMN IF NOT EXISTS handled_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS inventory_damage_reports
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_room_inventory_template_room_id ON room_inventory_category_templates(room_id);
CREATE INDEX IF NOT EXISTS idx_room_inventory_template_category_id ON room_inventory_category_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_damage_reports_item_id ON inventory_damage_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_damage_reports_status ON inventory_damage_reports(status);

-- Seed practical default categories once
INSERT INTO inventory_categories (name, slug, is_room_template, sort_order)
VALUES
  ('Bed Frames', 'bed_frames', true, 10),
  ('Mattresses', 'mattresses', true, 20),
  ('Wardrobes', 'wardrobes', true, 30),
  ('Ceiling Fans', 'ceiling_fans', true, 40),
  ('Lighting', 'lighting', true, 50),
  ('Curtains', 'curtains', true, 60),
  ('Door Locks', 'door_locks', true, 70),
  ('Electrical Sockets', 'electrical_sockets', true, 80),
  ('Plumbing Fixtures', 'plumbing_fixtures', true, 90),
  ('General Furniture', 'general_furniture', false, 100)
ON CONFLICT (slug) DO NOTHING;

-- Try to map existing free-text categories into canonical category IDs
UPDATE inventory_items ii
SET category_id = ic.id
FROM inventory_categories ic
WHERE ii.category_id IS NULL
  AND lower(trim(ii.category)) = replace(ic.slug, '_', ' ');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_inventory_categories'
    ) THEN
      CREATE TRIGGER set_timestamp_inventory_categories
      BEFORE UPDATE ON inventory_categories
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_room_inventory_category_templates'
    ) THEN
      CREATE TRIGGER set_timestamp_room_inventory_category_templates
      BEFORE UPDATE ON room_inventory_category_templates
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
  END IF;
END $$;

ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_inventory_category_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view inventory categories" ON inventory_categories;
CREATE POLICY "Staff can view inventory categories" ON inventory_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Staff can manage inventory categories" ON inventory_categories;
CREATE POLICY "Staff can manage inventory categories" ON inventory_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND role IN ('super_admin', 'admin', 'hostel_manager', 'maintenance', 'porter', 'other')
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Staff can view room inventory templates" ON room_inventory_category_templates;
CREATE POLICY "Staff can view room inventory templates" ON room_inventory_category_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Staff can manage room inventory templates" ON room_inventory_category_templates;
CREATE POLICY "Staff can manage room inventory templates" ON room_inventory_category_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND role IN ('super_admin', 'admin', 'hostel_manager', 'maintenance', 'porter', 'other')
        AND is_active = true
    )
  );
