-- ============================================================
-- COMPLETE SETUP: Courses & Instructors with Auto-Sync
-- ============================================================
-- This script does everything in one go:
-- 1. Creates courses table from course_focus_options
-- 2. Creates instructors table from client_report_questions
-- 3. Sets up auto-sync triggers
-- 4. Syncs Questions 3, 4, 5
--
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: CREATE AND POPULATE COURSES TABLE
-- ============================================================

DROP TABLE IF EXISTS courses CASCADE;

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_name ON courses(name);

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

-- Populate courses from course_focus_options
-- Extract unique course codes and names (without instructor info)
INSERT INTO courses (code, name)
SELECT DISTINCT ON (course_code)
  course_code,
  -- Extract course name (everything between course code and " - ")
  CASE
    WHEN position(' - ' in focus_label) > 0 THEN
      trim(substring(
        focus_label
        FROM length(course_code) + 2
        FOR position(' - ' in focus_label) - length(course_code) - 2
      ))
    ELSE
      trim(substring(focus_label FROM length(course_code) + 2))
  END as course_name
FROM course_focus_options
WHERE
  course_code IS NOT NULL
  AND course_code != ''
  AND focus_label IS NOT NULL
  AND focus_label LIKE course_code || '%'
ORDER BY course_code, focus_label
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name;

DO $$
BEGIN
  RAISE NOTICE '✅ Step 1 Complete: Courses table created and populated';
END $$;

-- ============================================================
-- STEP 2: CREATE AND POPULATE INSTRUCTORS TABLE
-- ============================================================

DROP TABLE IF EXISTS instructors CASCADE;

CREATE TABLE instructors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  email_id TEXT NOT NULL UNIQUE,
  email_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_instructors_email_id ON instructors(email_id);
CREATE INDEX idx_instructors_name ON instructors(name);
CREATE INDEX idx_instructors_department ON instructors(department);
CREATE INDEX idx_instructors_email_address ON instructors(email_address);

ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read instructors" ON instructors;
DROP POLICY IF EXISTS "Allow admins to manage instructors" ON instructors;

CREATE POLICY "Allow authenticated users to read instructors"
  ON instructors FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage instructors"
  ON instructors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );

-- Populate instructors from Question 4
DO $$
DECLARE
  instructor_data TEXT;
  instructor_item TEXT;
  instructor_name TEXT;
  instructor_dept TEXT;
  instructor_email_id TEXT;
  paren_pos INT;
  colon_pos INT;
BEGIN
  SELECT possible_answers INTO instructor_data
  FROM client_report_questions
  WHERE question_number = 4;

  IF instructor_data IS NOT NULL THEN
    FOREACH instructor_item IN ARRAY string_to_array(instructor_data, ',')
    LOOP
      instructor_item := trim(instructor_item);

      -- Skip N/A and empty entries
      IF instructor_item = 'N/A' OR instructor_item = '' THEN
        CONTINUE;
      END IF;

      -- Find positions of key characters
      paren_pos := position('(' in instructor_item);
      colon_pos := position('):' in instructor_item);

      -- Only process if format matches: Name (Department): EMAIL_ID
      IF paren_pos > 0 AND colon_pos > paren_pos THEN
        -- Extract name (everything before first '(')
        instructor_name := trim(substring(instructor_item from 1 for paren_pos - 1));

        -- Extract department (between '(' and '):')
        instructor_dept := trim(substring(instructor_item from paren_pos + 1 for colon_pos - paren_pos - 1));

        -- Extract email_id (everything after '):' and space)
        instructor_email_id := trim(substring(instructor_item from colon_pos + 2));

        -- Only insert if we have all required fields
        IF instructor_name != '' AND instructor_email_id != '' THEN
          BEGIN
            INSERT INTO instructors (name, department, email_id, email_address)
            VALUES (
              instructor_name,
              instructor_dept,
              instructor_email_id,
              instructor_email_id || '@gannon.edu'
            );
          EXCEPTION
            WHEN unique_violation THEN
              -- Skip duplicates silently
              NULL;
          END;
        END IF;
      END IF;
    END LOOP;
  END IF;

  RAISE NOTICE '✅ Step 2 Complete: Instructors table created and populated';
END $$;

-- ============================================================
-- STEP 3: SET UP AUTO-SYNC TRIGGERS
-- ============================================================

