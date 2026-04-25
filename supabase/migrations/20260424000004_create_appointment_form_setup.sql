-- Migration: Create Appointment Form Setup System
-- Description: Dynamic question configuration for client appointment booking forms
-- Created: 2026-04-24

-- Create appointment_form_questions table
CREATE TABLE IF NOT EXISTS appointment_form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL CHECK (question_number >= 1 AND question_number <= 20),
  question_text TEXT NOT NULL,
  possible_answers TEXT, -- Stores syntax string (e.g., "CHECKBOX,Option1,Option2" or empty for FILL-IN)
  is_required BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'Normal Visibility', -- 'Normal Visibility' or 'Administrators Only'
  send_to_staff BOOLEAN DEFAULT false,
  schedule_restrictions JSONB DEFAULT '[]'::jsonb, -- Array of schedule IDs this question applies to
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure question numbers are unique
  CONSTRAINT unique_question_number UNIQUE (question_number)
);

-- Create appointment_answers table
CREATE TABLE IF NOT EXISTS appointment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id VARCHAR(255) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
  question_id UUID REFERENCES appointment_form_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointment_form_questions_number ON appointment_form_questions(question_number);
CREATE INDEX IF NOT EXISTS idx_appointment_answers_appointment ON appointment_answers(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_answers_question ON appointment_answers(question_id);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointment_form_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_appointment_form_questions_updated_at ON appointment_form_questions;
CREATE TRIGGER trigger_update_appointment_form_questions_updated_at
  BEFORE UPDATE ON appointment_form_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_form_questions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE appointment_form_questions IS 'Stores dynamic question configurations for client appointment booking forms';
COMMENT ON COLUMN appointment_form_questions.possible_answers IS 'Syntax string: empty=FILL-IN, TEXTAREA, LIKERT, CHECKBOX[,options], or comma-separated=DROP-DOWN';
COMMENT ON COLUMN appointment_form_questions.schedule_restrictions IS 'Array of schedule IDs - empty array means applies to all schedules';
COMMENT ON TABLE appointment_answers IS 'Stores client responses to dynamic appointment form questions';
