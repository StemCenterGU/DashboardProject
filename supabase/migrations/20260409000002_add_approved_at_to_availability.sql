-- ============================================================================
-- Schedule Change Request System - Part 3: Track Approval Dates
-- ============================================================================
-- Add approved_at column to tutor_availability to track when slots were approved

-- Add approved_at column
ALTER TABLE tutor_availability
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();

-- Add approved_by column to track which admin approved
ALTER TABLE tutor_availability
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(user_id);

-- Create index for querying by approval date
CREATE INDEX IF NOT EXISTS idx_tutor_availability_approved_at ON tutor_availability(approved_at);

-- Add comments
COMMENT ON COLUMN tutor_availability.approved_at IS 'Timestamp when this availability slot was approved by admin';
COMMENT ON COLUMN tutor_availability.approved_by IS 'Admin user who approved this slot';

-- Set approved_at for existing records (they were auto-approved)
UPDATE tutor_availability
SET approved_at = COALESCE(created_at, NOW())
WHERE approved_at IS NULL;
