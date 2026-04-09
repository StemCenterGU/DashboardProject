-- Move Usernames from tutor_name to username Column
-- Date: 2026-04-05
--
-- This migration identifies tutors where the tutor_name column contains
-- Gannon usernames (like 'anjeh001') instead of proper names (like 'Kensy A.')
-- and moves them to the correct username column, setting tutor_name to NULL.
--
-- Username Pattern Criteria:
--   - All lowercase letters followed by numbers (e.g., 'anjeh001', 'wheeler039')
--   - No spaces, no periods, no uppercase letters
--   - Typically 7-12 characters total
--   - Ends with 3 digits (001-999)
--
-- IMPORTANT: This migration temporarily removes the NOT NULL constraint on tutor_name
--            to allow NULL values, then adds it back with a default afterward.

-- ============================================
-- STEP 0: Remove NOT NULL Constraint Temporarily
-- ============================================

-- Remove NOT NULL constraint to allow NULL values during migration
ALTER TABLE tutors ALTER COLUMN tutor_name DROP NOT NULL;

-- ============================================
-- STEP 1: Preview Changes (Already done if previewing)
-- ============================================

-- Show tutors that will be affected
SELECT
    tutor_id,
    tutor_name AS current_tutor_name,
    username AS current_username,
    CASE
        WHEN tutor_name ~ '^[a-z]+[0-9]{3,}$' THEN 'Match: Username pattern'
        WHEN tutor_name !~ '[A-Z\. ]' THEN 'Match: No uppercase/period/space'
        ELSE 'No match'
    END AS match_reason
FROM tutors
WHERE
    -- Username pattern: lowercase letters + numbers at end
    (tutor_name ~ '^[a-z]+[0-9]{3,}$')
    OR
    -- No uppercase letters, periods, or spaces (likely username)
    (tutor_name !~ '[A-Z]' AND tutor_name !~ '\.' AND tutor_name !~ ' ')
ORDER BY tutor_name;

-- Count how many will be affected
SELECT COUNT(*) as tutors_to_update
FROM tutors
WHERE
    (tutor_name ~ '^[a-z]+[0-9]{3,}$')
    OR
    (tutor_name !~ '[A-Z]' AND tutor_name !~ '\.' AND tutor_name !~ ' ');

-- ============================================
-- STEP 2: Backup Current State
-- ============================================

-- Create temporary backup table
CREATE TEMP TABLE tutors_backup_20260405 AS
SELECT * FROM tutors;

-- Verify backup
SELECT COUNT(*) as backed_up_tutors FROM tutors_backup_20260405;

-- ============================================
-- STEP 3: Move Usernames to username Column
-- ============================================

-- Case 1: Move username from tutor_name to username column (only if username is NULL)
-- This handles tutors where username hasn't been populated yet
UPDATE tutors
SET username = tutor_name,
    tutor_name = NULL
WHERE
    -- Match Gannon username pattern (lowercase + numbers)
    ((tutor_name ~ '^[a-z]+[0-9]{3,}$')
    OR
    -- Match anything without uppercase/periods/spaces (likely username)
    (tutor_name !~ '[A-Z]' AND tutor_name !~ '\.' AND tutor_name !~ ' '))
    AND tutor_name IS NOT NULL
    AND username IS NULL;  -- Only if username is empty

-- Case 2: Clear tutor_name where username already exists
-- This handles tutors where username is already populated but tutor_name has a duplicate username
UPDATE tutors
SET tutor_name = NULL
WHERE
    -- Match Gannon username pattern (lowercase + numbers)
    ((tutor_name ~ '^[a-z]+[0-9]{3,}$')
    OR
    -- Match anything without uppercase/periods/spaces (likely username)
    (tutor_name !~ '[A-Z]' AND tutor_name !~ '\.' AND tutor_name !~ ' '))
    AND tutor_name IS NOT NULL
    AND username IS NOT NULL;  -- Username already populated, just clear tutor_name

-- ============================================
-- STEP 4: Verification Queries
-- ============================================

-- Show updated tutors
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
    COUNT(*) FILTER (WHERE tutor_name IS NULL AND username IS NOT NULL) as moved_successfully,
    COUNT(*) FILTER (WHERE tutor_name IS NOT NULL AND username IS NULL) as still_has_name_only,
    COUNT(*) FILTER (WHERE tutor_name IS NULL AND username IS NULL) as both_null,
    COUNT(*) as total_tutors
FROM tutors;

-- Show any tutors that still might have usernames in tutor_name
SELECT tutor_id, tutor_name, username
FROM tutors
WHERE
    tutor_name IS NOT NULL
    AND tutor_name ~ '^[a-z]+[0-9]{3,}$';

-- ============================================
-- STEP 5: Restore NOT NULL Constraint
-- ============================================

-- Add back NOT NULL constraint with a default value
-- This ensures future inserts must have a tutor_name
-- Use 'Unknown' as default for any NULL values
UPDATE tutors
SET tutor_name = 'Unknown'
WHERE tutor_name IS NULL;

-- Now add back the NOT NULL constraint with default
ALTER TABLE tutors ALTER COLUMN tutor_name SET NOT NULL;
ALTER TABLE tutors ALTER COLUMN tutor_name SET DEFAULT 'Unknown';

-- ============================================
-- STEP 6: Report
-- ============================================

DO $$
DECLARE
    v_updated_count INTEGER;
    v_unknown_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_updated_count
    FROM tutors
    WHERE username IS NOT NULL;

    SELECT COUNT(*) INTO v_unknown_count
    FROM tutors
    WHERE tutor_name = 'Unknown';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Username Cleanup Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tutors with usernames: %', v_updated_count;
    RAISE NOTICE 'Tutors with "Unknown" name: %', v_unknown_count;
    RAISE NOTICE 'Backup table: tutors_backup_20260405';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Verify results with SELECT queries above';
    RAISE NOTICE '2. Update "Unknown" names with proper abbreviated names';
    RAISE NOTICE '3. Check that username contains the moved usernames';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- ROLLBACK Instructions (if needed)
-- ============================================

-- To rollback this migration, run:
--
-- Step 1: Temporarily remove NOT NULL constraint
-- ALTER TABLE tutors ALTER COLUMN tutor_name DROP NOT NULL;
--
-- Step 2: Restore data from backup
-- UPDATE tutors t
-- SET tutor_name = b.tutor_name,
--     username = b.username
-- FROM tutors_backup_20260405 b
-- WHERE t.tutor_id = b.tutor_id;
--
-- Step 3: Restore NOT NULL constraint
-- ALTER TABLE tutors ALTER COLUMN tutor_name SET NOT NULL;
