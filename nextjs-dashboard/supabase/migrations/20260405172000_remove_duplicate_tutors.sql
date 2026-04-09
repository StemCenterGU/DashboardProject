-- Remove Duplicate Tutors
-- Date: 2026-04-05
--
-- This migration identifies and removes duplicate tutor records where:
--   - One row has proper data (proper name, username, student_id, role)
--   - Another row has username in tutor_name column (duplicate/bad data)
--
-- Strategy:
--   1. Identify duplicates by matching username
--   2. Keep the "good" row (has proper name format or most complete data)
--   3. Delete the "bad" row (has username in tutor_name)

-- ============================================
-- STEP 1: Preview Duplicates (Run this FIRST!)
-- ============================================

-- Find potential duplicates by username
WITH username_counts AS (
    SELECT
        username,
        COUNT(*) as count
    FROM tutors
    WHERE username IS NOT NULL
    GROUP BY username
    HAVING COUNT(*) > 1
)
SELECT
    t.tutor_id,
    t.tutor_name,
    t.username,
    t.student_id,
    t.role,
    CASE
        WHEN t.tutor_name ~ '^[a-z]+[0-9]{3,}$' THEN 'BAD: Username in tutor_name'
        WHEN t.tutor_name ~ '^[A-Z]' THEN 'GOOD: Proper name format'
        ELSE 'UNCLEAR'
    END as row_quality
FROM tutors t
INNER JOIN username_counts uc ON t.username = uc.username
ORDER BY t.username, row_quality;

-- Count total duplicates
SELECT COUNT(*) as duplicate_username_count
FROM (
    SELECT username
    FROM tutors
    WHERE username IS NOT NULL
    GROUP BY username
    HAVING COUNT(*) > 1
) as dupes;

-- Find duplicates where tutor_name looks like username
WITH duplicates AS (
    SELECT
        t1.tutor_id as bad_row_id,
        t1.tutor_name as bad_tutor_name,
        t1.username,
        t2.tutor_id as good_row_id,
        t2.tutor_name as good_tutor_name,
        t2.student_id,
        t2.role
    FROM tutors t1
    INNER JOIN tutors t2 ON t1.username = t2.username
    WHERE t1.tutor_id != t2.tutor_id  -- Different rows
      AND t1.tutor_name ~ '^[a-z]+[0-9]{3,}$'  -- t1 has username format
      AND t2.tutor_name ~ '^[A-Z]'  -- t2 has proper name
)
SELECT * FROM duplicates;

-- ============================================
-- STEP 2: Backup Current State
-- ============================================

-- Create backup of all tutors
CREATE TEMP TABLE tutors_dedup_backup_20260405 AS
SELECT * FROM tutors;

-- Verify backup
SELECT COUNT(*) as backed_up_tutors FROM tutors_dedup_backup_20260405;

-- ============================================
-- STEP 3: Delete Duplicate Rows (Bad Ones)
-- ============================================

-- Delete tutors where:
--   1. tutor_name contains username format (bad row)
--   2. Another tutor exists with same username but proper name (good row)
DELETE FROM tutors
WHERE tutor_id IN (
    SELECT t1.tutor_id
    FROM tutors t1
    WHERE EXISTS (
        -- Check if a better row exists with same username
        SELECT 1
        FROM tutors t2
        WHERE t2.username = t1.username
          AND t2.tutor_id != t1.tutor_id  -- Different row
          AND t2.tutor_name ~ '^[A-Z]'  -- Has proper name format
          AND t1.tutor_name ~ '^[a-z]+[0-9]{3,}$'  -- Current row has username format
    )
);

-- Alternative: Delete based on data completeness
-- Keep the row with more data (has student_id, role, proper name)
DELETE FROM tutors t1
WHERE EXISTS (
    SELECT 1
    FROM tutors t2
    WHERE t2.username = t1.username
      AND t2.tutor_id != t1.tutor_id
      AND (
          -- t2 is "better" if it has proper name format
          (t2.tutor_name ~ '^[A-Z]' AND t1.tutor_name !~ '^[A-Z]')
          OR
          -- t2 is "better" if it has more complete data
          (
              (t2.student_id IS NOT NULL AND t1.student_id IS NULL)
              OR (t2.role IS NOT NULL AND t1.role IS NULL)
          )
      )
      AND t1.tutor_id > t2.tutor_id  -- Keep older record (lower ID)
);

-- ============================================
-- STEP 4: Verification Queries
-- ============================================

-- Check for remaining duplicates (should be 0)
SELECT
    username,
    COUNT(*) as count
FROM tutors
WHERE username IS NOT NULL
GROUP BY username
HAVING COUNT(*) > 1;

-- Show all tutors with usernames
SELECT
    tutor_id,
    tutor_name,
    username,
    student_id,
    role
FROM tutors
WHERE username IS NOT NULL
ORDER BY username;

-- Count results
SELECT
    COUNT(*) FILTER (WHERE tutor_name ~ '^[a-z]+[0-9]{3,}$') as tutors_with_username_in_name,
    COUNT(*) FILTER (WHERE tutor_name ~ '^[A-Z]') as tutors_with_proper_name,
    COUNT(*) as total_tutors
FROM tutors;

-- ============================================
-- STEP 5: Report
-- ============================================

DO $$
DECLARE
    v_deleted_count INTEGER;
    v_remaining_count INTEGER;
BEGIN
    -- Count how many were deleted (compare to backup)
    SELECT COUNT(*) - (SELECT COUNT(*) FROM tutors)
    INTO v_deleted_count
    FROM tutors_dedup_backup_20260405;

    SELECT COUNT(*) INTO v_remaining_count FROM tutors;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Duplicate Tutors Removal Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Duplicate rows deleted: %', v_deleted_count;
    RAISE NOTICE 'Remaining tutors: %', v_remaining_count;
    RAISE NOTICE 'Backup table: tutors_dedup_backup_20260405';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Verify no duplicate usernames remain';
    RAISE NOTICE '2. Check that good data was preserved';
    RAISE NOTICE '3. Run username cleanup migration next';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- ROLLBACK Instructions (if needed)
-- ============================================

-- To rollback this migration, run:
--
-- DELETE FROM tutors;
-- INSERT INTO tutors SELECT * FROM tutors_dedup_backup_20260405;
