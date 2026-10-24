-- Migration: Fix RLS Policies for Client Report Questions
-- Description: Update RLS policies to allow proper access

-- Drop existing policies if they exist
DROP POLICY IF EXISTS admin_manage_report_questions ON client_report_questions;
DROP POLICY IF EXISTS admin_manage_report_config ON client_report_config;

-- Temporarily disable RLS to allow authenticated users (we'll add proper policies after)
ALTER TABLE client_report_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_report_config DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE client_report_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_report_config ENABLE ROW LEVEL SECURITY;

-- Create new policies that allow all authenticated users to read
-- and admins to manage
CREATE POLICY "Allow authenticated users to read report questions"
  ON client_report_questions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admins to manage report questions"
  ON client_report_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Allow authenticated users to read report config"
  ON client_report_config
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admins to manage report config"
  ON client_report_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );
