-- Comprehensive Investigation: Orphaned Tutor Records
-- Date: 2026-04-06
-- Purpose: Find orphaned availability and search for any username/tutor data
-- COMPATIBLE WITH: Supabase Studio SQL Editor

-- ===========================================================================
-- PART 1: IDENTIFY ORPHANED AVAILABILITY RECORDS
-- ===========================================================================

-- Summary of orphaned records
SELECT
    '=== PART 1: Orphaned Availability Summary ===' as section,
    COUNT(*) as total_orphaned_slots,
    COUNT(DISTINCT ta.tutor_id) as unique_orphaned_tutor_ids
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL;

-- Detailed breakdown by tutor_id
SELECT
    '=== Orphaned Records Detail ===' as section,
    ta.tutor_id,
    LEFT(ta.tutor_id::text, 8) || '...' as short_id,
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
        END, ', ' ORDER BY CASE ta.day_of_week
            WHEN 0 THEN 'Sun'
            WHEN 1 THEN 'Mon'
            WHEN 2 THEN 'Tue'
            WHEN 3 THEN 'Wed'
            WHEN 4 THEN 'Thu'
            WHEN 5 THEN 'Fri'
            WHEN 6 THEN 'Sat'
        END
    ) as days,
    TO_CHAR(MIN(ta.start_time), 'HH24:MI') as earliest_start,
    TO_CHAR(MAX(ta.end_time), 'HH24:MI') as latest_end,
    MIN(ta.created_at) as first_created,
    MAX(ta.updated_at) as last_updated
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
GROUP BY ta.tutor_id
ORDER BY total_slots DESC;

-- ===========================================================================
-- PART 2: CHECK FOR DELETED TUTORS IN BACKUP TABLES
-- ===========================================================================

-- Check if backup table exists
SELECT
    '=== PART 2: Backup Table Check ===' as section,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tutors_dedup_backup_20260405')
        THEN 'Backup table EXISTS'
        ELSE 'Backup table NOT FOUND'
    END as backup_status;

-- If backup exists, show deleted tutors
SELECT
    '=== Deleted Tutors from Backup ===' as section,
    b.tutor_id,
    b.tutor_name,
    b.username,
    b.student_id,
    b.role,
    CASE
        WHEN b.tutor_name ~ '^[a-z]+[0-9]{3,}$' THEN 'USERNAME_IN_NAME'
        WHEN b.tutor_name ~ '^[A-Z]' THEN 'PROPER_NAME'
        ELSE 'OTHER'
    END as name_format
FROM tutors_dedup_backup_20260405 b
LEFT JOIN tutors t ON b.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
    AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tutors_dedup_backup_20260405')
ORDER BY b.tutor_name;

-- Match deleted tutors with orphaned availability
SELECT
    '=== Orphaned Availability with Backup Match ===' as section,
    ta.tutor_id,
    b.tutor_name as backup_tutor_name,
    b.username as backup_username,
    b.student_id as backup_student_id,
    b.role as backup_role,
    COUNT(*) as orphaned_slots_count
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
LEFT JOIN tutors_dedup_backup_20260405 b ON ta.tutor_id = b.tutor_id
WHERE t.tutor_id IS NULL
    AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tutors_dedup_backup_20260405')
GROUP BY ta.tutor_id, b.tutor_name, b.username, b.student_id, b.role
ORDER BY orphaned_slots_count DESC;

-- ===========================================================================
-- PART 3: CHECK CURRENT TUTORS
-- ===========================================================================

SELECT
    '=== PART 3: Current Tutors with Usernames ===' as section,
    tutor_id,
    tutor_name,
    username,
    student_id,
    role,
    (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = t.tutor_id) as availability_count
FROM tutors t
WHERE username IS NOT NULL
ORDER BY tutor_name;

-- ===========================================================================
-- PART 4: PATTERN ANALYSIS
-- ===========================================================================

-- When were orphaned records created vs current tutors?
WITH orphaned_times AS (
    SELECT
        MIN(created_at) as earliest_orphaned,
        MAX(created_at) as latest_orphaned
    FROM tutor_availability ta
    LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
    WHERE t.tutor_id IS NULL
),
tutor_times AS (
    SELECT
        MIN(created_at) as earliest_tutor,
        MAX(created_at) as latest_tutor
    FROM tutors
    WHERE created_at IS NOT NULL
)
SELECT
    '=== PART 4: Timestamp Analysis ===' as section,
    'Orphaned availability' as record_type,
    TO_CHAR(earliest_orphaned, 'YYYY-MM-DD HH24:MI:SS') as earliest,
    TO_CHAR(latest_orphaned, 'YYYY-MM-DD HH24:MI:SS') as latest
FROM orphaned_times
UNION ALL
SELECT
    '=== PART 4: Timestamp Analysis ===' as section,
    'Current tutors' as record_type,
    TO_CHAR(earliest_tutor, 'YYYY-MM-DD HH24:MI:SS') as earliest,
    TO_CHAR(latest_tutor, 'YYYY-MM-DD HH24:MI:SS') as latest
FROM tutor_times;

-- ===========================================================================
-- PART 5: EXPORT ORPHANED IDS
-- ===========================================================================

SELECT
    '=== PART 5: All Orphaned Tutor IDs ===' as section,
    ta.tutor_id,
    LEFT(ta.tutor_id::text, 12) || '...' as truncated_id,
    (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = ta.tutor_id) as slot_count
FROM (
    SELECT DISTINCT ta2.tutor_id
    FROM tutor_availability ta2
    LEFT JOIN tutors t2 ON ta2.tutor_id = t2.tutor_id
    WHERE t2.tutor_id IS NULL
) ta
ORDER BY slot_count DESC;

-- ===========================================================================
-- PART 6: FINAL SUMMARY
-- ===========================================================================

SELECT
    '=== FINAL SUMMARY ===' as section,
    (SELECT COUNT(*) FROM tutor_availability ta LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id WHERE t.tutor_id IS NULL) as orphaned_slots,
    (SELECT COUNT(DISTINCT tutor_id) FROM tutor_availability ta LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id WHERE t.tutor_id IS NULL) as orphaned_tutor_ids,
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tutors_dedup_backup_20260405') THEN 'YES' ELSE 'NO' END) as backup_exists,
    (SELECT COUNT(*) FROM tutors_dedup_backup_20260405 b LEFT JOIN tutors t ON b.tutor_id = t.tutor_id WHERE t.tutor_id IS NULL AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tutors_dedup_backup_20260405')) as deleted_tutors_in_backup;
