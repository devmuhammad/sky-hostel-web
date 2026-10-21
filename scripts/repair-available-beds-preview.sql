-- Room availability check: READ-ONLY. Safe to run at any time.
-- Run this before scripts/repair-available-beds-apply.sql.

-- 1. Lost beds: valid for the room, missing from available_beds, and not
--    held by any student. These are what the apply script would add back.
--    If this returns no rows, no repair is needed.
WITH expected AS (
  SELECT r.id AS room_id, r.block, r.name, label
  FROM rooms r
  CROSS JOIN LATERAL unnest(
    CASE WHEN r.bed_type = '6_bed'
      THEN ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)', 'Bed 3 (Top)', 'Bed 3 (Down)']
      ELSE ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']
    END
  ) AS label
)
SELECT e.block, e.name AS room, array_agg(e.label ORDER BY e.label) AS lost_beds
FROM expected e
JOIN rooms r ON r.id = e.room_id
WHERE NOT (e.label = ANY (COALESCE(r.available_beds, ARRAY[]::text[])))
  AND NOT EXISTS (
    SELECT 1 FROM students s
    WHERE s.block = e.block AND s.room = e.name AND s.bedspace_label = e.label
  )
GROUP BY e.block, e.name
ORDER BY e.block, e.name;

-- 2. Students whose room or bed does not match a real room/bed.
--    Review by hand; neither script changes these.
SELECT s.id, s.first_name, s.last_name, s.matric_number, s.block, s.room, s.bedspace_label
FROM students s
LEFT JOIN rooms r ON r.block = s.block AND r.name = s.room
WHERE s.bedspace_label IS NOT NULL
  AND (
    r.id IS NULL
    OR NOT (s.bedspace_label = ANY (
      CASE WHEN r.bed_type = '6_bed'
        THEN ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)', 'Bed 3 (Top)', 'Bed 3 (Down)']
        ELSE ARRAY['Bed 1 (Top)', 'Bed 1 (Down)', 'Bed 2 (Top)', 'Bed 2 (Down)']
      END
    ))
  )
ORDER BY s.block, s.room;

-- 3. Beds assigned to more than one student.
SELECT block, room, bedspace_label, count(*) AS students
FROM students
WHERE bedspace_label IS NOT NULL
GROUP BY block, room, bedspace_label
HAVING count(*) > 1
ORDER BY block, room;
