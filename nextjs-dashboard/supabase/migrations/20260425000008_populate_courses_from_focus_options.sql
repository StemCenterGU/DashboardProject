-- Migration: Populate Courses from course_focus_options table
-- Description: Extract unique courses from course_focus_options and populate client report Question 3

-- ======================================
-- CREATE COURSES TABLE (if not exists)
-- ======================================
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);

-- Add RLS policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read courses" ON courses;
DROP POLICY IF EXISTS "Allow admins to manage courses" ON courses;

CREATE POLICY "Allow authenticated users to read courses"
  ON courses FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage courses"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );

-- ======================================
-- POPULATE COURSES FROM course_focus_options
-- ======================================
-- Extract course code and name from focus_label
-- Format: "ACCT313 Accounting Information Systems - Dr XYZ Only"
-- We want: code="ACCT313", name="Accounting Information Systems"

INSERT INTO courses (code, name)
SELECT DISTINCT
  course_code,
  -- Extract course name (everything between course code and " - ")
  CASE
    -- If there's a dash, take everything before it and remove the course code
    WHEN position(' - ' in focus_label) > 0 THEN
      trim(substring(
        focus_label
        FROM length(course_code) + 2
        FOR position(' - ' in focus_label) - length(course_code) - 2
      ))
    -- Otherwise, take everything after the course code
    ELSE
      trim(substring(focus_label FROM length(course_code) + 2))
  END as course_name
FROM course_focus_options
WHERE
  course_code IS NOT NULL
  AND course_code != ''
  AND focus_label IS NOT NULL
  -- Only include entries with course codes in the label
  AND focus_label LIKE course_code || '%'
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name;

-- ======================================
-- SYNC QUESTION 3 FROM COURSES TABLE
-- ======================================
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(code || ' (' || name || ')', ',' ORDER BY code)
  FROM courses
)
WHERE question_number = 3;

-- ======================================
-- VERIFICATION
-- ======================================
DO $$
DECLARE
  courses_count INTEGER;
  q3_length INTEGER;
BEGIN
  SELECT COUNT(*) INTO courses_count FROM courses;
  SELECT LENGTH(possible_answers) INTO q3_length FROM client_report_questions WHERE question_number = 3;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Courses populated from course_focus_options';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total unique courses: %', courses_count;
  RAISE NOTICE 'Question 3 answer length: % characters', q3_length;
  RAISE NOTICE '========================================';
END $$;

-- Show sample courses
SELECT id, code, name
FROM courses
ORDER BY code
LIMIT 10;
