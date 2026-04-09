-- Simple Investigation: Orphaned Tutor Records
-- Date: 2026-04-06
-- Run this in Supabase Studio SQL Editor

-- ===========================================================================
-- PART 1: COUNT ORPHANED RECORDS
-- ===========================================================================

SELECT
    '=== ORPHANED RECORDS SUMMARY ===' as info,
    COUNT(*) as total_orphaned_slots,
    COUNT(DISTINCT ta.tutor_id) as unique_orphaned_tutor_ids
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL;

-- ===========================================================================
-- PART 2: DETAILED ORPHANED RECORDS
-- ===========================================================================

SELECT
    '=== ORPHANED RECORDS DETAIL ===' as info,
    ta.tutor_id,
    SUBSTRING(ta.tutor_id::text, 1, 8) || '...' as short_id,
    COUNT(*) as total_slots,
    STRING_AGG(DISTINCT
        CASE ta.day_of_week
            WHEN 0 THEN 'Sun'
            WHEN 1 THEN 'Mon'
            WHEN 2 THEN 'Tue'
            WHEN 3 THEN 'Wed'
            WHEN 4 THEN 'Thu'
            WHEN 5 THEN 'Fri'
            WHEN 6 THEN 'Sat'
        END, ', '
    ) as days_available,
    MIN(ta.start_time)::time as earliest_start,
    MAX(ta.end_time)::time as latest_end
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
GROUP BY ta.tutor_id
ORDER BY total_slots DESC;

-- ===========================================================================
-- PART 3: SAMPLE ORPHANED AVAILABILITY RECORDS
-- ===========================================================================

SELECT
    '=== SAMPLE ORPHANED SLOTS ===' as info,
    ta.availability_id,
    SUBSTRING(ta.tutor_id::text, 1, 8) || '...' as tutor_id_short,
    CASE ta.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name,
    ta.start_time::time as start_time,
    ta.end_time::time as end_time,
    ta.created_at
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
ORDER BY ta.created_at DESC
LIMIT 20;

-- ===========================================================================
-- PART 4: CURRENT TUTORS (FOR COMPARISON)
-- ===========================================================================

SELECT
    '=== CURRENT TUTORS WITH USERNAMES ===' as info,
    COUNT(*) as total_tutors_with_usernames
FROM tutors
WHERE username IS NOT NULL;

SELECT
    '=== SAMPLE CURRENT TUTORS ===' as info,
    tutor_id,
    tutor_name,
    username,
    student_id,
    role,
    (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = t.tutor_id) as availability_count
FROM tutors t
WHERE username IS NOT NULL
ORDER BY tutor_name
LIMIT 10;

-- ===========================================================================
-- PART 5: CHECK FOR LEAD TUTORS
-- ===========================================================================

SELECT
    '=== LEAD TUTORS COUNT ===' as info,
    COUNT(*) as total_lead_tutors,
    COUNT(CASE WHEN (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = t.tutor_id) > 0 THEN 1 END) as lead_tutors_with_availability
FROM tutors t
WHERE role = 'lead_tutor';

-- ===========================================================================
-- PART 6: RECOMMENDATION
-- ===========================================================================

SELECT
    '=== RECOMMENDATION ===' as info,
    CASE
        WHEN (SELECT COUNT(*) FROM tutor_availability ta LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id WHERE t.tutor_id IS NULL) = 0
        THEN 'No orphaned records found. Database is clean!'
        WHEN (SELECT COUNT(*) FROM tutor_availability ta LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id WHERE t.tutor_id IS NULL) > 0
        THEN 'Orphaned records found. Options: 1) Delete orphaned availability, 2) Create placeholder tutors, 3) Manual investigation needed'
        ELSE 'Unknown status'
    END as recommendation,
    (SELECT COUNT(*) FROM tutor_availability ta LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id WHERE t.tutor_id IS NULL) as orphaned_count;
