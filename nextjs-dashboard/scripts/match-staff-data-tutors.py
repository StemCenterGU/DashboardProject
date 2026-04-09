#!/usr/bin/env python3
"""
Match Staff.xlsx data with existing Supabase tutors and generate SQL migration
Updates tutors table with username, student_id, and role fields
Only includes tutors that exist in both Excel and Supabase seed data
"""

import pandas as pd
import json
from datetime import datetime

# Existing tutors in Supabase (from seed-tutor-focuses-bulk.sql)
SUPABASE_TUTORS = [
    'Abigail T.', 'Aizirek A.', 'Alix A.', 'Avish M.', 'Bailey H.', 'Blossom A.',
    'Camryn B.', 'Chloe K.', 'Claire S.', 'Clara B.', 'Clare C', 'Claudia O.',
    'Elizabeth H.', 'Emily K.', 'Ethan W.', 'Eva S.', 'Gabriel J.', 'Glory N.',
    'Grady S.', 'Hannah P.', 'Hiver N.', 'Hope T.', 'Isaac W.', 'Izzy G.',
    'Javier M.', 'Jocelyn S.', 'Jonathan H.', 'Kara B.', 'Katrina O.', 'Kayla C.',
    'Kayla T.', 'Kensy A.', 'Khang M.', 'Khanh L.', 'Kristen S.', 'Lexi M.',
    'Lili Ú.', 'Lilly M.', 'Maddy E.', 'Makayla L.', 'Moira S.', 'My N.',
    'Natalie H.', 'Ojus D.', 'Pedro A.', 'Phuong T.', 'Prashriti A.', 'Preshna K.',
    'Princess M.', 'Quoc N.', 'Rajih M.', 'Robert T.', 'Ryan E.', 'Sarah F.',
    'Van P.', 'Victoria W.', 'Zaid A.', 'Zoë G.', 'Nico H.'
]

# Name mapping: Excel full name → Supabase abbreviated name
NAME_MAPPING = {
    'Abigail Trainor': 'Abigail T.',
    'Aizirek S. Asylbekova': 'Aizirek A.',
    'Alix Daniela Aquino Rivas': 'Alix A.',
    'Avish Maniar': 'Avish M.',
    'Bailey Hebert': 'Bailey H.',
    'Blossom Anolue': 'Blossom A.',
    'Camryn Brown': 'Camryn B.',
    'Chloe Kitagawa': 'Chloe K.',
    'Claire Stolz': 'Claire S.',
    'Clara Bourke Hurtado': 'Clara B.',
    'Clare Caulfield': 'Clare C',
    'Claudia Orte Blanch': 'Claudia O.',
    'Elizabeth Hale': 'Elizabeth H.',
    'Emily Koss': 'Emily K.',
    'Ethan Weigel': 'Ethan W.',
    'Eva Sledge': 'Eva S.',
    'Gabriel Aloysius Johnson II': 'Gabriel J.',
    'Glory Ngako': 'Glory N.',
    'Grady Smith': 'Grady S.',
    'Hannah Popovich': 'Hannah P.',
    'Hiver Ngoma': 'Hiver N.',
    'Hope Tadiwa Tele': 'Hope T.',
    'Isaac Wheeler': 'Isaac W.',
    'Isabella Gingras': 'Izzy G.',
    'Javier Mesa Mendez': 'Javier M.',
    'Jocelyn Sawicki': 'Jocelyn S.',
    'Jonathan Hansford': 'Jonathan H.',
    'Kara Bridge': 'Kara B.',
    'Katrina Orange': 'Katrina O.',
    'Kayla Cessna': 'Kayla C.',
    'Kayla Tozier': 'Kayla T.',
    'Kensy Anjeh Akem': 'Kensy A.',
    'Phuc Khang Mai': 'Khang M.',
    'Khanh Le': 'Khanh L.',
    'Kirsten Slinkard': 'Kristen S.',
    'Lexi Mobilia': 'Lexi M.',
    'Lili Újfalvi': 'Lili Ú.',
    'Lilly Mahle': 'Lilly M.',
    'Maddy Endler': 'Maddy E.',
    'Makayla Lynard': 'Makayla L.',
    'Moira Stanisch': 'Moira S.',
    'Vu Tra My Nguyen': 'My N.',
    'Natalie Holden': 'Natalie H.',
    'Ojus Dalvi': 'Ojus D.',
    'Pedro Aragon': 'Pedro A.',
    'Thuy Phuong Tran': 'Phuong T.',
    'Prashriti Acharya': 'Prashriti A.',
    'Preshna karki': 'Preshna K.',
    'Princess Mgbemena': 'Princess M.',
    'Quoc Bao Ngoc Nguyen': 'Quoc N.',
    'Rajih Rajiaet Mpanga': 'Rajih M.',
    'Robert Anthony Tang': 'Robert T.',
    'Ryan Ehmann': 'Ryan E.',
    'Sarah Fulton': 'Sarah F.',
    'Van Phan': 'Van P.',
    'Victoria Wheeler': 'Victoria W.',
    'Zaid Abdelkarim Jamil Abbadi': 'Zaid A.',
    'Zoë Gaetjens': 'Zoë G.',
    'Nico Huynh': 'Nico H.',
}

