-- Create Tutor Records from Usernames
-- Date: 2026-04-06
-- Purpose: Create tutor records for usernames that don't exist yet
-- Run this in Supabase Studio SQL Editor

-- ===========================================================================
-- INSTRUCTIONS:
-- 1. Replace the usernames in the VALUES section below with your actual usernames
-- 2. The script will generate abbreviated names automatically
-- 3. All new tutors will have role='tutor' by default
-- ===========================================================================

-- Example usernames - REPLACE THESE WITH YOUR ACTUAL USERNAMES
-- Format: ('username1'), ('username2'), ('username3')

WITH new_usernames AS (
    SELECT username FROM (VALUES
        ('example001'),
        ('example002'),
        ('example003')
        -- ADD MORE USERNAMES HERE, ONE PER LINE
        -- EXAMPLE: ('smith123'),
        -- EXAMPLE: ('jones456'),
    ) AS t(username)
),
-- Filter out usernames that already exist
missing_usernames AS (
    SELECT nu.username
    FROM new_usernames nu
    LEFT JOIN tutors t ON t.username = nu.username
    WHERE t.username IS NULL
)
-- Insert new tutor records
INSERT INTO tutors (tutor_id, tutor_name, username, role)
SELECT
    gen_random_uuid() as tutor_id,
    -- Generate abbreviated name from username
    -- Example: 'smith123' -> 'S. Smith'
    UPPER(SUBSTRING(username, 1, 1)) || '. ' ||
    INITCAP(REGEXP_REPLACE(username, '[0-9]+$', '')) as tutor_name,
    username,
    'tutor' as role
FROM missing_usernames
RETURNING tutor_id, tutor_name, username, role;

-- Verify the new tutors were created
SELECT
    '=== NEWLY CREATED TUTORS ===' as info,
    tutor_id,
    tutor_name,
    username,
    role,
    created_at
FROM tutors
WHERE username IN (
    SELECT username FROM (VALUES
        ('example001'),
        ('example002'),
        ('example003')
        -- USE THE SAME LIST AS ABOVE
    ) AS t(username)
)
ORDER BY created_at DESC;
