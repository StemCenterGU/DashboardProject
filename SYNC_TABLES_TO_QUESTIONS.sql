-- ============================================================
-- SYNC TABLES TO QUESTIONS
-- ============================================================
-- This script syncs data FROM courses and instructors tables
-- TO client_report_questions (Questions 3, 4, 5)
-- ============================================================

-- ============================================================
-- STEP 1: SYNC QUESTION 3 FROM COURSES TABLE
-- ============================================================
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(code || ' (' || name || ')', ',' ORDER BY code)
  FROM courses
)
WHERE question_number = 3;

DO $$
BEGIN
  RAISE NOTICE '✅ Question 3 synced from courses table';
END $$;

-- ============================================================
-- STEP 2: SYNC QUESTION 4 FROM INSTRUCTORS TABLE
-- ============================================================
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(name || ' (' || department || '): ' || email_id, ',' ORDER BY name)
  FROM instructors
)
WHERE question_number = 4;

DO $$
BEGIN
  RAISE NOTICE '✅ Question 4 synced from instructors table';
END $$;

-- ============================================================
-- STEP 3: SYNC QUESTION 5 FROM INSTRUCTORS TABLE
-- ============================================================
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'AUTOEMAIL,' || string_agg(email_address, ',' ORDER BY email_address)
  FROM instructors
)
WHERE question_number = 5;

DO $$
BEGIN
  RAISE NOTICE '✅ Question 5 synced from instructors table';
END $$;

-- ============================================================
-- STEP 4: SET UP AUTO-SYNC TRIGGERS
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

-- Drop existing triggers if they exist
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
  RAISE NOTICE '✅ Auto-sync triggers installed';
END $$;

-- ============================================================
-- VERIFICATION
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
  RAISE NOTICE '║     SYNC COMPLETE - ALL SYSTEMS READY!         ║';
  RAISE NOTICE '╚════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables:';
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
