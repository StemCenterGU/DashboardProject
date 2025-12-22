-- Set admin role for admin@university.edu
-- Run this in Supabase SQL Editor

UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@university.edu';

-- Verify the change
SELECT user_id, email, full_name, role, active, created_at
FROM users 
WHERE email = 'admin@university.edu';

