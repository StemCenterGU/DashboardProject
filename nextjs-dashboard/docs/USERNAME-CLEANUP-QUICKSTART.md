# Username Cleanup - Quick Start Guide

## 🎯 What This Does

Moves Gannon usernames (like "anjeh001") from the `tutor_name` column to the `username` column, then sets `tutor_name` to NULL.

**Before:**
```
tutor_name: "anjeh001"
username: NULL
```

**After:**
```
tutor_name: "Unknown"  (placeholder due to NOT NULL constraint)
username: "anjeh001"
```

---

## ⚡ Quick Apply (3 Steps)

### Step 1: Preview What Will Change (IMPORTANT!)

Run this in Supabase SQL Editor first:

```sql
-- See which tutors will be affected
SELECT tutor_id, tutor_name, username
FROM tutors
WHERE (tutor_name ~ '^[a-z]+[0-9]{3,}$')
   OR (tutor_name !~ '[A-Z]' AND tutor_name !~ '\.' AND tutor_name !~ ' ');
```

This shows all tutors with usernames in tutor_name that will be moved.

### Step 2: Run the Migration

1. Go to Supabase Dashboard → **SQL Editor**
2. Open: `supabase/migrations/20260405171500_move_usernames_from_tutor_name.sql`
3. Copy all content
4. Paste and click **Run**

### Step 3: Verify It Worked

```sql
-- Check results - should show tutors with usernames in correct column
SELECT tutor_name, username, student_id, role
FROM tutors
WHERE username IS NOT NULL
ORDER BY username;

-- Verify no usernames remain in tutor_name (should return 0 rows)
SELECT * FROM tutors
WHERE tutor_name ~ '^[a-z]+[0-9]{3,}$';
```

---

## 📋 What Gets Updated

The migration identifies usernames using this pattern:
- ✅ All lowercase + numbers at end (e.g., "anjeh001", "wheeler039")
- ✅ No uppercase letters, periods, or spaces

**Will be moved:**
- "anjeh001" → moved to username column
- "maniar001" → moved to username column
- "wheeler039" → moved to username column

**Will NOT be touched:**
- "Kensy A." → proper name format, stays in tutor_name
- "Avish M." → proper name format, stays in tutor_name
- "Emily K." → proper name format, stays in tutor_name

---

## 🔒 Safety Features

✅ **Backup Created** - All data backed up to `tutors_backup_20260405`
✅ **Preview Queries** - See changes before applying
✅ **Non-Destructive** - Only moves usernames, doesn't delete data
✅ **Easy Rollback** - Simple undo if needed

---

## 🔄 Rollback (If Needed)

If something goes wrong, undo with:

```sql
-- Step 1: Remove NOT NULL constraint
ALTER TABLE tutors ALTER COLUMN tutor_name DROP NOT NULL;

-- Step 2: Restore from backup
UPDATE tutors t
SET tutor_name = b.tutor_name,
    username = b.username
FROM tutors_backup_20260405 b
WHERE t.tutor_id = b.tutor_id;

-- Step 3: Restore NOT NULL constraint
ALTER TABLE tutors ALTER COLUMN tutor_name SET NOT NULL;
```

---

## ✅ Expected Results

After running the migration:

| Scenario | Before | After |
|----------|--------|-------|
| Username in tutor_name | tutor_name: "anjeh001"<br>username: NULL | tutor_name: "Unknown"<br>username: "anjeh001" |
| Proper name | tutor_name: "Kensy A."<br>username: "anjeh001" | tutor_name: "Kensy A."<br>username: "anjeh001" *(no change)* |

**Note:** tutor_name is set to "Unknown" instead of NULL due to NOT NULL constraint on the column.

---

## 📊 Verification Checklist

After running migration, verify:

- [ ] Preview query shows expected tutors
- [ ] Migration ran without errors
- [ ] Backup table created (`tutors_backup_20260405`)
- [ ] Usernames moved to username column
- [ ] tutor_name is NULL for affected tutors
- [ ] Proper names ("Kensy A.") unchanged
- [ ] No usernames remain in tutor_name column

---

## 📚 Full Documentation

See `docs/USERNAME-CLEANUP-REPORT.md` for complete details.

---

**Migration:** `supabase/migrations/20260405171500_move_usernames_from_tutor_name.sql`
**Generated:** 2026-04-05