# Position to Role mapping
POSITION_TO_ROLE = {
    'Lead Tutor': 'lead_tutor',
    'Student Manager': 'manager',
    'Student Sysadmin & Project Manager': 'admin',
    'Tutor': 'tutor',
    'STEM-PASS Tutor': 'tutor',
    'STEM-PASS Tutor (SEECS Funded)': 'tutor',
    'STEMBassador': 'tutor',
    'Tech Evangelist': 'tutor',
    'TBD': 'tutor',
}

def normalize_name(name):
    """Normalize name by stripping whitespace"""
    return name.strip() if pd.notna(name) else ''

def match_tutor(excel_name):
    """Match Excel name to Supabase tutor name"""
    normalized = normalize_name(excel_name)
    return NAME_MAPPING.get(normalized)

def main():
    # Read Excel file
    print("Reading Staff.xlsx...")
    df = pd.read_excel('c:/Users/avish/Downloads/Staff.xlsx')

    print(f"Total staff in Excel: {len(df)}")

    # Track statistics
    matched_tutors = []
    unmatched_tutors = []
    role_counts = {'tutor': 0, 'lead_tutor': 0, 'manager': 0, 'admin': 0}

    # Process each row
    seen_emails = set()  # Track duplicates

    for idx, row in df.iterrows():
        email = row['Email']
        username = row['Username']
        name = normalize_name(row['Name'])
        position = row['Position']
        student_id = str(int(row['Student ID'])) if pd.notna(row['Student ID']) else ''

        # Skip duplicates (some tutors have multiple positions)
        if email in seen_emails:
            continue
        seen_emails.add(email)

        # Check if this tutor exists in Supabase
        supabase_name = match_tutor(name)

        if supabase_name and supabase_name in SUPABASE_TUTORS:
            # Map position to role
            role = POSITION_TO_ROLE.get(position, 'tutor')
            role_counts[role] += 1

            matched_tutors.append({
                'email': email,
                'username': username,
                'name': name,
                'position': position,
                'role': role,
                'student_id': student_id,
                'supabase_name': supabase_name
            })
        else:
            unmatched_tutors.append({
                'email': email,
                'username': username,
                'name': name,
                'position': position
            })

    print(f"\nMatched tutors: {len(matched_tutors)}")
    print(f"Unmatched tutors (will be skipped): {len(unmatched_tutors)}")
    print(f"\nRole distribution for matched tutors:")
    for role, count in role_counts.items():
        print(f"  {role}: {count}")

    # Generate SQL migration for tutors table
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    sql_filename = f'../supabase/migrations/{timestamp}_populate_staff_data_in_tutors.sql'

    print(f"\nGenerating SQL migration: {sql_filename}")

    with open(sql_filename, 'w', encoding='utf-8') as f:
        f.write("""-- Populate Staff Data in Tutors Table
-- Generated by: scripts/match-staff-data-tutors.py
-- Date: """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """
--
-- This migration updates username, student_id, and role fields for 59 matched tutors
-- Tutors matched by tutor_name (abbreviated) from Staff.xlsx
--
-- IMPORTANT: Run 20260405170000_add_staff_columns_to_tutors.sql FIRST
--            to add the username, student_id, and role columns
--
-- Position Mapping:
--   Lead Tutor → lead_tutor
--   Student Manager → manager
--   Student Sysadmin & Project Manager → admin
--   All other positions → tutor
--

""")

        f.write(f"-- Total tutors to update: {len(matched_tutors)}\n")
        f.write(f"-- Role breakdown: {role_counts}\n\n")

        # Group by role for cleaner SQL
        for role in ['admin', 'manager', 'lead_tutor', 'tutor']:
            role_tutors = [t for t in matched_tutors if t['role'] == role]
            if not role_tutors:
                continue

            f.write(f"\n-- ============================================\n")
            f.write(f"-- Update {role.upper()} role ({len(role_tutors)} people)\n")
            f.write(f"-- ============================================\n\n")

            for tutor in role_tutors:
                f.write(f"-- {tutor['name']} ({tutor['position']})\n")
                f.write(f"UPDATE tutors\n")
                f.write(f"SET username = '{tutor['username']}',\n")
                f.write(f"    student_id = '{tutor['student_id']}',\n")
                f.write(f"    role = '{role}'\n")
                f.write(f"WHERE tutor_name = '{tutor['supabase_name']}';\n\n")

        f.write(f"\n-- ============================================\n")
        f.write(f"-- Summary\n")
        f.write(f"-- ============================================\n")
        f.write(f"-- Total updates: {len(matched_tutors)}\n")
        f.write(f"-- Admin: {role_counts['admin']}\n")
        f.write(f"-- Manager: {role_counts['manager']}\n")
        f.write(f"-- Lead Tutor: {role_counts['lead_tutor']}\n")
        f.write(f"-- Tutor: {role_counts['tutor']}\n\n")

        f.write(f"-- Verification query\n")
        f.write(f"-- Run this after migration to verify updates:\n")
        f.write(f"-- SELECT tutor_name, username, student_id, role FROM tutors WHERE username IS NOT NULL ORDER BY role, tutor_name;\n")

    # Generate summary report
    report_filename = '../docs/TUTORS-SYNC-REPORT.md'
    print(f"Generating summary report: {report_filename}")

    with open(report_filename, 'w', encoding='utf-8') as f:
        f.write(f"""# Tutors Table Staff Data Sync Report

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Source:** Staff.xlsx
**Script:** scripts/match-staff-data-tutors.py
**Target:** tutors table (NOT users table)

---

## Summary

- ✅ **Matched tutors:** {len(matched_tutors)} (will be synced)
- ❌ **Unmatched tutors:** {len(unmatched_tutors)} (skipped)
- 📊 **Total in Excel:** {len(df)} staff members

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
| Admin | {role_counts['admin']} | Student Sysadmin & Project Manager |
| Manager | {role_counts['manager']} | Student Manager |
| Lead Tutor | {role_counts['lead_tutor']} | Lead Tutor |
| Tutor | {role_counts['tutor']} | All other positions |
| **Total** | **{len(matched_tutors)}** | |

---

## Matched Tutors ({len(matched_tutors)})

These tutors exist in both Excel and Supabase and will be synced:

""")

        # Group matched by role
        for role in ['admin', 'manager', 'lead_tutor', 'tutor']:
            role_tutors = [t for t in matched_tutors if t['role'] == role]
            if not role_tutors:
                continue

            f.write(f"\n### {role.replace('_', ' ').title()} ({len(role_tutors)})\n\n")
            f.write(f"| Tutor Name | Full Name | Username | Student ID | Position |\n")
            f.write(f"|------------|-----------|----------|------------|----------|\n")

            for tutor in sorted(role_tutors, key=lambda x: x['supabase_name']):
                f.write(f"| {tutor['supabase_name']} | {tutor['name']} | {tutor['username']} | {tutor['student_id']} | {tutor['position']} |\n")

        f.write(f"\n---\n\n## Unmatched Tutors ({len(unmatched_tutors)})\n\n")
        f.write("These tutors are in Excel but NOT in Supabase seed data (will be skipped):\n\n")
        f.write(f"| Name | Email | Position |\n")
        f.write(f"|------|-------|----------|\n")

        for tutor in sorted(unmatched_tutors, key=lambda x: x['name']):
            f.write(f"| {tutor['name']} | {tutor['email']} | {tutor['position']} |\n")

        f.write(f"\n---\n\n## SQL Migrations\n\n")
        f.write(f"### Step 1: Add Columns (Schema Change)\n\n")
        f.write(f"**File:** `supabase/migrations/20260405170000_add_staff_columns_to_tutors.sql`\n\n")
        f.write(f"Adds three columns to tutors table:\n")
        f.write(f"- username (VARCHAR(50), UNIQUE)\n")
        f.write(f"- student_id (VARCHAR(50), UNIQUE)\n")
        f.write(f"- role (VARCHAR(50), CHECK constraint)\n\n")

        f.write(f"### Step 2: Populate Data\n\n")
        f.write(f"**File:** `supabase/migrations/{timestamp}_populate_staff_data_in_tutors.sql`\n\n")
        f.write(f"Contains {len(matched_tutors)} UPDATE statements to populate the new columns.\n\n")

        f.write(f"### How to Apply\n\n")
        f.write(f"**Option A: Supabase Dashboard**\n")
        f.write(f"1. Go to SQL Editor\n")
        f.write(f"2. Run migration 1: `20260405170000_add_staff_columns_to_tutors.sql`\n")
        f.write(f"3. Run migration 2: `{timestamp}_populate_staff_data_in_tutors.sql`\n\n")

        f.write(f"**Option B: Supabase CLI**\n")
        f.write(f"```bash\n")
        f.write(f"cd nextjs-dashboard\n")
        f.write(f"supabase db push\n")
        f.write(f"```\n\n")

        f.write(f"### Verification Query\n\n")
        f.write(f"After running both migrations, verify the data:\n\n")
        f.write(f"```sql\n")
        f.write(f"SELECT tutor_name, username, student_id, role \n")
        f.write(f"FROM tutors \n")
        f.write(f"WHERE username IS NOT NULL \n")
        f.write(f"ORDER BY role, tutor_name;\n")
        f.write(f"```\n\n")
        f.write(f"Expected result: {len(matched_tutors)} rows\n\n")

        f.write(f"---\n\n")
        f.write(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    print(f"\nDone!")
    print(f"\nGenerated files:")
    print(f"  1. {sql_filename}")
    print(f"  2. {report_filename}")
    print(f"\nNext steps:")
    print(f"  1. Run migration 1: 20260405170000_add_staff_columns_to_tutors.sql (adds columns)")
    print(f"  2. Run migration 2: {timestamp}_populate_staff_data_in_tutors.sql (populates data)")
    print(f"  3. Check the summary report for details")

if __name__ == '__main__':
    main()
