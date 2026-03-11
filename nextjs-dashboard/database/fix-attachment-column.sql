-- QUICK FIX: Add attachment_path column to appointments table
-- This fixes the error: "Could not find the 'attachment_path' column of 'appointments' in the schema cache"

-- Run this SQL in Supabase SQL Editor:
-- 1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 2. Copy and paste this entire file
-- 3. Click "Run"

-- Add the attachment_path column if it doesn't exist
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- Verify the column was added (optional - run separately to check)
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'appointments'
-- AND column_name = 'attachment_path';
