-- ============================================================================
-- DIAGNOSTIC: Check what columns your appointments table currently has
-- ============================================================================
-- Run this FIRST to see what's missing before running the fix
-- ============================================================================

-- Show all columns in your current appointments table
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Count how many columns exist
SELECT COUNT(*) as current_column_count
FROM information_schema.columns
WHERE table_name = 'appointments';

-- Expected columns (should have around 26-29):
-- appointment_id, tutor_id, tutor_name, student_name, student_email,
-- course_id, appointment_date, start_time, end_time, duration,
-- status, notes, source, schedule_title, is_walk_in, is_missed,
-- is_online, focus, created_by, modified_by, is_repeating,
-- course_instructor, course_code, course_name, attachment_path,
-- created_at, updated_at

-- ============================================================================
-- If you see less than 20 columns, your table needs the migration!
-- ============================================================================
