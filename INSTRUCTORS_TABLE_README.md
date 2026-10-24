# Instructors Table with Automated Emails

## Overview

I've created a normalized database table for instructors with their automated email addresses. This replaces the comma-separated strings in questions 4 and 5 with a proper relational table.

**Note:** Your existing `courses` table is already working perfectly and remains unchanged.

## What Was Created

### 1. Database Migration
**File:** `nextjs-dashboard/supabase/migrations/20260425000004_create_instructors_table.sql`

This migration creates:
- **`instructors` table** - Stores instructor information with automated emails
- **Automated data population** - Parses question 4 data and populates the table
- **Email mapping** - Each instructor has their email_id and full email_address
- **RLS policies** - Row Level Security for authenticated users (read) and admins (full access)
- **Indexes** - For faster lookups by email_id, name, department, email_address

### 2. API Endpoint

#### GET /api/admin/instructors
**File:** `nextjs-dashboard/app/api/admin/instructors/route.ts`
- Returns all instructors sorted by name
- Includes automated email addresses
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
    },
    {
      "id": 2,
      "name": "Adams Heather",
      "department": "Physician Assistant Program",
      "email_id": "ADAMS051",
      "email_address": "ADAMS051@gannon.edu",
      "created_at": "2026-04-25T00:00:00Z",
      "updated_at": "2026-04-25T00:00:00Z"
    }
  ]
}
```

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20260425000004_create_instructors_table.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI
```bash
cd nextjs-dashboard
npx supabase db push  # Pushes new migrations to remote database
```

## Database Schema

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

**Key Features:**
- `email_id` is the unique identifier from your data (e.g., ABDELAL001)
- `email_address` is the full automated email (email_id + @gannon.edu)
- Both fields are indexed for fast lookups
- Department information is preserved from question 4

## How the Data Migration Works

The migration includes a PostgreSQL function `populate_instructors_from_questions()` that:

1. **Reads** the existing comma-separated data from `client_report_questions` table question 4:
   - Format: `"Abdelal Ahmed (Speech-Language Pathology-Rusk): ABDELAL001"`

2. **Parses** each comma-separated item:
   - Extracts instructor name
   - Extracts department (between parentheses)
   - Extracts email ID (after the colon)

3. **Generates** automated email address:
   - Constructs full email: `EMAIL_ID@gannon.edu`

4. **Inserts** the parsed data into the `instructors` table

5. **Reports** the number of instructors successfully populated

## Expected Results

After running the migration:
- **~400+ instructors** populated from question 4
- Each instructor has:
  - Full name
  - Department
  - Email ID
  - Automated email address

## Verification

After running the migration, verify the data was populated correctly:

```sql
-- Check instructor count
SELECT COUNT(*) as instructor_count FROM instructors;

-- Sample instructors
SELECT name, department, email_id, email_address
FROM instructors
ORDER BY name
LIMIT 10;

-- Search by department
SELECT name, email_address
FROM instructors
WHERE department LIKE '%Nursing%'
ORDER BY name;

-- Find instructor by email ID
SELECT *
FROM instructors
WHERE email_id = 'ABDELAL001';
```

Expected results:
- **~400+ instructors** (all instructors from question 4)
- All instructors have properly formatted email addresses

## Benefits of This Approach

1. **Clean Data Structure**: Separate columns for name, department, email_id, and email_address
2. **Fast Lookups**: Indexed fields for quick searches by name, department, or email
3. **Data Integrity**: Unique constraints prevent duplicate email IDs
4. **Maintainability**: Easy to add, edit, or remove instructors
5. **Automated Emails**: Email addresses are automatically constructed from email IDs
6. **Compatibility**: Works seamlessly with your existing courses table

## Using the API Endpoint

### Frontend Example
```typescript
import { useEffect, useState } from 'react'

interface Instructor {
  id: number
  name: string
  department: string
  email_id: string
  email_address: string
}

export default function InstructorsList() {
  const [instructors, setInstructors] = useState<Instructor[]>([])

  useEffect(() => {
    const fetchInstructors = async () => {
      const response = await fetch('/api/admin/instructors')
      const data = await response.json()
      setInstructors(data.instructors)
    }
    fetchInstructors()
  }, [])

  return (
    <div>
      <h2>Instructors</h2>
      {instructors.map((instructor) => (
        <div key={instructor.id}>
          <strong>{instructor.name}</strong>
          <p>Department: {instructor.department}</p>
          <p>Email: {instructor.email_address}</p>
        </div>
      ))}
    </div>
  )
}
```

## Relationship with Questions

- **Question 3**: Uses the existing `courses` table (already working)
- **Question 4**: Now references the `instructors` table
- **Question 5**: Automated emails are stored in `instructors.email_address`

You can update questions 4 and 5 to use data from this table instead of comma-separated strings.

## Troubleshooting

### Migration fails with parsing errors
- Check that `client_report_questions` table has data for question 4
- Verify the format matches: `"Name (Department): EMAIL_ID"`

### No data in table after migration
- Check Supabase logs for error messages
- Manually run `SELECT populate_instructors_from_questions();` in SQL Editor
- Verify question 4 data exists and is properly formatted

### API endpoint returns empty array
- Ensure RLS policies are correct
- Check that you're authenticated as an admin or developer
- Verify the table was populated by running the verification SQL above

### Duplicate email errors
- The migration uses `ON CONFLICT DO NOTHING` to skip duplicates
- Each email_id must be unique

## Questions?

If you encounter any issues or need help integrating this with your frontend, let me know!
