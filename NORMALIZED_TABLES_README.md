# Normalized Database Tables for Courses and Instructors

## Overview

I've created a normalized database structure to replace the comma-separated strings for courses and instructors in your client report questions. This makes the data more maintainable, searchable, and efficient.

## What Was Created

### 1. Database Migration
**File:** `nextjs-dashboard/supabase/migrations/20260425000004_create_normalized_tables.sql`

This migration creates:
- **`courses` table** - Stores course information (code, name)
- **`instructors` table** - Stores instructor information (name, department, email_id, email_address)
- **Automated data population** - Parses existing question data and populates the new tables
- **RLS policies** - Row Level Security for authenticated users (read) and admins (full access)
- **Indexes** - For faster lookups by code, name, email_id, department

### 2. API Endpoints

#### GET /api/admin/courses
**File:** `nextjs-dashboard/app/api/admin/courses/route.ts`
- Returns all courses sorted by course code
- Requires authentication
- Example response:
```json
{
  "courses": [
    {
      "id": 1,
      "code": "ACCT_313",
      "name": "Accounting Information Systems",
      "full_name": "ACCT_313 (Accounting Information Systems)",
      "created_at": "2026-04-25T00:00:00Z",
      "updated_at": "2026-04-25T00:00:00Z"
    }
  ]
}
```

#### GET /api/admin/instructors
**File:** `nextjs-dashboard/app/api/admin/instructors/route.ts`
- Returns all instructors sorted by name
- Requires authentication
- Example response:
```json
{
  "instructors": [
    {
      "id": 1,
      "name": "Abdelal Ahmed",
      "department": "Speech-Language Pathology-Rusk",
      "email_id": "ABDELAL001",
      "email_address": "ABDELAL001@gannon.edu",
      "created_at": "2026-04-25T00:00:00Z",
      "updated_at": "2026-04-25T00:00:00Z"
    }
  ]
}
```

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
cd nextjs-dashboard
npx supabase db reset  # This will apply all migrations
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20260425000004_create_normalized_tables.sql`
4. Click **Run** to execute the migration

### Option 3: Using Supabase Migration Push (Production)
```bash
cd nextjs-dashboard
npx supabase db push  # Pushes new migrations to remote database
```

## Database Schema

### Courses Table
```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,           -- e.g., "ACCT_313"
  name TEXT NOT NULL,                   -- e.g., "Accounting Information Systems"
  full_name TEXT GENERATED ALWAYS AS (code || ' (' || name || ')') STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Instructors Table
```sql
CREATE TABLE instructors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,                   -- e.g., "Abdelal Ahmed"
  department TEXT,                      -- e.g., "Speech-Language Pathology-Rusk"
  email_id TEXT NOT NULL UNIQUE,        -- e.g., "ABDELAL001"
  email_address TEXT NOT NULL UNIQUE,   -- e.g., "ABDELAL001@gannon.edu"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## How the Data Migration Works

The migration includes a PostgreSQL function `populate_courses_and_instructors()` that:

1. **Reads** the existing comma-separated data from `client_report_questions` table:
   - Question 3 contains courses in format: `"ACCT_313 (Accounting Information Systems)"`
   - Question 4 contains instructors in format: `"Abdelal Ahmed (Speech-Language Pathology-Rusk): ABDELAL001"`

2. **Parses** each comma-separated item using PostgreSQL string functions

3. **Inserts** the parsed data into the new `courses` and `instructors` tables

4. **Reports** the number of courses and instructors successfully populated

## Next Steps

### Updating the Frontend (Report Options Page)

You'll want to update `app/(dashboard)/admin/report-options/page.tsx` to:

1. **Fetch courses and instructors** from the new API endpoints instead of displaying comma-separated strings:
```typescript
const [courses, setCourses] = useState([])
const [instructors, setInstructors] = useState([])

useEffect(() => {
  const fetchData = async () => {
    const coursesRes = await fetch('/api/admin/courses')
    const instructorsRes = await fetch('/api/admin/instructors')

    const coursesData = await coursesRes.json()
    const instructorsData = await instructorsRes.json()

    setCourses(coursesData.courses)
    setInstructors(instructorsData.instructors)
  }
  fetchData()
}, [])
```

2. **Display questions 3, 4, 5 differently** - instead of a text input for `possible_answers`, show a searchable dropdown or multi-select component that pulls from the `courses` and `instructors` tables

3. **Update the save logic** - when saving, you can either:
   - **Option A:** Keep storing comma-separated strings in `possible_answers` (generated from the normalized tables)
   - **Option B:** Create junction tables to store relationships between questions and courses/instructors

### Option A Example (Simpler):
```typescript
// When saving question 3, generate the comma-separated string:
const courseString = courses.map(c => `${c.code} (${c.name})`).join(',')

// When saving question 4, generate the comma-separated string:
const instructorString = instructors.map(i =>
  `${i.name} (${i.department}): ${i.email_id}`
).join(',')
```

## Benefits of This Approach

1. **Maintainability**: Add/edit/delete courses and instructors easily
2. **Searchability**: Query courses by code, instructors by name or department
3. **Data Integrity**: Unique constraints prevent duplicates
4. **Performance**: Indexed fields for faster lookups
5. **Flexibility**: Easy to add new fields (e.g., course credits, instructor office hours)
6. **Scalability**: Can handle thousands of courses/instructors efficiently

## Verification

After running the migration, verify the data was populated correctly:

```sql
-- Check course count
SELECT COUNT(*) as course_count FROM courses;

-- Check instructor count
SELECT COUNT(*) as instructor_count FROM instructors;

-- Sample courses
SELECT * FROM courses LIMIT 10;

-- Sample instructors
SELECT * FROM instructors LIMIT 10;
```

Expected results:
- **~800+ courses** (all courses from question 3)
- **~400+ instructors** (all instructors from question 4)

## Troubleshooting

### Migration fails with parsing errors
- Check that the `client_report_questions` table has data for questions 3 and 4
- Run the migration `20260425000002_insert_default_report_questions.sql` first

### No data in tables after migration
- Check Supabase logs for error messages
- Manually run `SELECT populate_courses_and_instructors();` in SQL Editor
- Verify question 3 and 4 data format in `client_report_questions`

### API endpoints return empty arrays
- Ensure RLS policies are correct
- Check that you're authenticated as an admin or developer
- Verify the tables were populated by running the verification SQL above

## Questions?

If you encounter any issues or need help updating the frontend to use these new tables, let me know!
