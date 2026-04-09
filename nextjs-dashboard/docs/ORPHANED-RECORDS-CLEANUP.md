# Orphaned Availability Records Cleanup

**Date:** 2026-04-06
**Issue:** "Unknown Tutor" showing in schedule display
**Cause:** Availability records with tutor_ids that don't exist in tutors table
**Solution:** Delete orphaned records and add foreign key constraint

---

## Problem Description

The tutor schedules page was showing "Unknown Tutor (abc12345...)" for some schedules. This indicates orphaned records in the `tutor_availability` table where the `tutor_id` doesn't exist in the `tutors` table.

### How It Happens:
1. Tutor record deleted from `tutors` table
2. Availability records remain in `tutor_availability` table
3. No foreign key constraint to cascade delete

---

## Solution

### Step 1: Identify Orphaned Records (Optional)

Run this query to see what will be deleted:

```sql
SELECT
    ta.availability_id,
    ta.tutor_id,
    ta.day_of_week,
    ta.start_time,
    ta.end_time,
    COUNT(*) OVER (PARTITION BY ta.tutor_id) as slots_for_this_tutor
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
ORDER BY ta.tutor_id, ta.day_of_week, ta.start_time;
```

**Expected Result:** List of availability records with non-existent tutor_ids

### Step 2: Apply Cleanup Migration

```bash
cd nextjs-dashboard
npx supabase migration up --local
```

This will apply:
1. `20260406000000_remove_orphaned_availability.sql` - Deletes orphaned records
2. `20260406000001_add_foreign_key_constraint.sql` - Adds FK constraint

### Step 3: Verify Cleanup

```sql
-- Should return 0 rows
SELECT
    ta.availability_id,
    ta.tutor_id
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL;
```

### Step 4: Verify Foreign Key

```sql
-- Check constraint exists
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    'tutor_availability' AS table_name,
    att.attname AS column_name,
    cl.relname AS referenced_table
FROM pg_constraint con
JOIN pg_class cl ON con.confrelid = cl.oid
JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
WHERE con.conrelid = 'tutor_availability'::regclass
  AND con.contype = 'f';
```

**Expected Result:** Shows `fk_tutor_availability_tutor` constraint

---

## Migration Details

### Migration 1: Remove Orphaned Records
**File:** `20260406000000_remove_orphaned_availability.sql`

```sql
DELETE FROM tutor_availability
WHERE tutor_id NOT IN (
    SELECT tutor_id FROM tutors
);
```

**What it does:**
- Deletes availability records with invalid tutor_ids
- Cleans up data integrity issues

### Migration 2: Add Foreign Key Constraint
**File:** `20260406000001_add_foreign_key_constraint.sql`

```sql
ALTER TABLE tutor_availability
ADD CONSTRAINT fk_tutor_availability_tutor
FOREIGN KEY (tutor_id)
REFERENCES tutors(tutor_id)
ON DELETE CASCADE;
```

**What it does:**
- Adds foreign key constraint
- Enables CASCADE delete (when tutor deleted, availability deleted)
- Prevents future orphaned records
- Adds performance index on tutor_id

---

## Testing

### Test 1: Check Schedule Display
1. Navigate to tutor schedules page
2. Verify no "Unknown Tutor" entries appear
3. All schedules should show proper tutor names

### Test 2: Verify Data Integrity
```sql
-- All availability records should have valid tutors
SELECT
    COUNT(DISTINCT ta.tutor_id) as tutors_with_availability,
    COUNT(ta.availability_id) as total_slots
FROM tutor_availability ta
JOIN tutors t ON ta.tutor_id = t.tutor_id;
```

### Test 3: Test Foreign Key Constraint
```sql
-- This should fail with foreign key violation
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time)
VALUES ('00000000-0000-0000-0000-000000000000', 0, '08:00', '09:00');
-- Expected: ERROR: insert or update on table "tutor_availability" violates foreign key constraint
```

### Test 4: Test CASCADE Delete
```sql
-- Create test tutor
INSERT INTO tutors (tutor_id, tutor_name, username)
VALUES (gen_random_uuid(), 'Test Tutor', 'test999')
RETURNING tutor_id;

-- Add availability for test tutor (use the UUID from above)
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time)
VALUES ('[UUID-FROM-ABOVE]', 0, '08:00', '09:00');

-- Delete test tutor
DELETE FROM tutors WHERE username = 'test999';

-- Verify availability was also deleted (should return 0 rows)
SELECT * FROM tutor_availability WHERE tutor_id = '[UUID-FROM-ABOVE]';
```

---

## Impact

### Before Cleanup:
- ❌ Orphaned availability records in database
- ❌ "Unknown Tutor" showing in schedule display
- ❌ No constraint preventing future orphans
- ❌ Poor data integrity

### After Cleanup:
- ✅ All availability records reference valid tutors
- ✅ Schedule display shows proper tutor names
- ✅ Foreign key constraint prevents orphaned records
- ✅ Cascade delete maintains data integrity
- ✅ Performance index added

---

## Rollback (If Needed)

If you need to rollback the foreign key constraint (not recommended):

```sql
-- Remove foreign key constraint
ALTER TABLE tutor_availability
DROP CONSTRAINT IF EXISTS fk_tutor_availability_tutor;

-- Remove index
DROP INDEX IF EXISTS idx_tutor_availability_tutor_id;
```

**Note:** You cannot "rollback" the deletion of orphaned records. Make sure to verify the orphaned records query before applying the cleanup migration.

---

## Prevention

With the foreign key constraint in place:
1. ✅ Cannot insert availability for non-existent tutor
2. ✅ Deleting tutor automatically deletes their availability
3. ✅ Database enforces referential integrity
4. ✅ No manual cleanup needed in the future

---

## Related Files

- **Migration 1:** `supabase/migrations/20260406000000_remove_orphaned_availability.sql`
- **Migration 2:** `supabase/migrations/20260406000001_add_foreign_key_constraint.sql`
- **Schedule API:** `app/api/schedule/route.ts`
- **Display Fix Doc:** `docs/SCHEDULE-DISPLAY-FIX.md`

---

## Summary

| Issue | Before | After |
|-------|--------|-------|
| Orphaned records | Yes | No (deleted) |
| Foreign key constraint | No | Yes (with CASCADE) |
| "Unknown Tutor" display | Yes | No |
| Data integrity | Poor | Enforced by database |
| Future prevention | Manual cleanup | Automatic (constraint) |

---

**Last Updated:** 2026-04-06
**Status:** Ready to apply
