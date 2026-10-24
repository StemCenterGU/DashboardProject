-- Migration: Create Programs/Majors Table
-- Description: Store all academic programs and majors for registration form

CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  program_name TEXT NOT NULL,
  program_type TEXT NOT NULL, -- 'Undergraduate' or 'Graduate' or 'Other'
  degree_type TEXT, -- 'B.S.', 'M.A.', 'Minor', etc.
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  show_in_primary BOOLEAN DEFAULT true, -- Show in Primary Major dropdown
  show_in_additional BOOLEAN DEFAULT true, -- Show in Additional Major dropdown
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_programs_type ON programs(program_type);
CREATE INDEX idx_programs_active ON programs(is_active);

-- Insert all programs
INSERT INTO programs (program_name, program_type, degree_type, show_in_primary, show_in_additional, display_order) VALUES
-- Special options (only in Primary, not in Additional)
('Not Listed', 'Other', NULL, true, false, 1),
('N/A – Gannon Employee', 'Other', NULL, true, true, 2),
('Other – Please list in comments section below', 'Other', NULL, true, true, 3),

-- Undergraduate Programs
('Accounting', 'Undergraduate', 'B.S.', true, true, 10),
('Accounting', 'Undergraduate', 'A.S.', true, true, 11),
('Accounting', 'Undergraduate', 'Minor', 12),
('Advertising Communications', 'Undergraduate', 'B.S.', 20),
('Advertising Communications', 'Undergraduate', 'Minor', 21),
('Archaeology and Culture', 'Undergraduate', 'Minor', 30),
('Athletic Coaching', 'Undergraduate', 'Minor', 40),
('Bioinformatics', 'Undergraduate', 'B.S.', 50),
('Biology', 'Undergraduate', 'B.S.', 60),
('Biology', 'Undergraduate', 'Teaching Certificate', 61),
('Biology', 'Undergraduate', 'Minor', 62),
('Biomedical Engineering', 'Undergraduate', 'B.S.', 70),
('Business Administration', 'Undergraduate', 'B.S.', 80),
('Business Administration', 'Undergraduate', 'A.S.', 81),
('Business Administration', 'Undergraduate', 'Certificate', 82),
('Business Administration', 'Undergraduate', 'Minor', 83),
('Chemical Engineering', 'Undergraduate', 'B.S. (Gannon)', 90),
('Chemical Engineering', 'Undergraduate', 'B.S. (Pittsburgh)', 91),
('Chemistry', 'Undergraduate', 'B.S.', 100),
('Communication and Rhetorical Studies', 'Undergraduate', 'Minor', 110),
('Communication Arts-Electronic Media', 'Undergraduate', 'B.A.', 120),
('Computer Science', 'Undergraduate', 'B.S.', 130),
('Computer Science', 'Undergraduate', 'Minor', 131),
('Corrections', 'Undergraduate', 'Minor', 140),
('Criminal Justice', 'Undergraduate', 'B.A.', 150),
('Criminal Justice', 'Undergraduate', 'A.A.', 151),
('Criminal Justice', 'Undergraduate', 'Certificate', 152),
('Criminal Justice', 'Undergraduate', 'Minor', 153),
('Early Childhood Ed./Early Interv.', 'Undergraduate', 'A.A.', 160),
('Early Childhood Education PreK-4', 'Undergraduate', 'B.S.', 170),
('Early Childhood Ed. PreK-4/Spec. Ed. PreK-8', 'Undergraduate', 'B.S.', 171),
('Earth Science', 'Undergraduate', 'Minor', 180),
('Electrical and Computer Engineering', 'Undergraduate', 'B.S.', 190),
('English', 'Undergraduate', 'B.A.', 200),
('English', 'Undergraduate', 'Teaching Certificate', 201),
('English', 'Undergraduate', 'Minor', 202),
('Entrepreneurship', 'Undergraduate', 'B.S.', 210),
('Entrepreneurship', 'Undergraduate', 'Minor', 211),
('Environmental Engineering', 'Undergraduate', 'B.S.', 220),
('Environmental Science', 'Undergraduate', 'B.S.', 230),
('Exercise Science', 'Undergraduate', 'Minor', 240),
('Finance', 'Undergraduate', 'B.S.', 250),
('Finance', 'Undergraduate', 'Minor', 251),
('Fine Arts', 'Undergraduate', 'Minor', 260),
('Foreign Language and International Studies', 'Undergraduate', 'B.A.', 270),
('Foreign Language and Literature', 'Undergraduate', 'B.A.', 280),
('Foreign Language and Literature', 'Undergraduate', 'Teaching Certificate', 281),
('Forensic Investigation', 'Undergraduate', 'Minor', 290),
('French', 'Undergraduate', 'Minor', 300),
('German', 'Undergraduate', 'Minor', 310),
('Gerontology', 'Undergraduate', 'Certificate', 320),
('Gerontology', 'Undergraduate', 'Minor', 321),
('Health Science', 'Undergraduate', 'B.S.', 330),
('History', 'Undergraduate', 'B.A.', 340),
('History', 'Undergraduate', 'Teaching Certificate', 341),
('History', 'Undergraduate', 'Minor', 342),
('Human Resource Management', 'Undergraduate', 'Minor', 350),
('Human Resources', 'Undergraduate', 'Certificate', 360),
('Industrial Engineering', 'Undergraduate', 'B.S.', 370),
('Information Systems', 'Undergraduate', 'B.S.', 380),
('Information Systems', 'Undergraduate', 'Minor', 381),
('International Business', 'Undergraduate', 'B.S.', 390),
('International Business', 'Undergraduate', 'Minor', 391),
('International Studies', 'Undergraduate', 'B.A.', 400),
('International Studies', 'Undergraduate', 'Minor', 401),
('Journalism Communications', 'Undergraduate', 'B.A.', 410),
('Journalism Communications', 'Undergraduate', 'Minor', 411),
('Juvenile Justice', 'Undergraduate', 'Certificate', 420),
('Juvenile Justice', 'Undergraduate', 'Minor', 421),
('Leadership Studies', 'Undergraduate', 'B.S.', 430),
('Leadership Studies', 'Undergraduate', 'Certificate', 431),
('Leadership Studies', 'Undergraduate', 'Minor', 432),
('Legal Studies', 'Undergraduate', 'B.A.', 440),
('Legal Studies', 'Undergraduate', 'A.A.', 441),
('Legal Studies', 'Undergraduate', 'Certificate', 442),
('Liberal Arts', 'Undergraduate', 'B.A.', 450),
('Liberal Arts', 'Undergraduate', 'A.A.', 451),
('Management', 'Undergraduate', 'B.S.', 460),
('Marketing', 'Undergraduate', 'B.S.', 470),
('Marketing', 'Undergraduate', 'Minor', 471),
('Mathematics', 'Undergraduate', 'B.S.', 480),
('Mathematics', 'Undergraduate', 'Teaching Certificate', 481),
('Mathematics', 'Undergraduate', 'Minor', 482),
('Mechanical Engineering', 'Undergraduate', 'B.S.', 490),
('Medical Program', 'Undergraduate', 'B.S. (Gannon); D.O. (LECOM)', 500),
('Medical Program', 'Undergraduate', 'B.S. (Gannon); D.O. (PCOM)', 501),
('Medical Program', 'Undergraduate', 'B.S. (Gannon); M.D. (Ross)', 502),
('Medical Technology', 'Undergraduate', 'B.S.', 510),
('Microcomputer Applications', 'Undergraduate', 'Certificate', 520),
('Middle Level Education 4-8', 'Undergraduate', 'B.S.', 530),
('Middle Level Ed. 4-8/Spec. Ed. PreK-8', 'Undergraduate', 'B.S.', 531),
('Mortuary Science', 'Undergraduate', 'B.S.', 540),
('Nanotechnology', 'Undergraduate', 'Minor', 550),
('Nursing', 'Undergraduate', 'B.S.', 560),
('Nursing RN-BSN', 'Undergraduate', 'B.S.', 561),
('Nursing RN-BSN (Online)', 'Undergraduate', 'B.S.', 562),
('Nutrition and Human Performance', 'Undergraduate', 'B.S.', 570),
('Occupational Therapy', 'Undergraduate', 'M.S.', 580),
('Optometry', 'Undergraduate', 'B.S.', 590),
('Optometry', 'Undergraduate', 'B.S. (Salus)', 591),
('Philosophy', 'Undergraduate', 'B.A.', 600),
('Philosophy', 'Undergraduate', 'Minor', 601),
('Physical Therapy', 'Undergraduate', 'D.P.T.', 610),
('Physician Assistant', 'Undergraduate', 'M.P.A.S.', 620),
('Podiatry Medicine', 'Undergraduate', 'B.S. (Gannon); D.P.M. (Temple)', 630),
('Podiatry Medicine', 'Undergraduate', 'B.S. (Gannon); D.O. (LECOM)', 631),
('Political Science', 'Undergraduate', 'B.A.', 640),
('Political Science', 'Undergraduate', 'Minor', 641),
('Polysomnography', 'Undergraduate', 'Certificate', 650),
('Pre-Law', 'Undergraduate', '3/3 Early Admissions', 660),
('Pre-Law', 'Undergraduate', 'Minor', 661),
('Pre-Pharmacy', 'Undergraduate', 'Pharm.D. (Charleston)', 670),
('Pre-Pharmacy', 'Undergraduate', 'Pharm.D. (Duquesne)', 671),
('Pre-Pharmacy', 'Undergraduate', 'Pharm.D. (LECOM)', 672),
('Pre-Pharm. Dual Deg.', 'Undergraduate', 'B.S. (GU); Pharm.D. (Charleston)', 673),
('Pre-Professional Medical (various fields)', 'Undergraduate', NULL, 680),
('Process Management', 'Undergraduate', 'Minor', 690),
('Psychology', 'Undergraduate', 'B.A.', 700),
('Psychology', 'Undergraduate', 'Minor', 701),
('Radiologic Sciences', 'Undergraduate', 'A.S.', 710),
('Respiratory Care', 'Undergraduate', 'B.S.', 720),
('Respiratory Care', 'Undergraduate', 'A.S.', 721),
('Risk Management and Insurance', 'Undergraduate', 'B.S.', 730),
('Risk Management and Insurance', 'Undergraduate', 'Certificate', 731),
('Risk Management and Insurance', 'Undergraduate', 'Minor', 732),
('School Nurse Certification', 'Undergraduate', 'Certificate', 740),
('Science', 'Undergraduate', 'B.S.', 750),
('Secondary Education and K12', 'Undergraduate', 'B.S.', 760),
('Social Work', 'Undergraduate', 'B.A.', 770),
('Social Work', 'Undergraduate', 'Minor', 771),
('Software Engineering', 'Undergraduate', 'B.S.', 780),
('Spanish', 'Undergraduate', 'Minor', 790),
('Sport and Exercise Science', 'Undergraduate', 'B.S.', 800),
('Sports Behavior', 'Undergraduate', 'Minor', 810),
('Sports Management and Marketing', 'Undergraduate', 'B.S.', 820),
('Statistics', 'Undergraduate', 'Minor', 830),
('Theatre', 'Undergraduate', 'B.A.', 840),
('Theatre', 'Undergraduate', 'Minor', 841),
('Theatre and Communication Arts', 'Undergraduate', 'B.A.', 842),
('Theology', 'Undergraduate', 'B.A.', 850),
('Theology', 'Undergraduate', 'Minor', 851),
('Undeclared', 'Undergraduate', NULL, 860),
('Veterinary Program', 'Undergraduate', 'B.S. (Gannon); D.V.M. (Ross)', 870),
('Womens Studies', 'Undergraduate', 'Minor', 880),

