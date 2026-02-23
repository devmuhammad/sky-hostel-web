-- Migration: Phase 9 - Room Availability Controls (Open / Reserved / Locked)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_availability_status') THEN
    CREATE TYPE room_availability_status AS ENUM ('open', 'reserved', 'locked');
  END IF;
END $$;

ALTER TABLE IF EXISTS rooms
ADD COLUMN IF NOT EXISTS room_availability_status room_availability_status NOT NULL DEFAULT 'open';

CREATE INDEX IF NOT EXISTS idx_rooms_availability_status ON rooms(room_availability_status);
