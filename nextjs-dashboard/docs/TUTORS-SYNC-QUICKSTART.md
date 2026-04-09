# Tutors Table Excel Sync - Quick Start Guide

## ✅ What Was Done

- ✅ **59 tutors matched** from Staff.xlsx with existing tutors table
- ✅ **Created schema migration** to add 3 new columns to tutors table
- ✅ **Generated data migration** to populate username, student_id, and role
- ❌ **Skipped 9 tutors** that don't exist in tutors table yet

---

## 📊 New Columns Added to Tutors Table

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| **username** | VARCHAR(50) UNIQUE | Gannon username | "anjeh001" |
| **student_id** | VARCHAR(50) UNIQUE | Student ID number | "3211062" |
| **role** | VARCHAR(50) | Staff role/position | "lead_tutor" |

**Existing columns preserved:**
- `tutor_id` (UUID, Primary Key) - unchanged
- `tutor_name` (VARCHAR, UNIQUE) - unchanged (still abbreviated like "Kensy A.")

---

## 🎯 Role Distribution (59 tutors)

| Excel Position | Supabase Role | Count |
|----------------|---------------|-------|
| Student Sysadmin & Project Manager | `admin` | 1 |
| Student Manager | `manager` | 3 |
| Lead Tutor | `lead_tutor` | 13 |
| All other positions | `tutor` | 42 |
| **Total** | | **59** |

---

## 📁 Files Generated

### 1. Schema Migration (Add Columns)
**File:** `supabase/migrations/20260405170000_add_staff_columns_to_tutors.sql`

```sql
ALTER TABLE tutors ADD COLUMN username VARCHAR(50) UNIQUE;
ALTER TABLE tutors ADD COLUMN student_id VARCHAR(50) UNIQUE;
ALTER TABLE tutors ADD COLUMN role VARCHAR(50) DEFAULT 'tutor'
  CHECK (role IN ('tutor', 'lead_tutor', 'manager', 'admin', 'developer'));
```

### 2. Data Migration (Populate Data)
**File:** `supabase/migrations/20260405170851_populate_staff_data_in_tutors.sql`

Contains 59 UPDATE statements like:
```sql
UPDATE tutors
SET username = 'anjeh001',
    student_id = '3211062',
    role = 'lead_tutor'
WHERE tutor_name = 'Kensy A.';
```

### 3. Reports
- **`docs/TUTORS-SYNC-REPORT.md`** - Complete sync report with all tutors
- **`scripts/match-staff-data-tutors.py`** - Python script (can be re-run)

---

## 🚀 How to Apply (2 Steps)

### Step 1: Add Columns to Tutors Table

**Option A: Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Click **SQL Editor**
3. Click **New query**
4. Copy contents of: `supabase/migrations/20260405170000_add_staff_columns_to_tutors.sql`
5. Paste and click **Run**
6. ✅ You should see: "Success" with "Tutors table schema updated successfully"

**Option B: Supabase CLI**
```bash
cd nextjs-dashboard
supabase db push
```

### Step 2: Populate the Data

**Option A: Supabase Dashboard**
1. In **SQL Editor**, click **New query**
2. Copy contents of: `supabase/migrations/20260405170851_populate_staff_data_in_tutors.sql`
3. Paste and click **Run**
4. ✅ You should see 59 rows updated

**Option B: Supabase CLI**
Already done if you ran `supabase db push` above!

---

## ✔️ Verification

After running both migrations, verify the data:

### Quick Check
```sql
SELECT COUNT(*) FROM tutors WHERE username IS NOT NULL;
```
**Expected:** 59 rows

### Detailed View
```sql
SELECT tutor_name, username, student_id, role
FROM tutors
WHERE username IS NOT NULL
ORDER BY role, tutor_name;
```

### Sample Records to Verify

| Tutor Name | Username | Student ID | Role | Position |
|------------|----------|------------|------|----------|
| Emily K. | koss001 | 3176413 | admin | Student Sysadmin & Project Manager |
| Elizabeth H. | hale007 | 3185060 | manager | Student Manager |
| Kensy A. | anjeh001 | 3211062 | lead_tutor | Lead Tutor |
| Avish M. | maniar001 | 3198602 | tutor | Tech Evangelist |

---

