# Course/Focus Options Seed Script

This script adds all course and focus options to the `courses` table for the scheduling page dropdown.

## How to Run

1. Open your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `seed-course-focus-options.sql`
4. Click "Run" to execute

## What It Does

- Inserts all course/focus options from the WCOnline system
- Each option is stored as a separate row in the `courses` table
- The full focus text (e.g., "ACCT305 Intermediate Fin Accounting I - Dr Renee Castrigano Only") is stored in `course_name`
- Course codes are extracted when available (e.g., "ACCT305")
- Entries with the same course code but different instructors will have `NULL` for `course_code` to avoid conflicts (since `course_code` has a UNIQUE constraint)

## Notes

- The script uses `ON CONFLICT (course_code) DO UPDATE` to handle duplicates
- Entries with `NULL` course_code will all be inserted as separate rows
- All entries are set to `active = true` by default
- The frontend will display these options in the "Course or Focus" dropdown on the scheduling page

## Verification

After running the script, verify the data was inserted:

```sql
SELECT COUNT(*) FROM courses WHERE active = true;
-- Should return a large number (hundreds of entries)

SELECT course_name FROM courses WHERE course_name LIKE '%ACCT305%' ORDER BY course_name;
-- Should show all ACCT305 options
```

## Updating the Dropdown

The scheduling page API (`/api/scheduling/schedule-week`) already fetches courses:

```typescript
supabase.from("courses").select("course_id, course_code, course_name").eq("active", true).order("course_name")
```

The frontend components (`week-schedule-grid.tsx` and `week-as-day-grids.tsx`) will automatically display these in the dropdown once the data is in the database.
