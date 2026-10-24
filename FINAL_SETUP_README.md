# Final Setup - Courses & Instructors Auto-Sync

## What You Need

You want to:
1. ✅ Use courses from **`course_focus_options`** table (same as appointment forms)
2. ✅ Use instructors from Question 4 data
3. ✅ Auto-sync everything so Questions 3, 4, 5 stay updated

## One-Step Setup

### Copy and Run This File in Supabase SQL Editor:

**File:** `COMPLETE_SETUP.sql`

This single script does **everything**:
- Creates `courses` table from `course_focus_options`
- Creates `instructors` table from Question 4
- Sets up auto-sync triggers
- Syncs Questions 3, 4, 5

### How to Run:

1. Go to Supabase Dashboard → SQL Editor
2. Open `COMPLETE_SETUP.sql`
3. Copy all contents
4. Paste in SQL Editor
5. Click **Run**
6. Done! ✅

## What It Does

### For Courses (Question 3):

**Source:** `course_focus_options` table

**Extracts:** Unique course codes and names (without instructors)

**Example:**
```
From: "ACCT313 Accounting Information Systems - Dr XYZ Only"
To:   code="ACCT313", name="Accounting Information Systems"
```

**Result in Question 3:**
```
N/A,ACCT313 (Accounting Information Systems),BCOR105 (Found of Busn Enterprise),...
```

### For Instructors (Question 4):

**Source:** `client_report_questions` where `question_number = 4`

**Extracts:** Name, Department, Email ID

**Example:**
```
From: "Abdelal Ahmed (Speech-Language Pathology-Rusk): ABDELAL001"
To:   name="Abdelal Ahmed", dept="Speech-Language...", email_id="ABDELAL001"
```

**Result in Question 4:**
```
N/A,Abdelal Ahmed (Speech-Language Pathology-Rusk): ABDELAL001,...
```

### For Emails (Question 5):

**Source:** `instructors` table (email_address column)

**Result in Question 5:**
```
AUTOEMAIL,ABDELAL001@gannon.edu,ADAMS051@gannon.edu,...
```

## Auto-Sync in Action

After setup, any table changes automatically update questions:

```sql
-- Add a new course
INSERT INTO courses (code, name)
VALUES ('MATH500', 'Advanced Linear Algebra');
-- ✅ Question 3 auto-updates instantly!

-- Add a new instructor
INSERT INTO instructors (name, department, email_id, email_address)
VALUES ('Smith John', 'Mathematics', 'SMITH999', 'SMITH999@gannon.edu');
-- ✅ Questions 4 & 5 auto-update instantly!

-- Update a course name
UPDATE courses SET name = 'Advanced Linear Algebra II' WHERE code = 'MATH500';
-- ✅ Question 3 auto-updates instantly!

-- Delete a course
DELETE FROM courses WHERE code = 'MATH500';
-- ✅ Question 3 auto-updates instantly!
```

## Verification

After running the script, check it worked:

```sql
-- Check courses
SELECT COUNT(*) FROM courses;
-- Should show number of unique courses from course_focus_options

-- Check instructors
SELECT COUNT(*) FROM instructors;
-- Should show ~400+ instructors

-- Check Question 3
SELECT LEFT(possible_answers, 200)
FROM client_report_questions
WHERE question_number = 3;
-- Should show: "N/A,ACCT313 (Accounting Information Systems),..."

-- Check Question 4
SELECT LEFT(possible_answers, 200)
FROM client_report_questions
WHERE question_number = 4;
-- Should show: "N/A,Abdelal Ahmed (Speech-Language Pathology-Rusk): ABDELAL001,..."

-- Check Question 5
SELECT LEFT(possible_answers, 200)
FROM client_report_questions
WHERE question_number = 5;
-- Should show: "AUTOEMAIL,ABDELAL001@gannon.edu,..."
```

## Benefits

✅ **Same source as appointment forms** - Courses come from `course_focus_options`
✅ **Auto-sync** - Never manually update questions again
✅ **Real-time** - Changes apply instantly
✅ **Clean data** - Course names without instructor info
✅ **Easy management** - Just update tables, questions auto-sync

## That's It!

Run `COMPLETE_SETUP.sql` once and you're done forever. 🎉

The system will automatically keep Questions 3, 4, and 5 in sync with your tables.
