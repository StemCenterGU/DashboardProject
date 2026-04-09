-- Investigation: Orphaned Tutor Availability Records
-- Date: 2026-04-06
-- Purpose: Find availability records without matching tutors and search for username data

-- 1. Find all orphaned availability records
SELECT
    ta.tutor_id,
    COUNT(*) as total_slots,
    ARRAY_AGG(DISTINCT ta.day_of_week ORDER BY ta.day_of_week) as days_with_availability,
    MIN(ta.start_time) as earliest_time,
    MAX(ta.end_time) as latest_time,
    MIN(ta.created_at) as first_created,
    MAX(ta.updated_at) as last_updated
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
GROUP BY ta.tutor_id
ORDER BY total_slots DESC;

-- 2. Get detailed view of orphaned records
SELECT
    ta.availability_id,
    ta.tutor_id,
    ta.day_of_week,
    CASE ta.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    ta.start_time,
    ta.end_time,
    ta.is_available,
    ta.created_at,
    ta.updated_at
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
ORDER BY ta.tutor_id, ta.day_of_week, ta.start_time;

-- 3. Check if these tutor_ids exist in any audit/log tables
-- (This query will fail if no audit tables exist - that's expected)
-- SELECT * FROM tutors_audit WHERE tutor_id IN (
--     SELECT ta.tutor_id
--     FROM tutor_availability ta
--     LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
--     WHERE t.tutor_id IS NULL
-- );

-- 4. Count total orphaned records
SELECT
    COUNT(*) as total_orphaned_records,
    COUNT(DISTINCT tutor_id) as unique_orphaned_tutors
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL;

-- 5. Check if any tutors were recently deleted
-- (Check postgres system tables for recent DELETEs)
-- This may not work depending on your database configuration

-- 6. List all tutors with usernames for comparison
SELECT
    tutor_id,
    tutor_name,
    username,
    student_id,
    role
FROM tutors
WHERE username IS NOT NULL
ORDER BY tutor_name;

-- 7. Find tutors that might have been created and deleted
-- (if created_at/updated_at timestamps overlap with orphaned records)
SELECT
    t.tutor_id,
    t.tutor_name,
    t.username,
    t.created_at as tutor_created,
    COUNT(ta.availability_id) as slots
FROM tutors t
LEFT JOIN tutor_availability ta ON t.tutor_id = ta.tutor_id
WHERE t.created_at IS NOT NULL
  AND ta.availability_id IS NULL  -- tutors without availability
GROUP BY t.tutor_id, t.tutor_name, t.username, t.created_at
ORDER BY tutor_created DESC;
