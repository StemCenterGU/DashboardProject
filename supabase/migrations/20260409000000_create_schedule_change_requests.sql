-- ============================================================================
-- Schedule Change Request System - Part 1: Request Tables
-- ============================================================================
-- This creates the tables for handling tutor schedule change requests
-- with draft, pending, approved, and rejected states

-- Create schedule_change_requests table
CREATE TABLE IF NOT EXISTS schedule_change_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES tutors(tutor_id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(user_id),
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT check_status_dates CHECK (
    (status = 'draft' AND submitted_at IS NULL) OR
    (status IN ('pending', 'approved', 'rejected') AND submitted_at IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_schedule_requests_tutor_id ON schedule_change_requests(tutor_id);
CREATE INDEX idx_schedule_requests_status ON schedule_change_requests(status);
CREATE INDEX idx_schedule_requests_submitted_by ON schedule_change_requests(submitted_by);
CREATE INDEX idx_schedule_requests_submitted_at ON schedule_change_requests(submitted_at);

-- Add comments for documentation
COMMENT ON TABLE schedule_change_requests IS 'Tracks schedule change requests from tutors awaiting admin approval';
COMMENT ON COLUMN schedule_change_requests.status IS 'Request status: draft (being edited), pending (awaiting review), approved (accepted), rejected (denied)';
COMMENT ON COLUMN schedule_change_requests.admin_notes IS 'Admin notes/modifications made during review';
COMMENT ON COLUMN schedule_change_requests.rejection_reason IS 'Reason provided by admin if request is rejected';

-- Create schedule_change_slots table
CREATE TABLE IF NOT EXISTS schedule_change_slots (
  change_slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES schedule_change_requests(request_id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('add', 'delete', 'modify')),
  original_slot_id UUID REFERENCES tutor_availability(availability_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: end_time must be after start_time
  CONSTRAINT check_time_order CHECK (end_time > start_time),

  -- Constraint: original_slot_id required for 'modify' and 'delete' actions
  CONSTRAINT check_original_slot CHECK (
    (action = 'add' AND original_slot_id IS NULL) OR
    (action IN ('modify', 'delete') AND original_slot_id IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_change_slots_request_id ON schedule_change_slots(request_id);
CREATE INDEX idx_change_slots_original_slot ON schedule_change_slots(original_slot_id);
CREATE INDEX idx_change_slots_day ON schedule_change_slots(day_of_week);

-- Add comments
COMMENT ON TABLE schedule_change_slots IS 'Individual slot changes within a schedule change request';
COMMENT ON COLUMN schedule_change_slots.action IS 'Type of change: add (new slot), delete (remove slot), modify (edit existing slot)';
COMMENT ON COLUMN schedule_change_slots.original_slot_id IS 'Reference to existing slot for modify/delete actions';

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_schedule_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_schedule_request_timestamp
  BEFORE UPDATE ON schedule_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_request_timestamp();

-- Add constraint: only one pending request per tutor
CREATE UNIQUE INDEX idx_one_pending_per_tutor
  ON schedule_change_requests(tutor_id)
  WHERE status = 'pending';

COMMENT ON INDEX idx_one_pending_per_tutor IS 'Ensures a tutor can only have one pending request at a time';
