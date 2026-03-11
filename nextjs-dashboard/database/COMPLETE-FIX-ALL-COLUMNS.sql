-- ============================================================================
-- COMPLETE FIX: Add ALL missing columns to appointments table
-- ============================================================================
-- This script adds EVERY column that might be missing
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tjhcndrxlstezfgiyxla/sql
-- ============================================================================

-- Core appointment fields
-- Note: appointment_id and tutor_id should already exist as they're PRIMARY KEY and NOT NULL respectively
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_id VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tutor_id UUID;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tutor_name VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS student_name VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS student_email VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_date DATE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration DECIMAL(4,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- WCOnline specific fields
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS schedule_title VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_missed BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS focus TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS modified_by VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_repeating BOOLEAN DEFAULT false;

-- Course tracking fields
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS course_instructor VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS course_code VARCHAR(50);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS course_name VARCHAR(255);

-- File attachment
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Timestamps
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================================
-- Verification: Check all columns now exist
-- ============================================================================
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Expected: Around 26-29 columns should be listed
-- ============================================================================
