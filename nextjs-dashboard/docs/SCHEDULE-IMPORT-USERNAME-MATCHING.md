# Schedule Import - Username Matching Guide

**Date:** 2026-04-05
**Change:** Updated schedule import to match tutors by username instead of tutor_name

---

## What Changed

The schedule upload API now matches tutors using **usernames** (from Excel file) instead of abbreviated tutor names.

### Before:
- Excel file contains usernames (e.g., "anjeh001", "wheeler039")
- API matched by tutor_name (e.g., "Kensy A.", "Isaac W.")
- **Result:** Mismatch → duplicate tutors created

### After:
- Excel file contains usernames (e.g., "anjeh001", "wheeler039")
- API matches by username column
- **Result:** Correct tutor matched → schedules assigned properly

---

## Excel File Format

### Header Row (Row 1)

**Columns 6+ must contain Gannon usernames:**

```
| ... | ... | ... | ... | ... | anjeh001 | wheeler039 | maniar001 | hale007 | ...
```

**Important:**
- ✅ Use lowercase usernames: "anjeh001" (correct)
- ❌ Don't use abbreviated names: "Kensy A." (wrong)
- ❌ Don't use full names: "Kensy Anjeh Akem" (wrong)
- ❌ Don't use emails: "anjeh001@gannon.edu" (wrong)

### Data Rows (Starting Row 14)

Time slots with 'X' marks for availability:

```
('Sunday 08:00AM', '08:30AM')    |   X   |        |   X   |       |
('Sunday 08:30AM', '09:00AM')    |       |    X   |       |   X   |
```

---

## How Tutor Matching Works

### Updated Matching Logic

**File:** `app/api/schedule/upload/route.ts`

```typescript
for (const tutorUsername of parseResult.tutors) {
  // Match by username column (not tutor_name)
  const { data: existingTutor } = await supabase
    .from("tutors")
    .select("tutor_id, tutor_name, username")
    .eq("username", tutorUsername)  // ← Key change
    .single()

  if (existingTutor) {
    // Found! Map username to tutor_id
    tutorIdMap[tutorUsername] = existingTutor.tutor_id
  } else {
    // Not found - log warning, don't create duplicate
    unmatchedUsernames.push(tutorUsername)
  }
}
```

### What Happens to Unmatched Usernames?

If a username in the Excel file doesn't exist in the database:
- ❌ Tutor is NOT created automatically (prevents duplicates)
- ⚠️ Warning added to response
- ⏭️ Schedule slots for that username are skipped
- ℹ️ User notified in upload preview

---

## API Response

### Success Response

```json
{
  "success": true,
  "tutorsMatched": 15,
  "tutorsNotMatched": 2,
  "slotsCreated": 120,
  "tutors": ["anjeh001", "wheeler039", "maniar001", ...],
  "matchedTutors": ["anjeh001", "wheeler039", "maniar001", ...],
  "unmatchedUsernames": ["unknown001", "test002"],
  "warnings": [
    "2 username(s) not found in database: unknown001, test002"
  ]
}
```

### Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Overall success status |
| tutorsMatched | number | Number of usernames successfully matched |
| tutorsNotMatched | number | Number of usernames not found in database |
| slotsCreated | number | Total availability slots inserted |
| tutors | string[] | All usernames from Excel file |
| matchedTutors | string[] | Usernames that were matched |
| unmatchedUsernames | string[] | Usernames that were NOT matched |
| warnings | string[] | Warning messages (including unmatched usernames) |

---

## Prerequisites

### Database Requirements

Tutors must have their username column populated:

```sql
-- Check if tutors have usernames
SELECT tutor_id, tutor_name, username
FROM tutors
WHERE username IS NOT NULL;
```

**If usernames are missing:**
1. Run the staff data sync migrations first
2. See: `docs/TUTORS-SYNC-QUICKSTART.md`
3. Migration files:
   - `20260405170000_add_staff_columns_to_tutors.sql`
   - `20260405170851_populate_staff_data_in_tutors.sql`

---

## Upload Process Flow

### Step-by-Step

1. **User drops Excel file** in upload area
   - File parsed client-side
   - Usernames extracted from row 1, columns 6+

2. **Preview dialog shown**
   - Shows: Tutors found, slots parsed
   - User can review before confirming

3. **User confirms upload**
   - File sent to `/api/schedule/upload`
   - API matches usernames to tutors

4. **Matching process**
   - For each username in Excel:
     - Query: `SELECT * FROM tutors WHERE username = '...'`
     - If found → add to tutorIdMap
     - If not found → add to unmatchedUsernames

