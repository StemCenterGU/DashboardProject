# Tutors Table Deduplication Guide

**Generated:** 2026-04-05
**Migration:** `20260405172000_remove_duplicate_tutors.sql`
**Issue:** Duplicate tutor records with same username

---

## Problem Description

The tutors table has duplicate records where:
- **Good row:** Has proper name format (e.g., "Elizabeth H."), username, student_id, role
- **Bad row:** Has username in tutor_name (e.g., "hale007"), duplicate data

**Example Duplicate:**
```
Row 1 (GOOD):  tutor_name="Elizabeth H.", username="hale007", student_id="3185060", role="manager"
Row 2 (BAD):   tutor_name="hale007",      username="hale007", student_id=NULL,      role=NULL
```

This causes:
- ❌ Duplicate key constraint errors when moving usernames
- ❌ Confusion about which row is correct
- ❌ Incomplete data in bad rows

---

## Solution Strategy

### 1. Identify Duplicates
Find tutors with same username but different tutor_name values.

### 2. Classify Rows
- **GOOD row:** tutor_name has proper format (uppercase, periods, spaces)
- **BAD row:** tutor_name has username format (lowercase + numbers)

### 3. Keep Good, Delete Bad
- Keep the row with proper name format and complete data
- Delete the row with username in tutor_name

---

## How to Apply (3 Steps)

### Step 1: Preview Duplicates (REQUIRED!)

Run this query FIRST to see what will be deleted:

```sql
-- Show all potential duplicates
WITH username_counts AS (
    SELECT username, COUNT(*) as count
    FROM tutors
    WHERE username IS NOT NULL
    GROUP BY username
    HAVING COUNT(*) > 1
)
SELECT
    t.tutor_id,
    t.tutor_name,
    t.username,
    t.student_id,
    t.role,
    CASE
        WHEN t.tutor_name ~ '^[a-z]+[0-9]{3,}$' THEN 'BAD: Username in tutor_name'
        WHEN t.tutor_name ~ '^[A-Z]' THEN 'GOOD: Proper name format'
        ELSE 'UNCLEAR'
    END as row_quality
FROM tutors t
INNER JOIN username_counts uc ON t.username = uc.username
ORDER BY t.username, row_quality;
```

**Review carefully!** Make sure:
- BAD rows are actually duplicates
- GOOD rows have the data you want to keep

### Step 2: Run Migration

**Option A: Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Click **SQL Editor**
3. Open: `supabase/migrations/20260405172000_remove_duplicate_tutors.sql`
4. Run it

**Option B: Supabase CLI**
```bash
cd nextjs-dashboard
supabase db push
```

### Step 3: Verify Results

```sql
-- Should return 0 rows (no duplicates)
SELECT username, COUNT(*) as count
FROM tutors
WHERE username IS NOT NULL
GROUP BY username
HAVING COUNT(*) > 1;

-- Check remaining tutors
SELECT tutor_id, tutor_name, username, student_id, role
FROM tutors
WHERE username IS NOT NULL
ORDER BY username;
```

---

## Detection Criteria

### Good Row Indicators
- ✅ tutor_name matches pattern: `^[A-Z]` (starts with capital)
- ✅ Contains proper name format: "FirstName L." with period
- ✅ Has student_id populated
- ✅ Has role populated

### Bad Row Indicators
- ❌ tutor_name matches pattern: `^[a-z]+[0-9]{3,}$` (username format)
- ❌ All lowercase, ends with numbers
- ❌ student_id is NULL
- ❌ role is NULL or generic

---

## Before vs After Examples

### Example 1: Duplicate with Good and Bad Rows

**BEFORE:**
| tutor_id | tutor_name | username | student_id | role | Quality |
|----------|------------|----------|------------|------|---------|
| abc-123 | Elizabeth H. | hale007 | 3185060 | manager | ✅ GOOD |
| xyz-789 | hale007 | hale007 | NULL | NULL | ❌ BAD |

**AFTER:**
| tutor_id | tutor_name | username | student_id | role |
|----------|------------|----------|------------|------|
| abc-123 | Elizabeth H. | hale007 | 3185060 | manager |

**Action:** Deleted row xyz-789 (bad row with username in tutor_name)

### Example 2: No Duplicates (No Change)

