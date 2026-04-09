-- ============================================================================
-- Fix Duplicate Email and Set Role
-- ============================================================================
-- This handles the duplicate email constraint issue
-- ============================================================================

-- STEP 1: See what we have
-- ----------------------------------------------------------------------------
SELECT
  user_id,
  email,
  role,
  full_name,
  created_at
FROM users
WHERE email = 'testtutor@gannon.edu'
ORDER BY created_at;

-- This will show if there are duplicate entries


-- STEP 2: Clean up duplicates and fix role
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  auth_id UUID;
  correct_record_id UUID;
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== FIXING DUPLICATES AND ROLE ===';

  -- Get the auth user ID (the correct one)
  SELECT id INTO auth_id FROM auth.users WHERE email = 'testtutor@gannon.edu';

  IF auth_id IS NULL THEN
    RAISE EXCEPTION 'User not found in auth.users!';
  END IF;

  RAISE NOTICE 'Correct auth user_id: %', auth_id;

  -- Delete any duplicate records that DON'T match the auth ID
  DELETE FROM users
  WHERE email = 'testtutor@gannon.edu'
    AND user_id != auth_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % duplicate record(s)', deleted_count;
  END IF;

  -- Now update or insert the correct record
  UPDATE users
  SET role = 'tutor',
      full_name = COALESCE(full_name, 'Test Tutor')
  WHERE user_id = auth_id;

  IF NOT FOUND THEN
    -- Record doesn't exist, insert it
    INSERT INTO users (user_id, email, role, full_name)
    VALUES (auth_id, 'testtutor@gannon.edu', 'tutor', 'Test Tutor');

    RAISE NOTICE '✅ Created user record with role=tutor';
  ELSE
    RAISE NOTICE '✅ Updated user record with role=tutor';
  END IF;

  -- Link tutor to user
  UPDATE tutors
  SET user_id = auth_id
  WHERE username = 'testtutor';

  RAISE NOTICE '✅ Linked tutor to user';
  RAISE NOTICE '';
  RAISE NOTICE '=== FIX COMPLETE ===';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: LOG OUT AND LOG BACK IN!';
  RAISE NOTICE 'The role is cached in your session.';
END $$;


-- STEP 3: Verify there's only one record now
-- ----------------------------------------------------------------------------
SELECT
  'FINAL CHECK' as status,
  COUNT(*) as record_count,
  MAX(user_id) as user_id,
  MAX(email) as email,
  MAX(role) as role
FROM users
WHERE email = 'testtutor@gannon.edu';

-- Should show: record_count = 1, role = 'tutor'


-- STEP 4: Verify complete linkage
-- ----------------------------------------------------------------------------
SELECT
  au.email as auth_email,
  u.user_id,
  u.email as public_email,
  u.role,
  t.tutor_id,
  t.username,
  t.user_id as tutor_linked_to,
  CASE
    WHEN u.role = 'tutor' AND t.user_id = u.user_id THEN '✅ ALL CORRECT'
    WHEN u.role IS NULL THEN '❌ ROLE IS NULL'
    WHEN t.user_id IS NULL THEN '❌ TUTOR NOT LINKED'
    WHEN t.user_id != u.user_id THEN '❌ TUTOR LINKED TO WRONG USER'
    ELSE '⚠️ CHECK MANUALLY'
  END as status
FROM auth.users au
JOIN users u ON u.user_id = au.id
LEFT JOIN tutors t ON t.username = 'testtutor'
WHERE au.email = 'testtutor@gannon.edu';

-- Should show: status = '✅ ALL CORRECT'
