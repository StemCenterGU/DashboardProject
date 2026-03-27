-- Migration: Add administrative options and recurring appointment fields
-- Run this in the Supabase SQL Editor for existing databases

-- 1. Add administrative option fields to appointments table
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_no_show BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_client BOOLEAN DEFAULT false;

-- 2. Add recurring appointment fields to appointments table
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS parent_appointment_id TEXT;

-- 3. Add comments for documentation
COMMENT ON COLUMN appointments.is_placeholder IS 'True if tutor blocked this slot for their own work (no student appointments allowed)';
COMMENT ON COLUMN appointments.is_no_show IS 'True if student did not show up for appointment (admin only)';
COMMENT ON COLUMN appointments.notify_client IS 'True if student should receive email notification';
COMMENT ON COLUMN appointments.recurrence_pattern IS 'JSON string with recurrence rules (e.g., {"frequency": "weekly", "daysOfWeek": [1,3,5]})';
COMMENT ON COLUMN appointments.recurrence_end_date IS 'End date for recurring appointments';
COMMENT ON COLUMN appointments.parent_appointment_id IS 'Reference to the original appointment ID if this is part of a recurring series';

-- 4. Create index for recurring appointment queries
CREATE INDEX IF NOT EXISTS idx_appointments_parent ON appointments(parent_appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_placeholder ON appointments(is_placeholder);
