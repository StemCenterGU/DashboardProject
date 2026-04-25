-- Migration: Create Client Reports System
-- Description: Creates the main client_reports table for tracking detailed appointment reports
-- Created: 2026-04-24

-- Create client_reports table
CREATE TABLE IF NOT EXISTS client_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id VARCHAR(255) REFERENCES appointments(appointment_id) ON DELETE CASCADE,

  -- Basic Report Information
  client_name VARCHAR(255) NOT NULL,
  report_date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),

  -- Staff Information
  staff_resource_id UUID REFERENCES tutors(tutor_id) ON DELETE SET NULL,
  staff_resource_name VARCHAR(255),

  -- Appointment Details
  actual_appointment_length INTEGER, -- in minutes
  missing_information JSONB DEFAULT '[]'::jsonb, -- Array of checkbox IDs for what info was missing

  -- Course Information
  department VARCHAR(255),
  course_id UUID REFERENCES courses(course_id) ON DELETE SET NULL,
  instructor VARCHAR(255),

  -- Email Automation
  email_automation_enabled BOOLEAN DEFAULT false,
  advisor_email VARCHAR(255),

  -- Focus Areas (stored as arrays of option IDs)
  broad_appointment_focus JSONB DEFAULT '[]'::jsonb,
  resources_utilized JSONB DEFAULT '[]'::jsonb,
  wrc_detailed_focus JSONB DEFAULT '[]'::jsonb,
  wrc_student_categories JSONB DEFAULT '[]'::jsonb,
  gannon_101_credit VARCHAR(50),

  -- Notes (rich text stored as HTML)
  shared_notes TEXT,
  confidential_notes TEXT,

  -- Email Recipients
  email_recipients JSONB DEFAULT '{"client": false, "staff": false, "resource": false}'::jsonb,

  -- Attachments (array of file paths/URLs)
  attachment_paths JSONB DEFAULT '[]'::jsonb,

  -- Audit Fields
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_client_reports_appointment ON client_reports(appointment_id);
CREATE INDEX IF NOT EXISTS idx_client_reports_staff ON client_reports(staff_resource_id);
CREATE INDEX IF NOT EXISTS idx_client_reports_date ON client_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_client_reports_created_by ON client_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_client_reports_course ON client_reports(course_id);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_reports_updated_at ON client_reports;
CREATE TRIGGER trigger_update_client_reports_updated_at
  BEFORE UPDATE ON client_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_client_reports_updated_at();

-- Add comments for documentation
COMMENT ON TABLE client_reports IS 'Stores detailed client appointment reports with focus areas, notes, and attachments';
COMMENT ON COLUMN client_reports.missing_information IS 'Array of option IDs representing missing information checkboxes';
COMMENT ON COLUMN client_reports.broad_appointment_focus IS 'Array of option IDs for broad focus categories';
COMMENT ON COLUMN client_reports.resources_utilized IS 'Array of option IDs for equipment/resources used';
COMMENT ON COLUMN client_reports.wrc_detailed_focus IS 'Array of option IDs for WRC-specific focus areas';
COMMENT ON COLUMN client_reports.wrc_student_categories IS 'Array of option IDs for WRC student categories';
COMMENT ON COLUMN client_reports.shared_notes IS 'Notes visible to client and staff (rich text HTML)';
COMMENT ON COLUMN client_reports.confidential_notes IS 'Notes visible only to staff (rich text HTML)';
COMMENT ON COLUMN client_reports.attachment_paths IS 'Array of file paths/URLs for attachments';
