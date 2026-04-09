-- Check all tutors in the database

-- All tutors
SELECT
    '=== All Tutors ===' as info,
    tutor_id,
    tutor_name,
    username,
    student_id,
    role
FROM tutors
ORDER BY tutor_name;

-- Tutors count by role
SELECT
    '=== Tutors Count by Role ===' as info,
    role,
    COUNT(*) as count
FROM tutors
GROUP BY role
ORDER BY role;

-- Tutors with username as tutor_name (likely auto-created)
SELECT
    '=== Tutors with Username as Name ===' as info,
    tutor_id,
    tutor_name,
    username,
    role
FROM tutors
WHERE tutor_name = username
ORDER BY tutor_name;

-- Total counts
SELECT
    '=== Summary ===' as info,
    COUNT(*) as total_tutors,
    COUNT(*) FILTER (WHERE role = 'lead_tutor') as lead_tutors,
    COUNT(*) FILTER (WHERE role = 'tutor') as regular_tutors,
    COUNT(*) FILTER (WHERE tutor_name = username) as auto_created_tutors
FROM tutors;
