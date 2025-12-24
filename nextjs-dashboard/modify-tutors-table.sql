-- Modify Tutors Table to Add tutor_name Column
-- This allows tutors to exist without requiring users table
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Add tutor_name column to tutors table
-- ============================================

ALTER TABLE tutors 
    ADD COLUMN IF NOT EXISTS tutor_name VARCHAR(255);

-- Make user_id nullable (optional - only if you want tutors without users)
-- ALTER TABLE tutors ALTER COLUMN user_id DROP NOT NULL;

-- ============================================
-- STEP 2: Insert all tutors with names
-- ============================================

INSERT INTO tutors (tutor_name, is_available)
VALUES
    ('Aizirek A', true),
    ('Alix A', true),
    ('Avish M', true),
    ('Bailey H', true),
    ('Blossom A', true),
    ('Camryn B', true),
    ('Clara B', true),
    ('Claudia O', true),
    ('Elizabeth H', true),
    ('Emily B', true),
    ('Ethan W', true),
    ('Eva S', true),
    ('Glory N', true),
    ('Gonzalo P', true),
    ('Hannah P', true),
    ('Hiver N', true),
    ('Hoang T', true),
    ('Hope T', true),
    ('Issac W', true),
    ('Izzy G', true),
    ('Jonathan H', true),
    ('Juhi M', true),
    ('Kara B', true),
    ('Kayla T', true),
    ('Kensy A', true),
    ('Khang M', true),
    ('Khanh L', true),
    ('Lili U', true),
    ('Lilly M', true),
    ('Maddy E', true),
    ('Makalya L', true),
    ('Maria M', true),
    ('Matthew T', true),
    ('My N', true),
    ('Natalie H', true),
    ('Ojus D', true),
    ('Pedro A', true),
    ('Phuong T', true),
    ('Prashriti A', true),
    ('Princess M', true),
    ('Quoc N', true),
    ('Rajih M', true),
    ('Robert T', true),
    ('Zaid A', true),
    ('Zoe G', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Count tutors
SELECT COUNT(*) as total_tutors FROM tutors;

-- List all tutors with their names
SELECT 
    tutor_id,
    tutor_name,
    is_available,
    created_at
FROM tutors
ORDER BY tutor_name;

