-- Add tutor_name column to appointments table if it doesn't exist
-- This column stores the tutor name directly from "Staff or Resource" field

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS tutor_name VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN appointments.tutor_name IS 'Tutor name (from Staff or Resource field, stored directly for reference)';

