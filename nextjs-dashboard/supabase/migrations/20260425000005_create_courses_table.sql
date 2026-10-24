-- Migration: Create Courses Table
-- Description: Normalize course data from comma-separated strings to relational table

-- Drop existing courses table if it exists (clean slate)
DROP TABLE IF EXISTS courses CASCADE;

-- ======================================
-- CREATE COURSES TABLE
-- ======================================
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- e.g., "ACCT_313"
  name TEXT NOT NULL, -- e.g., "Accounting Information Systems"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);

-- Add RLS policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read courses" ON courses;
DROP POLICY IF EXISTS "Allow admins to manage courses" ON courses;

-- Allow all authenticated users to read courses
CREATE POLICY "Allow authenticated users to read courses"
  ON courses
  FOR SELECT
  USING (true);

-- Allow admins to manage courses
CREATE POLICY "Allow admins to manage courses"
  ON courses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );

-- ======================================
-- DATA POPULATION FUNCTION
-- ======================================
-- This function parses the existing comma-separated data from client_report_questions
-- and populates the courses table

CREATE OR REPLACE FUNCTION populate_courses_from_questions()
RETURNS void AS $$
DECLARE
  course_data TEXT;
  course_item TEXT;
  course_code TEXT;
  course_name TEXT;
BEGIN
  -- Get course data from question 3
  -- Format: "ACCT_313 (Accounting Information Systems)"
  SELECT possible_answers INTO course_data
  FROM client_report_questions
  WHERE question_number = 3;

  -- Parse and insert courses
  IF course_data IS NOT NULL THEN
    FOREACH course_item IN ARRAY string_to_array(course_data, ',')
    LOOP
      -- Skip N/A and empty items
      course_item := trim(course_item);

      -- Check if item has parentheses (format: CODE (Name))
      IF course_item != 'N/A' AND course_item != '' AND
         position('(' in course_item) > 0 AND
         position(')' in course_item) > 0 THEN

        -- Extract code (before opening parenthesis)
        course_code := trim(substring(course_item from 1 for position('(' in course_item) - 1));

        -- Extract name (between parentheses)
        course_name := trim(substring(
          course_item
          from position('(' in course_item) + 1
          for position(')' in course_item) - position('(' in course_item) - 1
        ));

        -- Insert course
        INSERT INTO courses (code, name)
        VALUES (course_code, course_name)
        ON CONFLICT (code) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the population function
SELECT populate_courses_from_questions();

-- Drop the function after use (optional - comment out if you want to keep it)
DROP FUNCTION IF EXISTS populate_courses_from_questions();

-- ======================================
-- VERIFICATION
-- ======================================
-- Check how many courses were inserted
DO $$
DECLARE
  course_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO course_count FROM courses;
  RAISE NOTICE 'Successfully populated % courses', course_count;
END $$;

-- Sample query to verify data
-- Uncomment to see sample data:
-- SELECT id, code, name
-- FROM courses
-- ORDER BY code
-- LIMIT 10;
