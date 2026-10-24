# Complete Data Population Guide

## Overview

This guide explains how data flows and how to populate the normalized tables from your existing question data.

---

## Current State

✅ **You have:** Questions 3, 4, 5 in `client_report_questions` table with comma-separated data
❌ **You need:** Normalized `courses` and `instructors` tables populated from that data

---

## The Data Flow

```
┌─────────────────────────────────┐
│ client_report_questions         │
│ (Questions 3, 4, 5)            │
│ - Comma-separated strings       │
└─────────────────────────────────┘
              │
              │ (1) Run Migrations
              │     (ONE TIME)
              ▼
┌─────────────────────────────────┐
│ Normalized Tables               │
│ - courses (800+ rows)           │
│ - instructors (400+ rows)       │
└─────────────────────────────────┘
              │
              │ (2) Call API Endpoint
              │     (WHENEVER NEEDED)
              ▼
┌─────────────────────────────────┐
│ client_report_questions         │
│ (Questions 3, 4, 5)            │
│ - Updated with latest data      │
└─────────────────────────────────┘
```

---

## Step-by-Step Instructions

### Step 1: Populate the Courses Table

**Run this migration in Supabase Dashboard:**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20260425000005_create_courses_table.sql`
5. Paste into the editor
6. Click **Run**

**What this does:**
- Creates the `courses` table
- Reads question 3: `"N/A,ACCT_313 (Accounting Information Systems),ACCT_315 (...),..."`
- Parses each course into: `{ code: "ACCT_313", name: "Accounting Information Systems" }`
- Inserts ~800 courses into the table

**Verify it worked:**
```sql
SELECT COUNT(*) FROM courses;
-- Should return ~800+

SELECT * FROM courses LIMIT 10;
-- Should show courses with code and name
```

---

### Step 2: Populate the Instructors Table

**Run this migration in Supabase Dashboard:**

1. In **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20260425000004_create_instructors_table.sql`
4. Paste into the editor
5. Click **Run**

**What this does:**
- Creates the `instructors` table
- Reads question 4: `"N/A,Abdelal Ahmed (Speech-Language Pathology-Rusk): ABDELAL001,..."`
- Parses each instructor into:
  ```
  {
    name: "Abdelal Ahmed",
    department: "Speech-Language Pathology-Rusk",
    email_id: "ABDELAL001",
    email_address: "ABDELAL001@gannon.edu"
  }
  ```
- Inserts ~400 instructors into the table

**Verify it worked:**
```sql
SELECT COUNT(*) FROM instructors;
-- Should return ~400+

SELECT * FROM instructors LIMIT 10;
-- Should show instructors with name, department, email_id, email_address
```

---

### Step 3: (Optional) Sync Tables Back to Questions

If you want to update questions 3, 4, 5 with the latest data from the tables:

**Option A: Using Browser Console**

1. Log in to your app as admin
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Paste this code:

```javascript
fetch('/api/admin/report-config/populate-from-tables', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Success!', data)
    alert(`Populated ${data.stats.courses_count} courses and ${data.stats.instructors_count} instructors!`)
  })
  .catch(err => console.error('❌ Error:', err))
```

**Option B: Using Supabase SQL**

Run this in SQL Editor:

```sql
-- Update Question 3 with courses from table
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(code || ' (' || name || ')', ',' ORDER BY code)
  FROM courses
)
WHERE question_number = 3;

-- Update Question 4 with instructors from table
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'N/A,' || string_agg(name || ' (' || department || '): ' || email_id, ',' ORDER BY name)
  FROM instructors
)
WHERE question_number = 4;

-- Update Question 5 with instructor emails from table
UPDATE client_report_questions
SET possible_answers = (
  SELECT 'AUTOEMAIL,' || string_agg(email_address, ',' ORDER BY name)
  FROM instructors
)
WHERE question_number = 5;
```

---

## Summary of Migrations

| Migration | Purpose | Creates | Populates From |
|-----------|---------|---------|----------------|
| `20260425000005_create_courses_table.sql` | Create courses table | `courses` table | Question 3 data |
| `20260425000004_create_instructors_table.sql` | Create instructors table | `instructors` table | Question 4 data |

---

## When to Use Each Method

### Use Migrations (Steps 1 & 2):
- ✅ First time setup
- ✅ After adding the normalized tables feature
- ✅ One-time population from existing questions

### Use API Endpoint (Step 3):
- ✅ After adding new courses to the `courses` table
- ✅ After adding new instructors to the `instructors` table
- ✅ After editing instructor departments or emails
- ✅ Whenever you want to sync tables → questions

---

## Typical Workflow Going Forward

Once the tables are populated:

1. **Add a new course:**
   ```sql
   INSERT INTO courses (code, name)
   VALUES ('MATH_999', 'Advanced Calculus');
   ```

2. **Add a new instructor:**
   ```sql
   INSERT INTO instructors (name, department, email_id, email_address)
   VALUES ('Smith John', 'Mathematics', 'SMITH999', 'SMITH999@gannon.edu');
   ```

3. **Sync to questions:**
   - Call the API endpoint: `POST /api/admin/report-config/populate-from-tables`
   - OR run the SQL UPDATE queries from Step 3

---

## Verification Queries

**Check everything is populated:**

```sql
-- Check courses
SELECT
  'Courses' as table_name,
  COUNT(*) as count,
  MIN(code) as first_code,
  MAX(code) as last_code
FROM courses;

-- Check instructors
SELECT
  'Instructors' as table_name,
  COUNT(*) as count,
  MIN(name) as first_name,
  MAX(name) as last_name
FROM instructors;

-- Check questions are populated
SELECT
  question_number,
  question_text,
  LENGTH(possible_answers) as answer_length,
  LEFT(possible_answers, 50) as preview
FROM client_report_questions
WHERE question_number IN (3, 4, 5)
ORDER BY question_number;
```

---

## Troubleshooting

### "No data in courses/instructors table"
- Make sure you ran the migration
- Check that question 3 and 4 have data in `client_report_questions`
- Look at Supabase logs for errors

### "Migration fails with parsing errors"
- Verify the format of questions 3 and 4
- Question 3 should be: `"CODE (Name),CODE (Name),..."`
- Question 4 should be: `"Name (Department): EMAIL_ID,Name (...),..."`

### "API endpoint returns 0 courses/instructors"
- Run the verification queries above
- Check RLS policies allow reading the tables
- Ensure you're logged in as admin

---

## Quick Reference

| Task | Method |
|------|--------|
| Initial population | Run migrations in Supabase SQL Editor |
| Add new course | `INSERT INTO courses ...` |
| Add new instructor | `INSERT INTO instructors ...` |
| Sync tables to questions | Call API endpoint or run UPDATE queries |
| View data | `SELECT * FROM courses/instructors` |

---

## Need Help?

If something isn't working:
1. Check the Supabase logs for errors
2. Run the verification queries
3. Check that questions 3, 4, 5 exist and have data
4. Ensure you have admin permissions

Let me know if you need assistance!
