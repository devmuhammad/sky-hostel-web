-- Migration 16: Per-bed reservations + occupancy-driven room lock/open
-- Safe to re-run. Does not delete data.
--
-- Reserved is no longer a whole-room flag. Each held bedspace stores the
-- bed label and the person it is reserved for. Full rooms are locked in
-- application code when no selectable bedspaces remain.

ALTER TABLE IF EXISTS rooms
ADD COLUMN IF NOT EXISTS bed_reservations jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_rooms_bed_reservations
  ON rooms USING gin (bed_reservations);

SELECT 'Migration 16 (bed reservations) applied successfully' AS status;
