-- Comprehensive Investigation: Orphaned Tutor Records
-- Date: 2026-04-06
-- Purpose: Find orphaned availability and search for any username/tutor data

-- ===========================================================================
-- PART 1: IDENTIFY ORPHANED AVAILABILITY RECORDS
-- ===========================================================================

\echo '================================================'
\echo 'PART 1: Orphaned Availability Records Summary'
\echo '================================================'

-- Summary of orphaned records
SELECT
    COUNT(*) as total_orphaned_slots,
    COUNT(DISTINCT tutor_id) as unique_orphaned_tutor_ids
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL;

-- Detailed breakdown by tutor_id
\echo ''
\echo 'Orphaned Records by Tutor ID:'
\echo '----------------------------'

SELECT
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
        END, ', ' ORDER BY ta.day_of_week
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

\echo ''
\echo '================================================'
\echo 'PART 2: Checking Backup Tables'
\echo '================================================'

-- Check if deduplication backup exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tutors_dedup_backup_20260405') THEN
        RAISE NOTICE 'Found backup table: tutors_dedup_backup_20260405';

        -- Show tutors that were in backup but deleted
        RAISE NOTICE 'Checking for deleted tutors in backup...';
        PERFORM * FROM (
            SELECT
                b.tutor_id,
                b.tutor_name,
                b.username,
                b.student_id,
                b.role
            FROM tutors_dedup_backup_20260405 b
            LEFT JOIN tutors t ON b.tutor_id = t.tutor_id
            WHERE t.tutor_id IS NULL
        ) as deleted;

    ELSE
        RAISE NOTICE 'No backup table found (tutors_dedup_backup_20260405)';
    END IF;
END $$;

-- If backup exists, query it
SELECT
    'Deleted tutors from backup' as info,
    b.tutor_id,
    b.tutor_name,
    b.username,
    b.student_id,
    b.role
FROM tutors_dedup_backup_20260405 b
LEFT JOIN tutors t ON b.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
    AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tutors_dedup_backup_20260405');

-- ===========================================================================
-- PART 3: CHECK CURRENT TUTORS FOR MATCHES
-- ===========================================================================

\echo ''
\echo '================================================'
\echo 'PART 3: Current Tutors with Usernames'
\echo '================================================'

SELECT
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
-- PART 4: ATTEMPT TO MATCH ORPHANED IDS
-- ===========================================================================

\echo ''
\echo '================================================'
\echo 'PART 4: Matching Attempts'
\echo '================================================'

-- Check if orphaned tutor_ids match ANY existing tutor
-- (unlikely, but worth checking for typos/UUID similarities)
SELECT
    'Orphaned ID matches existing tutor?' as check_type,
    ta.tutor_id as orphaned_id,
    t.tutor_id as matching_tutor_id,
    t.tutor_name,
    t.username
FROM (
    SELECT DISTINCT tutor_id
    FROM tutor_availability ta2
    LEFT JOIN tutors t2 ON ta2.tutor_id = t2.tutor_id
    WHERE t2.tutor_id IS NULL
) ta
CROSS JOIN tutors t
WHERE ta.tutor_id::text LIKE LEFT(t.tutor_id::text, 8) || '%'
LIMIT 10;

-- ===========================================================================
-- PART 5: ANALYZE PATTERNS
-- ===========================================================================

\echo ''
\echo '================================================'
\echo 'PART 5: Pattern Analysis'
\echo '================================================'

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
    'Orphaned availability' as record_type,
    TO_CHAR(earliest_orphaned, 'YYYY-MM-DD HH24:MI:SS') as earliest,
    TO_CHAR(latest_orphaned, 'YYYY-MM-DD HH24:MI:SS') as latest
FROM orphaned_times
UNION ALL
SELECT
    'Current tutors' as record_type,
    TO_CHAR(earliest_tutor, 'YYYY-MM-DD HH24:MI:SS') as earliest,
    TO_CHAR(latest_tutor, 'YYYY-MM-DD HH24:MI:SS') as latest
FROM tutor_times;

-- ===========================================================================
-- PART 6: GENERATE RECOMMENDED ACTIONS
-- ===========================================================================

\echo ''
\echo '================================================'
\echo 'PART 6: Recommendations'
\echo '================================================'

DO $$
DECLARE
    v_orphaned_count INTEGER;
    v_orphaned_tutor_ids INTEGER;
    v_has_backup BOOLEAN;
BEGIN
    -- Count orphaned records
    SELECT COUNT(*), COUNT(DISTINCT tutor_id)
    INTO v_orphaned_count, v_orphaned_tutor_ids
    FROM tutor_availability ta
    LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
    WHERE t.tutor_id IS NULL;

    -- Check for backup
    SELECT EXISTS (
        SELECT 1 FROM pg_tables WHERE tablename = 'tutors_dedup_backup_20260405'
    ) INTO v_has_backup;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'INVESTIGATION SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Orphaned availability records: %', v_orphaned_count;
    RAISE NOTICE 'Unique orphaned tutor_ids: %', v_orphaned_tutor_ids;
    RAISE NOTICE 'Backup table exists: %', v_has_backup;
    RAISE NOTICE '';
    RAISE NOTICE 'RECOMMENDATIONS:';
    RAISE NOTICE '';

    IF v_orphaned_count = 0 THEN
        RAISE NOTICE '✓ No orphaned records found - database is clean!';
    ELSIF v_has_backup THEN
        RAISE NOTICE '1. Check backup table for deleted tutors with usernames';
        RAISE NOTICE '2. If found, restore those specific tutors';
        RAISE NOTICE '3. If not found, consider deleting orphaned availability';
    ELSE
        RAISE NOTICE '1. No backup available to restore tutors from';
        RAISE NOTICE '2. Options:';
        RAISE NOTICE '   a) Delete orphaned availability (data loss)';
        RAISE NOTICE '   b) Create placeholder tutors (Unknown Tutor 1, etc)';
        RAISE NOTICE '   c) Manual investigation needed';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- ===========================================================================
-- PART 7: EXPORT ORPHANED IDS FOR MANUAL REVIEW
-- ===========================================================================

\echo ''
\echo '================================================'
\echo 'PART 7: Orphaned Tutor IDs (for manual review)'
\echo '================================================'

-- List all orphaned tutor_ids for user to investigate
SELECT DISTINCT
    tutor_id,
    LEFT(tutor_id::text, 12) || '...' as truncated_id,
    (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = ta.tutor_id) as slot_count
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
ORDER BY slot_count DESC;
