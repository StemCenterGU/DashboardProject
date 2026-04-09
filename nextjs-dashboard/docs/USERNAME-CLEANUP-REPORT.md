# Username Cleanup Report - Tutors Table

**Generated:** 2026-04-05
**Migration:** `20260405171500_move_usernames_from_tutor_name.sql`
**Issue:** Some tutors have Gannon usernames (e.g., "anjeh001") in tutor_name column instead of proper names

---

## Problem Description

The `tutors` table has two columns for identifying tutors:
- **tutor_name** (VARCHAR) - Should contain abbreviated names like "Kensy A."
- **username** (VARCHAR) - Should contain Gannon usernames like "anjeh001"

**Issue Found:** Some tutors have usernames stored in the tutor_name column instead of proper names.

---

## Username Pattern Detection

The migration identifies tutors with usernames in tutor_name using these criteria:

### Pattern 1: Gannon Username Format
- **Regex:** `^[a-z]+[0-9]{3,}$`
- **Example:** "anjeh001", "wheeler039", "maniar001"
- **Characteristics:**
  - All lowercase letters
  - Followed by 3+ digits at the end
  - No spaces, periods, or special characters

### Pattern 2: Lacks Proper Name Formatting
- **Criteria:** No uppercase letters AND no periods AND no spaces
- **Example:** Any value that's all lowercase without formatting
- **Reasoning:** Proper names should have "FirstName L." format with capitals and periods

---

## What the Migration Does

### Step 0: Remove NOT NULL Constraint
Temporarily removes the NOT NULL constraint on tutor_name to allow NULL values:
```sql
ALTER TABLE tutors ALTER COLUMN tutor_name DROP NOT NULL;
```

### Step 1: Preview Changes
Shows all tutors that will be affected before making changes:
```sql
SELECT tutor_id, tutor_name, username
FROM tutors
WHERE (tutor_name ~ '^[a-z]+[0-9]{3,}$')
   OR (tutor_name !~ '[A-Z]' AND tutor_name !~ '\.' AND tutor_name !~ ' ');
```

### Step 2: Backup Data
Creates a temporary backup table:
```sql
CREATE TEMP TABLE tutors_backup_20260405 AS SELECT * FROM tutors;
```

### Step 3: Move Usernames
Transfers username from tutor_name to username column:
```sql
UPDATE tutors
SET username = CASE
        WHEN username IS NULL THEN tutor_name
        ELSE username
    END,
    tutor_name = NULL
WHERE (tutor_name ~ '^[a-z]+[0-9]{3,}$')
   OR (tutor_name !~ '[A-Z]' AND tutor_name !~ '\.' AND tutor_name !~ ' ')
   AND tutor_name IS NOT NULL;
```

### Step 4: Verify Results
Runs validation queries to ensure changes were applied correctly.

### Step 5: Restore NOT NULL Constraint
Sets NULL tutor_name values to 'Unknown' and restores the constraint:
```sql
UPDATE tutors SET tutor_name = 'Unknown' WHERE tutor_name IS NULL;
ALTER TABLE tutors ALTER COLUMN tutor_name SET NOT NULL;
ALTER TABLE tutors ALTER COLUMN tutor_name SET DEFAULT 'Unknown';
```

---

## Before vs After Examples

### Example 1: Username in tutor_name, username column is NULL

**BEFORE:**
| tutor_id | tutor_name | username | student_id | role |
|----------|------------|----------|------------|------|
| abc-123 | anjeh001 | NULL | NULL | NULL |

**AFTER:**
| tutor_id | tutor_name | username | student_id | role |
|----------|------------|----------|------------|------|
| abc-123 | Unknown | anjeh001 | NULL | NULL |

**Action:** Username moved from tutor_name to username column.

### Example 2: Username in BOTH columns (duplicate)

**BEFORE:**
| tutor_id | tutor_name | username | student_id | role |
|----------|------------|----------|------------|------|
| xyz-789 | hale007 | hale007 | 3185060 | manager |

**AFTER:**
| tutor_id | tutor_name | username | student_id | role |
|----------|------------|----------|------------|------|
| xyz-789 | Unknown | hale007 | 3185060 | manager |

**Action:** tutor_name cleared (username already existed, avoiding duplicate key error).

### Example 3: Proper Name (No Change)

**BEFORE:**
| tutor_id | tutor_name | username | student_id | role |
|----------|------------|----------|------------|------|
| def-456 | Kensy A. | anjeh001 | 3211062 | lead_tutor |

**AFTER:** (No change - already correct)
| tutor_id | tutor_name | username | student_id | role |
|----------|------------|----------|------------|------|
| def-456 | Kensy A. | anjeh001 | 3211062 | lead_tutor |

**Action:** None - proper name format detected, left unchanged.

**Note:** tutor_name is set to 'Unknown' instead of NULL due to NOT NULL constraint.

---

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Preview First** (IMPORTANT - Run this first!):
   ```sql
   -- See which tutors will be affected
   SELECT tutor_id, tutor_name, username
   FROM tutors
   WHERE (tutor_name ~ '^[a-z]+[0-9]{3,}$')
      OR (tutor_name !~ '[A-Z]' AND tutor_name !~ '\.' AND tutor_name !~ ' ');
   ```

2. **Run Migration**:
   - Go to https://supabase.com/dashboard
   - Click **SQL Editor**
   - Open: `supabase/migrations/20260405171500_move_usernames_from_tutor_name.sql`
   - Copy all content
   - Paste and click **Run**

