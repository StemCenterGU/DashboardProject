-- Find and Create Missing Tutors from Existing Availability
-- This will identify tutor_ids in availability that don't have tutor records
-- Then create placeholder tutors for them

-- STEP 1: Check if we have orphaned availability (should be 0 based on previous investigation)
SELECT
    '=== Orphaned Availability Check ===' as info,
    COUNT(*) as orphaned_count,
    COUNT(DISTINCT ta.tutor_id) as orphaned_tutor_ids
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL;

-- STEP 2: Check current tutors and their availability
SELECT
    '=== Current Tutors ===' as info,
    t.tutor_id,
    t.tutor_name,
    t.username,
    t.role,
    COUNT(ta.availability_id) as slot_count
FROM tutors t
LEFT JOIN tutor_availability ta ON t.tutor_id = ta.tutor_id
GROUP BY t.tutor_id, t.tutor_name, t.username, t.role
ORDER BY slot_count DESC;

-- STEP 3: Check for tutors without username
SELECT
    '=== Tutors Without Usernames ===' as info,
    t.tutor_id,
    t.tutor_name,
    t.role,
    COUNT(ta.availability_id) as slot_count
FROM tutors t
LEFT JOIN tutor_availability ta ON t.tutor_id = ta.tutor_id
WHERE t.username IS NULL
GROUP BY t.tutor_id, t.tutor_name, t.role
ORDER BY slot_count DESC;

-- STEP 4: Show lead tutors specifically
SELECT
    '=== Lead Tutors Only ===' as info,
    t.tutor_id,
    t.tutor_name,
    t.username,
    COUNT(ta.availability_id) as slot_count
FROM tutors t
LEFT JOIN tutor_availability ta ON t.tutor_id = ta.tutor_id
WHERE t.role = 'lead_tutor'
GROUP BY t.tutor_id, t.tutor_name, t.username
ORDER BY t.tutor_name;
