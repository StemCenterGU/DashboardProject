-- Add missing columns to appointments table
-- These columns support the full appointment workflow including no-shows, placeholders, and recurring appointments

-- Add is_no_show column (tracks no-show appointments)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_no_show BOOLEAN DEFAULT FALSE;

-- Add is_placeholder column (for blocked time slots)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;

-- Add notify_client column (controls email notifications)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS notify_client BOOLEAN DEFAULT FALSE;

-- Add attachment_path column (for uploaded files)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Add recurrence columns for recurring appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_repeating BOOLEAN DEFAULT FALSE;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS parent_appointment_id VARCHAR(50);

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_appointments_no_show
ON appointments(is_no_show)
WHERE is_no_show = TRUE;

CREATE INDEX IF NOT EXISTS idx_appointments_placeholder
ON appointments(is_placeholder)
WHERE is_placeholder = TRUE;

CREATE INDEX IF NOT EXISTS idx_appointments_repeating
ON appointments(is_repeating)
WHERE is_repeating = TRUE;

CREATE INDEX IF NOT EXISTS idx_appointments_parent
ON appointments(parent_appointment_id)
WHERE parent_appointment_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN appointments.is_no_show IS 'Indicates if the student did not show up for the appointment. Can only be set by admins, managers, or lead tutors.';
COMMENT ON COLUMN appointments.is_placeholder IS 'Indicates if this is a placeholder/blocked time slot rather than an actual appointment.';
COMMENT ON COLUMN appointments.notify_client IS 'Whether to send email notification to the student about this appointment.';
COMMENT ON COLUMN appointments.attachment_path IS 'Path to any file attached to this appointment (e.g., assignment, notes).';
COMMENT ON COLUMN appointments.is_repeating IS 'Whether this appointment is part of a recurring series.';
COMMENT ON COLUMN appointments.recurrence_pattern IS 'JSON string defining the recurrence pattern (frequency, days of week, etc.).';
COMMENT ON COLUMN appointments.recurrence_end_date IS 'End date for recurring appointments.';
COMMENT ON COLUMN appointments.parent_appointment_id IS 'ID linking all appointments in a recurring series together.';
