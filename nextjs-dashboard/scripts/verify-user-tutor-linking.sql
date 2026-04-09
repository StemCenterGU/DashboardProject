-- Verification Script: User-Tutor Linking
-- Run this in Supabase SQL Editor to verify the migration results

-- ============================================================================
-- 1. Check if user_id column was added to tutors table
-- ============================================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tutors'
  AND column_name = 'user_id';

-- Expected: Should show user_id column as uuid type


-- ============================================================================
-- 2. Check total tutors and how many are linked to users
-- ============================================================================
SELECT
  COUNT(*) as total_tutors,
  COUNT(user_id) as tutors_with_user_id,
  COUNT(*) - COUNT(user_id) as tutors_without_user_id
FROM tutors;

-- Shows breakdown of linked vs unlinked tutors


-- ============================================================================
-- 3. Show all users and their linked tutor profiles
-- ============================================================================
SELECT
  u.email,
  u.role as user_role,
  SPLIT_PART(u.email, '@', 1) as email_username,
  t.username as tutor_username,
  t.tutor_name,
  t.role as tutor_role,
  CASE
    WHEN t.user_id IS NOT NULL THEN '✅ Linked'
    ELSE '❌ Not Linked'
  END as link_status
FROM users u
LEFT JOIN tutors t ON t.user_id = u.user_id
ORDER BY u.email;

-- Shows which users are linked to tutor profiles


-- ============================================================================
-- 4. Find tutors that could be linked but aren't
-- ============================================================================
SELECT
  t.username as tutor_username,
  t.tutor_name,
  u.email as matching_user_email,
  u.role as user_role
FROM tutors t
LEFT JOIN users u ON LOWER(SPLIT_PART(u.email, '@', 1)) = LOWER(t.username)
WHERE t.user_id IS NULL
  AND u.email IS NOT NULL;

-- Shows potential matches that weren't auto-linked


-- ============================================================================
-- 5. Check for duplicate user_id values (should be UNIQUE)
-- ============================================================================
SELECT
  user_id,
  COUNT(*) as count,
  STRING_AGG(tutor_name, ', ') as tutors
FROM tutors
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Expected: No rows (user_id should be unique)


-- ============================================================================
-- 6. Show sample of successfully linked records
-- ============================================================================
SELECT
  t.tutor_name,
  t.username,
  u.email,
  u.role,
  u.created_at as user_created
FROM tutors t
INNER JOIN users u ON t.user_id = u.user_id
LIMIT 10;

-- Shows examples of successful linkages


-- ============================================================================
-- 7. Check foreign key constraint exists
-- ============================================================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'tutors'
  AND kcu.column_name = 'user_id';

-- Expected: Shows foreign key constraint from tutors.user_id to auth.users.id


-- ============================================================================
-- 8. Summary Report
-- ============================================================================
SELECT
  '📊 MIGRATION SUMMARY' as report_section,
  (SELECT COUNT(*) FROM tutors) as total_tutors,
  (SELECT COUNT(user_id) FROM tutors) as linked_tutors,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(DISTINCT t.user_id) FROM tutors t WHERE t.user_id IS NOT NULL) as users_with_tutor_profile,
  ROUND(
    (SELECT COUNT(user_id)::numeric FROM tutors) /
    NULLIF((SELECT COUNT(*)::numeric FROM tutors), 0) * 100,
    2
  ) as linking_percentage;
