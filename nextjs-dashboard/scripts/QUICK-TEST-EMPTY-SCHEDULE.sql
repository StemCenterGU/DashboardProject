-- ============================================================================
-- QUICK TEST: Empty Schedule Feature
-- ============================================================================
-- Copy this entire script and run it in Supabase SQL Editor
-- It will use YOUR current logged-in account to test the empty schedule
-- ============================================================================

-- STEP 1: Find your email address (you need to know this)
-- Replace 'YOUR_EMAIL_HERE' in the script below with your actual email

DO $$
DECLARE
  my_email VARCHAR := 'YOUR_EMAIL_HERE@gannon.edu'; -- ⚠️ CHANGE THIS!
  my_user_id UUID;
  my_username VARCHAR;
  test_tutor_id UUID;
  existing_slots INTEGER;
BEGIN
  -- Validate email format
  IF my_email = 'YOUR_EMAIL_HERE@gannon.edu' THEN
    RAISE EXCEPTION '⚠️ Please replace YOUR_EMAIL_HERE with your actual email address!';
  END IF;

  -- Get user ID
  SELECT user_id INTO my_user_id
  FROM users
  WHERE email = my_email;

  IF my_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %. Make sure you are logged in and the email is correct.', my_email;
  END IF;

  -- Extract username from email
  my_username := SPLIT_PART(my_email, '@', 1);

  RAISE NOTICE '📧 Found user: %', my_email;
  RAISE NOTICE '🆔 User ID: %', my_user_id;
  RAISE NOTICE '👤 Username: %', my_username;
  RAISE NOTICE '';

  -- Check if tutor already exists
  SELECT tutor_id INTO test_tutor_id
  FROM tutors
  WHERE user_id = my_user_id OR username = my_username;

  IF test_tutor_id IS NOT NULL THEN
    -- Tutor exists - backup and clear their slots
    SELECT COUNT(*) INTO existing_slots
    FROM tutor_availability
    WHERE tutor_id = test_tutor_id;

    RAISE NOTICE '⚠️ You already have a tutor profile with % slots', existing_slots;
    RAISE NOTICE '   Tutor ID: %', test_tutor_id;

    IF existing_slots > 0 THEN
      -- Create backup table if it doesn't exist
      CREATE TABLE IF NOT EXISTS tutor_availability_backup (
        LIKE tutor_availability INCLUDING ALL
      );

      -- Backup existing slots
      INSERT INTO tutor_availability_backup
      SELECT * FROM tutor_availability WHERE tutor_id = test_tutor_id;

      -- Delete slots temporarily for testing
      DELETE FROM tutor_availability WHERE tutor_id = test_tutor_id;

      RAISE NOTICE '✅ Backed up % slots to tutor_availability_backup table', existing_slots;
      RAISE NOTICE '✅ Cleared your availability (you can restore it later)';
    ELSE
      RAISE NOTICE '✅ Your tutor profile has 0 slots already - perfect for testing!';
    END IF;

  ELSE
    -- No tutor exists - create one
    INSERT INTO tutors (tutor_name, username, role, user_id)
    VALUES (
      my_email || ' (Test)',
      my_username,
      'tutor',
      my_user_id
    )
    RETURNING tutor_id INTO test_tutor_id;

    RAISE NOTICE '✅ Created new test tutor profile';
    RAISE NOTICE '   Tutor ID: %', test_tutor_id;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎉 Setup complete! Next steps:';
  RAISE NOTICE '   1. Go to the application';
  RAISE NOTICE '   2. Navigate to Tutor Schedules page';
  RAISE NOTICE '   3. You should see your name with "0 slots"';
  RAISE NOTICE '   4. Expand to see all 7 days with 2PM-8PM templates';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 To restore your original slots (if you had any):';
  RAISE NOTICE '   Run the RESTORE script below';
END $$;


-- ============================================================================
-- RESTORE YOUR ORIGINAL SLOTS (run this after testing)
-- ============================================================================
/*
DO $$
DECLARE
  my_email VARCHAR := 'YOUR_EMAIL_HERE@gannon.edu'; -- ⚠️ SAME EMAIL AS ABOVE
  my_user_id UUID;
  my_tutor_id UUID;
  restored_count INTEGER;
BEGIN
  -- Get user and tutor IDs
  SELECT user_id INTO my_user_id FROM users WHERE email = my_email;
  SELECT tutor_id INTO my_tutor_id FROM tutors WHERE user_id = my_user_id;

  IF my_tutor_id IS NULL THEN
    RAISE EXCEPTION 'Tutor not found for email: %', my_email;
  END IF;

  -- Restore from backup
  INSERT INTO tutor_availability
  SELECT * FROM tutor_availability_backup
  WHERE tutor_id = my_tutor_id
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS restored_count = ROW_COUNT;

  -- Clean up backup
  DELETE FROM tutor_availability_backup WHERE tutor_id = my_tutor_id;

  RAISE NOTICE '✅ Restored % availability slots', restored_count;
  RAISE NOTICE '✅ Cleaned up backup table';
END $$;
*/


-- ============================================================================
-- VERIFICATION: Check your current state
-- ============================================================================
-- Replace 'YOUR_EMAIL_HERE' below and run this to see your current setup:

SELECT
  u.email,
  u.role,
  t.tutor_name,
  t.username,
  t.tutor_id,
  COUNT(ta.availability_id) as total_slots,
  STRING_AGG(DISTINCT CASE
    WHEN ta.day_of_week = 0 THEN 'Sun'
    WHEN ta.day_of_week = 1 THEN 'Mon'
    WHEN ta.day_of_week = 2 THEN 'Tue'
    WHEN ta.day_of_week = 3 THEN 'Wed'
    WHEN ta.day_of_week = 4 THEN 'Thu'
    WHEN ta.day_of_week = 5 THEN 'Fri'
    WHEN ta.day_of_week = 6 THEN 'Sat'
  END, ', ') as days_with_slots
FROM users u
LEFT JOIN tutors t ON t.user_id = u.user_id
LEFT JOIN tutor_availability ta ON ta.tutor_id = t.tutor_id
WHERE u.email = 'YOUR_EMAIL_HERE@gannon.edu' -- ⚠️ CHANGE THIS
GROUP BY u.email, u.role, t.tutor_name, t.username, t.tutor_id;
