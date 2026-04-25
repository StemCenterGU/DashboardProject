-- Migration: Create Report Focus Options
-- Description: Creates table for managing checkbox options in client reports (admin-configurable)
-- Created: 2026-04-24

-- Create report_focus_options table
CREATE TABLE IF NOT EXISTS report_focus_options (
  option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- 'broad_focus', 'resources', 'wrc_detailed', 'wrc_categories', 'missing_info'
  option_text VARCHAR(500) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for category lookups
CREATE INDEX IF NOT EXISTS idx_report_focus_options_category ON report_focus_options(category);
CREATE INDEX IF NOT EXISTS idx_report_focus_options_active ON report_focus_options(is_active);
CREATE INDEX IF NOT EXISTS idx_report_focus_options_order ON report_focus_options(category, display_order);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_report_focus_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_report_focus_options_updated_at ON report_focus_options;
CREATE TRIGGER trigger_update_report_focus_options_updated_at
  BEFORE UPDATE ON report_focus_options
  FOR EACH ROW
  EXECUTE FUNCTION update_report_focus_options_updated_at();

-- Add comments for documentation
COMMENT ON TABLE report_focus_options IS 'Stores configurable checkbox options for client report forms';
COMMENT ON COLUMN report_focus_options.category IS 'Category of option: broad_focus, resources, wrc_detailed, wrc_categories, missing_info';
COMMENT ON COLUMN report_focus_options.display_order IS 'Order in which options appear in the UI';
COMMENT ON COLUMN report_focus_options.is_active IS 'Whether this option is currently available for selection';
