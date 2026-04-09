# Schedule Display Fix - Missing Tutor Names

**Date:** 2026-04-05
**Issue:** Tutor schedules showing UUIDs instead of names
**Status:** Fixed

---

## Problem Description

The tutor schedules page was showing tutor IDs (UUIDs) instead of tutor names for some schedules.

### Example of Issue:
```
❌ Tutor: 34cf43e5-33e7-4953-9d4b-d451b16a05a3
   Sunday: 08:00 AM - 09:00 AM

✅ Tutor: Kensy A.
   Sunday: 08:00 AM - 09:00 AM
```

---

## Root Causes Identified

### 1. Critical Bug: Missing Error Handling (FIXED)

**Location:** `app/api/schedule/route.ts` (Lines 50-52)

**Problem:**
```typescript
if (tutorsError) {
  console.error("Tutors query error:", tutorsError)
}
// Code continued with empty tutorMap!
```

If the tutors query failed, the API continued execution with an empty `tutorMap`, causing ALL schedules to show UUIDs.

**Fix:**
```typescript
if (tutorsError) {
  console.error("Tutors query error:", tutorsError)
  return NextResponse.json(
    { error: "Failed to fetch tutor information", details: tutorsError.message },
    { status: 500 }
  )
}
```

### 2. Poor Fallback Display (FIXED)

**Problem:**
```typescript
const tutorName = tutorMap[tutorId] || tutorId  // Shows full UUID
```

**Fix:**
```typescript
const tutorName = tutorMap[tutorId] || `Unknown Tutor (${tutorId.substring(0, 8)}...)`
```

Now shows: `Unknown Tutor (34cf43e5...)` instead of full UUID.

### 3. No Validation (FIXED)

**Added:**
```typescript
// Validate all tutor_ids in availability exist in tutors table
const availabilityTutorIds = [...new Set((availability || []).map(a => a.tutor_id))]
const missingTutors = availabilityTutorIds.filter(id => !tutorMap[id])

if (missingTutors.length > 0) {
  console.warn(`Warning: ${missingTutors.length} availability records have no matching tutor:`, missingTutors)
}
```

Logs warnings when orphaned records are detected.

---

## Files Modified

### 1. Main Schedule API
**File:** `app/api/schedule/route.ts`

**Changes:**
- ✅ Added error handling for tutors query failure (Lines 50-52 → 50-62)
- ✅ Added check for empty tutors result (Lines 63-68)
- ✅ Improved fallback display (Line 78)
- ✅ Added validation for missing tutors (Lines 70-75)
- ✅ Included `username` in SELECT query (Line 48)

### 2. Example Optimized Version
**File:** `app/api/schedule/route-with-join.ts.example`

**Purpose:**
- Shows alternative implementation using SQL JOIN
- Better performance (single query instead of two)
- Automatic data integrity (only returns schedules with valid tutors)

---

## Testing & Verification

### Quick Test

1. **Check if names appear:**
   ```
   Open: http://localhost:3000/tutor-schedules
   Expected: All schedules show tutor names, not UUIDs
   ```

2. **Check API response:**
   ```bash
   curl http://localhost:3000/api/schedule
   ```
   Should return JSON with `tutorName` fields populated.

### Database Verification Queries

#### Check for 'Unknown' Tutor Names
```sql
SELECT tutor_id, tutor_name, username
FROM tutors
WHERE tutor_name = 'Unknown';
```

**Action:** If any found, update with proper abbreviated names.

#### Check for Orphaned Availability Records
```sql
SELECT ta.tutor_id, COUNT(*) as slot_count
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
GROUP BY ta.tutor_id;
```

**Expected:** 0 rows (foreign key constraint should prevent this)

**Action:** If any found, either:
- Delete orphaned records
- Add missing tutors to tutors table

#### Check Schedules by Tutor Name
```sql
SELECT
    t.tutor_name,
    t.username,
    COUNT(ta.availability_id) as schedule_count
FROM tutors t
LEFT JOIN tutor_availability ta ON t.tutor_id = ta.tutor_id
GROUP BY t.tutor_name, t.username
ORDER BY t.tutor_name;
```

Shows all tutors with their schedule counts.

---

## Potential Data Issues

### Tutors with 'Unknown' Names

