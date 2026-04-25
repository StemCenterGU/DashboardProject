-- Migration: Alter Courses Table for Client Reports
-- Description: Adds missing columns to existing courses table
-- Created: 2026-04-24

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'courses' AND column_name = 'department') THEN
    ALTER TABLE courses ADD COLUMN department VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'courses' AND column_name = 'is_active') THEN
    ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'courses' AND column_name = 'created_at') THEN
    ALTER TABLE courses ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'courses' AND column_name = 'updated_at') THEN
    ALTER TABLE courses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);

-- Add trigger to auto-update updated_at timestamp (replace if exists)
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_update_courses_updated_at ON courses;
CREATE TRIGGER trigger_update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

-- Add comments for documentation
COMMENT ON TABLE courses IS 'Stores course information for reference in client reports';
COMMENT ON COLUMN courses.course_code IS 'Unique course identifier (e.g., MATH_101)';
COMMENT ON COLUMN courses.is_active IS 'Whether this course is currently offered';
