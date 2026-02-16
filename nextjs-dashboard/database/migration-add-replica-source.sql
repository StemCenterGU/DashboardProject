-- Optional migration: document allowed source values (including 'replica')
-- Run this in Supabase SQL Editor if you want to enforce source values at the DB level.
-- The app works without this; it's for clarity and data integrity.

-- 1. Appointments: allow 'wconline', 'manual', 'replica'
-- (Drop existing constraint if you added one earlier; otherwise skip the DROP.)
-- ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_source_check;

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_source_check;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_source_check
  CHECK (source IN ('wconline', 'manual', 'replica'));

-- 2. Available slots: allow 'wconline', 'manual', 'tutor_availability', 'replica'
ALTER TABLE available_slots
  DROP CONSTRAINT IF EXISTS available_slots_source_check;

ALTER TABLE available_slots
  ADD CONSTRAINT available_slots_source_check
  CHECK (source IN ('wconline', 'manual', 'tutor_availability', 'replica'));

-- Comment for future reference
COMMENT ON COLUMN appointments.source IS 'Origin: wconline (sync from Gannon WCOnline API), manual (created in dashboard), replica (created in WCOnline replica app)';
COMMENT ON COLUMN available_slots.source IS 'Origin: wconline, manual, tutor_availability, replica';
