-- Migration: Create Client Report Config Table
-- Description: Store email template configuration for client reports

CREATE TABLE IF NOT EXISTS client_report_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  email_body TEXT,
  email_subject TEXT DEFAULT 'Automated Tutoring Report - [username], [date]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_config_row CHECK (id = 1)
);

-- Insert default configuration
INSERT INTO client_report_config (id, email_body, email_subject)
VALUES (
  1,
  '<p><strong>Date:</strong> [date], [start] - [end]</p>
<p></p>
<p><strong>Course:</strong> [q73_response]</p>
<p></p>
<p><strong>Instructor:</strong> [q27_response]</p>
<p></p>
<p><strong>Writing &amp; Research Center Only | Appointment Topics:</strong> [q71_response]</p>
<p></p>
<p><strong>Appointment Summary:</strong> [q30_response]</p>
<p></p>
<p style="color: red;">If you believe you may have been sent this in error (such as if [username] is not your student), please consider replying to this email so that appointment records can be rectified; most likely, the incorrect instructor was selected from an internal listing.</p>',
  'Automated Tutoring Report - [username], [date]'
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE client_report_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read config" ON client_report_config;
DROP POLICY IF EXISTS "Allow admins to manage config" ON client_report_config;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read config"
  ON client_report_config FOR SELECT
  USING (true);

-- Allow admins to update
CREATE POLICY "Allow admins to manage config"
  ON client_report_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );
