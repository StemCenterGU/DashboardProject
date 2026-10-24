# Automatic Sync Between Tables and Questions

## What This Does

This migration sets up **automatic synchronization** between your normalized tables and client report questions. You'll **never need to manually sync again**!

## How It Works

### Database Triggers

When you:
- ✅ Add a new course → Question 3 automatically updates
- ✅ Update a course → Question 3 automatically updates
- ✅ Delete a course → Question 3 automatically updates
- ✅ Add a new instructor → Questions 4 & 5 automatically update
- ✅ Update an instructor → Questions 4 & 5 automatically update
- ✅ Delete an instructor → Questions 4 & 5 automatically update

**No manual action needed!**

## Setup (One Time Only)

### Run this migration in Supabase SQL Editor:

**File:** `supabase/migrations/20260425000007_auto_sync_questions_with_triggers.sql`

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of the migration file
3. Paste and click **Run**

That's it! Auto-sync is now active.

## Testing It Works

### Test 1: Add a New Course

```sql
-- Add a test course
INSERT INTO courses (code, name)
VALUES ('TEST_999', 'Test Course');

-- Check that Question 3 was automatically updated
SELECT LEFT(possible_answers, 200)
FROM client_report_questions
WHERE question_number = 3;
-- You should see 'TEST_999 (Test Course)' in the string!

-- Clean up
DELETE FROM courses WHERE code = 'TEST_999';
```

### Test 2: Add a New Instructor

```sql
-- Add a test instructor
INSERT INTO instructors (name, department, email_id, email_address)
VALUES ('Test Teacher', 'Test Department', 'TEST999', 'TEST999@gannon.edu');

-- Check that Question 4 was automatically updated
SELECT LEFT(possible_answers, 200)
FROM client_report_questions
WHERE question_number = 4;
-- You should see 'Test Teacher (Test Department): TEST999'

-- Check that Question 5 was automatically updated
SELECT LEFT(possible_answers, 200)
FROM client_report_questions
WHERE question_number = 5;
-- You should see 'TEST999@gannon.edu'

-- Clean up
DELETE FROM instructors WHERE email_id = 'TEST999';
```

## What Gets Synced

| Table Change | Auto-Updates | Format |
|--------------|--------------|--------|
| `courses` → INSERT/UPDATE/DELETE | Question 3 | `N/A,CODE (Name),CODE (Name),...` |
| `instructors` → INSERT/UPDATE/DELETE | Question 4 | `N/A,Name (Dept): EMAIL_ID,...` |
| `instructors` → INSERT/UPDATE/DELETE | Question 5 | `AUTOEMAIL,email@gannon.edu,...` |

## Benefits

✅ **Real-time sync** - Changes appear immediately
✅ **No manual work** - Never run sync scripts again
✅ **Always accurate** - Questions always match table data
✅ **Simple management** - Just update tables, questions auto-update

## Example Workflow

```sql
-- Add a new course for Spring 2026
INSERT INTO courses (code, name)
VALUES ('MATH_500', 'Advanced Linear Algebra');

-- Add a new instructor
INSERT INTO instructors (name, department, email_id, email_address)
VALUES ('Johnson Sarah', 'Mathematics', 'JOHNSON999', 'JOHNSON999@gannon.edu');

-- That's it! Questions 3, 4, and 5 are already updated.
-- No need to call any API or run any sync script.
```

## Behind the Scenes

### Triggers Created:
1. `courses_auto_sync_trigger` - Watches the `courses` table
2. `instructors_auto_sync_trigger` - Watches the `instructors` table

### Functions Created:
1. `sync_question_3_from_courses()` - Rebuilds Question 3
2. `sync_questions_4_5_from_instructors()` - Rebuilds Questions 4 & 5

## Disabling Auto-Sync (if needed)

If you ever need to temporarily disable auto-sync:

```sql
-- Disable triggers
ALTER TABLE courses DISABLE TRIGGER courses_auto_sync_trigger;
ALTER TABLE instructors DISABLE TRIGGER instructors_auto_sync_trigger;

-- Re-enable triggers
ALTER TABLE courses ENABLE TRIGGER courses_auto_sync_trigger;
ALTER TABLE instructors ENABLE TRIGGER instructors_auto_sync_trigger;
```

## Removing Auto-Sync (if needed)

To completely remove the auto-sync feature:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS courses_auto_sync_trigger ON courses;
DROP TRIGGER IF EXISTS instructors_auto_sync_trigger ON instructors;

-- Drop functions
DROP FUNCTION IF EXISTS sync_question_3_from_courses();
DROP FUNCTION IF EXISTS sync_questions_4_5_from_instructors();
```

## Troubleshooting

### Questions not updating after adding data

Check if triggers are enabled:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('courses', 'instructors');
```

Should show:
- `courses_auto_sync_trigger` on `courses` table
- `instructors_auto_sync_trigger` on `instructors` table

### Manual sync if needed

If you ever need to manually trigger a sync:

```sql
-- Sync Question 3
SELECT sync_question_3_from_courses();

-- Sync Questions 4 & 5
SELECT sync_questions_4_5_from_instructors();
```

## Performance Note

The triggers use `FOR EACH STATEMENT` instead of `FOR EACH ROW`, which means:
- ✅ More efficient for bulk operations
- ✅ Only one update per transaction
- ✅ No performance issues with large imports

## Summary

✨ **One-time setup**: Run the migration once
✨ **Forever automated**: Tables and questions stay in sync
✨ **Zero maintenance**: No scripts to run, no endpoints to call

Just manage your courses and instructors in the tables, and the questions will always be up to date!
