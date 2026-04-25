-- Migration: Create Registration Form Setup System
-- Description: One-time demographic data collection during student registration
-- Created: 2026-04-24

-- Create registration_form_questions table
CREATE TABLE IF NOT EXISTS registration_form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL CHECK (question_number >= 1 AND question_number <= 20),
  question_text TEXT NOT NULL,
  possible_answers TEXT, -- Stores syntax string (same parser as appointment forms)
  is_required BOOLEAN DEFAULT false,
  display_on_appointment BOOLEAN DEFAULT false, -- Unique to registration form
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure question numbers are unique
  CONSTRAINT unique_registration_question_number UNIQUE (question_number)
);

-- Create user_registration_answers table
CREATE TABLE IF NOT EXISTS user_registration_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  question_id UUID REFERENCES registration_form_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one answer per user per question
  CONSTRAINT unique_user_question UNIQUE (user_id, question_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registration_form_questions_number ON registration_form_questions(question_number);
CREATE INDEX IF NOT EXISTS idx_registration_form_questions_display ON registration_form_questions(display_on_appointment);
CREATE INDEX IF NOT EXISTS idx_user_registration_answers_user ON user_registration_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_registration_answers_question ON user_registration_answers(question_id);

-- Add triggers to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_registration_form_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_registration_form_questions_updated_at ON registration_form_questions;
CREATE TRIGGER trigger_update_registration_form_questions_updated_at
  BEFORE UPDATE ON registration_form_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_registration_form_questions_updated_at();

CREATE OR REPLACE FUNCTION update_user_registration_answers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_registration_answers_updated_at ON user_registration_answers;
CREATE TRIGGER trigger_update_user_registration_answers_updated_at
  BEFORE UPDATE ON user_registration_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_registration_answers_updated_at();

-- Add comments for documentation
COMMENT ON TABLE registration_form_questions IS 'Stores question configurations for one-time student registration/profile forms';
COMMENT ON COLUMN registration_form_questions.display_on_appointment IS 'Whether this demographic data should be shown to tutors on appointment details';
COMMENT ON TABLE user_registration_answers IS 'Stores student demographic profile responses linked to user accounts';
