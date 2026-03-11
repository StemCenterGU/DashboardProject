-- VERIFICATION QUERY: Check appointments table structure
-- Run this in Supabase SQL Editor to see what columns currently exist

-- View all columns in the appointments table
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Expected columns that should exist:
-- appointment_id, tutor_id, tutor_name, student_name, student_email,
-- course_id, appointment_date, start_time, end_time, duration, status,
-- notes, source, schedule_title, is_walk_in, is_missed, is_online,
-- focus, created_by, modified_by, is_repeating, course_instructor,
-- course_code, course_name, attachment_path, created_at, updated_at
