-- Add 'developer' role so developer accounts can see new/replica features.
-- Run this in Supabase SQL Editor.

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('tutor', 'lead_tutor', 'manager', 'admin', 'developer'));

COMMENT ON COLUMN users.role IS 'tutor, lead_tutor, manager, admin, developer (developer sees Replica / new features)';
