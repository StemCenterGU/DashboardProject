-- Find tutor with name containing "Van P"

SELECT
    '=== Tutors with Van P in name ===' as info,
    tutor_id,
    tutor_name,
    username,
    student_id,
    role,
    (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = t.tutor_id) as slot_count
FROM tutors t
WHERE tutor_name ILIKE '%Van%P%'
   OR tutor_name ILIKE '%Van%'
   OR tutor_name ILIKE '%Phan%'
ORDER BY tutor_name;

-- Check if phan016 exists and their details
SELECT
    '=== Checking phan016 specifically ===' as info,
    tutor_id,
    tutor_name,
    username,
    student_id,
    role,
    (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = t.tutor_id) as slot_count
FROM tutors t
WHERE username = 'phan016';

-- Check all lead tutors
SELECT
    '=== All Lead Tutors ===' as info,
    tutor_id,
    tutor_name,
    username,
    role,
    (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = t.tutor_id) as slot_count
FROM tutors t
WHERE role = 'lead_tutor'
ORDER BY tutor_name;