-- Graduate Programs
('Advanced Counselor Studies', 'Graduate', 'Graduate Certificate', 1000),
('Business Administration', 'Graduate', 'M.B.A.', 1010),
('Business Administration (Online)', 'Graduate', 'M.B.A.', 1011),
('Community Counseling', 'Graduate', 'M.S.', 1020),
('Computer and Information Science', 'Graduate', 'M.S.', 1030),
('Counseling Psychology', 'Graduate', 'Ph.D.', 1040),
('Curriculum and Instruction-Cohort Option', 'Graduate', 'M.Ed.', 1050),
('Curriculum and Instruction-On Campus', 'Graduate', 'M.Ed.', 1051),
('Educational Leadership', 'Graduate', 'M.Ed.', 1060),
('Electrical Engineering', 'Graduate', 'M.S.', 1070),
('Embedded Software Engineering', 'Graduate', 'M.S.', 1080),
('Engineering Management', 'Graduate', 'M.S.', 1090),
('Engineering Management (Online)', 'Graduate', 'M.S.', 1091),
('English', 'Graduate', 'M.A.', 1100),
('ESL Program Specialist', 'Graduate', 'Graduate Certificate', 1110),
('Environmental Health and Engineering', 'Graduate', 'M.S.', 1120),
('Environmental Health and Safety', 'Graduate', 'Graduate Certificate', 1121),
('Finance', 'Graduate', 'Graduate Certificate', 1130),
('Gerontology', 'Graduate', 'Graduate Certificate', 1140),
('Human Resource Management', 'Graduate', 'Graduate Certificate', 1150),
('Marketing', 'Graduate', 'Graduate Certificate', 1160),
('Mechanical Engineering', 'Graduate', 'M.S.', 1170),
('Nat. Board for Prof. Teach. Standards', 'Graduate', 'Graduate Certificate', 1180),
('Natural and Environmental Sciences', 'Graduate', 'M.Ed.', 1190),
('Nurse Anesthesia', 'Graduate', 'M.S.N.', 1200),
('Nurse Practitioner', 'Graduate', 'M.S.N.', 1210),
('Nursing Administration', 'Graduate', 'M.S.N.', 1220),
('Nursing RN to MSN', 'Graduate', 'M.S.N.', 1230),
('Occupational Therapy', 'Graduate', 'M.S.', 1240),
('Organizational Leadership', 'Graduate', 'Graduate Certificate', 1250),
('Organizational Learning and Leadership', 'Graduate', 'Ph.D.', 1260),
('Pastoral Leadership', 'Graduate', 'Graduate Certificate', 1270),
('Pastoral Ministry', 'Graduate', 'Graduate Certificate', 1280),
('Pastoral Studies', 'Graduate', 'M.A.', 1290),
('Physical Therapy', 'Graduate', 'D.P.T.', 1300),
('Physician Assistant', 'Graduate', 'M.P.A.S.', 1310),
('Principal K-12', 'Graduate', 'Graduate Certificate', 1320),
('Public Administration', 'Graduate', 'M.P.A.', 1330),
('Public Administration', 'Graduate', 'Graduate Certificate', 1331),
('Public Administration (Online)', 'Graduate', 'M.P.A.', 1332),
('Reading', 'Graduate', 'M.Ed.', 1340),
('Reading Specialist', 'Graduate', 'Graduate Certificate', 1350),
('Religious Education', 'Graduate', 'Graduate Certificate', 1360),
('Secondary Teaching Certification', 'Graduate', 'Graduate Certificate', 1370),
('Superintendent Letter of Eligibility', 'Graduate', 'Graduate Certificate', 1380),
('Supervisor of Curriculum', 'Graduate', 'Graduate Certificate', 1390),
('Supervisor of Special Education', 'Graduate', 'Graduate Certificate', 1400);

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read programs
CREATE POLICY "Allow authenticated users to read programs"
  ON programs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow admins to manage programs
