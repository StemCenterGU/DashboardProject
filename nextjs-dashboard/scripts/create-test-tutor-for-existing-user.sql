-- ============================================================================
-- Create Test Tutor for Empty Schedule Testing
-- ============================================================================
-- This script creates a tutor record with ZERO availability slots
-- and links it to an existing verified user account
--
-- OPTION 1: Use this if you want to link to your CURRENT logged-in user
-- OPTION 2: Use this to create a new tutor for a specific existing user
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Find your existing user
-- ----------------------------------------------------------------------------
-- Run this to see all your existing users:
SELECT
  user_id,
  email,
  role,
  created_at
FROM users
ORDER BY created_at DESC;

-- Copy the user_id and email from above to use in STEP 2


-- ----------------------------------------------------------------------------
-- STEP 2: Create a test tutor and link it to your existing user
-- ----------------------------------------------------------------------------
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with the actual UUID from STEP 1
-- IMPORTANT: Replace 'yourusername' with the prefix of your email (before @)

-- Example: If your email is john.doe@gannon.edu, use 'john.doe' as username

DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS
  test_username VARCHAR := 'yourusername';   -- REPLACE THIS
  test_tutor_name VARCHAR := 'Your Name (Test)'; -- REPLACE THIS
  new_tutor_id UUID;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = test_user_id) THEN
    RAISE EXCEPTION 'User ID not found: %. Please check STEP 1.', test_user_id;
  END IF;

  -- Delete any existing test tutor with this username (cleanup)
  DELETE FROM tutor_availability WHERE tutor_id IN (
    SELECT tutor_id FROM tutors WHERE username = test_username
  );
  DELETE FROM tutors WHERE username = test_username;

  -- Create new tutor with ZERO availability slots
  INSERT INTO tutors (tutor_name, username, role, user_id)
  VALUES (test_tutor_name, test_username, 'tutor', test_user_id)
  RETURNING tutor_id INTO new_tutor_id;

  RAISE NOTICE '✅ Test tutor created successfully!';
  RAISE NOTICE '   Tutor ID: %', new_tutor_id;
  RAISE NOTICE '   Username: %', test_username;
  RAISE NOTICE '   Linked to user: %', test_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. Log in to the application';
  RAISE NOTICE '   2. Navigate to Tutor Schedules page';
  RAISE NOTICE '   3. You should see your schedule with 0 slots';
  RAISE NOTICE '   4. All 7 days should appear with empty templates';
END $$;


-- ----------------------------------------------------------------------------
-- STEP 3: Verify the setup
-- ----------------------------------------------------------------------------
-- Run this to confirm everything is linked correctly:

SELECT
  u.email AS user_email,
  u.role AS user_role,
  t.tutor_name,
  t.username AS tutor_username,
  t.tutor_id,
  (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = t.tutor_id) AS availability_count
FROM users u
LEFT JOIN tutors t ON t.user_id = u.user_id
WHERE u.user_id = 'YOUR_USER_ID_HERE' -- REPLACE with same ID from STEP 2
ORDER BY u.email;

-- Expected result:
-- - user_email: your email
-- - tutor_name: Your Name (Test)
-- - availability_count: 0


-- ----------------------------------------------------------------------------
-- ALTERNATIVE: Quick method using your email
-- ----------------------------------------------------------------------------
-- If you know your email, use this simpler version:

/*
DO $$
DECLARE
  my_email VARCHAR := 'your.email@gannon.edu'; -- REPLACE THIS
  my_user_id UUID;
  my_username VARCHAR;
  new_tutor_id UUID;
BEGIN
  -- Get user_id from email
  SELECT user_id INTO my_user_id FROM users WHERE email = my_email;

  IF my_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', my_email;
  END IF;

  -- Extract username from email (part before @)
  my_username := SPLIT_PART(my_email, '@', 1);

  -- Clean up existing test tutor
  DELETE FROM tutor_availability WHERE tutor_id IN (
    SELECT tutor_id FROM tutors WHERE username = my_username
  );
  DELETE FROM tutors WHERE username = my_username;

  -- Create tutor
  INSERT INTO tutors (tutor_name, username, role, user_id)
  VALUES (my_email || ' (Test Tutor)', my_username, 'tutor', my_user_id)
  RETURNING tutor_id INTO new_tutor_id;

  RAISE NOTICE '✅ Test tutor created!';
  RAISE NOTICE '   Tutor ID: %', new_tutor_id;
  RAISE NOTICE '   Username: %', my_username;
  RAISE NOTICE '   Email: %', my_email;
END $$;
*/


-- ----------------------------------------------------------------------------
-- CLEANUP: Remove test tutor when done testing
-- ----------------------------------------------------------------------------
-- Run this when you're done testing and want to clean up:

/*
-- REPLACE 'yourusername' with the username you used above
DELETE FROM tutor_availability WHERE tutor_id IN (
  SELECT tutor_id FROM tutors WHERE username = 'yourusername'
);
DELETE FROM tutors WHERE username = 'yourusername';

-- Verify cleanup
SELECT COUNT(*) as remaining_test_tutors
FROM tutors
WHERE username = 'yourusername';
-- Should return 0
*/
