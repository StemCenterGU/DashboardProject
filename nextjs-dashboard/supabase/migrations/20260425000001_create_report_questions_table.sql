-- Migration: Create Client Report Questions Table
-- Description: Store client report form questions (post-session form filled by staff)

-- Create report questions table
CREATE TABLE IF NOT EXISTS client_report_questions (
  id SERIAL PRIMARY KEY,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  possible_answers TEXT, -- Can be NULL for fill-in, or contain CHECKBOX/TEXTAREA/LIKERT/AUTOEMAIL/dropdown options
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(question_number)
);

-- Create report configuration table for email settings
CREATE TABLE IF NOT EXISTS client_report_config (
  id SERIAL PRIMARY KEY,
  email_body TEXT,
  email_subject TEXT DEFAULT 'Automated Tutoring Report - [username], [date]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default email configuration
INSERT INTO client_report_config (email_body, email_subject)
VALUES (
  'Automated Tutoring Report Form

Tutoring Department: [q26_response]

Client: [username]

Tutor/consultant: [resource]

Date: [date], [start] - [end]

Course: [q73_response]',
  'Automated Tutoring Report - [username], [date]'
)
ON CONFLICT DO NOTHING;

-- Insert default client report questions (from WCOnline)
INSERT INTO client_report_questions (question_number, question_text, possible_answers, is_required) VALUES
  (1, 'If any key information (student name, course, instructor name, advisor name) is missing or incomplete, check the appropriate box and describe the issue in the CONFIDENTIAL text area at the bottom of the form', 'CHECKBOX,Incorrect and/or incomplete information given by student,Information given by student cannot be found in dropdown lists', false),
  (2, 'Department', 'Writing & Research Center,STEM Center', true),
  (3, 'Course', 'N/A,ACCT_313 (Accounting Information Systems),ACCT_315 (Intermediate Fin Accounting II),ACCT_320 (Cost Management),ACCT_355 (Forensic Analysis),ACCT_365 (Internal Audit),ACCT_375 (Organiztnl Internshp),ACCT_420 (Income Taxes)', true),
  (4, 'Instructor', 'N/A,Abdelal Ahmed (Speech-Language Pathology-Rusk): ABDELAL001,Adams Heather (Physician Assistant Program): ADAMS051', true),
  (5, 'Automated instructor email (do not use if student wants to keep appointment confidential)', 'AUTOEMAIL,ABDELAL001@gannon.edu,ADAMS051@gannon.edu,ADAMUS002@gannon.edu', false),
  (6, 'Advisor email lookup (email addresses shown here will have to be entered manually in the area at the bottom of the form)', '(do not use this for now)', false),
  (7, 'Broad appointment focus(es)', 'CHECKBOX,Help with assignment,Study for a quiz/test/exam,Review previous notes/materials in general,Get ahead on upcoming course material,General help studying or organizing,Understand instructor expectations,General speech or presentation skills,Help communicating in the English language,Select/register for courses,Discuss academic majors/minors/programs,Discuss careers,Discuss student life or engagement opportunities,Discuss personal concerns,Communication attempt to an assigned student,Two-way exchange with an assigned student', false),
  (8, 'Resources utilized', 'CHECKBOX,[WRC] Sanner Presentation Studio,[STEM] Touchscreen display,[STEM] Surface Studio PC,[STEM] Surface tablet,[STEM] Android tablet,[STEM] Graphing calculator,[STEM] Scientific calculator,[STEM] Display screen/AirMedia,[STEM] Microscope,[STEM] Anatomy/skeletal model,[STEM] Chemistry model kit,[STEM] 3D printer,[STEM] Smart notebook,[STEM] Wall-mount whiteboard,[STEM] Small hanging whiteboard', false),
  (9, '[WRC] Detailed appointment focus(es)', 'CHECKBOX,Understanding the assignment,Developing a thesis,Organizing; using transitions,Developing stronger support,Understanding instructors comments,Writing to an audience,Documentation,Using quotes & paraphrases,Punctuation & spelling,Style/voice,Grammar/mechanics,Tutoring appointment,Speech appointment,Conversation partner appointment', false),
  (10, 'Was this appointment for Gannon 101 credit?', 'Yes,No', true),
  (11, 'Shared appointment notes, sent in email to student/faculty/advisor (such as assignment, specific material covered, suggestions to students, and recommended plans for students)', 'TEXTAREA', false),
  (12, 'Confidential appointment notes, not sent in email, but viewable by staff and tutors with WCOnline administrative access', 'TEXTAREA', false),
  (13, '[WRC] Check all that apply', 'CHECKBOX,Global Student,Possibility Student,ESL Program,Dual Enrollment,Freshmen,Graduate Student', false);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_report_questions_number ON client_report_questions(question_number);

-- Add RLS policies
ALTER TABLE client_report_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_report_config ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage report questions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_report_questions'
    AND policyname = 'admin_manage_report_questions'
  ) THEN
    CREATE POLICY admin_manage_report_questions ON client_report_questions
      FOR ALL
      USING (auth.jwt() ->> 'role' IN ('admin', 'developer'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_report_config'
    AND policyname = 'admin_manage_report_config'
  ) THEN
    CREATE POLICY admin_manage_report_config ON client_report_config
      FOR ALL
      USING (auth.jwt() ->> 'role' IN ('admin', 'developer'));
  END IF;
END $$;
