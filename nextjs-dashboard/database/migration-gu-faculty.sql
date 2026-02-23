-- GU Faculty table for STEM dashboard
-- Run in Supabase SQL Editor after supabase-schema.sql

CREATE TABLE IF NOT EXISTS faculty (
    faculty_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    user_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faculty_name ON faculty(name);
CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON faculty(user_id);

ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty are viewable by all" ON faculty FOR SELECT USING (true);
CREATE POLICY "Faculty are insertable by all" ON faculty FOR INSERT WITH CHECK (true);
CREATE POLICY "Faculty are updatable by all" ON faculty FOR UPDATE USING (true);

CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON faculty
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
