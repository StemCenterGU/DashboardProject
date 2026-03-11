-- COMPREHENSIVE FIX: Add all missing columns to appointments table
-- This fixes errors like:
--   "Could not find the 'course_code' column of 'appointments' in the schema cache"
--   "Could not find the 'course_name' column of 'appointments' in the schema cache"
--   "Could not find the 'attachment_path' column of 'appointments' in the schema cache"

-- ============================================================================
-- HOW TO RUN:
-- 1. Go to: https://supabase.com/dashboard/project/tjhcndrxlstezfgiyxla/sql
-- 2. Copy and paste this entire file
-- 3. Click "Run"
-- ============================================================================

-- Ensure course_id column exists and is properly configured
-- Note: course_id is optional (nullable) - appointments can exist without a linked course
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS course_id UUID;

-- Add foreign key constraint only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_course_id_fkey'
    AND table_name = 'appointments'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_course_id_fkey
      FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add course_code column (stores course code like "CIS180", "BCOR105", etc.)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS course_code VARCHAR(50);

-- Add course_name column (stores full course name)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS course_name VARCHAR(255);

-- Add course_instructor column (stores instructor name)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS course_instructor VARCHAR(255);

-- Add attachment_path column (stores file path in Supabase Storage)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add focus column (WCOnline field - contains "course_name - course_instructor")
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS focus TEXT;

-- Add schedule_title column (WCOnline field)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS schedule_title VARCHAR(255);

-- Add created_by column (WCOnline field)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- Add modified_by column (WCOnline field)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS modified_by VARCHAR(255);

-- Add is_repeating column (WCOnline field)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS is_repeating BOOLEAN DEFAULT false;

-- ============================================================================
-- VERIFICATION QUERY (run this separately after the migration to verify)
-- ============================================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'appointments'
-- ORDER BY ordinal_position;
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'All missing columns have been added to the appointments table.';
  RAISE NOTICE 'You can now create appointments without errors.';
END $$;
