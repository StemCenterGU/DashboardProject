-- ============================================================================
-- Fix Test Tutor Role Issue
-- ============================================================================
-- This script diagnoses and fixes the issue where role is null
-- ============================================================================

-- STEP 1: Check if test user exists in auth.users
-- ----------------------------------------------------------------------------
SELECT
  'auth.users' as source,
  id as user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'testtutor@gannon.edu';

-- Expected: Should return 1 row with the user


-- STEP 2: Check if test user exists in public.users with role
-- ----------------------------------------------------------------------------
SELECT
  'public.users' as source,
  user_id,
  email,
  role,
  full_name,
  created_at
FROM users
WHERE email = 'testtutor@gannon.edu';

-- Expected: Should return 1 row with role = 'tutor'
-- If role is NULL or row is missing, that's the problem!


-- STEP 3: Check if tutor record exists
-- ----------------------------------------------------------------------------
SELECT
  'tutors' as source,
  tutor_id,
  tutor_name,
  username,
  role,
  user_id
FROM tutors
WHERE username = 'testtutor';

-- Expected: Should return 1 row


-- STEP 4: Fix - Add/Update user in public.users table with correct role
-- ----------------------------------------------------------------------------
-- Run this to fix the issue:

DO $$
DECLARE
  auth_user_id UUID;
  public_user_exists BOOLEAN;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'testtutor@gannon.edu';

  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found in auth.users. Please create the user in Supabase Dashboard first.';
  END IF;

  RAISE NOTICE 'Found auth user: %', auth_user_id;

  -- Check if user exists in public.users
  SELECT EXISTS(
    SELECT 1 FROM users WHERE user_id = auth_user_id
  ) INTO public_user_exists;

  IF public_user_exists THEN
    -- User exists - update role
    UPDATE users
    SET role = 'tutor'
    WHERE user_id = auth_user_id;

    RAISE NOTICE '✅ Updated existing user role to "tutor"';
  ELSE
    -- User doesn't exist - create it
    INSERT INTO users (user_id, email, role, full_name)
    VALUES (
      auth_user_id,
      'testtutor@gannon.edu',
      'tutor',
      'Test Tutor'
    );

    RAISE NOTICE '✅ Created new user in public.users with role "tutor"';
  END IF;

  -- Update tutor record to link user_id
  UPDATE tutors
  SET user_id = auth_user_id
  WHERE username = 'testtutor'
    AND (user_id IS NULL OR user_id != auth_user_id);

  RAISE NOTICE '✅ Updated tutor record to link to user';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Fix complete! Please try logging in again.';
END $$;


-- STEP 5: Verify the fix worked
-- ----------------------------------------------------------------------------
SELECT
  u.user_id,
  u.email,
  u.role as user_role,
  t.tutor_id,
  t.username as tutor_username,
  t.tutor_name,
  CASE
    WHEN u.user_id IS NOT NULL AND u.role IS NOT NULL THEN '✅ User has role'
    WHEN u.user_id IS NOT NULL AND u.role IS NULL THEN '❌ User exists but role is NULL'
    ELSE '❌ User missing from public.users'
  END as status
FROM auth.users au
LEFT JOIN users u ON u.user_id = au.id
LEFT JOIN tutors t ON t.user_id = au.id
WHERE au.email = 'testtutor@gannon.edu';

-- Expected after fix:
-- - user_role should be 'tutor'
-- - status should be '✅ User has role'


-- STEP 6: Test the API endpoint
-- ----------------------------------------------------------------------------
-- After running the fix, you can test if the role is being returned correctly
-- by logging in and checking the browser console for:
--
-- TutorScheduleView permissions: {
--   role: "tutor",  ← Should NOT be null
--   canEditOwn: true,
--   canEditAll: false,
--   canEdit: true,
--   ...
-- }