**BEFORE & AFTER:**
| tutor_id | tutor_name | username | student_id | role |
|----------|------------|----------|------------|------|
| def-456 | Kensy A. | anjeh001 | 3211062 | lead_tutor |

**Action:** None - only one row exists, no duplicate

---

## Deduplication Logic

The migration uses this DELETE query:

```sql
DELETE FROM tutors
WHERE tutor_id IN (
    SELECT t1.tutor_id
    FROM tutors t1
    WHERE EXISTS (
        SELECT 1
        FROM tutors t2
        WHERE t2.username = t1.username          -- Same username
          AND t2.tutor_id != t1.tutor_id         -- Different row
          AND t2.tutor_name ~ '^[A-Z]'           -- t2 has proper name
          AND t1.tutor_name ~ '^[a-z]+[0-9]{3,}$'  -- t1 has username format
    )
);
```

**Translation:**
- Delete row t1 if...
- Another row t2 exists with same username
- t2 has proper name format (good)
- t1 has username format (bad)

---

## Safety Features

### 1. Backup Created
All data backed up to `tutors_dedup_backup_20260405` before deletion.

### 2. Preview Queries
See exactly what will be deleted before committing.

### 3. Pattern Matching
Only deletes rows clearly identified as "bad" duplicates.

### 4. Preserves Data
Keeps the row with most complete information.

---

## Rollback Instructions

If something goes wrong:

```sql
-- Restore all tutors from backup
DELETE FROM tutors;
INSERT INTO tutors SELECT * FROM tutors_dedup_backup_20260405;

-- Verify restoration
SELECT COUNT(*) FROM tutors;
```

---

## Expected Results

After running the migration:

1. **Duplicate usernames removed:** Each username appears only once
2. **Good data preserved:** Rows with proper names and complete data kept
3. **Bad data deleted:** Rows with usernames in tutor_name removed
4. **Ready for cleanup:** Can now run username cleanup migration safely

---

## Migration Order

**IMPORTANT:** Run migrations in this order:

1. ✅ **First:** `20260405172000_remove_duplicate_tutors.sql` (this one)
   - Removes duplicate tutor rows

2. ⏭️ **Second:** `20260405171500_move_usernames_from_tutor_name.sql`
   - Moves usernames from tutor_name to username column
   - Will work correctly now that duplicates are removed

---

## Verification Checklist

After running migration:

- [ ] Preview query shows expected duplicates
- [ ] Migration ran without errors
- [ ] Backup table created (`tutors_dedup_backup_20260405`)
- [ ] No duplicate usernames remain (query returns 0 rows)
- [ ] Good rows preserved (have proper names)
- [ ] Bad rows deleted (usernames removed from tutor_name)
- [ ] Ready to run username cleanup migration

---

## Troubleshooting

### Issue: "Good row accidentally deleted"

**Check preview query first!**
If a row was incorrectly classified, rollback and adjust the detection pattern.

### Issue: "Still seeing duplicates"

**Run this query:**
```sql
SELECT username, COUNT(*) as count, string_agg(tutor_name, ', ') as names
FROM tutors
WHERE username IS NOT NULL
GROUP BY username
HAVING COUNT(*) > 1;
```

Check if both rows have proper names or both have usernames - may need manual review.

### Issue: "Unsure which row to keep"

**Compare data completeness:**
```sql
SELECT
    tutor_id,
    tutor_name,
    username,
    CASE WHEN student_id IS NOT NULL THEN 'Has ID' ELSE 'No ID' END,
    CASE WHEN role IS NOT NULL THEN 'Has Role' ELSE 'No Role' END
FROM tutors
WHERE username = 'specific-username';
```

Keep the row with more populated fields.

---

## Summary

**Migration File:** `20260405172000_remove_duplicate_tutors.sql`

**What it does:**
- Identifies duplicate tutors by username
- Classifies rows as GOOD (proper name) or BAD (username format)
- Deletes BAD rows, keeps GOOD rows
- Creates backup for safety

**Result:**
- ✅ No duplicate usernames
- ✅ Clean data ready for username cleanup
- ✅ One row per tutor
- ✅ Proper names preserved

---

**Next Step:** Run `20260405171500_move_usernames_from_tutor_name.sql` to clean up remaining usernames in tutor_name column.

**Last Updated:** 2026-04-05
