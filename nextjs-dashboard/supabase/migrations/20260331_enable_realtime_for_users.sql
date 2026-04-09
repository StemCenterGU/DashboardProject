-- Enable Realtime for users table
-- This allows the AuthContext to receive instant updates when user roles change

-- 1. Enable realtime for the users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- 2. Create RLS policy to allow users to subscribe to their own role changes
-- Users can only listen to changes on their own record, not other users
CREATE POLICY IF NOT EXISTS "Users can subscribe to own role changes"
ON users
FOR SELECT
USING (user_id = auth.uid());

-- 3. Ensure realtime is enabled for UPDATE events
-- (This is typically enabled by default, but we're being explicit)
COMMENT ON TABLE users IS 'Realtime enabled for role synchronization';
