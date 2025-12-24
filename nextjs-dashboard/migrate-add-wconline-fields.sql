-- Migration Script: Add WCOnline Fields to Existing Tables
-- Run this in Supabase SQL Editor if you already have the database set up
-- This adds all the new fields from WCOnline API

-- ============================================
-- UPDATE APPOINTMENTS TABLE
-- ============================================

-- Make course_id optional (nullable)
ALTER TABLE appointments 
    ALTER COLUMN course_id DROP NOT NULL;

-- Add new WCOnline fields to appointments
ALTER TABLE appointments 
    ADD COLUMN IF NOT EXISTS schedule_title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_missed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS focus TEXT,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS modified_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_repeating BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS course_instructor VARCHAR(255),
    ADD COLUMN IF NOT EXISTS course_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS course_name VARCHAR(255);

-- Update status constraint to include 'missed' and 'no_show'
ALTER TABLE appointments 
    DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments 
    ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'missed', 'no_show'));

-- ============================================
-- UPDATE AVAILABLE_SLOTS TABLE
-- ============================================

-- Add all WCOnline fields to available_slots
ALTER TABLE available_slots 
    ADD COLUMN IF NOT EXISTS schedule_title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS focus TEXT,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS modified_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_repeating BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS course_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS course_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS course_instructor VARCHAR(255);

-- ============================================
-- UPDATE TUTOR_AVAILABILITY TABLE
-- ============================================

-- Add unique constraint to prevent duplicate recurring availability
ALTER TABLE tutor_availability 
    DROP CONSTRAINT IF EXISTS tutor_availability_tutor_id_day_of_week_start_time_end_time_key;

ALTER TABLE tutor_availability 
    ADD CONSTRAINT tutor_availability_tutor_id_day_of_week_start_time_end_time_key 
    UNIQUE (tutor_id, day_of_week, start_time, end_time);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that all columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
    AND column_name IN (
        'schedule_title', 'is_walk_in', 'is_missed', 'is_online', 
        'focus', 'created_by', 'modified_by', 'is_repeating', 
        'course_instructor', 'course_code', 'course_name'
    )
ORDER BY column_name;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'available_slots' 
    AND column_name = 'schedule_title';