## 📋 What Gets Updated

**Example UPDATE for Lead Tutor:**
```sql
-- Before
tutor_id: abc-123-def
tutor_name: "Kensy A."
username: NULL
student_id: NULL
role: NULL

-- After
tutor_id: abc-123-def
tutor_name: "Kensy A."        ← unchanged (still abbreviated)
username: "anjeh001"           ← NEW
student_id: "3211062"          ← NEW
role: "lead_tutor"             ← NEW
```

---

## ❌ Skipped Tutors (9)

These tutors are in Excel but NOT in the tutors table (won't be synced):

1. Emily Bowers (bowers076@gannon.edu)
2. George Bailey (bailey234@gannon.edu)
3. Gonzalo Perez (perezrod001@gannon.edu)
4. Julia Bukowski (bukowski011@gannon.edu)
5. Maria Mora Pena (morapena001@gannon.edu)
6. Matthew Thompson (thompson123@gannon.edu)
7. Pratham Patel (patel292@gannon.edu)
8. Roberta Ghansah (ghansah001@gannon.edu)
9. Robiiakhon Kuchkorova (kuchkoro001@gannon.edu)

**Note:** These must be manually added to the tutors table first if needed.

---

## 🔍 Position → Role Mapping

The script maps Excel Position to Supabase role:

```
Excel Position                        → Supabase Role
────────────────────────────────────────────────────────
Student Sysadmin & Project Manager   → admin
Student Manager                      → manager
Lead Tutor                           → lead_tutor
Tutor                                → tutor
STEM-PASS Tutor                      → tutor
STEM-PASS Tutor (SEECS Funded)       → tutor
Tech Evangelist                      → tutor
STEMBassador                         → tutor
TBD                                  → tutor
```

---

## 🔄 Re-running the Script

If Staff.xlsx is updated in the future:

```bash
cd nextjs-dashboard/scripts
python match-staff-data-tutors.py
```

This will:
- Generate a new data migration file (with new timestamp)
- Create a new report with updated data
- Preserve previous migrations

**Note:** You only need to run the schema migration ONCE. Future updates only need the data migration.

---

## 🐛 Troubleshooting

### Issue: "Column already exists"

**Cause:** Schema migration was already run

**Solution:** Skip Step 1, only run Step 2 (data migration)

### Issue: "Duplicate key value violates unique constraint"

**Cause:** Trying to insert duplicate username or student_id

**Solution:**
- Check if data was already populated
- Run verification query to see existing data

### Issue: "Check constraint violated for role"

**Cause:** Invalid role value

**Solution:**
- Role must be one of: 'tutor', 'lead_tutor', 'manager', 'admin', 'developer'
- Re-run the script to regenerate migration with correct values

### Issue: "tutor_name not found"

**Cause:** Tutor doesn't exist in tutors table

**Solution:**
- Verify tutor exists: `SELECT * FROM tutors WHERE tutor_name = 'Kensy A.';`
- If missing, they're in the "skipped" list - see full report

---

## 📊 Summary

**Total Staff in Excel:** 72
**Matched & Synced:** 59 ✅
**Skipped (not in DB):** 9 ❌
**Duplicate entries removed:** 4 (same person, multiple positions)

**Columns Added:**
- username (VARCHAR(50), UNIQUE)
- student_id (VARCHAR(50), UNIQUE)
- role (VARCHAR(50), with CHECK constraint)

**Tutors by Role:**
- 1 Admin (Emily K.)
- 3 Managers (Elizabeth H., Van P., Lili Ú.)
- 13 Lead Tutors
- 42 Regular Tutors

---

## 📚 Documentation

- **This Guide:** `docs/TUTORS-SYNC-QUICKSTART.md`
- **Full Report:** `docs/TUTORS-SYNC-REPORT.md`
- **Schema Migration:** `supabase/migrations/20260405170000_add_staff_columns_to_tutors.sql`
- **Data Migration:** `supabase/migrations/20260405170851_populate_staff_data_in_tutors.sql`
- **Python Script:** `scripts/match-staff-data-tutors.py`

---

**Ready to go!** Just run the two migrations in Supabase Dashboard and you're done! 🎉

**Generated:** 2026-04-05
**Target Table:** tutors (NOT users)