**Cause:** Username cleanup migration set some tutor_name values to 'Unknown'

**Check:**
```sql
SELECT tutor_id, tutor_name, username, student_id, role
FROM tutors
WHERE tutor_name = 'Unknown' OR tutor_name LIKE 'Unknown%';
```

**Fix Options:**

**Option A: Manual Update** (for a few tutors)
```sql
UPDATE tutors
SET tutor_name = 'Abbreviated Name'
WHERE tutor_id = 'specific-uuid';
```

**Option B: Batch Update** (if you have a mapping)
```sql
-- Example: Generate abbreviated name from username
UPDATE tutors
SET tutor_name =
    CASE username
        WHEN 'anjeh001' THEN 'Kensy A.'
        WHEN 'wheeler039' THEN 'Isaac W.'
        WHEN 'maniar001' THEN 'Avish M.'
        -- Add more mappings...
    END
WHERE tutor_name = 'Unknown' AND username IS NOT NULL;
```

**Option C: Re-run Staff Sync** (if data is in Staff.xlsx)
```sql
-- Run the staff sync migration again
-- File: 20260405170851_populate_staff_data_in_tutors.sql
```

---

## Response Format Changes

### Before Fix
```json
{
  "schedules": [
    {
      "tutorId": "34cf43e5-33e7-4953-9d4b-d451b16a05a3",
      "tutorName": "34cf43e5-33e7-4953-9d4b-d451b16a05a3",  // UUID shown!
      "days": { ... },
      "totalSlots": 10
    }
  ]
}
```

### After Fix
```json
{
  "schedules": [
    {
      "tutorId": "34cf43e5-33e7-4953-9d4b-d451b16a05a3",
      "tutorName": "Kensy A.",  // Proper name!
      "days": { ... },
      "totalSlots": 10
    }
  ]
}
```

### If Tutor Not Found
```json
{
  "schedules": [
    {
      "tutorId": "34cf43e5-33e7-4953-9d4b-d451b16a05a3",
      "tutorName": "Unknown Tutor (34cf43e5...)",  // Shortened UUID
      "days": { ... },
      "totalSlots": 10
    }
  ]
}
```

---

## Alternative: JOIN Query Implementation

For better performance, see: `app/api/schedule/route-with-join.ts.example`

**Benefits:**
- ✅ Single database query (not two)
- ✅ Automatic data integrity (no orphaned records)
- ✅ No manual mapping required
- ✅ Better performance with large datasets

**To use:**
1. Review the example file
2. Test in development
3. Replace current implementation if desired

---

## Monitoring & Debugging

### Check Server Logs

**Look for these messages:**

✅ **Good:**
```
Matched username "anjeh001" to tutor "Kensy A." (...)
```

⚠️ **Warning:**
```
Warning: 2 availability records have no matching tutor: [uuid1, uuid2]
```

❌ **Error:**
```
Tutors query error: [error details]
Failed to fetch tutor information
```

### Console Warnings

If you see: `Warning: X availability records have no matching tutor`

**Action:**
1. Run orphaned records query (see above)
2. Investigate why those tutor_ids don't exist
3. Either delete availability records or add missing tutors

---

## Summary of Changes

| Issue | Before | After |
|-------|--------|-------|
| Tutors query fails | Continues with empty map | Returns 500 error |
| No tutors found | Crashes | Returns empty schedules |
| Tutor not in map | Shows full UUID | Shows "Unknown Tutor (abc...)" |
| Missing tutors | Silent failure | Console warning logged |
| SELECT columns | tutor_id, tutor_name | tutor_id, tutor_name, username |

---

## Related Issues Fixed

1. ✅ Critical error handling bug
2. ✅ Poor user experience with UUIDs
3. ✅ No visibility into missing tutors
4. ✅ No validation of data integrity

---

## Next Steps (Optional)

1. **Clean up 'Unknown' tutor names:**
   - Run verification query
   - Update with proper abbreviated names

2. **Consider JOIN implementation:**
   - Review example file
   - Test performance improvements
   - Deploy if beneficial

3. **Monitor logs:**
   - Watch for missing tutor warnings
   - Investigate any orphaned records

---

**Last Updated:** 2026-04-05
**Status:** Fixed and deployed
