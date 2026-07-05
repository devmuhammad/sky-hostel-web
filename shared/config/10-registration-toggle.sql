-- Migration: Phase 10 - Registration Open/Closed Toggle

-- Generic lightweight key/value settings table so future admin toggles
-- don't each need their own migration.
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed the registration flag as open by default so existing behavior
-- doesn't change until an admin explicitly closes it.
INSERT INTO app_settings (key, value)
VALUES ('registration_open', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_app_settings') THEN
      CREATE TRIGGER set_timestamp_app_settings
      BEFORE UPDATE ON app_settings
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
  END IF;
END $$;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Public (anon) needs to read this so the registration/invoice pages and
-- the payments API can check whether applications are open.
DROP POLICY IF EXISTS "Public can read settings" ON app_settings;
CREATE POLICY "Public can read settings" ON app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can insert settings" ON app_settings;
CREATE POLICY "Staff can insert settings" ON app_settings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  )
);

DROP POLICY IF EXISTS "Staff can update settings" ON app_settings;
CREATE POLICY "Staff can update settings" ON app_settings FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  )
);