-- Function to sync Question 3 from courses
CREATE OR REPLACE FUNCTION sync_question_3_from_courses()
RETURNS trigger AS $$
BEGIN
  UPDATE client_report_questions
  SET possible_answers = (
    SELECT 'N/A,' || string_agg(code || ' (' || name || ')', ',' ORDER BY code)
    FROM courses
  )
  WHERE question_number = 3;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync Questions 4 & 5 from instructors
CREATE OR REPLACE FUNCTION sync_questions_4_5_from_instructors()
RETURNS trigger AS $$
BEGIN
  UPDATE client_report_questions
  SET possible_answers = (
    SELECT 'N/A,' || string_agg(name || ' (' || department || '): ' || email_id, ',' ORDER BY name)
    FROM instructors
  )
  WHERE question_number = 4;

  UPDATE client_report_questions
  SET possible_answers = (
    SELECT 'AUTOEMAIL,' || string_agg(email_address, ',' ORDER BY email_address)
    FROM instructors
  )
  WHERE question_number = 5;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS courses_auto_sync_trigger ON courses;
DROP TRIGGER IF EXISTS instructors_auto_sync_trigger ON instructors;

-- Create triggers
CREATE TRIGGER courses_auto_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON courses
FOR EACH STATEMENT
EXECUTE FUNCTION sync_question_3_from_courses();

CREATE TRIGGER instructors_auto_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON instructors
FOR EACH STATEMENT
EXECUTE FUNCTION sync_questions_4_5_from_instructors();

DO $$
BEGIN
  RAISE NOTICE '✅ Step 3 Complete: Auto-sync triggers installed';
END $$;

-- ============================================================
-- STEP 4: INITIAL SYNC OF QUESTIONS 3, 4, 5
-- ============================================================

-- Sync Question 3 (Courses)
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(code || ' (' || name || ')', ',' ORDER BY code)
  FROM courses
)
WHERE question_number = 3;

-- Sync Question 4 (Instructors)
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(name || ' (' || department || '): ' || email_id, ',' ORDER BY name)
  FROM instructors
)
WHERE question_number = 4;

-- Sync Question 5 (Emails)
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'AUTOEMAIL,' || string_agg(email_address, ',' ORDER BY email_address)
  FROM instructors
)
WHERE question_number = 5;

DO $$
BEGIN
  RAISE NOTICE '✅ Step 4 Complete: Questions 3, 4, 5 synced';
END $$;

-- ============================================================
-- VERIFICATION & SUMMARY
-- ============================================================

DO $$
DECLARE
  courses_count INTEGER;
  instructors_count INTEGER;
  q3_length INTEGER;
  q4_length INTEGER;
  q5_length INTEGER;
BEGIN
  SELECT COUNT(*) INTO courses_count FROM courses;
  SELECT COUNT(*) INTO instructors_count FROM instructors;
  SELECT LENGTH(possible_answers) INTO q3_length FROM client_report_questions WHERE question_number = 3;
  SELECT LENGTH(possible_answers) INTO q4_length FROM client_report_questions WHERE question_number = 4;
  SELECT LENGTH(possible_answers) INTO q5_length FROM client_report_questions WHERE question_number = 5;

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════╗';
  RAISE NOTICE '║     SETUP COMPLETE - ALL SYSTEMS READY!        ║';
  RAISE NOTICE '╚════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '   • courses: % unique courses', courses_count;
  RAISE NOTICE '   • instructors: % instructors', instructors_count;
  RAISE NOTICE '';
  RAISE NOTICE '📝 Questions Synced:';
  RAISE NOTICE '   • Question 3 (Courses): % chars', q3_length;
  RAISE NOTICE '   • Question 4 (Instructors): % chars', q4_length;
  RAISE NOTICE '   • Question 5 (Emails): % chars', q5_length;
  RAISE NOTICE '';
  RAISE NOTICE '✨ Auto-Sync Enabled:';
  RAISE NOTICE '   • Add/update courses → Q3 auto-updates';
  RAISE NOTICE '   • Add/update instructors → Q4 & Q5 auto-update';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 You can now add courses/instructors and';
  RAISE NOTICE '   questions will automatically stay in sync!';
  RAISE NOTICE '';
END $$;

-- Show preview of synced questions
SELECT
  question_number,
  question_text,
  LENGTH(possible_answers) as length,
  LEFT(possible_answers, 100) || '...' as preview
FROM client_report_questions
WHERE question_number IN (3, 4, 5)
ORDER BY question_number;

-- Show sample data
SELECT 'Sample Courses' as info, code, name FROM courses ORDER BY code LIMIT 5;
SELECT 'Sample Instructors' as info, name, department, email_address FROM instructors ORDER BY name LIMIT 5;
