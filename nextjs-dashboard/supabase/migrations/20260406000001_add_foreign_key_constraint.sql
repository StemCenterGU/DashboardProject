-- Add Foreign Key Constraint to Prevent Orphaned Records
-- Date: 2026-04-06
-- Purpose: Ensure tutor_availability.tutor_id references valid tutors.tutor_id

-- Check if the constraint already exists
-- If it exists, this will fail gracefully

-- Add foreign key constraint with CASCADE delete
-- When a tutor is deleted, their availability records are also deleted
ALTER TABLE tutor_availability
ADD CONSTRAINT fk_tutor_availability_tutor
FOREIGN KEY (tutor_id)
REFERENCES tutors(tutor_id)
ON DELETE CASCADE;

-- Add index on tutor_id for better query performance
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_id
ON tutor_availability(tutor_id);

COMMENT ON CONSTRAINT fk_tutor_availability_tutor ON tutor_availability
IS 'Ensures tutor_id references a valid tutor. Deletes availability when tutor is deleted.';
