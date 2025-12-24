-- Simplify Tutors Table - Only tutor_id and tutor_name
-- Run this in Supabase SQL Editor to modify existing table

-- ============================================
-- STEP 1: Drop existing constraints and columns
-- ============================================

-- Drop foreign key constraint (if exists)
ALTER TABLE tutors 
    DROP CONSTRAINT IF EXISTS tutors_user_id_fkey;

-- Drop unique constraint on user_id (if exists)
ALTER TABLE tutors 
    DROP CONSTRAINT IF EXISTS tutors_user_id_key;

-- Drop indexes
DROP INDEX IF EXISTS idx_tutors_user_id;
DROP INDEX IF EXISTS idx_tutors_available;

-- ============================================
-- STEP 2: Remove unnecessary columns
-- ============================================

ALTER TABLE tutors 
    DROP COLUMN IF EXISTS user_id,
    DROP COLUMN IF EXISTS is_available,
    DROP COLUMN IF EXISTS created_at,
    DROP COLUMN IF EXISTS updated_at;

-- ============================================
-- STEP 3: Change tutor_id to UUID (if it's SERIAL)
-- ============================================

-- If tutor_id is SERIAL, we need to recreate the table
-- First, backup data (if any)
CREATE TABLE IF NOT EXISTS tutors_backup AS SELECT * FROM tutors;

-- Drop and recreate with UUID
DROP TABLE IF EXISTS tutors CASCADE;

CREATE TABLE tutors (
    tutor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_name VARCHAR(255) NOT NULL UNIQUE
);

-- ============================================
-- STEP 4: Restore data (if needed)
-- ============================================

-- If you had data in tutors_backup, you can restore tutor names:
-- INSERT INTO tutors (tutor_name)
-- SELECT DISTINCT tutor_name FROM tutors_backup WHERE tutor_name IS NOT NULL;

-- Drop backup table
-- DROP TABLE IF EXISTS tutors_backup;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tutors'
ORDER BY ordinal_position;

