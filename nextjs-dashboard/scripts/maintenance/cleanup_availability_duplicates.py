#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Clean up duplicate entries in tutor_availability table
Keeps the entry with the widest time range for each tutor/day combination
"""

import sys
import io
import os
import requests
from dotenv import load_dotenv
from collections import defaultdict
from datetime import datetime, timedelta

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

print("🧹 Cleaning Up Duplicate Tutor Availability Entries")
print("="*70)

# Fetch all tutor availability records
response = requests.get(
    f'{url}/rest/v1/tutor_availability?select=availability_id,tutor_id,day_of_week,start_time,end_time,is_available',
    headers=headers
)

records = response.json()

# Fetch tutors for names
tutors_response = requests.get(
    f'{url}/rest/v1/tutors?select=tutor_id,tutor_name',
    headers=headers
)
tutors_dict = {t['tutor_id']: t['tutor_name'] for t in tutors_response.json()}

# Add tutor names
for record in records:
    record['tutor_name'] = tutors_dict.get(record['tutor_id'], 'Unknown')

print(f"✅ Found {len(records)} total availability records\n")

# Group by tutor + day
duplicates = defaultdict(list)
for record in records:
    key = (record['tutor_id'], record['day_of_week'])
    duplicates[key].append(record)

# Find and resolve duplicates
deleted_count = 0
kept_count = 0

day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

for key, recs in duplicates.items():
    if len(recs) <= 1:
        continue  # No duplicates
    
    tutor_name = recs[0]['tutor_name']
    day_name = day_names[key[1]] if key[1] < 7 else f"Day {key[1]}"
    
    print(f"\n🔍 Processing duplicates for: {tutor_name} - {day_name}")
    print(f"   Found {len(recs)} entries:")
    
    # Calculate duration for each record
    for rec in recs:
        start = datetime.strptime(rec['start_time'], '%H:%M:%S')
        end = datetime.strptime(rec['end_time'], '%H:%M:%S')
        duration = (end - start).total_seconds() / 3600  # hours
        rec['duration'] = duration
        print(f"   - {rec['start_time']} to {rec['end_time']} ({duration:.1f}h) [ID: {rec['availability_id'][:8]}...]")
    
    # Keep the one with the longest duration (most comprehensive)
    # If durations are equal, keep the one with earliest start time
    recs_sorted = sorted(recs, key=lambda x: (-x['duration'], x['start_time']))
    keep_record = recs_sorted[0]
    delete_records = recs_sorted[1:]
    
    print(f"   ✅ Keeping: {keep_record['start_time']} to {keep_record['end_time']} ({keep_record['duration']:.1f}h)")
    kept_count += 1
    
    # Delete the duplicates
    for rec in delete_records:
        try:
            delete_response = requests.delete(
                f'{url}/rest/v1/tutor_availability?availability_id=eq.{rec["availability_id"]}',
                headers=headers
            )
            if delete_response.status_code in [200, 204]:
                print(f"   🗑️  Deleted: {rec['start_time']} to {rec['end_time']} [ID: {rec['availability_id'][:8]}...]")
                deleted_count += 1
            else:
                print(f"   ❌ Failed to delete: {rec['availability_id'][:8]}... - {delete_response.status_code}")
        except Exception as e:
            print(f"   ❌ Error deleting {rec['availability_id'][:8]}...: {e}")

print(f"\n" + "="*70)
print(f"✅ Cleanup Complete!")
print(f"   Deleted: {deleted_count} duplicate entries")
print(f"   Kept: {kept_count} unique tutor/day combinations")
print(f"   Remaining records: {len(records) - deleted_count}")
print("="*70)
