-- Migration: Phase 11 - Daily Log Replies, In-App Notifications,
-- Inventory Item Status + Occupancy Stages, and Room Maintenance Logs.
--
-- Safe/idempotent to run multiple times.

-- =============================================================
-- 1. DAILY LOG COMMENTS (threaded replies visible to all staff)
-- =============================================================
CREATE TABLE IF NOT EXISTS staff_daily_log_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id UUID NOT NULL REFERENCES staff_daily_logs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_daily_log_comments_log_id
  ON staff_daily_log_comments(log_id);

ALTER TABLE staff_daily_log_comments ENABLE ROW LEVEL SECURITY;

-- Anyone who can see the parent log (the author or a supervisor) can read comments.
DROP POLICY IF EXISTS "View comments on visible logs" ON staff_daily_log_comments;
CREATE POLICY "View comments on visible logs" ON staff_daily_log_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_daily_logs l
      WHERE l.id = staff_daily_log_comments.log_id
        AND (
          l.staff_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
              AND role IN ('super_admin', 'admin', 'hostel_manager')
              AND is_active = true
          )
        )
    )
  );

-- Any active staff member who can see the log may reply to it.
DROP POLICY IF EXISTS "Create comments on visible logs" ON staff_daily_log_comments;
CREATE POLICY "Create comments on visible logs" ON staff_daily_log_comments
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND is_active = true
    )
  );

-- =============================================================
-- 2. IN-APP NOTIFICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  type VARCHAR(60) NOT NULL DEFAULT 'general',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link TEXT,
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- =============================================================
-- 3. INVENTORY ITEM STATUS + OCCUPANCY STAGE TRACKING
-- =============================================================
-- General item status independent of the physical "condition" scale.
ALTER TABLE IF EXISTS inventory_items
  ADD COLUMN IF NOT EXISTS item_status VARCHAR(30) NOT NULL DEFAULT 'good';

-- Per occupancy-stage status snapshots.
ALTER TABLE IF EXISTS inventory_items
  ADD COLUMN IF NOT EXISTS status_before_checkin VARCHAR(30);
ALTER TABLE IF EXISTS inventory_items
  ADD COLUMN IF NOT EXISTS status_during_occupancy VARCHAR(30);
ALTER TABLE IF EXISTS inventory_items
  ADD COLUMN IF NOT EXISTS status_after_exit VARCHAR(30);
ALTER TABLE IF EXISTS inventory_items
  ADD COLUMN IF NOT EXISTS stage_notes TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_items_item_status_check'
  ) THEN
    ALTER TABLE inventory_items
      ADD CONSTRAINT inventory_items_item_status_check
      CHECK (item_status IN ('good', 'damaged', 'missing', 'under_maintenance'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_items_stage_status_check'
  ) THEN
    ALTER TABLE inventory_items
      ADD CONSTRAINT inventory_items_stage_status_check
      CHECK (
        (status_before_checkin IS NULL OR status_before_checkin IN ('good', 'damaged', 'missing', 'under_maintenance')) AND
        (status_during_occupancy IS NULL OR status_during_occupancy IN ('good', 'damaged', 'missing', 'under_maintenance')) AND
        (status_after_exit IS NULL OR status_after_exit IN ('good', 'damaged', 'missing', 'under_maintenance'))
      );
  END IF;
END $$;

-- =============================================================
-- 4. ROOM MAINTENANCE LOGS
-- =============================================================
CREATE TABLE IF NOT EXISTS room_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issue_found TEXT NOT NULL,
  action_taken TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  officer_responsible VARCHAR(255),
  complaint_url TEXT,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_room_maintenance_logs_room_id ON room_maintenance_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_room_maintenance_logs_status ON room_maintenance_logs(status);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trigger_set_timestamp') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_room_maintenance_logs') THEN
      CREATE TRIGGER set_timestamp_room_maintenance_logs
      BEFORE UPDATE ON room_maintenance_logs
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
  END IF;
END $$;

ALTER TABLE room_maintenance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view room maintenance logs" ON room_maintenance_logs;
CREATE POLICY "Staff can view room maintenance logs" ON room_maintenance_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Staff can manage room maintenance logs" ON room_maintenance_logs;
CREATE POLICY "Staff can manage room maintenance logs" ON room_maintenance_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND role IN ('super_admin', 'admin', 'hostel_manager', 'maintenance', 'porter', 'other')
        AND is_active = true
    )
  );

-- =============================================================
-- 5. COMPLAINT FORM URL SETTING (Google Form link)
-- =============================================================
INSERT INTO app_settings (key, value)
VALUES ('complaint_form_url', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;
