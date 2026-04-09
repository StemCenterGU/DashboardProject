-- ============================================================================
-- Fix Test Tutor Role - Updated Version
-- ============================================================================
-- This fixes the duplicate key error by using UPDATE instead of INSERT
-- ============================================================================

DO $$
DECLARE
  auth_user_id UUID;
  rows_updated INTEGER;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'testtutor@gannon.edu';

  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found in auth.users with email: testtutor@gannon.edu';
  END IF;

  RAISE NOTICE 'Found auth user: %', auth_user_id;

  -- Update existing user record (don't insert)
  UPDATE users
  SET role = 'tutor',
      full_name = COALESCE(full_name, 'Test Tutor')
  WHERE email = 'testtutor@gannon.edu'
     OR user_id = auth_user_id;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated > 0 THEN
    RAISE NOTICE '✅ Updated % user record(s) with role = tutor', rows_updated;
  ELSE
    -- If update didn't find anything, insert new record
    INSERT INTO users (user_id, email, role, full_name)
    VALUES (auth_user_id, 'testtutor@gannon.edu', 'tutor', 'Test Tutor');

    RAISE NOTICE '✅ Created new user record with role = tutor';
  END IF;

  -- Ensure tutor is linked to user
  UPDATE tutors
  SET user_id = auth_user_id
  WHERE username = 'testtutor';

  RAISE NOTICE '✅ Linked tutor to user';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Fix complete! Please refresh your browser.';
END $$;


-- Verify the fix
SELECT
  u.user_id,
  u.email,
  u.role,
  u.full_name,
  t.username,
  t.tutor_name
FROM users u
LEFT JOIN tutors t ON t.user_id = u.user_id
WHERE u.email = 'testtutor@gannon.edu';

-- Expected output:
-- role should be 'tutor' (not NULL)
-- username should be 'testtutor'