5. **Delete existing schedules**
   - For matched tutors only
   - Clears old availability data

6. **Insert new schedules**
   - Only for matched tutors
   - Slots with unmatched usernames are skipped

7. **Response returned**
   - Success/failure status
   - Matched/unmatched counts
   - Warnings for unmatched usernames

---

## Troubleshooting

### Issue: "Username not found in database"

**Cause:** Excel file contains username that doesn't exist in tutors table

**Solutions:**
1. **Check the username spelling:**
   ```sql
   SELECT tutor_name, username FROM tutors WHERE username LIKE '%part_of_username%';
   ```

2. **Add the missing tutor:**
   - Option A: Run staff sync migration
   - Option B: Manually insert tutor with username

3. **Verify username column populated:**
   ```sql
   SELECT COUNT(*) FROM tutors WHERE username IS NULL;
   ```
   If this returns > 0, run the staff sync migration first.

### Issue: "No slots created"

**Possible causes:**
1. All usernames in Excel are unmatched
2. Excel file has wrong format
3. No 'X' marks in availability columns

**Debug:**
```sql
-- Check which tutors have usernames
SELECT tutor_name, username FROM tutors WHERE username IS NOT NULL ORDER BY username;
```

Compare this list with usernames in your Excel file.

### Issue: "Tutors still being created as duplicates"

**Check:** Make sure you're using the updated API code

**Verify:**
```bash
# Check the file was updated
grep "eq(\"username\"" app/api/schedule/upload/route.ts
```

Should show: `.eq("username", tutorUsername)`

---

## Excel File Template

### Header Row Example

```
Date | ... | ... | ... | ... | anjeh001 | asylbeko001 | wheeler039 | maniar001 | hale007 | phan016 | ...
```

### Complete Example

```
Row 1:  Date | ... | ... | ... | ... | anjeh001 | wheeler039 | maniar001
Row 2:  [empty or metadata]
...
Row 14: ('Sunday 08:00AM', '08:30AM')    |    X     |            |     X
Row 15: ('Sunday 08:30AM', '09:00AM')    |          |      X     |     X
Row 16: ('Sunday 09:00AM', '09:30AM')    |    X     |      X     |
...
```

---

## Validation Checklist

Before uploading Excel file:

- [ ] Header row (row 1) contains Gannon usernames starting at column 6
- [ ] Usernames are lowercase (e.g., "anjeh001")
- [ ] Usernames match exactly with database (no typos)
- [ ] All tutors in Excel exist in database with username populated
- [ ] Time slots start at row 14
- [ ] 'X' marks indicate availability

After upload:

- [ ] Check tutorsMatched count matches expected
- [ ] Review unmatchedUsernames list
- [ ] Verify slotsCreated count is reasonable
- [ ] Check warnings for any issues

---

## Related Documentation

- **Staff Data Sync:** `docs/TUTORS-SYNC-QUICKSTART.md`
- **Tutor Deduplication:** `docs/DEDUPLICATION-QUICKSTART.md`
- **Schedule Parser:** `lib/scheduleParser.ts`
- **Upload Component:** `components/schedule/UploadSection.tsx`

---

## Database Schema Reference

### Tutors Table

```sql
CREATE TABLE tutors (
    tutor_id UUID PRIMARY KEY,
    tutor_name VARCHAR(255) NOT NULL UNIQUE,  -- "Kensy A."
    username VARCHAR(50) UNIQUE,               -- "anjeh001" ← Used for matching
    student_id VARCHAR(50) UNIQUE,
    role VARCHAR(50) DEFAULT 'tutor'
);
```

### Tutor_Availability Table

```sql
CREATE TABLE tutor_availability (
    availability_id UUID PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES tutors(tutor_id),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    UNIQUE(tutor_id, day_of_week, start_time, end_time)
);
```

---

## Summary

**What changed:**
- ✅ API now matches by `username` column (not `tutor_name`)
- ✅ Excel file usernames matched to database usernames
- ✅ No duplicate tutors created
- ✅ Unmatched usernames logged and reported

**Requirements:**
- ✅ Tutors table must have username column populated
- ✅ Excel file must contain Gannon usernames in header row
- ✅ Usernames must match exactly (case-sensitive)

**Result:**
- ✅ Correct tutors matched
- ✅ Schedules assigned to right tutors
- ✅ Clear warnings for unmatched usernames
- ✅ No duplicate tutor creation

---

**Last Updated:** 2026-04-05
**Version:** 1.0.0
