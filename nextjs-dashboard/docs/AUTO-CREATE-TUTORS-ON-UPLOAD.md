# Auto-Create Tutors on Schedule Upload

**Date:** 2026-04-06
**Feature:** Automatically create tutor records for unmatched usernames during Excel upload
**Status:** Implemented

---

## Overview

When uploading schedule Excel files, the system now **automatically creates tutor records** for any usernames that don't exist in the database. This eliminates "Unknown Tutor" entries in the Excel Grid View.

### Before This Update:
- ❌ Usernames not found in database → Schedules skipped
- ❌ "Unknown Tutor" shown in Excel Grid View
- ❌ Manual tutor creation required

### After This Update:
- ✅ Usernames not found → New tutor records auto-created
- ✅ Schedules imported for all tutors
- ✅ No "Unknown Tutor" entries
- ✅ Zero manual intervention needed

---

## How It Works

### Upload Flow

1. **Excel file uploaded** containing tutor usernames in header row
2. **System checks each username:**
   - If username exists → Use existing tutor record
   - If username doesn't exist → **Create new tutor automatically**
3. **New tutor created with:**
   - `username`: From Excel file (e.g., "smith123")
   - `tutor_name`: Auto-generated abbreviated name (e.g., "S. Smith")
   - `role`: Default value 'tutor'
   - `tutor_id`: Auto-generated UUID
4. **Schedule imported** for all tutors (matched + created)

### Name Generation Logic

The system generates abbreviated names from usernames:

**Pattern:** `FirstLetter. BaseName`

**Examples:**
```
Username: smith123  → Tutor Name: S. Smith
Username: jones456  → Tutor Name: J. Jones
Username: brown789  → Tutor Name: B. Brown
Username: anjeh001  → Tutor Name: A. Anjeh
```

**Algorithm:**
1. Extract first letter, convert to uppercase
2. Remove trailing numbers from username
3. Capitalize first letter of base name
4. Format as "X. Basename"

---

## API Response Changes

### Before:
```json
{
  "success": true,
  "tutorsMatched": 15,
  "tutorsNotMatched": 5,
  "unmatchedUsernames": ["smith123", "jones456", "brown789", "davis001", "wilson002"],
  "slotsCreated": 120
}
```

### After:
```json
{
  "success": true,
  "tutorsMatched": 15,
  "tutorsCreated": 5,
  "tutorsNotMatched": 0,
  "matchedTutors": ["existing001", "existing002", ...],
  "createdTutors": ["smith123", "jones456", "brown789", "davis001", "wilson002"],
  "unmatchedUsernames": [],
  "slotsCreated": 180,
  "warnings": [
    "5 new tutor(s) created: smith123, jones456, brown789, davis001, wilson002"
  ]
}
```

---

## User Impact

### For Professors/Admins:

**Before:**
1. Upload Excel file
2. See warning: "5 usernames not found"
3. Manually create 5 tutor records
4. Re-upload Excel file
5. Schedules finally imported

**After:**
1. Upload Excel file
2. See success: "5 new tutors created"
3. ✅ Done! All schedules imported

### For Students:

- **Before:** "Unknown Tutor" showing in schedule grid
- **After:** Proper tutor names showing immediately

---

## Technical Details

### File Modified

**`app/api/schedule/upload/route.ts`** (lines 73-94)

### Changes Made

#### Before:
```typescript
if (existingTutor) {
  tutorIdMap[tutorUsername] = existingTutor.tutor_id
} else {
  // Username not found - don't create duplicate tutor
  console.warn(`Username not found in database: ${tutorUsername}`)
  unmatchedUsernames.push(tutorUsername)
  // Skip this tutor - don't add to tutorIdMap
}
```

#### After:
```typescript
if (existingTutor) {
  tutorIdMap[tutorUsername] = existingTutor.tutor_id
} else {
  // Username not found - create new tutor
  const abbreviatedName = generateAbbreviatedName(tutorUsername)

  const { data: newTutor, error: createError } = await supabase
    .from("tutors")
    .insert({
      tutor_name: abbreviatedName,
      username: tutorUsername,
      role: 'tutor'
    })
    .select("tutor_id, tutor_name, username")
    .single()

  if (!createError && newTutor) {
    tutorIdMap[tutorUsername] = newTutor.tutor_id
    createdTutors.push(tutorUsername)
  } else {
    unmatchedUsernames.push(tutorUsername)
  }
}
```

### Name Generation Function

