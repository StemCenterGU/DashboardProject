# Migration Order - Run These in Sequence

## ⚠️ Important: Run in This Exact Order

You need to run these migrations **one at a time** in the Supabase SQL Editor.

---

## Step 1: Create Courses Table

**File:** `supabase/migrations/20260425000005_create_courses_table.sql`

**What it does:**
- Creates the `courses` table
- Populates it from Question 3 data
- Expected result: ~800+ courses

**Run in Supabase SQL Editor:**
1. Copy the file contents
2. Paste in SQL Editor
3. Click **Run**

**Verify:**
```sql
SELECT COUNT(*) FROM courses;
-- Should return ~800+
```

---

## Step 2: Create Instructors Table

**File:** `supabase/migrations/20260425000004_create_instructors_table.sql`

**What it does:**
- Creates the `instructors` table
- Populates it from Question 4 data
- Expected result: ~400+ instructors

**Run in Supabase SQL Editor:**
1. Copy the file contents
2. Paste in SQL Editor
3. Click **Run**

**Verify:**
```sql
SELECT COUNT(*) FROM instructors;
-- Should return ~400+
```

---

## Step 3: Set Up Auto-Sync Triggers

**File:** `supabase/migrations/20260425000007_auto_sync_questions_with_triggers.sql`

**What it does:**
- Creates database triggers for auto-sync
- Does initial sync of Questions 3, 4, 5 from tables
- From now on, any table changes auto-update questions

**Run in Supabase SQL Editor:**
1. Copy the file contents
2. Paste in SQL Editor
3. Click **Run**

**Verify:**
```sql
-- Check Question 3 is populated
SELECT question_number, LEFT(possible_answers, 100)
FROM client_report_questions
WHERE question_number = 3;

-- Check Question 4 is populated
SELECT question_number, LEFT(possible_answers, 100)
FROM client_report_questions
WHERE question_number = 4;

-- Check Question 5 is populated
SELECT question_number, LEFT(possible_answers, 100)
FROM client_report_questions
WHERE question_number = 5;
```

---

## Quick Copy-Paste Script

If you want to run all three at once, copy this entire script into Supabase SQL Editor:

