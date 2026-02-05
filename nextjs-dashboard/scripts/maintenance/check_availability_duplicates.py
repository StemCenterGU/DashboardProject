#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Check for duplicates and inconsistencies in tutor_availability table
"""

import sys
import io
import os
import requests
from dotenv import load_dotenv
from collections import defaultdict

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}'
}

print("🔍 Checking for Duplicates and Inconsistencies")
print("="*70)

# Fetch all tutor availability records
response = requests.get(
    f'{url}/rest/v1/tutor_availability?select=availability_id,tutor_id,day_of_week,start_time,end_time,is_available',
    headers=headers
)

if response.status_code != 200:
    print(f"❌ Error fetching data: {response.status_code}")
    print(f"Response: {response.text}")
    sys.exit(1)

records = response.json()

# Fetch tutors separately
tutors_response = requests.get(
    f'{url}/rest/v1/tutors?select=tutor_id,tutor_name',
    headers=headers
)
tutors_dict = {t['tutor_id']: t['tutor_name'] for t in tutors_response.json()}

# Add tutor names to records
for record in records:
    record['tutor_name'] = tutors_dict.get(record['tutor_id'], 'Unknown')

print(f"✅ Found {len(records)} total availability records\n")

# Check for duplicates (same tutor + day_of_week)
duplicates = defaultdict(list)
for record in records:
    tutor_id = record['tutor_id']
    day = record['day_of_week']
    key = (tutor_id, day)
    duplicates[key].append(record)

# Find actual duplicates
print("🔍 Checking for duplicate entries (same tutor + day)...")
duplicate_count = 0
for key, recs in duplicates.items():
    if len(recs) > 1:
        duplicate_count += 1
        tutor_name = recs[0].get('tutor_name', 'Unknown')
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        day_name = day_names[key[1]] if key[1] < 7 else f"Day {key[1]}"
        
        print(f"\n❌ DUPLICATE: {tutor_name} - {day_name}")
        for i, rec in enumerate(recs, 1):
            print(f"   Entry {i}: {rec['start_time']} - {rec['end_time']} (ID: {rec['availability_id'][:8]}...)")

if duplicate_count == 0:
    print("✅ No duplicates found!")
else:
    print(f"\n❌ Found {duplicate_count} duplicate tutor/day combinations")

# Check for inconsistencies
print(f"\n\n🔍 Checking for inconsistencies...")

# Group by tutor
by_tutor = defaultdict(list)
for record in records:
    tutor_id = record['tutor_id']
    by_tutor[tutor_id].append(record)

inconsistency_count = 0

# Check each tutor's schedule
for tutor_id, tutor_records in by_tutor.items():
    if not tutor_records:
        continue
        
    tutor_name = tutor_records[0].get('tutor_name', 'Unknown')
    
    # Check for overlapping times on same day
    by_day = defaultdict(list)
    for rec in tutor_records:
        by_day[rec['day_of_week']].append(rec)
    
    for day, day_records in by_day.items():
        if len(day_records) > 1:
            # Already reported as duplicate above
            continue
            
        # Check for invalid time ranges (end before start)
        for rec in day_records:
            start = rec['start_time']
            end = rec['end_time']
            if start and end and start >= end:
                inconsistency_count += 1
                day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                day_name = day_names[day] if day < 7 else f"Day {day}"
                print(f"❌ INVALID TIME RANGE: {tutor_name} - {day_name}: {start} - {end} (end before/equal start)")

if inconsistency_count == 0:
    print("✅ No time range inconsistencies found!")

# Summary
print(f"\n" + "="*70)
print(f"📊 Summary:")
print(f"   Total records: {len(records)}")
print(f"   Duplicates: {duplicate_count}")
print(f"   Inconsistencies: {inconsistency_count}")

if duplicate_count > 0:
    print(f"\n⚠️  Action needed: Remove duplicate entries")
    print(f"   You can delete duplicates manually or run a cleanup script")

print("="*70)
