-- Room availability repair: ADD-BACK ONLY.
-- Run scripts/repair-available-beds-preview.sql first and review its output.
-- Only appends lost beds (valid for the room, missing from available_beds,
-- held by no student) back to available_beds. Never removes a bed and never
-- touches the students table. Safe to re-run.

BEGIN;

WITH expected AS (
  SELECT r.id AS room_id, r.block, r.name, label
  FROM rooms r
  CROSS JOIN LATERAL unnest(
    CASE WHEN r.bed_type = '6_bed'
      THEN ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)', 'Bed 3 (Top)', 'Bed 3 (Down)']
      ELSE ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']
    END
  ) AS label
),
lost AS (
  SELECT e.room_id, array_agg(e.label ORDER BY e.label) AS labels
  FROM expected e
  JOIN rooms r ON r.id = e.room_id
  WHERE NOT (e.label = ANY (COALESCE(r.available_beds, ARRAY[]::text[])))
    AND NOT EXISTS (
      SELECT 1 FROM students s
      WHERE s.block = e.block AND s.room = e.name AND s.bedspace_label = e.label
    )
  GROUP BY e.room_id
)
UPDATE rooms r
SET available_beds = COALESCE(r.available_beds, ARRAY[]::text[]) || lost.labels
FROM lost
WHERE r.id = lost.room_id
RETURNING r.block, r.name, lost.labels AS restored_beds;

COMMIT;
