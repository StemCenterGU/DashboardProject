-- ============================================================================
-- QUICK FIX: Run this FIRST to fix all column issues
-- ============================================================================
-- Copy this entire file and paste into Supabase SQL Editor, then click RUN
-- URL: https://supabase.com/dashboard/project/tjhcndrxlstezfgiyxla/sql
-- ============================================================================

-- Step 1: Add ALL potentially missing columns
ALTER TABLE appointments
  -- Core appointment fields
  ADD COLUMN IF NOT EXISTS tutor_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS student_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS student_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS appointment_date DATE,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS duration DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
  -- Course fields
  ADD COLUMN IF NOT EXISTS course_id UUID,
  ADD COLUMN IF NOT EXISTS course_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS course_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS course_instructor VARCHAR(255),
  -- WCOnline specific fields
  ADD COLUMN IF NOT EXISTS schedule_title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_missed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS focus TEXT,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS modified_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_repeating BOOLEAN DEFAULT false,
  -- File attachment
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  -- Timestamps
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Verify columns were added
SELECT COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'appointments';

-- You should see 27 columns total

-- Step 3: Show all columns to verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- ============================================================================
-- DONE! Now try creating an appointment again.
-- ============================================================================
