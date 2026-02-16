-- Use an ENUM for users.role so Supabase Table Editor shows a dropdown when editing.
-- Run this in Supabase SQL Editor (after migration-add-developer-role.sql if you use it).

-- 1) Create the enum type with all allowed roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'tutor',
      'lead_tutor',
      'manager',
      'admin',
      'developer'
    );
  END IF;
END
$$;

-- 2) Drop the CHECK constraint if it exists (so we can change column type)
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

-- 3) Change the role column to use the enum only if it is not already user_role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
    AND data_type = 'character varying'
  ) THEN
    -- Drop default first (varchar default can't be cast to enum)
    ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
    -- Change type
    ALTER TABLE users
      ALTER COLUMN role TYPE user_role
      USING role::user_role;
    -- Restore default
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'tutor'::user_role;
  END IF;
END
$$;

COMMENT ON COLUMN users.role IS 'Dropdown in Table Editor: tutor, lead_tutor, manager, admin, developer';
