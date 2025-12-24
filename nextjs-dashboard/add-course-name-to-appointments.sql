-- Add course_name column to appointments table if it doesn't exist
-- This column stores the course name directly for reference (from WCOnline)

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS course_name VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN appointments.course_name IS 'Course name (stored directly for reference from WCOnline)';

