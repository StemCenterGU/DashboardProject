-- Reset Email Template to Default with Proper Formatting
-- Run this in Supabase SQL Editor to update the email template

-- Delete existing config
DELETE FROM client_report_config WHERE id = 1;

-- Insert new config with proper line breaks
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
);

-- Verify the update
SELECT
  id,
  email_subject,
  substring(email_body from 1 for 200) as email_preview
FROM client_report_config
WHERE id = 1;
