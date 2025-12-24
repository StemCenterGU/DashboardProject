-- Insert All Tutors - Simple Table (Just tutor_id and tutor_name)
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Create/Modify tutors table (if needed)
-- ============================================

-- Drop existing table if you want to recreate it
-- DROP TABLE IF EXISTS tutors CASCADE;

-- Create simple tutors table with just 2 columns
CREATE TABLE IF NOT EXISTS tutors (
    tutor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_name VARCHAR(255) NOT NULL UNIQUE
);

-- ============================================
-- STEP 2: Insert all 45 tutors with names
-- ============================================

INSERT INTO tutors (tutor_name)
VALUES
    ('Aizirek A'),
    ('Alix A'),
    ('Avish M'),
    ('Bailey H'),
    ('Blossom A'),
    ('Camryn B'),
    ('Clara B'),
    ('Claudia O'),
    ('Elizabeth H'),
    ('Emily B'),
    ('Ethan W'),
    ('Eva S'),
    ('Glory N'),
    ('Gonzalo P'),
    ('Hannah P'),
    ('Hiver N'),
    ('Hoang T'),
    ('Hope T'),
    ('Issac W'),
    ('Izzy G'),
    ('Jonathan H'),
    ('Juhi M'),
    ('Kara B'),
    ('Kayla T'),
    ('Kensy A'),
    ('Khang M'),
    ('Khanh L'),
    ('Lili U'),
    ('Lilly M'),
    ('Maddy E'),
    ('Makalya L'),
    ('Maria M'),
    ('Matthew T'),
    ('My N'),
    ('Natalie H'),
    ('Ojus D'),
    ('Pedro A'),
    ('Phuong T'),
    ('Prashriti A'),
    ('Princess M'),
    ('Quoc N'),
    ('Rajih M'),
    ('Robert T'),
    ('Zaid A'),
    ('Zoe G')
ON CONFLICT (tutor_name) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- List all tutors with their unique IDs
SELECT 
    tutor_id,
    tutor_name
FROM tutors
ORDER BY tutor_name;

-- Count
SELECT COUNT(*) as total_tutors FROM tutors;
