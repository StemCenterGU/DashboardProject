-- Add instructor to tutor_courses so each link is (tutor, course, instructor).
-- Run after migration-tutor-courses.sql. Run before seed-tutor-focuses-bulk.sql.

-- Add column (nullable at first for existing rows)
ALTER TABLE tutor_courses
  ADD COLUMN IF NOT EXISTS instructor VARCHAR(255);

-- Backfill existing rows so PK can include instructor
UPDATE tutor_courses
SET instructor = 'any instructors'
WHERE instructor IS NULL;

-- Default for new rows and enforce NOT NULL
ALTER TABLE tutor_courses
  ALTER COLUMN instructor SET DEFAULT 'any instructors';
ALTER TABLE tutor_courses
  ALTER COLUMN instructor SET NOT NULL;

-- Replace primary key with (tutor_id, course_id, instructor)
ALTER TABLE tutor_courses
  DROP CONSTRAINT IF EXISTS tutor_courses_pkey;

ALTER TABLE tutor_courses
  ADD PRIMARY KEY (tutor_id, course_id, instructor);

COMMENT ON COLUMN tutor_courses.instructor IS 'Instructor for this focus (e.g. "Dr X", "any instructors")';
COMMENT ON TABLE tutor_courses IS 'Which courses/focuses (with instructor) each tutor supports; used for Course or Focus filter on schedule';
