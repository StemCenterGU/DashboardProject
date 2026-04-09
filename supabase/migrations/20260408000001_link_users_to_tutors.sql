-- Link existing users to tutors by matching email prefix with tutor username
-- Example: anjeh001@gannon.edu matches tutor with username 'anjeh001'

-- Update tutors table to link user_id where email prefix matches username
UPDATE tutors
SET user_id = users.user_id
FROM users
WHERE tutors.username = LOWER(SPLIT_PART(users.email, '@', 1))
  AND tutors.user_id IS NULL
  AND users.user_id IS NOT NULL;

-- Log the results for verification
DO $$
DECLARE
  linked_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO linked_count
  FROM tutors
  WHERE user_id IS NOT NULL;

  RAISE NOTICE 'Successfully linked % tutors to user accounts', linked_count;
END $$;
