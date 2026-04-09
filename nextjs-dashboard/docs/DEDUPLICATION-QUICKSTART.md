# Remove Duplicate Tutors - Quick Start

## 🎯 What This Does

Removes duplicate tutor records where the same username appears in multiple rows.

**Keeps:** Row with proper name format (e.g., "Elizabeth H.")
**Deletes:** Row with username in tutor_name (e.g., "hale007")

---

## ⚡ Quick Apply (3 Steps)

### Step 1: Preview Duplicates (REQUIRED!)

**Run this in Supabase SQL Editor FIRST:**

```sql
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
        WHEN t.tutor_name ~ '^[a-z]+[0-9]{3,}$' THEN '❌ BAD: Delete this'
        WHEN t.tutor_name ~ '^[A-Z]' THEN '✅ GOOD: Keep this'
        ELSE '⚠️ UNCLEAR'
    END as action
FROM tutors t
INNER JOIN username_counts uc ON t.username = uc.username
ORDER BY t.username, action;
```

**Review carefully!** Make sure:
- ❌ BAD rows will be deleted
- ✅ GOOD rows will be kept

### Step 2: Run Migration

1. Go to Supabase Dashboard → **SQL Editor**
2. Open: `supabase/migrations/20260405172000_remove_duplicate_tutors.sql`
3. Run it

### Step 3: Verify No Duplicates

```sql
-- Should return 0 rows
SELECT username, COUNT(*) as count
FROM tutors
WHERE username IS NOT NULL
GROUP BY username
HAVING COUNT(*) > 1;
```

---

## 📋 Example Duplicate

**BEFORE (2 rows for same username):**
```
Row 1: tutor_name="Elizabeth H.", username="hale007", student_id="3185060", role="manager" ✅ KEEP
Row 2: tutor_name="hale007",      username="hale007", student_id=NULL,      role=NULL      ❌ DELETE
```

**AFTER (1 row):**
```
Row 1: tutor_name="Elizabeth H.", username="hale007", student_id="3185060", role="manager" ✅ KEPT
```

---

## 🔒 Safety Features

✅ **Backup Created** - All data backed up before deletion
✅ **Preview First** - See what will be deleted
✅ **Pattern Matching** - Only deletes clearly identified bad rows
✅ **Easy Rollback** - Simple restore if needed

---

## 🔄 Rollback (If Needed)

```sql
DELETE FROM tutors;
INSERT INTO tutors SELECT * FROM tutors_dedup_backup_20260405;
```

---

## ✅ Verification Checklist

- [ ] Preview shows duplicates as expected
- [ ] Migration ran without errors
- [ ] No duplicate usernames remain (0 rows in verification query)
- [ ] Good rows preserved with proper names
- [ ] Ready for username cleanup migration

---

## ➡️ Next Step

After deduplication, run the username cleanup migration:
- **File:** `20260405171500_move_usernames_from_tutor_name.sql`
- **Purpose:** Moves remaining usernames from tutor_name to username column

---

## 📚 Full Documentation

See `docs/DEDUPLICATION-GUIDE.md` for complete details.

---

**Migration:** `supabase/migrations/20260405172000_remove_duplicate_tutors.sql`
**Order:** Run THIS first, then username cleanup migration
**Generated:** 2026-04-05
