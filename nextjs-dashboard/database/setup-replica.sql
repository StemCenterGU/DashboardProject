-- ============================================
-- WCOnline Replica — Database Setup
-- ============================================
-- Run this in Supabase SQL Editor after the main schema (supabase-schema.sql) is applied.
-- This enables the 'replica' source for appointments and available_slots so the replica app
-- can write data without conflicting with WCOnline sync (which only touches source = 'wconline').

-- Step 1: Allow 'replica' as a valid source for appointments
-- --------------------------------------------
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_source_check;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_source_check
  CHECK (source IN ('wconline', 'manual', 'replica'));

-- Step 2: Allow 'replica' as a valid source for available_slots
-- --------------------------------------------
ALTER TABLE available_slots
  DROP CONSTRAINT IF EXISTS available_slots_source_check;

ALTER TABLE available_slots
  ADD CONSTRAINT available_slots_source_check
  CHECK (source IN ('wconline', 'manual', 'tutor_availability', 'replica'));

-- Step 3: Document columns for future reference
-- --------------------------------------------
COMMENT ON COLUMN appointments.source IS 'Origin: wconline (sync from Gannon WCOnline API), manual (dashboard), replica (WCOnline replica app)';
COMMENT ON COLUMN available_slots.source IS 'Origin: wconline, manual, tutor_availability, replica';

-- ============================================
-- Verification (run separately to confirm)
-- ============================================
-- After running the above, you can run this to verify:
--
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'appointments' AND column_name = 'source';
--
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'appointments'::regclass AND conname = 'appointments_source_check';
