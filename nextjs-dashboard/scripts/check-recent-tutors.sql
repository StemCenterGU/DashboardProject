-- Check recently created tutors
-- Run this to see if any tutors were created in the last hour

SELECT
    '=== Recently Created Tutors ===' as info,
    tutor_id,
    tutor_name,
    username,
    role,
    created_at
FROM tutors
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check all tutors count
SELECT
    '=== Total Tutors Count ===' as info,
    COUNT(*) as total_tutors,
    COUNT(*) FILTER (WHERE role = 'lead_tutor') as lead_tutors,
    COUNT(*) FILTER (WHERE role = 'tutor') as regular_tutors
FROM tutors;

-- Check tutors without proper names (username as name)
SELECT
    '=== Tutors with Username as Name ===' as info,
    tutor_id,
    tutor_name,
    username,
    role,
    created_at
FROM tutors
WHERE tutor_name = username
ORDER BY created_at DESC;
