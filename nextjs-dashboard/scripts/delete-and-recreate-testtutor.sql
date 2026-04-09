-- ============================================================================
-- Delete and Recreate Test Tutor User
-- ============================================================================
-- This script completely removes the test tutor and recreates it properly
-- ============================================================================

-- STEP 1: Delete all records for testtutor
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  test_user_id UUID;
  test_tutor_id UUID;
BEGIN
  -- Get IDs
  SELECT user_id INTO test_user_id FROM users WHERE email = 'testtutor@gannon.edu';
  SELECT tutor_id INTO test_tutor_id FROM tutors WHERE username = 'testtutor';

  -- Delete availability slots
  IF test_tutor_id IS NOT NULL THEN
    DELETE FROM tutor_availability WHERE tutor_id = test_tutor_id;
    RAISE NOTICE 'Deleted availability slots';
  END IF;

  -- Delete tutor
  DELETE FROM tutors WHERE username = 'testtutor';
  RAISE NOTICE 'Deleted tutor record';

  -- Delete from public.users
  DELETE FROM users WHERE email = 'testtutor@gannon.edu';
  RAISE NOTICE 'Deleted public.users record';

  -- Delete from auth.users (this removes authentication)
  DELETE FROM auth.users WHERE email = 'testtutor@gannon.edu';
  RAISE NOTICE 'Deleted auth.users record';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Test tutor completely deleted';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Go to Supabase Dashboard → Authentication → Users';
  RAISE NOTICE '2. Click "Add User" button';
  RAISE NOTICE '3. Fill in:';
  RAISE NOTICE '   - Email: testtutor@gannon.edu';
  RAISE NOTICE '   - Password: [choose a password]';
  RAISE NOTICE '   - Auto Confirm: YES (toggle ON)';
  RAISE NOTICE '4. Click "Create User"';
  RAISE NOTICE '5. Come back and run STEP 2 below';
END $$;


-- ============================================================================
-- STEP 2: After creating user in Dashboard, run this to set up tutor
-- ============================================================================
-- IMPORTANT: Only run this AFTER you've created the user in Supabase Dashboard!

/*
DO $$
DECLARE
  new_user_id UUID;
  new_tutor_id UUID;
BEGIN
  -- Get the newly created user ID
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'testtutor@gannon.edu';

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION '❌ User not found in auth.users. Please create user in Dashboard first!';
  END IF;

  RAISE NOTICE 'Found auth user: %', new_user_id;

  -- Create record in public.users table
  INSERT INTO users (user_id, email, role, full_name)
  VALUES (new_user_id, 'testtutor@gannon.edu', 'tutor', 'Test Tutor')
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'tutor', email = 'testtutor@gannon.edu';

  RAISE NOTICE '✅ Created/updated public.users record';

  -- Create tutor profile with NO availability slots
  INSERT INTO tutors (tutor_name, username, role, user_id)
  VALUES ('Test Tutor', 'testtutor', 'tutor', new_user_id)
  RETURNING tutor_id INTO new_tutor_id;

  RAISE NOTICE '✅ Created tutor profile';
  RAISE NOTICE '   Tutor ID: %', new_tutor_id;
  RAISE NOTICE '   Username: testtutor';
  RAISE NOTICE '   Availability slots: 0 (empty for testing)';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 You can now:';
  RAISE NOTICE '1. Log in with: testtutor@gannon.edu';
  RAISE NOTICE '2. Navigate to Tutor Schedules page';
  RAISE NOTICE '3. You should see all 7 days with clickable time slots';
END $$;
*/


-- ============================================================================
-- STEP 3: Verify everything is set up correctly
-- ============================================================================
/*
SELECT
  'Verification' as check_type,
  au.email as auth_email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  u.user_id as public_user_id,
  u.role as user_role,
  t.tutor_id,
  t.username as tutor_username,
  t.user_id as tutor_linked_to_user,
  (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = t.tutor_id) as availability_count
FROM auth.users au
LEFT JOIN users u ON u.user_id = au.id
LEFT JOIN tutors t ON t.user_id = au.id
WHERE au.email = 'testtutor@gannon.edu';

-- Expected results:
-- ✅ auth_email: testtutor@gannon.edu
-- ✅ email_confirmed: true
-- ✅ public_user_id: [UUID]
-- ✅ user_role: tutor
-- ✅ tutor_id: [UUID]
-- ✅ tutor_username: testtutor
-- ✅ tutor_linked_to_user: [same UUID as public_user_id]
-- ✅ availability_count: 0
*/
