-- Migration: Performance Optimization Indexes
-- Description: Adds indexes to improve query performance across all tables
-- Created: 2026-04-24

-- ============================================================================
-- APPOINTMENTS TABLE INDEXES
-- ============================================================================

-- Index for filtering by date range (most common query)
CREATE INDEX IF NOT EXISTS idx_appointments_date_range
ON appointments(appointment_date, start_time, end_time);

-- Index for tutor-specific queries
CREATE INDEX IF NOT EXISTS idx_appointments_tutor_date
ON appointments(tutor_id, appointment_date);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_appointments_status
ON appointments(status) WHERE status != 'cancelled';

-- Index for online/walk-in filtering
CREATE INDEX IF NOT EXISTS idx_appointments_is_online
ON appointments(is_online);

-- Composite index for common scheduling queries
CREATE INDEX IF NOT EXISTS idx_appointments_scheduling
ON appointments(tutor_id, appointment_date, start_time)
WHERE status NOT IN ('cancelled', 'no_show', 'missed');

-- ============================================================================
-- TUTOR_AVAILABILITY TABLE INDEXES
-- ============================================================================

-- Index for active availability queries
CREATE INDEX IF NOT EXISTS idx_tutor_availability_active
ON tutor_availability(tutor_id, day_of_week, is_available)
WHERE is_available = true;

-- Index for time range queries
CREATE INDEX IF NOT EXISTS idx_tutor_availability_time
ON tutor_availability(day_of_week, start_time, end_time);

-- ============================================================================
-- SCHEDULE_CHANGE_REQUESTS TABLE INDEXES
-- ============================================================================

-- Index for pending requests
CREATE INDEX IF NOT EXISTS idx_schedule_requests_pending
ON schedule_change_requests(status, submitted_at)
WHERE status = 'pending';

-- Index for tutor's request history
CREATE INDEX IF NOT EXISTS idx_schedule_requests_tutor
ON schedule_change_requests(tutor_id, status, submitted_at DESC);

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications(user_id, read, created_at DESC)
WHERE read = false;

-- Index for recent notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recent
ON notifications(user_id, created_at DESC);

-- ============================================================================
-- CLIENT_REPORTS TABLE INDEXES
-- ============================================================================

-- Index for date-based report queries
CREATE INDEX IF NOT EXISTS idx_client_reports_date_range
ON client_reports(report_date DESC);

-- Index for staff member's reports
CREATE INDEX IF NOT EXISTS idx_client_reports_staff_date
ON client_reports(staff_resource_id, report_date DESC);

-- ============================================================================
-- USERS/TUTORS TABLE INDEXES
-- ============================================================================

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- Index for tutor lookups by name
CREATE INDEX IF NOT EXISTS idx_tutors_name
ON tutors(tutor_name);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION: ANALYZE TABLES
-- ============================================================================

-- Update table statistics for query planner
ANALYZE appointments;
ANALYZE tutor_availability;
ANALYZE schedule_change_requests;
ANALYZE notifications;
ANALYZE client_reports;
ANALYZE tutors;
ANALYZE users;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_appointments_date_range IS 'Optimizes date range queries for scheduling views';
COMMENT ON INDEX idx_appointments_scheduling IS 'Optimizes active appointment lookups for availability checking';
COMMENT ON INDEX idx_tutor_availability_active IS 'Optimizes queries for available tutor slots';
COMMENT ON INDEX idx_schedule_requests_pending IS 'Optimizes admin dashboard pending requests view';
COMMENT ON INDEX idx_notifications_unread IS 'Optimizes unread notification badge queries';
