-- ============================================================================
-- Diagnose Developer Role Access Issue
-- ============================================================================

-- STEP 1: Check auth.users
-- ----------------------------------------------------------------------------
SELECT
  '1. AUTH TABLE' as check_step,
  id as auth_user_id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  user_metadata->>'role' as metadata_role,
  created_at
FROM auth.users
WHERE email = 'tech2026team@gmail.com';


-- STEP 2: Check public.users
-- ----------------------------------------------------------------------------
SELECT
  '2. PUBLIC USERS TABLE' as check_step,
  user_id,
  email,
  role,
  full_name,
  created_at
FROM users
WHERE email = 'tech2026team@gmail.com';


-- STEP 3: Check if there are duplicate records
-- ----------------------------------------------------------------------------
SELECT
  '3. DUPLICATE CHECK' as check_step,
  COUNT(*) as record_count,
  STRING_AGG(role::text, ', ') as all_roles
FROM users
WHERE email = 'tech2026team@gmail.com';


-- STEP 4: Verify the role is exactly 'developer'
-- ----------------------------------------------------------------------------
SELECT
  '4. ROLE VERIFICATION' as check_step,
  role,
  LENGTH(role) as role_length,
  role = 'developer' as is_exactly_developer,
  CASE
    WHEN role = 'developer' THEN '✅ Role is correct'
    WHEN role IS NULL THEN '❌ Role is NULL'
    WHEN role != 'developer' THEN '❌ Role is: ' || role
    ELSE '⚠️ Unknown issue'
  END as status
FROM users
WHERE email = 'tech2026team@gmail.com';


-- STEP 5: Fix - Ensure role is set to developer
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  auth_id UUID;
  current_role TEXT;
  record_count INTEGER;
BEGIN
  -- Get auth user ID
  SELECT id INTO auth_id FROM auth.users WHERE email = 'tech2026team@gmail.com';

  IF auth_id IS NULL THEN
    RAISE EXCEPTION 'User not found in auth.users!';
  END IF;

  -- Check how many records exist
  SELECT COUNT(*) INTO record_count FROM users WHERE email = 'tech2026team@gmail.com';

  IF record_count = 0 THEN
    -- No record - create it
    INSERT INTO users (user_id, email, role, full_name)
    VALUES (auth_id, 'tech2026team@gmail.com', 'developer', 'Tech Team');

    RAISE NOTICE '✅ Created user with developer role';
  ELSIF record_count = 1 THEN
    -- One record - update it
    UPDATE users
    SET role = 'developer'
    WHERE email = 'tech2026team@gmail.com'
    RETURNING role INTO current_role;

    RAISE NOTICE '✅ Updated role to: %', current_role;
  ELSE
    -- Multiple records - fix duplicates
    RAISE NOTICE '⚠️ Found % duplicate records. Cleaning up...', record_count;

    -- Delete duplicates, keep the one linked to auth
    DELETE FROM users
    WHERE email = 'tech2026team@gmail.com'
      AND user_id != auth_id;

    -- Update the correct one
    UPDATE users
    SET role = 'developer'
    WHERE user_id = auth_id;

    RAISE NOTICE '✅ Cleaned up duplicates and set role to developer';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANT NEXT STEPS:';
  RAISE NOTICE '1. LOG OUT of the application completely';
  RAISE NOTICE '2. Clear browser cache (Ctrl+Shift+Delete)';
  RAISE NOTICE '3. LOG BACK IN as tech2026team@gmail.com';
  RAISE NOTICE '4. The "User Management" link should now appear';
END $$;


-- STEP 6: Final verification
-- ----------------------------------------------------------------------------
SELECT
  '6. FINAL CHECK' as check_step,
  au.email,
  u.user_id,
  u.role,
  CASE
    WHEN u.role = 'developer' THEN '✅ CORRECT - User Management should be visible'
    ELSE '❌ WRONG - Role is: ' || COALESCE(u.role, 'NULL')
  END as access_status
FROM auth.users au
JOIN users u ON u.user_id = au.id
WHERE au.email = 'tech2026team@gmail.com';


-- STEP 7: Test what the API would return
-- ----------------------------------------------------------------------------
SELECT
  '7. API SIMULATION' as check_step,
  user_id,
  email,
  role,
  full_name
FROM users
WHERE email = 'tech2026team@gmail.com';

-- This should show role = 'developer'
