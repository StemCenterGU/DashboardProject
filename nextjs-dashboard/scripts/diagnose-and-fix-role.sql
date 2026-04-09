-- ============================================================================
-- COMPREHENSIVE DIAGNOSIS AND FIX FOR ROLE ISSUE
-- ============================================================================

-- STEP 1: Check all three tables
-- ----------------------------------------------------------------------------
SELECT 'Step 1: Checking all tables' as info;

-- Check auth.users
SELECT
  '1. auth.users' as table_name,
  id,
  email,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users
WHERE email = 'testtutor@gannon.edu';

-- Check public.users
SELECT
  '2. public.users' as table_name,
  user_id,
  email,
  role,
  full_name
FROM users
WHERE email = 'testtutor@gannon.edu';

-- Check tutors
SELECT
  '3. tutors' as table_name,
  tutor_id,
  username,
  tutor_name,
  role as tutor_role,
  user_id
FROM tutors
WHERE username = 'testtutor';


-- STEP 2: Fix the linkage and role
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  auth_id UUID;
  public_user_exists BOOLEAN;
  tutor_exists BOOLEAN;
BEGIN
  RAISE NOTICE '=== STARTING FIX ===';

  -- Get auth user ID
  SELECT id INTO auth_id FROM auth.users WHERE email = 'testtutor@gannon.edu';

  IF auth_id IS NULL THEN
    RAISE EXCEPTION 'User does not exist in auth.users. Create user in Dashboard first!';
  END IF;

  RAISE NOTICE 'Auth User ID: %', auth_id;

  -- Check if public.users record exists
  SELECT EXISTS(SELECT 1 FROM users WHERE user_id = auth_id) INTO public_user_exists;

  IF public_user_exists THEN
    RAISE NOTICE 'User exists in public.users - updating...';

    UPDATE users
    SET
      role = 'tutor',
      email = 'testtutor@gannon.edu',
      full_name = COALESCE(full_name, 'Test Tutor')
    WHERE user_id = auth_id;

    RAISE NOTICE '✅ Updated existing record in public.users';
  ELSE
    RAISE NOTICE 'User NOT in public.users - creating...';

    INSERT INTO users (user_id, email, role, full_name)
    VALUES (auth_id, 'testtutor@gannon.edu', 'tutor', 'Test Tutor');

    RAISE NOTICE '✅ Created new record in public.users';
  END IF;

  -- Check if tutor exists
  SELECT EXISTS(SELECT 1 FROM tutors WHERE username = 'testtutor') INTO tutor_exists;

  IF tutor_exists THEN
    RAISE NOTICE 'Tutor exists - linking to user...';

    UPDATE tutors
    SET user_id = auth_id
    WHERE username = 'testtutor';

    RAISE NOTICE '✅ Linked tutor to user';
  ELSE
    RAISE NOTICE 'Tutor NOT found - creating...';

    INSERT INTO tutors (tutor_name, username, role, user_id)
    VALUES ('Test Tutor', 'testtutor', 'tutor', auth_id);

    RAISE NOTICE '✅ Created tutor and linked to user';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=== FIX COMPLETE ===';
  RAISE NOTICE 'Please LOG OUT and LOG BACK IN for changes to take effect!';
END $$;


-- STEP 3: Verify the fix
-- ----------------------------------------------------------------------------
SELECT
  'VERIFICATION' as status,
  au.id as auth_user_id,
  au.email as auth_email,
  u.user_id as public_user_id,
  u.email as public_email,
  u.role as public_role,
  t.tutor_id,
  t.username,
  t.user_id as tutor_user_id,
  CASE
    WHEN u.role IS NOT NULL AND u.role = 'tutor' THEN '✅ ROLE IS SET CORRECTLY'
    WHEN u.role IS NULL THEN '❌ ROLE IS NULL'
    ELSE '⚠️ ROLE IS: ' || u.role
  END as role_status,
  CASE
    WHEN t.user_id = au.id THEN '✅ TUTOR LINKED'
    ELSE '❌ TUTOR NOT LINKED'
  END as link_status
FROM auth.users au
LEFT JOIN users u ON u.user_id = au.id
LEFT JOIN tutors t ON t.username = 'testtutor'
WHERE au.email = 'testtutor@gannon.edu';


-- STEP 4: Check what the API would return
-- ----------------------------------------------------------------------------
-- This simulates what /api/auth/get-role returns
SELECT
  'API SIMULATION' as info,
  user_id,
  email,
  role,
  CASE
    WHEN role = 'tutor' THEN '✅ API WILL RETURN: tutor'
    WHEN role IS NULL THEN '❌ API WILL RETURN: null'
    ELSE '⚠️ API WILL RETURN: ' || role
  END as api_result
FROM users
WHERE email = 'testtutor@gannon.edu';
