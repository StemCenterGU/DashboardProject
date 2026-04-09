-- ============================================================================
-- Set Password for Test User
-- ============================================================================
-- This script helps you set a password and verify email for a test user
-- Run this in Supabase SQL Editor
-- ============================================================================

-- OPTION 1: Set password using Supabase Admin API (RECOMMENDED)
-- ----------------------------------------------------------------------------
-- Unfortunately, you cannot directly set passwords via SQL for security reasons.
-- You MUST use one of these methods:

-- Method A: Supabase Dashboard
-- 1. Go to Authentication → Users in Supabase Dashboard
-- 2. Find testtutor@gannon.edu
-- 3. Click the three dots (...) → "Reset Password"
-- 4. Copy the reset link and use it to set password

-- Method B: Mark email as verified and use password reset
-- ----------------------------------------------------------------------------
-- This SQL will verify the email so you can use "Forgot Password" feature

DO $$
DECLARE
  test_email VARCHAR := 'testtutor@gannon.edu'; -- Change if needed
  test_user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = test_email;

  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', test_email;
  END IF;

  -- Mark email as verified
  UPDATE auth.users
  SET
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
  WHERE id = test_user_id;

  RAISE NOTICE '✅ Email verified for: %', test_email;
  RAISE NOTICE '   User ID: %', test_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '   1. Go to your login page';
  RAISE NOTICE '   2. Click "Forgot Password"';
  RAISE NOTICE '   3. Enter: %', test_email;
  RAISE NOTICE '   4. Check your email for reset link';
  RAISE NOTICE '   5. Set a new password';
END $$;


-- ============================================================================
-- OPTION 2: Delete and recreate user properly
-- ============================================================================
-- If the above doesn't work, delete the test user and recreate with password

/*
-- STEP 1: Delete existing test user
DO $$
DECLARE
  test_email VARCHAR := 'testtutor@gannon.edu';
  test_username VARCHAR := 'testtutor';
  test_user_id UUID;
  test_tutor_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO test_user_id FROM auth.users WHERE email = test_email;
  SELECT tutor_id INTO test_tutor_id FROM tutors WHERE username = test_username;

  -- Delete from public.users
  DELETE FROM users WHERE email = test_email;

  -- Delete tutor availability
  IF test_tutor_id IS NOT NULL THEN
    DELETE FROM tutor_availability WHERE tutor_id = test_tutor_id;
    DELETE FROM tutors WHERE tutor_id = test_tutor_id;
  END IF;

  -- Delete from auth.users (this also deletes related auth records)
  DELETE FROM auth.users WHERE id = test_user_id;

  RAISE NOTICE '✅ Deleted test user: %', test_email;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Now recreate the user in Supabase Dashboard:';
  RAISE NOTICE '   1. Go to Authentication → Users';
  RAISE NOTICE '   2. Click "Add User"';
  RAISE NOTICE '   3. Email: %', test_email;
  RAISE NOTICE '   4. Password: [choose a password]';
  RAISE NOTICE '   5. Auto Confirm: YES (toggle on)';
  RAISE NOTICE '   6. Click "Create User"';
  RAISE NOTICE '';
  RAISE NOTICE '   Then run the script below to link to tutor...';
END $$;
*/


-- ============================================================================
-- STEP 2: After recreating user, run this to create tutor and link
-- ============================================================================
/*
DO $$
DECLARE
  test_email VARCHAR := 'testtutor@gannon.edu';
  test_username VARCHAR := 'testtutor';
  new_user_id UUID;
  new_tutor_id UUID;
BEGIN
  -- Get the newly created user ID
  SELECT id INTO new_user_id FROM auth.users WHERE email = test_email;

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please create the user in Dashboard first.';
  END IF;

  -- Create in public.users table
  INSERT INTO users (user_id, email, role, full_name)
  VALUES (new_user_id, test_email, 'tutor', 'Test Tutor')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create tutor with NO availability slots
  INSERT INTO tutors (tutor_name, username, role, user_id)
  VALUES ('Test Tutor', test_username, 'tutor', new_user_id)
  RETURNING tutor_id INTO new_tutor_id;

  RAISE NOTICE '✅ Created tutor profile';
  RAISE NOTICE '   Email: %', test_email;
  RAISE NOTICE '   Username: %', test_username;
  RAISE NOTICE '   User ID: %', new_user_id;
  RAISE NOTICE '   Tutor ID: %', new_tutor_id;
  RAISE NOTICE '   Slots: 0 (empty schedule for testing)';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 You can now log in with:';
  RAISE NOTICE '   Email: %', test_email;
  RAISE NOTICE '   Password: [the password you set in Dashboard]';
END $$;
*/


-- ============================================================================
-- Verify user and tutor are linked correctly
-- ============================================================================
SELECT
  'auth.users' as table_name,
  au.id as user_id,
  au.email,
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
WHERE au.email = 'testtutor@gannon.edu'

UNION ALL

SELECT
  'public.users' as table_name,
  u.user_id::text,
  u.email,
  NULL::timestamptz,
  u.created_at
FROM users u
WHERE u.email = 'testtutor@gannon.edu'

UNION ALL

SELECT
  'tutors' as table_name,
  t.tutor_id::text,
  t.username || ' (username)',
  NULL::timestamptz,
  NULL::timestamptz
FROM tutors t
WHERE t.username = 'testtutor';