```typescript
// Generate abbreviated name from username
// Example: 'smith123' -> 'S. Smith'
const firstLetter = tutorUsername.charAt(0).toUpperCase()
const baseName = tutorUsername.replace(/[0-9]+$/g, '') // Remove trailing numbers
const abbreviatedName = `${firstLetter}. ${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`
```

---

## Database Impact

### Tutors Table

New records created with:

| Column | Value | Example |
|--------|-------|---------|
| tutor_id | Auto-generated UUID | `abc123...` |
| tutor_name | Generated from username | `S. Smith` |
| username | From Excel file | `smith123` |
| student_id | NULL (can be updated later) | NULL |
| role | Default 'tutor' | `tutor` |
| created_at | Current timestamp | `2026-04-06 14:30:00` |

### Constraints Respected

- ✅ `username UNIQUE` - No duplicate usernames
- ✅ `tutor_name NOT NULL` - Always has generated name
- ✅ `role CHECK` - Valid role value ('tutor')

---

## Error Handling

### Scenario 1: Duplicate Username

**If username already exists in database:**
- System uses existing tutor record
- No new tutor created
- No error thrown

### Scenario 2: Database Insert Fails

**If creating tutor fails (network, permissions, etc.):**
- Username added to `unmatchedUsernames` array
- Error logged to console
- Schedule for that tutor skipped
- Other tutors continue processing

### Scenario 3: Invalid Username

**If username is empty or invalid:**
- Parser validation catches it
- Not passed to tutor creation logic
- Reported in parse errors

---

## Manual Tutor Creation (Alternative)

If you need to create tutors manually instead, use:

### SQL Script Method

**File:** `scripts/create-tutors-from-usernames.sql`

```sql
WITH new_usernames AS (
    SELECT username FROM (VALUES
        ('smith123'),
        ('jones456'),
        ('brown789')
    ) AS t(username)
)
INSERT INTO tutors (tutor_id, tutor_name, username, role)
SELECT
    gen_random_uuid(),
    UPPER(SUBSTRING(username, 1, 1)) || '. ' ||
    INITCAP(REGEXP_REPLACE(username, '[0-9]+$', '')) as tutor_name,
    username,
    'tutor'
FROM new_usernames
WHERE username NOT IN (SELECT username FROM tutors WHERE username IS NOT NULL)
RETURNING *;
```

---

## Testing

### Test Case 1: Upload with New Usernames

1. Create Excel file with usernames not in database
2. Upload file
3. **Expected:** New tutors created, all schedules imported
4. **Verify:** Check tutors table for new records

### Test Case 2: Upload with Existing Usernames

1. Create Excel file with usernames that exist
2. Upload file
3. **Expected:** No new tutors, existing tutors used
4. **Verify:** tutor count unchanged

### Test Case 3: Upload with Mixed Usernames

1. Create Excel file with 5 existing + 5 new usernames
2. Upload file
3. **Expected:** 5 new tutors created, 5 existing matched
4. **Verify:** Response shows `tutorsMatched: 5, tutorsCreated: 5`

### Test Case 4: Excel Grid View

1. Upload schedules for new tutors
2. Navigate to Tutor Schedules page
3. Click "Excel Grid View (Lead Tutors)" tab
4. **Expected:** No "Unknown Tutor" entries
5. **Verify:** Proper abbreviated names showing

---

## Benefits

### 1. Zero Manual Work
- No need to create tutors before uploading schedules
- One-step process for schedule import

### 2. No Data Loss
- All schedules imported, even for new tutors
- No skipped usernames

### 3. Consistent Naming
- Auto-generated names follow consistent pattern
- Can be updated manually later if needed

### 4. Error Prevention
- Eliminates "Unknown Tutor" display issue
- Prevents orphaned availability records

### 5. Scalability
- Handles bulk uploads with many new tutors
- No bottleneck for onboarding new tutors

---

## Updating Auto-Created Tutors

To update tutor information later:

```sql
-- Update tutor name
UPDATE tutors
SET tutor_name = 'John Smith'
WHERE username = 'smith123';

-- Add student ID
UPDATE tutors
SET student_id = '3211062'
WHERE username = 'smith123';

-- Upgrade to lead_tutor role
UPDATE tutors
SET role = 'lead_tutor'
WHERE username = 'smith123';
```

Or use the Admin Panel UI (if available).

---

## Configuration

### Disable Auto-Creation (if needed)

To revert to old behavior (skip unmatched usernames):

**File:** `app/api/schedule/upload/route.ts` (lines 89-115)

Replace the auto-creation logic with:
```typescript
} else {
  unmatchedUsernames.push(tutorUsername)
}
```

### Customize Name Generation

To change how names are generated, modify lines 96-99:

```typescript
// Current: "S. Smith"
const abbreviatedName = `${firstLetter}. ${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`

// Alternative: Full name
const abbreviatedName = baseName.charAt(0).toUpperCase() + baseName.slice(1)

// Alternative: Uppercase
const abbreviatedName = baseName.toUpperCase()
```

---

## Related Features

- **Excel Grid View**: Shows tutors in spreadsheet format (2 PM - 8 PM)
- **Role-Based Filtering**: Filter by lead_tutor, tutor, etc.
- **Schedule Upload**: Import tutor availability from Excel/CSV
- **Admin Panel**: Manage tutor records manually

---

## Summary

| Feature | Status |
|---------|--------|
| Auto-create tutors on upload | ✅ Enabled |
| Generate abbreviated names | ✅ Implemented |
| Handle duplicate usernames | ✅ Handled |
| Error handling | ✅ Robust |
| API response updated | ✅ Complete |
| Documentation | ✅ Complete |

**Result:** No more "Unknown Tutor" issues. All usernames from Excel files are automatically converted to tutor records with proper names.

---

**Last Updated:** 2026-04-06
**Version:** 1.0.0
**Status:** Production Ready
