-- Migration: Auto-Sync Client Report Questions with Database Triggers
-- Description: Automatically update questions 3, 4, 5 whenever courses or instructors tables change

-- ======================================
-- FUNCTION TO SYNC QUESTION 3 (Courses)
-- ======================================
CREATE OR REPLACE FUNCTION sync_question_3_from_courses()
RETURNS trigger AS $$
BEGIN
  -- Update Question 3 with latest courses data
  UPDATE client_report_questions
  SET possible_answers = (
    SELECT 'N/A,' || string_agg(code || ' (' || name || ')', ',' ORDER BY code)
    FROM courses
  )
  WHERE question_number = 3;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ======================================
-- FUNCTION TO SYNC QUESTIONS 4 & 5 (Instructors)
-- ======================================
CREATE OR REPLACE FUNCTION sync_questions_4_5_from_instructors()
RETURNS trigger AS $$
BEGIN
  -- Update Question 4 with latest instructors data
  UPDATE client_report_questions
  SET possible_answers = (
    SELECT 'N/A,' || string_agg(name || ' (' || department || '): ' || email_id, ',' ORDER BY name)
    FROM instructors
  )
  WHERE question_number = 4;

  -- Update Question 5 with latest instructor emails
  UPDATE client_report_questions
  SET possible_answers = (
    SELECT 'AUTOEMAIL,' || string_agg(email_address, ',' ORDER BY email_address)
    FROM instructors
  )
  WHERE question_number = 5;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ======================================
-- DROP EXISTING TRIGGERS (if they exist)
-- ======================================
DROP TRIGGER IF EXISTS courses_auto_sync_trigger ON courses;
DROP TRIGGER IF EXISTS instructors_auto_sync_trigger ON instructors;

-- ======================================
-- CREATE TRIGGERS FOR AUTO-SYNC
-- ======================================

-- Trigger for courses table
-- Fires AFTER any INSERT, UPDATE, or DELETE on courses
CREATE TRIGGER courses_auto_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON courses
FOR EACH STATEMENT
EXECUTE FUNCTION sync_question_3_from_courses();

-- Trigger for instructors table
-- Fires AFTER any INSERT, UPDATE, or DELETE on instructors
CREATE TRIGGER instructors_auto_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON instructors
FOR EACH STATEMENT
EXECUTE FUNCTION sync_questions_4_5_from_instructors();

-- ======================================
-- INITIAL SYNC
-- ======================================
-- Populate questions with current data from tables

-- Sync Question 3 directly (can't call trigger function)
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(code || ' (' || name || ')', ',' ORDER BY code)
  FROM courses
)
WHERE question_number = 3;

-- Sync Question 4 directly
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(name || ' (' || department || '): ' || email_id, ',' ORDER BY name)
  FROM instructors
)
WHERE question_number = 4;

-- Sync Question 5 directly
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'AUTOEMAIL,' || string_agg(email_address, ',' ORDER BY email_address)
  FROM instructors
)
WHERE question_number = 5;

-- ======================================
-- VERIFICATION
-- ======================================
DO $$
DECLARE
  courses_count INTEGER;
  instructors_count INTEGER;
  q3_length INTEGER;
  q4_length INTEGER;
  q5_length INTEGER;
BEGIN
  -- Count records in tables
  SELECT COUNT(*) INTO courses_count FROM courses;
  SELECT COUNT(*) INTO instructors_count FROM instructors;

  -- Get length of populated answers
  SELECT LENGTH(possible_answers) INTO q3_length FROM client_report_questions WHERE question_number = 3;
  SELECT LENGTH(possible_answers) INTO q4_length FROM client_report_questions WHERE question_number = 4;
  SELECT LENGTH(possible_answers) INTO q5_length FROM client_report_questions WHERE question_number = 5;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AUTO-SYNC TRIGGERS INSTALLED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Courses in table: %', courses_count;
  RAISE NOTICE 'Instructors in table: %', instructors_count;
  RAISE NOTICE 'Question 3 (Courses) length: % characters', q3_length;
  RAISE NOTICE 'Question 4 (Instructors) length: % characters', q4_length;
  RAISE NOTICE 'Question 5 (Emails) length: % characters', q5_length;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Questions will now auto-update when tables change!';
  RAISE NOTICE '========================================';
END $$;

-- Show preview of synced questions
SELECT
  question_number,
  question_text,
  LENGTH(possible_answers) as answer_length,
  LEFT(possible_answers, 100) || '...' as preview
FROM client_report_questions
WHERE question_number IN (3, 4, 5)
ORDER BY question_number;
