-- Migration: Sync Client Report Questions from Normalized Tables
-- Description: Populate questions 3, 4, and 5 with data from courses and instructors tables

-- ======================================
-- UPDATE QUESTION 3 (Courses)
-- ======================================
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(code || ' (' || name || ')', ',' ORDER BY code)
  FROM courses
)
WHERE question_number = 3;

-- ======================================
-- UPDATE QUESTION 4 (Instructors)
-- ======================================
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(name || ' (' || department || '): ' || email_id, ',' ORDER BY name)
  FROM instructors
)
WHERE question_number = 4;

-- ======================================
-- UPDATE QUESTION 5 (Automated Emails)
-- ======================================
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

  RAISE NOTICE '✅ Courses in table: %', courses_count;
  RAISE NOTICE '✅ Instructors in table: %', instructors_count;
  RAISE NOTICE '✅ Question 3 answer length: % characters', q3_length;
  RAISE NOTICE '✅ Question 4 answer length: % characters', q4_length;
  RAISE NOTICE '✅ Question 5 answer length: % characters', q5_length;
END $$;

-- Show preview of updated questions
SELECT
  question_number,
  question_text,
  LENGTH(possible_answers) as answer_length,
  LEFT(possible_answers, 100) || '...' as preview
FROM client_report_questions
WHERE question_number IN (3, 4, 5)
ORDER BY question_number;
