# Tutors Table Staff Data Sync Report

**Generated:** 2026-04-05 17:08:51
**Source:** Staff.xlsx
**Script:** scripts/match-staff-data-tutors.py
**Target:** tutors table (NOT users table)

---

## Summary

- ✅ **Matched tutors:** 59 (will be synced)
- ❌ **Unmatched tutors:** 9 (skipped)
- 📊 **Total in Excel:** 72 staff members

---

## Changes to Tutors Table

### New Columns Added

1. **username** (VARCHAR(50), UNIQUE)
   - Gannon username from Staff.xlsx
   - Example: "anjeh001"

2. **student_id** (VARCHAR(50), UNIQUE)
   - Student ID number from Staff.xlsx
   - Example: "3211062"

3. **role** (VARCHAR(50), DEFAULT 'tutor')
   - Staff role/position
   - Values: 'tutor', 'lead_tutor', 'manager', 'admin'
   - Mapped from Excel Position column

### Existing Columns (Unchanged)

- **tutor_id** (UUID) - Primary key, unchanged
- **tutor_name** (VARCHAR) - Abbreviated name like "Kensy A.", unchanged

---

## Role Distribution (Matched Tutors)

| Role | Count | Description |
|------|-------|-------------|
| Admin | 1 | Student Sysadmin & Project Manager |
| Manager | 3 | Student Manager |
| Lead Tutor | 13 | Lead Tutor |
| Tutor | 42 | All other positions |
| **Total** | **59** | |

---

## Matched Tutors (59)

These tutors exist in both Excel and Supabase and will be synced:


### Admin (1)

| Tutor Name | Full Name | Username | Student ID | Position |
|------------|-----------|----------|------------|----------|
| Emily K. | Emily Koss | koss001 | 3176413 | Student Sysadmin & Project Manager |

### Manager (3)

| Tutor Name | Full Name | Username | Student ID | Position |
|------------|-----------|----------|------------|----------|
| Elizabeth H. | Elizabeth Hale | hale007 | 3185060 | Student Manager |
| Lili Ú. | Lili Újfalvi | ujfalvi001 | 3166071 | Student Manager |
| Van P. | Van Phan | phan016 | 3179612 | Student Manager |

### Lead Tutor (13)

| Tutor Name | Full Name | Username | Student ID | Position |
|------------|-----------|----------|------------|----------|
| Aizirek A. | Aizirek S. Asylbekova | asylbeko001 | 3191963 | Lead Tutor |
| Alix A. | Alix Daniela Aquino Rivas | aquinori001 | 3218415 | Lead Tutor |
| Clara B. | Clara Bourke Hurtado | bourkehu001 | 3192052 | Lead Tutor |
| Claudia O. | Claudia Orte Blanch | orteblan001 | 3214156 | Lead Tutor |
| Ethan W. | Ethan Weigel | weigel004 | 3203131 | Lead Tutor |
| Eva S. | Eva Sledge | sledge002 | 3181507 | Lead Tutor |
| Isaac W. | Isaac Wheeler | wheeler039 | 3208532 | Lead Tutor |
| Kensy A. | Kensy Anjeh Akem | anjeh001 | 3211062 | Lead Tutor |
| Lilly M. | Lilly Mahle | mahle006 | 3204203 | Lead Tutor |
| Maddy E. | Maddy Endler | endler001 | 3162109 | Lead Tutor |
| My N. | Vu Tra My Nguyen | nguyen049 | 3170014 | Lead Tutor |
| Pedro A. | Pedro Aragon | aragonro001 | 3198784 | Lead Tutor |
| Phuong T. | Thuy Phuong Tran | tran024 | 3191310 | Lead Tutor |

### Tutor (42)

