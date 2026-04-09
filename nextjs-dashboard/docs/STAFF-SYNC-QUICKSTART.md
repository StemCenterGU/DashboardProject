# Staff Excel Sync - Quick Start Guide

## What Was Done

✅ **Matched 59 tutors** from Staff.xlsx with existing Supabase tutors
❌ **Skipped 9 tutors** that don't exist in Supabase yet
📊 **Generated SQL migration** to update roles and usernames

---

## Files Generated

1. **`supabase/migrations/20260405165721_sync_staff_roles.sql`**
   - SQL migration with 59 UPDATE statements
   - Updates `role` field based on Excel Position
   - Sets `updated_at` timestamp

2. **`docs/STAFF-SYNC-REPORT.md`**
   - Detailed report with all matched/unmatched tutors
   - Full breakdown by role
   - Complete lists of who will be synced

3. **`scripts/match-staff-data.py`**
   - Python script that generated the migration
   - Can be re-run if Staff.xlsx is updated

---

## Role Assignments

From the 59 matched tutors:

| Excel Position | Supabase Role | Count |
|----------------|---------------|-------|
| Student Sysadmin & Project Manager | `admin` | 1 |
| Student Manager | `manager` | 3 |
| Lead Tutor | `lead_tutor` | 13 |
| Tutor | `tutor` | 28 |
| STEM-PASS Tutor | `tutor` | 13 |
| Tech Evangelist | `tutor` | 5 |
| STEMBassador | `tutor` | 2 |
| TBD | `tutor` | 2 |
| **Total** | | **59** |

---

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New query**
5. Open the migration file: `supabase/migrations/20260405165721_sync_staff_roles.sql`
6. Copy all the SQL content
7. Paste into SQL Editor
8. Click **Run** (or press Ctrl+Enter)
9. You should see: ✅ Success

### Option 2: Supabase CLI

```bash
cd nextjs-dashboard
supabase db push
```

---

## What Gets Updated

For each matched tutor, the migration updates:

```sql
UPDATE users
SET role = 'lead_tutor',    -- Based on Position mapping
    updated_at = NOW()       -- Timestamp of update
WHERE email = 'student@gannon.edu'
  OR email ILIKE '%username%';
```

**Fields Updated:**
- ✅ `role` - Mapped from Excel Position column
- ✅ `updated_at` - Set to current timestamp

**Fields NOT Changed:**
- ❌ `email` - Used for matching only
- ❌ `full_name` - Kept as-is
- ❌ `user_id` - Primary key (never changes)
- ❌ `password_hash` - Security (never changes)

---

## Matched Tutors by Role

### Admin (1)
- Emily Koss (koss001@gannon.edu)

### Managers (3)
- Elizabeth Hale (hale007@gannon.edu)
- Van Phan (phan016@gannon.edu)
- Lili Újfalvi (ujfalvi001@gannon.edu)

### Lead Tutors (13)
- Aizirek S. Asylbekova (asylbeko001@gannon.edu)
- Alix Daniela Aquino Rivas (aquinori001@gannon.edu)
- Clara Bourke Hurtado (bourkehu001@gannon.edu)
- Claudia Orte Blanch (orteblan001@gannon.edu)
- Ethan Weigel (weigel004@gannon.edu)
- Eva Sledge (sledge002@gannon.edu)
- Isaac Wheeler (wheeler039@gannon.edu)
- Kensy Anjeh Akem (anjeh001@gannon.edu)
- Lilly Mahle (mahle006@gannon.edu)
- Maddy Endler (endler001@gannon.edu)
- Pedro Aragon (aragonro001@gannon.edu)
- Thuy Phuong Tran (tran024@gannon.edu)
- Vu Tra My Nguyen (nguyen049@gannon.edu)

### Regular Tutors (42)
See `docs/STAFF-SYNC-REPORT.md` for complete list

---

## Unmatched Tutors (Skipped)

These 9 tutors are in Excel but NOT in Supabase:

1. Emily Bowers (bowers076@gannon.edu)
2. George Bailey (bailey234@gannon.edu)
3. Gonzalo Perez (perezrod001@gannon.edu)
4. Julia Bukowski (bukowski011@gannon.edu)
5. Maria Mora Pena (morapena001@gannon.edu)
6. Matthew Thompson (thompson123@gannon.edu)
7. Pratham Patel (patel292@gannon.edu)
8. Roberta Ghansah (ghansah001@gannon.edu)
9. Robiiakhon Kuchkorova (kuchkoro001@gannon.edu)

**Note:** These will NOT be added. They must be manually added to Supabase first if needed.

---

## Verification After Running

After running the migration, verify in Supabase:

1. Go to **Table Editor** → `users` table
2. Search for a few emails from the matched list
3. Check their `role` field has been updated correctly
4. Check `updated_at` shows recent timestamp

**Example:**
- Search: `koss001@gannon.edu`
- Expected role: `admin`
- Search: `anjeh001@gannon.edu`
- Expected role: `lead_tutor`

---

## Re-running the Script

If Staff.xlsx is updated, re-run the script:

```bash
cd nextjs-dashboard/scripts
python match-staff-data.py
```

This will:
- Generate a new migration file with updated timestamp
- Create a new report with current data
- Preserve previous migrations (timestamped)

---

## Troubleshooting

### Issue: "Email not found"

**Cause:** User doesn't exist in `users` table yet

**Solution:**
- User must login at least once to create their row
- Or manually insert user via Supabase Dashboard

### Issue: "Role constraint violation"

**Cause:** Role value not in allowed enum

**Solution:**
- Allowed roles: `tutor`, `lead_tutor`, `manager`, `admin`, `developer`
- Check migration SQL uses only these values

### Issue: "Nothing updated"

**Cause:** Email doesn't match any existing user

**Solution:**
- Verify users have logged in at least once
- Check email spelling in Staff.xlsx vs Supabase
- Use `ILIKE` fallback in SQL (already included)

---

## Next Steps After Sync

1. ✅ Users will see their updated roles immediately (if using real-time sync)
2. ✅ Or within 60 seconds (polling fallback)
3. ✅ Or on next login/page refresh
4. ✅ Admin panel will reflect new role assignments
5. ✅ Permissions will update automatically via RBAC system

---

## Summary

**Total Staff in Excel:** 72
**Matched & Synced:** 59 ✅
**Skipped (not in DB):** 9 ❌
**Duplicate entries removed:** 4 (same person, multiple positions)

**Role Distribution:**
- 1 Admin
- 3 Managers
- 13 Lead Tutors
- 42 Regular Tutors

---

**Generated:** 2026-04-05
**Script:** `scripts/match-staff-data.py`
**Migration:** `supabase/migrations/20260405165721_sync_staff_roles.sql`
