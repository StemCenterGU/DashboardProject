-- Find tutors from Excel file that are not lead tutors
-- These are the 17 usernames from your Excel file

WITH excel_tutors AS (
    SELECT username FROM (VALUES
        ('hale007'),
        ('phan016'),
        ('ujfalusi001'),
        ('gaetjensi001'),
        ('anjeh001'),
        ('aquinori001'),
        ('aragonro001'),
        ('asylbeko001'),
        ('bourkehu001'),
        ('endler001'),
        ('mahle006'),
        ('nguyen049'),
        ('orteblan001'),
        ('sledge002'),
        ('tran024'),
        ('weigel004'),
        ('wheeler039')
    ) AS t(username)
)
SELECT
    '=== Tutors from Excel that are NOT Lead Tutors ===' as info,
    t.tutor_id,
    t.tutor_name,
    t.username,
    t.role,
    COUNT(ta.availability_id) as slot_count
FROM tutors t
INNER JOIN excel_tutors et ON t.username = et.username
LEFT JOIN tutor_availability ta ON t.tutor_id = ta.tutor_id
WHERE t.role != 'lead_tutor'
GROUP BY t.tutor_id, t.tutor_name, t.username, t.role
ORDER BY t.tutor_name;

-- Count by role
WITH excel_tutors AS (
    SELECT username FROM (VALUES
        ('hale007'),
        ('phan016'),
        ('ujfalusi001'),
        ('gaetjensi001'),
        ('anjeh001'),
        ('aquinori001'),
        ('aragonro001'),
        ('asylbeko001'),
        ('bourkehu001'),
        ('endler001'),
        ('mahle006'),
        ('nguyen049'),
        ('orteblan001'),
        ('sledge002'),
        ('tran024'),
        ('weigel004'),
        ('wheeler039')
    ) AS t(username)
)
SELECT
    '=== Excel Tutors Count by Role ===' as info,
    t.role,
    COUNT(*) as count
FROM tutors t
INNER JOIN excel_tutors et ON t.username = et.username
GROUP BY t.role
ORDER BY t.role;

-- Update non-lead tutors to lead_tutor role
-- UNCOMMENT THE LINES BELOW TO UPDATE THEM:

-- WITH excel_tutors AS (
--     SELECT username FROM (VALUES
--         ('hale007'),
--         ('phan016'),
--         ('ujfalusi001'),
--         ('gaetjensi001'),
--         ('anjeh001'),
--         ('aquinori001'),
--         ('aragonro001'),
--         ('asylbeko001'),
--         ('bourkehu001'),
--         ('endler001'),
--         ('mahle006'),
--         ('nguyen049'),
--         ('orteblan001'),
--         ('sledge002'),
--         ('tran024'),
--         ('weigel004'),
--         ('wheeler039')
--     ) AS t(username)
-- )
-- UPDATE tutors
-- SET role = 'lead_tutor'
-- FROM excel_tutors et
-- WHERE tutors.username = et.username
--   AND tutors.role != 'lead_tutor'
-- RETURNING tutor_id, tutor_name, username, role;
