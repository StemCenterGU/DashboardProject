-- Delete Unknown Tutors
-- Date: 2026-04-06
-- Purpose: Remove tutors with generic/unknown names that were auto-created incorrectly

-- STEP 1: Preview tutors that will be deleted
SELECT
    '=== TUTORS TO BE DELETED (PREVIEW) ===' as info,
    t.tutor_id,
    t.tutor_name,
    t.username,
    t.role,
    COUNT(ta.availability_id) as slots_will_be_deleted
FROM tutors t
LEFT JOIN tutor_availability ta ON t.tutor_id = ta.tutor_id
WHERE
    -- Match patterns for unknown tutors
    t.tutor_name LIKE 'Unknown%'
    OR t.tutor_name LIKE 'Tutor-%'
    OR t.username IS NULL
    OR t.tutor_name = t.username  -- Name same as username (bad data)
GROUP BY t.tutor_id, t.tutor_name, t.username, t.role
ORDER BY t.tutor_name;

-- STEP 2: Count what will be deleted
SELECT
    '=== DELETION SUMMARY ===' as info,
    COUNT(DISTINCT t.tutor_id) as tutors_to_delete,
    COUNT(ta.availability_id) as availability_slots_to_delete
FROM tutors t
LEFT JOIN tutor_availability ta ON t.tutor_id = ta.tutor_id
WHERE
    t.tutor_name LIKE 'Unknown%'
    OR t.tutor_name LIKE 'Tutor-%'
    OR t.username IS NULL
    OR t.tutor_name = t.username;

-- STEP 3: Delete the unknown tutors and their availability
-- (Availability will be deleted automatically due to CASCADE)
DELETE FROM tutors
WHERE
    tutor_name LIKE 'Unknown%'
    OR tutor_name LIKE 'Tutor-%'
    OR username IS NULL
    OR tutor_name = username;

-- STEP 4: Verify deletion
SELECT
    '=== VERIFICATION: Remaining Lead Tutors ===' as info,
    t.tutor_id,
    t.tutor_name,
    t.username,
    t.role,
    COUNT(ta.availability_id) as slot_count
FROM tutors t
LEFT JOIN tutor_availability ta ON t.tutor_id = ta.tutor_id
WHERE t.role = 'lead_tutor'
GROUP BY t.tutor_id, t.tutor_name, t.username, t.role
ORDER BY t.tutor_name;

-- STEP 5: Count remaining tutors
SELECT
    '=== FINAL COUNTS ===' as info,
    (SELECT COUNT(*) FROM tutors) as total_tutors_remaining,
    (SELECT COUNT(*) FROM tutors WHERE role = 'lead_tutor') as lead_tutors_remaining,
    (SELECT COUNT(*) FROM tutor_availability) as total_availability_slots;
