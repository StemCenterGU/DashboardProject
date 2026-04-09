-- Add Staff Data Columns to Tutors Table
-- Date: 2026-04-05
--
-- Adds three new columns to support staff data sync from Staff.xlsx:
--   1. username - Gannon username (e.g., "anjeh001")
--   2. student_id - Student ID number from Excel
--   3. role - Staff role/position (tutor, lead_tutor, manager, admin)
--
-- This allows linking tutors table with staff information while preserving
-- the existing abbreviated tutor_name format (e.g., "Kensy A.")

-- 1. Add username column (unique Gannon username)
ALTER TABLE tutors
ADD COLUMN username VARCHAR(50) UNIQUE;

COMMENT ON COLUMN tutors.username IS 'Gannon username from Staff.xlsx (e.g., anjeh001)';

-- 2. Add student_id column (unique student ID number)
ALTER TABLE tutors
ADD COLUMN student_id VARCHAR(50) UNIQUE;

COMMENT ON COLUMN tutors.student_id IS 'Student ID number from Staff.xlsx';

-- 3. Add role column with CHECK constraint matching users table
ALTER TABLE tutors
ADD COLUMN role VARCHAR(50) DEFAULT 'tutor'
CHECK (role IN ('tutor', 'lead_tutor', 'manager', 'admin', 'developer'));

COMMENT ON COLUMN tutors.role IS 'Staff role: tutor, lead_tutor, manager, admin, or developer';

-- Create indexes for performance
CREATE INDEX idx_tutors_username ON tutors(username);
CREATE INDEX idx_tutors_student_id ON tutors(student_id);
CREATE INDEX idx_tutors_role ON tutors(role);

-- Verify changes
DO $$
BEGIN
    RAISE NOTICE 'Tutors table schema updated successfully';
    RAISE NOTICE 'Added columns: username, student_id, role';
    RAISE NOTICE 'Next step: Run populate_staff_data_in_tutors.sql to sync data from Staff.xlsx';
END $$;