CREATE POLICY "Allow admins to manage programs"
  ON programs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );

-- Create views for easy display format
-- View for PRIMARY Major/Program (includes "Not Listed")
CREATE OR REPLACE VIEW programs_primary_display AS
SELECT
  id,
  CASE
    WHEN degree_type IS NOT NULL THEN program_type || ' | ' || program_name || ' | ' || degree_type
    ELSE program_name
  END as display_name,
  program_type,
  degree_type,
  is_active,
  display_order
FROM programs
WHERE is_active = true AND show_in_primary = true
ORDER BY display_order, program_name, degree_type;

-- View for ADDITIONAL Major/Program (excludes "Not Listed")
CREATE OR REPLACE VIEW programs_additional_display AS
SELECT
  id,
  CASE
    WHEN degree_type IS NOT NULL THEN program_type || ' | ' || program_name || ' | ' || degree_type
    ELSE program_name
  END as display_name,
  program_type,
  degree_type,
  is_active,
  display_order
FROM programs
WHERE is_active = true AND show_in_additional = true
ORDER BY display_order, program_name, degree_type;

-- Keep old view for backward compatibility
CREATE OR REPLACE VIEW programs_display AS
SELECT * FROM programs_primary_display;

COMMENT ON TABLE programs IS 'Academic programs and majors for student registration';
COMMENT ON VIEW programs_primary_display IS 'Formatted display names for Primary Major/Program dropdown (includes "Not Listed")';
COMMENT ON VIEW programs_additional_display IS 'Formatted display names for Additional Major/Program dropdown (excludes "Not Listed")';
