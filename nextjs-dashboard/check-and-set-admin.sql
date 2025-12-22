-- Step 1: Check if user exists
SELECT user_id, email, full_name, role, active, created_at
FROM users 
WHERE email = 'avishmaniar24@gmail.com';

-- Step 2: If user exists, set admin role
UPDATE users 
SET role = 'admin' 
WHERE email = 'avishmaniar24@gmail.com';

-- Step 3: Verify the change
SELECT user_id, email, full_name, role, active 
FROM users 
WHERE email = 'avishmaniar24@gmail.com';

-- If user doesn't exist, you'll need to register first at /register

