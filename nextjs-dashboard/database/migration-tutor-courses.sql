-- Tutor–Course (Focus) junction table
-- Links tutors to the courses/focuses they support so the schedule can filter by "Course or Focus".
-- Run in Supabase SQL Editor after supabase-schema.sql.

CREATE TABLE IF NOT EXISTS tutor_courses (
  tutor_id UUID NOT NULL REFERENCES tutors(tutor_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (tutor_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_tutor_courses_tutor_id ON tutor_courses(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_courses_course_id ON tutor_courses(course_id);

COMMENT ON TABLE tutor_courses IS 'Which courses/focuses each tutor can support; used for Course or Focus filter on schedule';
