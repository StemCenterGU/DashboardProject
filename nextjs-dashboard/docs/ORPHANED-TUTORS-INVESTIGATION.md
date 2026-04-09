# Orphaned Tutors Investigation Guide

**Date:** 2026-04-06
**Issue:** Unknown tutors appearing in Excel Grid View
**Goal:** Find if usernames exist for orphaned tutor_availability records

---

## Quick Start

### Step 1: Run Investigation Script

```bash
# Connect to your Supabase database
psql "your-supabase-connection-string"

# Run the investigation script
\i scripts/investigate-orphaned-tutors.sql
```

Or use Supabase Studio:
1. Go to SQL Editor in Supabase Studio
2. Copy contents of `scripts/investigate-orphaned-tutors.sql`
3. Click "Run"
4. Review the output

---

## What the Script Does

The investigation script runs 7 comprehensive checks:

### Part 1: Orphaned Availability Records Summary
- Counts total orphaned slots
- Lists unique orphaned tutor_ids
- Shows schedule details for each orphaned tutor

### Part 2: Check Backup Tables
- Looks for `tutors_dedup_backup_20260405` table
- Checks if any deleted tutors had these IDs
- **This is the most likely source of username data!**

### Part 3: Current Tutors Analysis
- Lists all current tutors with usernames
- For comparison with orphaned records

### Part 4: Matching Attempts
- Tries to find patterns between orphaned IDs and existing tutors
- Checks for UUID similarities

### Part 5: Pattern Analysis
- Compares creation timestamps
- Helps identify when orphaned records were created

### Part 6: Recommendations
- Auto-generates recommendations based on findings
- Tells you what to do next

### Part 7: Export for Manual Review
- Lists all orphaned tutor_ids
- For you to investigate manually

---

## Expected Scenarios

### Scenario A: Usernames Found in Backup Table ✅ BEST CASE

**Output Example:**
```
Found backup table: tutors_dedup_backup_20260405
Deleted tutors from backup:
  tutor_id                              | tutor_name  | username   | student_id | role
  abc123...-...-...                     | john001     | john001    | NULL       | tutor
  def456...-...-...                     | smith002    | smith002   | NULL       | tutor
```

**What this means:**
- These tutors were deleted during deduplication
- They had usernames in the `tutor_name` field (bad data)
- But we can extract the username!

**Next Steps:**
- Restore these tutors with proper names
- Use username to generate abbreviated name
- Migration script will be created

---

### Scenario B: No Usernames Found ❌ HARDER CASE

**Output Example:**
```
No backup table found (tutors_dedup_backup_20260405)
OR
Backup exists but no deleted tutors match orphaned IDs
```

**What this means:**
- Tutors were deleted some other way
- No username data available
- Cannot identify who these tutors are

**Options:**
1. **Delete orphaned records** (recommended)
   - Clean up database
   - Unknown tutors disappear from view
   - Schedule data is lost

2. **Create placeholder tutors**
   - Create generic tutors like "Unknown Tutor 1"
   - Preserves schedule data
   - But doesn't solve the mystery

3. **Manual investigation required**
   - Check application logs
   - Check Excel upload files
   - Ask users who these tutors might be

---

### Scenario C: Orphaned Records Already Cleaned

**Output Example:**
```
Orphaned availability records: 0
Unique orphaned tutor_ids: 0
✓ No orphaned records found - database is clean!
```

**What this means:**
- The migration `20260406000000_remove_orphaned_availability.sql` already ran
- Or no orphaned records exist
- Database is healthy

**Next Steps:**
- Just update Excel grid time range
- No tutor cleanup needed

---

## Decision Tree

After running the investigation:

```
Do orphaned records exist?
│
├─ NO → Skip to "Update Excel Grid Time Range"
│
└─ YES → Were usernames found in backup?
    │
    ├─ YES → Proceed with "Restore Tutors from Backup"
    │
    └─ NO → Choose an option:
        │
        ├─ Delete orphaned records (clean database)
        ├─ Create placeholder tutors (preserve data)
        └─ Manual investigation (check logs/files)
```

---

## What To Report Back

After running the investigation script, please provide:

1. **Total orphaned records count**
   ```
   Orphaned availability records: ???
   Unique orphaned tutor_ids: ???
   ```

2. **Backup table status**
   ```
   Backup table exists: TRUE/FALSE
   ```

3. **If backup exists, deleted tutors info**
   ```sql
   -- Copy the output from Part 2:
   tutor_id | tutor_name | username | student_id | role
   ---------|------------|----------|------------|------
   ???      | ???        | ???      | ???        | ???
   ```

4. **Recommendations from Part 6**
   ```
   -- Copy the recommendations output
   ```

---

## Next Steps Based on Results

### If Usernames Found in Backup:

I will create:
- Migration to restore deleted tutors with proper names
- Script to generate abbreviated names from usernames
- Verification queries

### If No Usernames Found:

You choose:
- **Option A:** Delete orphaned records (I'll use existing migration)
- **Option B:** Create placeholder tutors (I'll create migration)
- **Option C:** Manual investigation (you provide more info)

### Then:

- Update Excel grid time range (2pm-8pm)
- Test the changes
- Document the solution

---

## Manual Alternative (If Script Fails)

If you can't run the SQL script, run these individual queries in Supabase Studio:

### Query 1: Count Orphaned Records
```sql
SELECT
    COUNT(*) as total_orphaned_slots,
    COUNT(DISTINCT tutor_id) as unique_orphaned_tutor_ids
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL;
```

### Query 2: Check Backup Table
```sql
-- Check if backup exists
SELECT tablename
FROM pg_tables
WHERE tablename = 'tutors_dedup_backup_20260405';

-- If exists, check for deleted tutors
SELECT
    b.tutor_id,
    b.tutor_name,
    b.username,
    b.student_id,
    b.role
FROM tutors_dedup_backup_20260405 b
LEFT JOIN tutors t ON b.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL;
```

### Query 3: List Orphaned Tutor IDs
```sql
SELECT DISTINCT
    tutor_id,
    (SELECT COUNT(*) FROM tutor_availability WHERE tutor_id = ta.tutor_id) as slot_count
FROM tutor_availability ta
LEFT JOIN tutors t ON ta.tutor_id = t.tutor_id
WHERE t.tutor_id IS NULL
ORDER BY slot_count DESC;
```

---

## Files Created

1. **`scripts/investigate-orphaned-tutors.sql`**
   - Comprehensive investigation script
   - Run this in your database

2. **`supabase/queries/investigate_orphaned_records.sql`**
   - Alternative query collection
   - Individual queries for manual execution

3. **This guide** - Step-by-step instructions

---

## Timeline

1. **Run investigation** (~5 minutes)
2. **Report findings** (paste output)
3. **I create solution** (~10 minutes)
4. **Apply migrations** (~2 minutes)
5. **Update Excel grid** (~5 minutes)
6. **Test and verify** (~5 minutes)

**Total:** ~30 minutes to complete resolution

---

## Safety Notes

- Investigation queries are READ-ONLY
- No data will be modified
- Backup table check is safe
- Report findings before any changes are made

---

## Questions?

If you encounter errors or need clarification:
1. Copy the error message
2. Note which part of the script failed
3. Share the output you got before the error
4. I'll help troubleshoot

---

**Ready to proceed:**
1. Run `scripts/investigate-orphaned-tutors.sql`
2. Copy the entire output
3. Share it with me
4. I'll create the appropriate solution based on what we find

---

**Last Updated:** 2026-04-06
**Status:** Awaiting investigation results
