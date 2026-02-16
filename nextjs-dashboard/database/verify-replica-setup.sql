-- Paste this entire file into Supabase SQL Editor and Run.
-- You should see 2 result sets with constraint definitions including 'replica'.

-- Check appointments source constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.appointments'::regclass
  AND conname = 'appointments_source_check';

-- Check available_slots source constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.available_slots'::regclass
  AND conname = 'available_slots_source_check';
