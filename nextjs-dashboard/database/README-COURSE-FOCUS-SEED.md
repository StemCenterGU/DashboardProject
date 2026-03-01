# Course/Focus Options Seed (Course or Focus dropdown)

All course and focus options for the **Course or Focus** dropdown are stored in the `courses` table. The canonical list is in **`docs/courses-with-instructors.md`** (one bullet per option, with course and instructor).

## Option A: Generate from the list and run in Supabase (recommended)

1. **Generate the SQL** from the markdown list (ensures dropdown and table stay in sync):
   ```bash
   node scripts/seed-courses-from-list.js
   ```
   This writes `database/seed-course-focus-from-list.sql` with one row per line in `docs/courses-with-instructors.md`.

2. **Run the generated SQL in Supabase**  
   - Open Supabase → SQL Editor  
   - Paste the contents of `database/seed-course-focus-from-list.sql`  
   - Run it  

   Rows that already exist (same `course_name`) are skipped, so you can re-run safely.

## Option B: Run the hand-maintained seed

1. Open Supabase → SQL Editor  
2. Copy and paste the contents of `seed-course-focus-options.sql`  
3. Click Run  

## What gets inserted

- Each option is one row in `courses` (e.g. "ACCT305 Intermediate Fin Accounting I - Dr Renee Castrigano Only" in `course_name`).
- `course_code` is set for the first occurrence of each code (e.g. ACCT305); other rows for the same code use `NULL` (because `course_code` is UNIQUE).
- All rows are inserted with `active = true`.

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
