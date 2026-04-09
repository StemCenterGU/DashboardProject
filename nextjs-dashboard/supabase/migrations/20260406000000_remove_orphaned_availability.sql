-- Remove Orphaned Availability Records
-- Date: 2026-04-06
-- Purpose: Delete availability records where tutor_id does not exist in tutors table

-- First, let's see what we're deleting (for verification)
-- Run this query manually first if you want to see the orphaned records:
-- SELECT ta.availability_id, ta.tutor_id, ta.day_of_week, ta.start_time, ta.end_time
-- FROM tutor_availability ta
-- LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
-- WHERE t.tutor_id IS NULL;

-- Delete orphaned availability records
DELETE FROM tutor_availability
WHERE tutor_id NOT IN (
    SELECT tutor_id FROM tutors
);

-- Add a comment explaining what was done
COMMENT ON TABLE tutor_availability IS 'Tutor availability slots. Foreign key ensures only valid tutor_ids. Orphaned records cleaned on 2026-04-06.';
