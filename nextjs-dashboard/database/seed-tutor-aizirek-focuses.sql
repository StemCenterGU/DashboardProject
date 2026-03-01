-- Seed tutor "Aizirek A." and link their focuses (courses) for Course or Focus filtering.
-- Run in Supabase SQL Editor after migration-tutor-courses.sql and seed-course-focus-options.sql (or existing courses).
-- Ensures the tutor exists, then inserts into tutor_courses so filtering by any of these courses shows this tutor.

-- Insert tutor if not exists (ignore if already present)
INSERT INTO tutors (tutor_name)
VALUES ('Aizirek A.')
ON CONFLICT (tutor_name) DO NOTHING;

-- Link Aizirek A. to each focus (course) by course_name
INSERT INTO tutor_courses (tutor_id, course_id)
SELECT t.tutor_id, c.course_id
FROM tutors t
JOIN courses c ON c.course_name IN (
  'BCOR105 Found of Busn Enterprise - Dr Michael Messina Only',
  'BCOR105 Found of Busn Enterprise - any instructors Only',
  'CIS150 Business Technology 1 - Mr Michael Beiter Only',
  'CIS150 Business Technology 1 - any instructors Only',
  'BCOR214 Prin of Accounting I - Dr Renee Castrigano Only',
  'BCOR250 Mgmt Theory and Practice - Dr Eric Brownlee Only',
  'BCOR250 Mgmt Theory and Practice - any instructors Only',
  'BCOR241 Prin of Marketing - Dr Michael Messina Only',
  'BCOR241 Prin of Marketing - any instructors Only',
  'BIOL103 Environmental Issues - Dr Steven Ropski Only',
  'BIOL103 Environmental Issues - any instructors Only',
  'MGMT380 Executive Leadership - Dr Vishal Arghode Only',
  'MGMT380 Executive Leadership - any instructors Only',
  'BCOR303 Legal Env of Business - Mr Terry Holmes Only',
  'BCOR303 Legal Env of Business - any instructors Only',
  'CIS252 Advanced Excel - Joshua Maurer Only',
  'CIS252 Advanced Excel - any instructors Only',
  'MKTG300 Consumer Decision Making - Dr Michael Messina Only',
  'MKTG300 Consumer Decision Making - any instructors Only',
  'MKTG330 Global Marketing - Mr Timothy Grunzel Only',
  'MKTG330 Global Marketing - any instructors Only',
  'IMGT375 Organizational Internship - Dr Celene Kalivoda Only',
  'IMGT375 Organizational Internship - any instructors Only',
  'Academic AdviceMentoring Not Major-Dependent Only',
  'INTERVIEW Only'
) AND c.active = true
WHERE t.tutor_name = 'Aizirek A.'
ON CONFLICT (tutor_id, course_id) DO NOTHING;