```sql
-- ============================================================
-- STEP 1: CREATE COURSES TABLE
-- ============================================================

DROP TABLE IF EXISTS courses CASCADE;

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read courses" ON courses;
DROP POLICY IF EXISTS "Allow admins to manage courses" ON courses;

CREATE POLICY "Allow authenticated users to read courses"
  ON courses FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage courses"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );

-- Populate courses from Question 3
DO $$
DECLARE
  course_data TEXT;
  course_item TEXT;
  course_code TEXT;
  course_name TEXT;
BEGIN
  SELECT possible_answers INTO course_data
  FROM client_report_questions
  WHERE question_number = 3;

  IF course_data IS NOT NULL THEN
    FOREACH course_item IN ARRAY string_to_array(course_data, ',')
    LOOP
      course_item := trim(course_item);
      IF course_item != 'N/A' AND course_item != '' AND
         position('(' in course_item) > 0 AND
         position(')' in course_item) > 0 THEN
        course_code := trim(substring(course_item from 1 for position('(' in course_item) - 1));
        course_name := trim(substring(
          course_item
          from position('(' in course_item) + 1
          for position(')' in course_item) - position('(' in course_item) - 1
        ));
        INSERT INTO courses (code, name)
        VALUES (course_code, course_name)
        ON CONFLICT (code) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- STEP 2: CREATE INSTRUCTORS TABLE
-- ============================================================

DROP TABLE IF EXISTS instructors CASCADE;

CREATE TABLE instructors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  email_id TEXT NOT NULL UNIQUE,
  email_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_instructors_email_id ON instructors(email_id);
CREATE INDEX IF NOT EXISTS idx_instructors_name ON instructors(name);
CREATE INDEX IF NOT EXISTS idx_instructors_department ON instructors(department);
CREATE INDEX IF NOT EXISTS idx_instructors_email_address ON instructors(email_address);

ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read instructors" ON instructors;
DROP POLICY IF EXISTS "Allow admins to manage instructors" ON instructors;

CREATE POLICY "Allow authenticated users to read instructors"
  ON instructors FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage instructors"
  ON instructors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );

-- Populate instructors from Question 4
DO $$
DECLARE
  instructor_data TEXT;
  instructor_item TEXT;
  instructor_name TEXT;
  instructor_dept TEXT;
  instructor_email_id TEXT;
BEGIN
  SELECT possible_answers INTO instructor_data
  FROM client_report_questions
  WHERE question_number = 4;

  IF instructor_data IS NOT NULL THEN
    FOREACH instructor_item IN ARRAY string_to_array(instructor_data, ',')
    LOOP
      instructor_item := trim(instructor_item);
      IF instructor_item != 'N/A' AND instructor_item != '' AND
         position('(' in instructor_item) > 0 AND
         position('):' in instructor_item) > 0 THEN
        instructor_name := trim(substring(instructor_item from 1 for position('(' in instructor_item) - 1));
        instructor_dept := trim(substring(instructor_item from position('(' in instructor_item) + 1 for position('):' in instructor_item) - position('(' in instructor_item) - 1));
        instructor_email_id := trim(substring(instructor_item from position('):' in instructor_item) + 2));
        INSERT INTO instructors (name, department, email_id, email_address)
        VALUES (
          instructor_name,
          instructor_dept,
          instructor_email_id,
          instructor_email_id || '@gannon.edu'
        )
        ON CONFLICT (email_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- STEP 3: SET UP AUTO-SYNC TRIGGERS
-- ============================================================

-- Function to sync Question 3
CREATE OR REPLACE FUNCTION sync_question_3_from_courses()
RETURNS trigger AS $$
BEGIN
  UPDATE client_report_questions
  SET possible_answers = (
    SELECT 'N/A,' || string_agg(code || ' (' || name || ')', ',' ORDER BY code)
    FROM courses
  )
  WHERE question_number = 3;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync Questions 4 & 5
CREATE OR REPLACE FUNCTION sync_questions_4_5_from_instructors()
RETURNS trigger AS $$
BEGIN
  UPDATE client_report_questions
  SET possible_answers = (
    SELECT 'N/A,' || string_agg(name || ' (' || department || '): ' || email_id, ',' ORDER BY name)
    FROM instructors
  )
  WHERE question_number = 4;

  UPDATE client_report_questions
  SET possible_answers = (
    SELECT 'AUTOEMAIL,' || string_agg(email_address, ',' ORDER BY email_address)
    FROM instructors
  )
  WHERE question_number = 5;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS courses_auto_sync_trigger ON courses;
DROP TRIGGER IF EXISTS instructors_auto_sync_trigger ON instructors;

-- Create triggers
CREATE TRIGGER courses_auto_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON courses
FOR EACH STATEMENT
EXECUTE FUNCTION sync_question_3_from_courses();

CREATE TRIGGER instructors_auto_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON instructors
FOR EACH STATEMENT
EXECUTE FUNCTION sync_questions_4_5_from_instructors();

-- Initial sync
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(code || ' (' || name || ')', ',' ORDER BY code)
  FROM courses
)
WHERE question_number = 3;

UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(name || ' (' || department || '): ' || email_id, ',' ORDER BY name)
  FROM instructors
)
WHERE question_number = 4;

UPDATE client_report_questions
SET possible_answers = (
  SELECT 'AUTOEMAIL,' || string_agg(email_address, ',' ORDER BY email_address)
  FROM instructors
)
WHERE question_number = 5;

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
  courses_count INTEGER;
  instructors_count INTEGER;
  q3_length INTEGER;
  q4_length INTEGER;
  q5_length INTEGER;
BEGIN
  SELECT COUNT(*) INTO courses_count FROM courses;
  SELECT COUNT(*) INTO instructors_count FROM instructors;
  SELECT LENGTH(possible_answers) INTO q3_length FROM client_report_questions WHERE question_number = 3;
  SELECT LENGTH(possible_answers) INTO q4_length FROM client_report_questions WHERE question_number = 4;
  SELECT LENGTH(possible_answers) INTO q5_length FROM client_report_questions WHERE question_number = 5;

  RAISE NOTICE '✅ Courses: %', courses_count;
  RAISE NOTICE '✅ Instructors: %', instructors_count;
  RAISE NOTICE '✅ Question 3 length: % chars', q3_length;
  RAISE NOTICE '✅ Question 4 length: % chars', q4_length;
  RAISE NOTICE '✅ Question 5 length: % chars', q5_length;
  RAISE NOTICE '✅ Auto-sync triggers installed!';
END $$;

SELECT
  question_number,
  question_text,
  LENGTH(possible_answers) as length,
  LEFT(possible_answers, 100) || '...' as preview
FROM client_report_questions
WHERE question_number IN (3, 4, 5)
ORDER BY question_number;
```

---

## That's It!

After running this script:
- ✅ `courses` table created and populated
- ✅ `instructors` table created and populated
- ✅ Questions 3, 4, 5 synced from tables
- ✅ Auto-sync triggers installed
- ✅ Future changes automatically sync

**Test it:**
```sql
-- Add a test course
INSERT INTO courses (code, name) VALUES ('TEST_999', 'Test Course');

-- Check Question 3 - it should already include TEST_999!
SELECT LEFT(possible_answers, 200) FROM client_report_questions WHERE question_number = 3;

-- Clean up
DELETE FROM courses WHERE code = 'TEST_999';
```
