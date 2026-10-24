# Populating Client Report Questions from Normalized Tables

## Overview

I've created an API endpoint that automatically populates questions 3, 4, and 5 in the client report form with data from the normalized `courses` and `instructors` tables.

## What This Does

The endpoint reads data from your normalized tables and populates:
- **Question 3** (Course): All courses from the `courses` table in format "CODE (Name)"
- **Question 4** (Instructor): All instructors from the `instructors` table in format "Name (Department): EMAIL_ID"
- **Question 5** (Automated emails): All instructor emails from the `instructors` table in format "EMAIL@gannon.edu"

## API Endpoint

### POST /api/admin/report-config/populate-from-tables

**File:** `app/api/admin/report-config/populate-from-tables/route.ts`

**Authentication:** Requires admin/developer authentication

**Request:** No body required

**Response:**
```json
{
  "success": true,
  "message": "Successfully populated questions 3, 4, and 5 from normalized tables",
  "stats": {
    "courses_count": 800,
    "instructors_count": 400,
    "emails_count": 400
  }
}
```

## How to Use

### Method 1: Using the Browser (Easiest)

1. Make sure you're logged in as an admin
2. Open your browser's Developer Console (F12)
3. Go to the Console tab
4. Paste this code and press Enter:

```javascript
fetch('/api/admin/report-config/populate-from-tables', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

### Method 2: Using curl

```bash
# Replace with your actual authentication cookie
curl -X POST http://localhost:3000/api/admin/report-config/populate-from-tables \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie-here"
```

### Method 3: Using a Button in the Admin UI

You can add a button to your Report Options page:

```typescript
const handlePopulateFromTables = async () => {
  try {
    const response = await fetch('/api/admin/report-config/populate-from-tables', {
      method: 'POST',
    })
    const data = await response.json()

    if (data.success) {
      toast.success(`Populated ${data.stats.courses_count} courses and ${data.stats.instructors_count} instructors!`)
      // Refresh the page or re-fetch questions
      window.location.reload()
    } else {
      toast.error(data.error || 'Failed to populate questions')
    }
  } catch (error) {
    toast.error('An error occurred')
    console.error(error)
  }
}

// In your JSX:
<button onClick={handlePopulateFromTables} className="btn btn-primary">
  Populate from Tables
</button>
```

## What Happens Behind the Scenes

1. **Fetches courses** from the `courses` table, sorted by code
2. **Fetches instructors** from the `instructors` table, sorted by name
3. **Builds comma-separated strings**:
   - Courses: `"N/A,ACCT_313 (Accounting Information Systems),ACCT_315 (...),..."`
   - Instructors: `"N/A,Abdelal Ahmed (Speech-Language Pathology-Rusk): ABDELAL001,..."`
   - Emails: `"AUTOEMAIL,ABDELAL001@gannon.edu,ADAMS051@gannon.edu,..."`
4. **Updates the database**:
   - Updates `client_report_questions` table
   - Sets `possible_answers` for questions 3, 4, and 5

## When to Use This

Use this endpoint whenever:
- ✅ You add new courses to the `courses` table
- ✅ You add new instructors to the `instructors` table
- ✅ You modify instructor departments or email IDs
- ✅ You want to sync the normalized tables with the report questions

## Before Using

Make sure:
1. ✅ The `courses` table exists and has data
2. ✅ The `instructors` table exists and has data
3. ✅ You've run the migration: `20260425000004_create_instructors_table.sql`
4. ✅ You're logged in as an admin or developer

## Expected Results

After running the endpoint:
- Question 3 will have ~800+ courses
- Question 4 will have ~400+ instructors
- Question 5 will have ~400+ instructor emails
- All formatted correctly for the dropdown/select fields

## Verification

To verify the data was populated correctly:

```sql
-- Check Question 3 (Courses)
SELECT question_number, question_text,
       LEFT(possible_answers, 100) as preview,
       LENGTH(possible_answers) as length
FROM client_report_questions
WHERE question_number = 3;

-- Check Question 4 (Instructors)
SELECT question_number, question_text,
       LEFT(possible_answers, 100) as preview,
       LENGTH(possible_answers) as length
FROM client_report_questions
WHERE question_number = 4;

-- Check Question 5 (Emails)
SELECT question_number, question_text,
       LEFT(possible_answers, 100) as preview,
       LENGTH(possible_answers) as length
FROM client_report_questions
WHERE question_number = 5;
```

## Workflow

### Complete Workflow for Managing Courses and Instructors:

1. **Add/Edit data in normalized tables:**
   ```sql
   -- Add a new course
   INSERT INTO courses (code, name)
   VALUES ('MATH_999', 'Advanced Calculus');

   -- Add a new instructor
   INSERT INTO instructors (name, department, email_id, email_address)
   VALUES ('Smith John', 'Mathematics', 'SMITH999', 'SMITH999@gannon.edu');
   ```

2. **Populate questions from tables:**
   ```
   POST /api/admin/report-config/populate-from-tables
   ```

3. **Verify in the admin UI:**
   - Go to `/admin/report-options`
   - Check that questions 3, 4, and 5 show the updated data

## Advantages of This Approach

1. **Single Source of Truth**: Data lives in normalized tables
2. **Easy Updates**: Modify tables, then run one endpoint
3. **No Manual Editing**: No need to manually edit comma-separated strings
4. **Data Integrity**: Foreign keys and constraints prevent errors
5. **Fast Queries**: Indexed tables for quick lookups
6. **Automated**: Just click a button to sync

## Troubleshooting

### Error: "Failed to fetch courses"
- Check that the `courses` table exists
- Run: `SELECT COUNT(*) FROM courses;`

### Error: "Failed to fetch instructors"
- Check that the `instructors` table exists
- Run: `SELECT COUNT(*) FROM instructors;`

### Error: "Unauthorized"
- Make sure you're logged in as an admin or developer
- Check your session is valid

### Questions not updating
- Check the API response for errors
- Verify the `client_report_questions` table has questions 3, 4, and 5
- Run the verification SQL queries above

## Alternative: Automatic Sync

If you want questions to automatically update whenever you change the tables, you could create a PostgreSQL trigger:

```sql
CREATE OR REPLACE FUNCTION sync_questions_from_tables()
RETURNS trigger AS $$
BEGIN
  -- Call the populate function whenever courses or instructors change
  PERFORM populate_questions_from_tables();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courses_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON courses
EXECUTE FUNCTION sync_questions_from_tables();

CREATE TRIGGER instructors_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON instructors
EXECUTE FUNCTION sync_questions_from_tables();
```

## Questions?

If you need help integrating this into your UI or have issues, let me know!
