-- Remove user_id from Tutors Table
-- Run this in Supabase SQL Editor if you need to modify existing table

-- ============================================
-- STEP 1: Drop foreign key constraint (if exists)
-- ============================================

ALTER TABLE tutors 
    DROP CONSTRAINT IF EXISTS tutors_user_id_fkey;

-- ============================================
-- STEP 2: Drop unique constraint on user_id (if exists)
-- ============================================

ALTER TABLE tutors 
    DROP CONSTRAINT IF EXISTS tutors_user_id_key;

-- ============================================
-- STEP 3: Remove user_id column
-- ============================================

ALTER TABLE tutors 
    DROP COLUMN IF EXISTS user_id;

-- ============================================
-- STEP 4: Add tutor_name column (if not exists)
-- ============================================

ALTER TABLE tutors 
    ADD COLUMN IF NOT EXISTS tutor_name VARCHAR(255);

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

