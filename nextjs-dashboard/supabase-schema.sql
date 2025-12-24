-- Supabase Database Schema
-- Run this in Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'tutor' CHECK (role IN ('tutor', 'lead_tutor', 'manager', 'admin')),
    active BOOLEAN DEFAULT true,
    password_hash TEXT,
    salt TEXT,
    tutor_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- ============================================
-- TUTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tutors (
    tutor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_name VARCHAR(255) NOT NULL UNIQUE
);

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
    course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(50) UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for course code lookups
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(active);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id VARCHAR(255) PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES tutors(tutor_id) ON DELETE CASCADE,
    tutor_name VARCHAR(255), -- Tutor name (from Staff or Resource) stored directly for reference
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255),
    course_id UUID REFERENCES courses(course_id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration DECIMAL(4,2), -- Duration in hours
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'missed', 'no_show')),
    notes TEXT,
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'wconline', etc.
    -- WCOnline specific fields
    schedule_title VARCHAR(255), -- Schedule Title from WCOnline
    is_walk_in BOOLEAN DEFAULT false, -- Walk-In/Drop-In
    is_missed BOOLEAN DEFAULT false, -- Missed/No-Show
    is_online BOOLEAN DEFAULT false, -- Online appointment
    focus TEXT, -- Focus field from WCOnline (contains "course_name - course_instructor")
    created_by VARCHAR(255), -- Created By from WCOnline
    modified_by VARCHAR(255), -- Modified By from WCOnline
    is_repeating BOOLEAN DEFAULT false, -- Repeating appointment
    course_instructor VARCHAR(255), -- Course instructor from WCOnline (extracted from focus field)
    course_code VARCHAR(50), -- Course code (stored directly for reference)
    course_name VARCHAR(255), -- Course name (stored directly for reference, extracted from focus field)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_tutor_id ON appointments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_course_id ON appointments(course_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_source ON appointments(source);
CREATE INDEX IF NOT EXISTS idx_appointments_date_tutor ON appointments(appointment_date, tutor_id);

-- ============================================
-- TUTOR AVAILABILITY TABLE (Recurring weekly schedule)
-- ============================================
CREATE TABLE IF NOT EXISTS tutor_availability (
    availability_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES tutors(tutor_id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, day_of_week, start_time, end_time)
);

-- ============================================
-- AVAILABLE TIME SLOTS TABLE (From WCOnline CUSTOM type)
-- ============================================
CREATE TABLE IF NOT EXISTS available_slots (
    slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID REFERENCES tutors(tutor_id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN DEFAULT false,
    source VARCHAR(50) DEFAULT 'wconline', -- 'wconline', 'manual'
    -- WCOnline specific fields (all checked fields from WCOnline)
    schedule_title VARCHAR(255), -- Schedule Title from WCOnline
    is_walk_in BOOLEAN DEFAULT false, -- Walk-In/Drop-In
    is_online BOOLEAN DEFAULT false, -- Online appointment
    focus TEXT, -- Focus field from WCOnline
    created_by VARCHAR(255), -- Created By from WCOnline
    modified_by VARCHAR(255), -- Modified By from WCOnline
    is_repeating BOOLEAN DEFAULT false, -- Repeating slot
    course_code VARCHAR(50), -- Course code (stored directly for reference)
    course_name VARCHAR(255), -- Course name (stored directly for reference)
    course_instructor VARCHAR(255), -- Course instructor from WCOnline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, slot_date, start_time, end_time)
);

-- Indexes for available slots
CREATE INDEX IF NOT EXISTS idx_slots_tutor_id ON available_slots(tutor_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON available_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_slots_booked ON available_slots(is_booked);
CREATE INDEX IF NOT EXISTS idx_slots_date_tutor ON available_slots(slot_date, tutor_id);

-- Index for availability lookups
CREATE INDEX IF NOT EXISTS idx_availability_tutor_id ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_availability_day ON tutor_availability(day_of_week);

-- ============================================
-- SHIFTS TABLE (Optional - for shift management)
-- ============================================
CREATE TABLE IF NOT EXISTS shifts (
    shift_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_name VARCHAR(255),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SHIFT ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shift_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(shift_id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES tutors(tutor_id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for shift assignments
CREATE INDEX IF NOT EXISTS idx_assignments_shift_id ON shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_assignments_tutor_id ON shift_assignments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON shift_assignments(assignment_date);

-- ============================================
-- AUDIT LOGS TABLE (Optional - for tracking changes)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(100), -- 'user', 'appointment', 'tutor', etc.
    target_id VARCHAR(255),
    details JSONB,
    severity VARCHAR(50) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust based on your security needs)
-- For now, allow all operations - you can restrict later

-- Users: Allow read for authenticated, write for admins
CREATE POLICY "Users are viewable by authenticated users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users are insertable by authenticated users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users are updatable by authenticated users" ON users
    FOR UPDATE USING (true);

-- Tutors: Allow all operations
CREATE POLICY "Tutors are viewable by all" ON tutors
    FOR SELECT USING (true);

CREATE POLICY "Tutors are insertable by all" ON tutors
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Tutors are updatable by all" ON tutors
    FOR UPDATE USING (true);

-- Courses: Allow all operations
CREATE POLICY "Courses are viewable by all" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Courses are insertable by all" ON courses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Courses are updatable by all" ON courses
    FOR UPDATE USING (true);

-- Appointments: Allow all operations
CREATE POLICY "Appointments are viewable by all" ON appointments
    FOR SELECT USING (true);

CREATE POLICY "Appointments are insertable by all" ON appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Appointments are updatable by all" ON appointments
    FOR UPDATE USING (true);

-- Tutor Availability: Allow all operations
CREATE POLICY "Availability is viewable by all" ON tutor_availability
    FOR SELECT USING (true);

CREATE POLICY "Availability is insertable by all" ON tutor_availability
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Availability is updatable by all" ON tutor_availability
    FOR UPDATE USING (true);

-- Shifts: Allow all operations
CREATE POLICY "Shifts are viewable by all" ON shifts
    FOR SELECT USING (true);

CREATE POLICY "Shifts are insertable by all" ON shifts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Shifts are updatable by all" ON shifts
    FOR UPDATE USING (true);

-- Shift Assignments: Allow all operations
CREATE POLICY "Assignments are viewable by all" ON shift_assignments
    FOR SELECT USING (true);

CREATE POLICY "Assignments are insertable by all" ON shift_assignments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Assignments are updatable by all" ON shift_assignments
    FOR UPDATE USING (true);

-- Audit Logs: Allow all operations
CREATE POLICY "Audit logs are viewable by all" ON audit_logs
    FOR SELECT USING (true);

CREATE POLICY "Audit logs are insertable by all" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutors_updated_at BEFORE UPDATE ON tutors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_availability_updated_at BEFORE UPDATE ON tutor_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_assignments_updated_at BEFORE UPDATE ON shift_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM 
    information_schema.tables t
WHERE 
    table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY 
    table_name;

