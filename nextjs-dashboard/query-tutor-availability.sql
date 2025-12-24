-- Query Tutor Availability (Grouped by Tutor)
-- Run this in Supabase SQL Editor to see the grouped weekly schedules

-- ============================================
-- VIEW 1: All tutor availability grouped by tutor
-- ============================================
SELECT 
    u.full_name AS tutor_name,
    u.email AS tutor_email,
    ta.tutor_id,
    ta.day_of_week,
    CASE ta.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS day_name,
    ta.start_time,
    ta.end_time,
    ta.is_available,
    ta.created_at
FROM tutor_availability ta
JOIN tutors t ON ta.tutor_id = t.tutor_id
JOIN users u ON t.user_id = u.user_id
ORDER BY u.full_name, ta.day_of_week, ta.start_time;

-- ============================================
-- VIEW 2: Summary by tutor (count of time slots)
-- ============================================
SELECT 
    u.full_name AS tutor_name,
    COUNT(*) AS total_time_slots,
    COUNT(DISTINCT ta.day_of_week) AS days_per_week
FROM tutor_availability ta
JOIN tutors t ON ta.tutor_id = t.tutor_id
JOIN users u ON t.user_id = u.user_id
GROUP BY u.full_name, ta.tutor_id
ORDER BY u.full_name;

-- ============================================
-- VIEW 3: Detailed schedule for a specific tutor
-- ============================================
-- Replace 'Tutor Name' with the actual tutor name you want to see
SELECT 
    CASE ta.day_of_week
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS day,
    ta.start_time,
    ta.end_time,
    EXTRACT(EPOCH FROM (ta.end_time - ta.start_time))/3600 AS duration_hours
FROM tutor_availability ta
JOIN tutors t ON ta.tutor_id = t.tutor_id
JOIN users u ON t.user_id = u.user_id
WHERE u.full_name = 'Tutor Name'  -- Change this to the tutor name
ORDER BY ta.day_of_week, ta.start_time;

-- ============================================
-- VIEW 4: Weekly schedule view (pivot style)
-- ============================================
SELECT 
    u.full_name AS tutor_name,
    MAX(CASE WHEN ta.day_of_week = 0 THEN ta.start_time::text || '-' || ta.end_time::text END) AS sunday,
    MAX(CASE WHEN ta.day_of_week = 1 THEN ta.start_time::text || '-' || ta.end_time::text END) AS monday,
    MAX(CASE WHEN ta.day_of_week = 2 THEN ta.start_time::text || '-' || ta.end_time::text END) AS tuesday,
    MAX(CASE WHEN ta.day_of_week = 3 THEN ta.start_time::text || '-' || ta.end_time::text END) AS wednesday,
    MAX(CASE WHEN ta.day_of_week = 4 THEN ta.start_time::text || '-' || ta.end_time::text END) AS thursday,
    MAX(CASE WHEN ta.day_of_week = 5 THEN ta.start_time::text || '-' || ta.end_time::text END) AS friday,
    MAX(CASE WHEN ta.day_of_week = 6 THEN ta.start_time::text || '-' || ta.end_time::text END) AS saturday
FROM tutor_availability ta
JOIN tutors t ON ta.tutor_id = t.tutor_id
JOIN users u ON t.user_id = u.user_id
GROUP BY u.full_name, ta.tutor_id
ORDER BY u.full_name;

-- ============================================
-- VIEW 5: Verify grouping (check for duplicates)
-- ============================================
-- This should return 0 rows if grouping worked correctly
-- (no duplicate tutor_id + day_of_week + start_time + end_time combinations)
SELECT 
    tutor_id,
    day_of_week,
    start_time,
    end_time,
    COUNT(*) AS duplicate_count
FROM tutor_availability
GROUP BY tutor_id, day_of_week, start_time, end_time
HAVING COUNT(*) > 1;

