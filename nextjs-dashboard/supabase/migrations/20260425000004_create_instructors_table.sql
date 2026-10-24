-- Migration: Create Instructors Table with Automated Emails
-- Description: Normalize instructor data from comma-separated strings to relational table
-- Note: Courses table already exists and is working perfectly

-- Drop existing instructors table if it exists (clean slate)
DROP TABLE IF EXISTS instructors CASCADE;

-- ======================================
-- CREATE INSTRUCTORS TABLE
-- ======================================
-- This table stores both instructor information AND their automated email addresses
-- Question 4: Instructor data in format "Name (Department): EMAIL_ID"
-- Question 5: Automated emails in format "EMAIL_ID@gannon.edu"
CREATE TABLE instructors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  email_id TEXT NOT NULL UNIQUE, -- e.g., ABDELAL001
  email_address TEXT NOT NULL UNIQUE, -- e.g., ABDELAL001@gannon.edu (automated email)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_instructors_email_id ON instructors(email_id);
CREATE INDEX IF NOT EXISTS idx_instructors_name ON instructors(name);
CREATE INDEX IF NOT EXISTS idx_instructors_department ON instructors(department);
CREATE INDEX IF NOT EXISTS idx_instructors_email_address ON instructors(email_address);

-- Add RLS policies
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read instructors" ON instructors;
DROP POLICY IF EXISTS "Allow admins to manage instructors" ON instructors;

-- Allow all authenticated users to read instructors
CREATE POLICY "Allow authenticated users to read instructors"
  ON instructors
  FOR SELECT
  USING (true);

-- Allow admins to manage instructors
CREATE POLICY "Allow admins to manage instructors"
  ON instructors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );

-- ======================================
-- DATA POPULATION FUNCTION
-- ======================================
-- This function parses the existing comma-separated data from client_report_questions
-- and populates the instructors table

CREATE OR REPLACE FUNCTION populate_instructors_from_questions()
RETURNS void AS $$
DECLARE
  instructor_data TEXT;
  instructor_item TEXT;
  instructor_name TEXT;
  instructor_dept TEXT;
  instructor_email_id TEXT;
BEGIN
  -- Get instructor data from question 4
  -- Format: "Abdelal Ahmed (Speech-Language Pathology-Rusk): ABDELAL001"
  SELECT possible_answers INTO instructor_data
  FROM client_report_questions
  WHERE question_number = 4;

  -- Parse and insert instructors
  IF instructor_data IS NOT NULL THEN
    FOREACH instructor_item IN ARRAY string_to_array(instructor_data, ',')
    LOOP
      -- Skip N/A and empty items
      instructor_item := trim(instructor_item);

      IF instructor_item != 'N/A' AND instructor_item != '' AND
         position('(' in instructor_item) > 0 AND
         position('):' in instructor_item) > 0 THEN

        -- Extract name (before opening parenthesis)
        instructor_name := trim(substring(instructor_item from 1 for position('(' in instructor_item) - 1));

        -- Extract department (between parentheses)
        instructor_dept := trim(substring(instructor_item from position('(' in instructor_item) + 1 for position('):' in instructor_item) - position('(' in instructor_item) - 1));

        -- Extract email ID (after ): )
        instructor_email_id := trim(substring(instructor_item from position('):' in instructor_item) + 2));

        -- Insert instructor with automated email address
        INSERT INTO instructors (name, department, email_id, email_address)
        VALUES (
          instructor_name,
          instructor_dept,
          instructor_email_id,
          instructor_email_id || '@gannon.edu'
        )
        ON CONFLICT (email_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the population function
SELECT populate_instructors_from_questions();

-- Drop the function after use (optional - comment out if you want to keep it)
DROP FUNCTION IF EXISTS populate_instructors_from_questions();

-- ======================================
-- VERIFICATION
-- ======================================
-- Check how many instructors were inserted
DO $$
DECLARE
  instructor_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO instructor_count FROM instructors;
  RAISE NOTICE 'Successfully populated % instructors with automated emails', instructor_count;
END $$;

-- Sample query to verify data
-- Uncomment to see sample data:
-- SELECT id, name, department, email_id, email_address
-- FROM instructors
-- ORDER BY name
-- LIMIT 10;
