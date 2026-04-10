-- ============================================================================
-- Reset Password for tech2026team@gmail.com
-- ============================================================================
-- Since you can't reset password via SQL directly, here are your options
-- ============================================================================

-- OPTION 1: Use Supabase Dashboard (EASIEST)
-- ----------------------------------------------------------------------------
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Find user: tech2026team@gmail.com
-- 3. Click the three dots (...) menu
-- 4. Select "Send Password Recovery Email"
--    OR
--    Click "Edit User" and set a new password directly
--
-- This is the fastest and safest method!


-- OPTION 2: Check if user exists and verify email
-- ----------------------------------------------------------------------------
-- First, let's verify the user exists:

SELECT
  id as user_id,
  email,
  email_confirmed_at IS NOT NULL as email_verified,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'tech2026team@gmail.com';

-- If email_verified is FALSE, you can verify it with the query below


-- OPTION 3: Verify email so password reset works
-- ----------------------------------------------------------------------------
-- If the email is not verified, verify it first:

UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'tech2026team@gmail.com';

-- Then use "Forgot Password" on the login page


-- OPTION 4: Check user's role in application
-- ----------------------------------------------------------------------------
SELECT
  u.user_id,
  u.email,
  u.role,
  u.full_name
FROM users u
WHERE u.email = 'tech2026team@gmail.com';


-- OPTION 5: Delete and recreate user (LAST RESORT)
-- ----------------------------------------------------------------------------
-- Only use this if you want to completely reset the account
-- WARNING: This will delete all data associated with this user!

/*
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_uuid FROM auth.users WHERE email = 'tech2026team@gmail.com';

  -- Delete from public.users
  DELETE FROM users WHERE user_id = user_uuid;

  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_uuid;

  RAISE NOTICE '✅ User deleted. Now recreate in Supabase Dashboard:';
  RAISE NOTICE '   1. Go to Authentication → Users';
  RAISE NOTICE '   2. Click "Add User"';
  RAISE NOTICE '   3. Email: tech2026team@gmail.com';
  RAISE NOTICE '   4. Password: [your new password]';
  RAISE NOTICE '   5. Auto Confirm: YES';
  RAISE NOTICE '   6. Create User';
END $$;
*/