| Tutor Name | Full Name | Username | Student ID | Position |
|------------|-----------|----------|------------|----------|
| Abigail T. | Abigail Trainor | trainor003 | 3181650 | STEM-PASS Tutor |
| Avish M. | Avish Maniar | maniar001 | 3198602 | Tech Evangelist |
| Bailey H. | Bailey Hebert | hebert005 | 3214420 | Tutor |
| Blossom A. | Blossom Anolue | anolue001 | 3161501 | Tutor |
| Camryn B. | Camryn Brown | brown555 | 3179295 | Tutor |
| Chloe K. | Chloe Kitagawa | kitagawa001 | 3166609 | STEM-PASS Tutor (SEECS Funded) |
| Claire S. | Claire Stolz | stolz007 | 3208155 | STEM-PASS Tutor |
| Clare C | Clare Caulfield | caulfiel012 | 1722659 | STEM-PASS Tutor |
| Gabriel J. | Gabriel Aloysius Johnson II | johnsoni001 | 3211055 | STEM-PASS Tutor |
| Glory N. | Glory Ngako | ngako002 | 3160440 | Tutor |
| Grady S. | Grady Smith | smith430 | 3174095 | Tutor |
| Hannah P. | Hannah Popovich | popovich011 | 3137173 | Tutor |
| Hiver N. | Hiver Ngoma | ngoma001 | 3205645 | Tutor |
| Hope T. | Hope Tadiwa Tele | tele001 | 3207634 | Tutor |
| Izzy G. | Isabella Gingras | gingras002 | 3179843 | Tutor |
| Javier M. | Javier Mesa Mendez | mesamend001 | 3193066 | STEM-PASS Tutor (SEECS Funded) |
| Jocelyn S. | Jocelyn Sawicki | sawicki001 | 3206908 | STEM-PASS Tutor |
| Jonathan H. | Jonathan Hansford | hansford001 | 3202307 | Tutor |
| Kara B. | Kara Bridge | bridge009 | 3178489 | Tutor |
| Katrina O. | Katrina Orange | orange002 | 3162347 | STEM-PASS Tutor |
| Kayla C. | Kayla Cessna | cessna007 | 3182968 | STEM-PASS Tutor |
| Kayla T. | Kayla Tozier | tozier001 | 3135137 | Tutor |
| Khang M. | Phuc Khang Mai | mai005 | 3156592 | Tech Evangelist |
| Khanh L. | Khanh Le | le020 | 3187462 | Tutor |
| Kristen S. | Kirsten Slinkard | slinkard001 | 3176162 | STEM-PASS Tutor (SEECS Funded) |
| Lexi M. | Lexi Mobilia | mobilia006 | 3144246 | STEM-PASS Tutor |
| Makayla L. | Makayla Lynard | lynard001 | 3173946 | Tutor |
| Moira S. | Moira Stanisch | stanisch001 | 3147525 | STEM-PASS Tutor |
| Natalie H. | Natalie Holden | holden007 | 3207819 | Tutor |
| Nico H. | Nico Huynh | huynh007 | 3132939 | STEM-PASS Tutor |
| Ojus D. | Ojus Dalvi | dalvi002 | 3094955 | TBD |
| Prashriti A. | Prashriti Acharya | acharya023 | 3165884 | Tutor |
| Preshna K. | Preshna karki | karki005 | 3159596 | STEM-PASS Tutor (SEECS Funded) |
| Princess M. | Princess Mgbemena | mgbemena001 | 3174635 | STEM-PASS Tutor |
| Quoc N. | Quoc Bao Ngoc Nguyen | nguyen067 | 3188016 | Tutor |
| Rajih M. | Rajih Rajiaet Mpanga | mpanga001 | 3204917 | Tutor |
| Robert T. | Robert Anthony Tang | tang006 | 3205333 | Tutor |
| Ryan E. | Ryan Ehmann | ehmann001 | 3181706 | Tutor |
| Sarah F. | Sarah Fulton | fulton010 | 3211848 | STEM-PASS Tutor |
| Victoria W. | Victoria Wheeler | wheeler037 | 3176247 | STEM-PASS Tutor |
| Zaid A. | Zaid Abdelkarim Jamil Abbadi | abbadi001 | 3219698 | STEMBassador |
| Zoë G. | Zoë Gaetjens | gaetjens001 | 3160847 | TBD |

---

## Unmatched Tutors (9)

These tutors are in Excel but NOT in Supabase seed data (will be skipped):

| Name | Email | Position |
|------|-------|----------|
| Emily Bowers | bowers076@gannon.edu | Tutor |
| George Bailey | bailey234@gannon.edu | Tutor |
| Gonzalo Perez | perezrod001@gannon.edu | Lead Tutor |
| Julia Bukowski | bukowski011@gannon.edu | Tutor |
| Maria Mora Pena | morapena001@gannon.edu | Tech Evangelist |
| Matthew Thompson | thompson123@gannon.edu | Tutor |
| Pratham Patel | patel292@gannon.edu | Tech Evangelist |
| Roberta Ghansah | ghansah001@gannon.edu | STEMBassador |
| Robiiakhon Kuchkorova | kuchkoro001@gannon.edu | Tech Evangelist |

---

## SQL Migrations

### Step 1: Add Columns (Schema Change)

**File:** `supabase/migrations/20260405170000_add_staff_columns_to_tutors.sql`

Adds three columns to tutors table:
- username (VARCHAR(50), UNIQUE)
- student_id (VARCHAR(50), UNIQUE)
- role (VARCHAR(50), CHECK constraint)

### Step 2: Populate Data

**File:** `supabase/migrations/20260405170851_populate_staff_data_in_tutors.sql`

Contains 59 UPDATE statements to populate the new columns.

### How to Apply

**Option A: Supabase Dashboard**
1. Go to SQL Editor
2. Run migration 1: `20260405170000_add_staff_columns_to_tutors.sql`
3. Run migration 2: `20260405170851_populate_staff_data_in_tutors.sql`

**Option B: Supabase CLI**
```bash
cd nextjs-dashboard
supabase db push
```

### Verification Query

After running both migrations, verify the data:

```sql
SELECT tutor_name, username, student_id, role 
FROM tutors 
WHERE username IS NOT NULL 
ORDER BY role, tutor_name;
```

Expected result: 59 rows

---

**Last Updated:** 2026-04-05 17:08:51
