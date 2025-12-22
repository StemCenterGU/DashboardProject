-- Set admin role for avishmaniar24@gmail.com
UPDATE users 
SET role = 'admin' 
WHERE email = 'avishmaniar24@gmail.com';

-- Verify the change
SELECT email, full_name, role, active 
FROM users 
WHERE email = 'avishmaniar24@gmail.com';

