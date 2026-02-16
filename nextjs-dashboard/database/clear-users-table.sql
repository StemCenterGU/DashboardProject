-- Clear all rows from the users table.
-- Auth users are unchanged; on next login they will get a new row (sync-on-login).
-- Run in Supabase SQL Editor.

DELETE FROM users;

-- Optional: reset sequence if you had a non-UUID column with a sequence (users uses UUID, so not needed).
-- To remove all data and reset: TRUNCATE users RESTART IDENTITY CASCADE;
