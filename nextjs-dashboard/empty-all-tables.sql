-- Empty All Tables (Keep Structure)
-- This script deletes all data from all tables but preserves table structure, columns, constraints, indexes, etc.
-- Run this in Supabase SQL Editor

-- ============================================
-- DISABLE TRIGGERS (temporarily)
-- ============================================
-- This prevents triggers from firing during deletion
SET session_replication_role = 'replica';

-- ============================================
-- DELETE DATA IN CORRECT ORDER (respecting foreign keys)
-- ============================================

-- Delete from tables with foreign keys first (child tables)
-- Then delete from parent tables

-- 1. Delete from tables that reference other tables
DELETE FROM shift_assignments;
DELETE FROM tutor_availability;
DELETE FROM available_slots;
DELETE FROM appointments;
DELETE FROM audit_logs;

-- 2. Delete from intermediate tables
DELETE FROM tutors;
DELETE FROM courses;

-- 3. Delete from main user table (last, as it's referenced by tutors)
DELETE FROM users;

-- 4. Delete from standalone tables
DELETE FROM shifts;

-- ============================================
-- RESET SEQUENCES (optional - resets auto-increment counters)
-- ============================================
-- Note: UUID primary keys don't use sequences, but if you have any serial/bigserial columns, reset them
-- ALTER SEQUENCE IF EXISTS users_user_id_seq RESTART WITH 1;
-- (Adjust based on your actual sequence names if needed)

-- ============================================
-- RE-ENABLE TRIGGERS
-- ============================================
SET session_replication_role = 'origin';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that all tables are empty (should return 0 for all)
SELECT 
    'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL
SELECT 'tutors', COUNT(*) FROM tutors
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'tutor_availability', COUNT(*) FROM tutor_availability
UNION ALL
SELECT 'available_slots', COUNT(*) FROM available_slots
UNION ALL
SELECT 'shifts', COUNT(*) FROM shifts
UNION ALL
SELECT 'shift_assignments', COUNT(*) FROM shift_assignments
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;

-- Verify table structure still exists (should return all tables)
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'users', 'tutors', 'courses', 'appointments', 
        'tutor_availability', 'available_slots', 
        'shifts', 'shift_assignments', 'audit_logs'
    )
ORDER BY table_name;

