-- Verify Lead Tutors
-- Show all lead tutors and their details

SELECT
    t.tutor_id,
    t.tutor_name,
    t.username,
    t.student_id,
    t.role,
    COUNT(ta.availability_id) as total_slots,
    COUNT(DISTINCT ta.day_of_week) as days_available,
    MIN(ta.start_time)::time as earliest_start,
    MAX(ta.end_time)::time as latest_end
FROM tutors t
LEFT JOIN tutor_availability ta ON t.tutor_id = ta.tutor_id
WHERE t.role = 'lead_tutor'
GROUP BY t.tutor_id, t.tutor_name, t.username, t.student_id, t.role
ORDER BY t.tutor_name;
