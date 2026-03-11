-- Migration: Add attachment_path to appointments table
-- Run this in the Supabase SQL Editor for existing databases

-- 1. Add the column to the appointments table
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS attachment_path TEXT;

-- 2. Create the storage bucket (run in Supabase Storage UI or via API)
--    Bucket name: appointment-attachments
--    Public: false
--    File size limit: 10485760 (10 MB)
--    Allowed MIME types: image/jpeg, image/png, image/gif, image/webp,
--      application/pdf, application/msword,
--      application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--      application/vnd.ms-excel,
--      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
--      text/plain

-- 3. Storage RLS policy: allow authenticated users to read files
--    (The upload API uses the service role key so no insert policy is needed on the client side)
--    In Supabase Dashboard > Storage > appointment-attachments > Policies, add:
--
--    Policy: "Authenticated users can read attachments"
--    Operation: SELECT
--    Target roles: authenticated
--    Policy definition: true
