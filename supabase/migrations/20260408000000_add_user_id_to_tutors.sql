-- Add user_id column to tutors table to link with auth.users
-- This enables tutors to view and edit their own schedules

-- Add user_id column with foreign key constraint
ALTER TABLE tutors
ADD COLUMN user_id UUID UNIQUE
REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_tutors_user_id ON tutors(user_id);

-- Add comment for documentation
COMMENT ON COLUMN tutors.user_id IS 'Links tutor to their authentication user account';