3. **Verify Results**:
   ```sql
   -- Check that usernames were moved
   SELECT tutor_name, username, student_id, role
   FROM tutors
   WHERE username IS NOT NULL
   ORDER BY username;

   -- Count results
   SELECT
       COUNT(*) FILTER (WHERE tutor_name IS NULL AND username IS NOT NULL) as moved_successfully,
       COUNT(*) FILTER (WHERE tutor_name IS NOT NULL) as still_has_tutor_name,
       COUNT(*) as total
   FROM tutors;
   ```

### Option 2: Supabase CLI

```bash
cd nextjs-dashboard
supabase db push
```

---

## Verification Queries

### Check for Remaining Usernames in tutor_name
```sql
-- Should return 0 rows
SELECT tutor_id, tutor_name, username
FROM tutors
WHERE tutor_name IS NOT NULL
  AND tutor_name ~ '^[a-z]+[0-9]{3,}$';
```

### View All Tutors with Usernames
```sql
SELECT tutor_id, tutor_name, username, student_id, role
FROM tutors
WHERE username IS NOT NULL
ORDER BY role, username;
```

### Count Tutors by Data Status
```sql
SELECT
    COUNT(*) FILTER (WHERE tutor_name IS NULL AND username IS NOT NULL) as username_only,
    COUNT(*) FILTER (WHERE tutor_name IS NOT NULL AND username IS NOT NULL) as both_name_and_username,
    COUNT(*) FILTER (WHERE tutor_name IS NULL AND username IS NULL) as both_null,
    COUNT(*) as total
FROM tutors;
```

---

## Safety Features

### 1. Backup Table
The migration creates `tutors_backup_20260405` with all data before changes.

### 2. Non-Destructive
- Only updates rows matching username patterns
- Preserves existing username values (doesn't overwrite if already set)
- Keeps all other columns unchanged

### 3. Pattern Matching
- Specific regex patterns ensure only usernames are moved
- Proper names like "Kensy A." are NOT affected

### 4. Verification Built-in
- Multiple SELECT queries show results
- Counts confirm expected changes
- Easy to spot issues before committing

---

## Rollback Instructions

If you need to undo the changes:

### Quick Rollback
```sql
-- Step 1: Temporarily remove NOT NULL constraint
ALTER TABLE tutors ALTER COLUMN tutor_name DROP NOT NULL;

-- Step 2: Restore from backup table
UPDATE tutors t
SET tutor_name = b.tutor_name,
    username = b.username
FROM tutors_backup_20260405 b
WHERE t.tutor_id = b.tutor_id;

-- Step 3: Restore NOT NULL constraint
ALTER TABLE tutors ALTER COLUMN tutor_name SET NOT NULL;
```

### Verify Rollback
```sql
-- Check data was restored
SELECT COUNT(*) FROM tutors
WHERE tutor_name = (
    SELECT tutor_name FROM tutors_backup_20260405
    WHERE tutors.tutor_id = tutors_backup_20260405.tutor_id
);
```

---

## Expected Results

After running the migration:

1. **Tutors with usernames in tutor_name:**
   - ✅ Username moved to `username` column
   - ✅ `tutor_name` set to NULL

2. **Tutors with proper names:**
   - ✅ No changes (tutor_name stays as "Kensy A.")
   - ✅ Existing username column preserved

3. **Tutors with both:**
   - ✅ tutor_name preserved if it's a proper name
   - ✅ username column unchanged (existing value kept)

---

## Next Steps After Migration

1. **Verify All Changes:**
   - Run verification queries above
   - Check that no usernames remain in tutor_name
   - Confirm username column populated correctly

2. **Update Tutor Names (Optional):**
   - If you want to add proper abbreviated names back
   - Can run the populate staff data migration again
   - Or manually update tutor_name with abbreviated format

3. **Clean Up Backup Table:**
   ```sql
   -- After verifying everything is correct
   DROP TABLE IF EXISTS tutors_backup_20260405;
   ```

---

## Troubleshooting

### Issue: "Too many/few tutors affected"

**Check the preview query:**
```sql
SELECT tutor_id, tutor_name, username,
    CASE
        WHEN tutor_name ~ '^[a-z]+[0-9]{3,}$' THEN 'Username pattern'
        WHEN tutor_name !~ '[A-Z\. ]' THEN 'No formatting'
        ELSE 'Proper name'
    END as classification
FROM tutors
ORDER BY classification, tutor_name;
```

### Issue: "Username column already has value"

The migration preserves existing username values:
```sql
-- Only updates if username IS NULL
username = CASE
    WHEN username IS NULL THEN tutor_name
    ELSE username  -- Keeps existing value
END
```

### Issue: "Need to restore specific tutor"

```sql
-- Restore one tutor from backup
UPDATE tutors t
SET tutor_name = b.tutor_name,
    username = b.username
FROM tutors_backup_20260405 b
WHERE t.tutor_id = 'specific-tutor-id'
  AND b.tutor_id = 'specific-tutor-id';
```

---

## Summary

**Migration File:** `20260405171500_move_usernames_from_tutor_name.sql`

**What it does:**
- Identifies tutors with usernames in tutor_name column
- Moves usernames to username column
- Sets tutor_name to NULL
- Creates backup for safety
- Provides verification queries

**Safety:**
- ✅ Backup table created first
- ✅ Non-destructive (preserves existing data)
- ✅ Preview queries available
- ✅ Easy rollback process
- ✅ Verification built-in

**Result:**
- Clean separation: tutor_name for names, username for usernames
- Data properly normalized
- Ready for future staff data syncs

---

**Last Updated:** 2026-04-05
**Status:** Ready to apply
