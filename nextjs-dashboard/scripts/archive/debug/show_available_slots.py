#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
import os
import requests
from dotenv import load_dotenv
import json

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

print("📊 AVAILABLE_SLOTS TABLE - Data for 2026-01-25")
print("="*70)

# Get slots with tutor info
response = requests.get(
    f'{url}/rest/v1/available_slots?slot_date=eq.2026-01-25&select=*&order=start_time,tutor_id',
    headers=headers
)

slots = response.json()
print(f"\n✅ Total slots in available_slots table: {len(slots)}")

if len(slots) > 0:
    print(f"\n📋 Sample slot data (first 3 slots):")
    for i, slot in enumerate(slots[:3], 1):
        print(f"\n  Slot {i}:")
        print(f"    slot_id: {slot['slot_id']}")
        print(f"    tutor_id: {slot['tutor_id']}")
        print(f"    slot_date: {slot['slot_date']}")
        print(f"    start_time: {slot['start_time']}")
        print(f"    end_time: {slot['end_time']}")
        print(f"    is_booked: {slot['is_booked']}")
        print(f"    source: {slot['source']}")

# Get slots with tutor names joined
print("\n\n📊 SLOTS WITH TUTOR NAMES")
print("="*70)

response = requests.get(
    f'{url}/rest/v1/available_slots?slot_date=eq.2026-01-25&select=slot_id,slot_date,start_time,end_time,is_booked,source,tutors(tutor_name)&order=start_time',
    headers=headers
)

slots_with_tutors = response.json()

if len(slots_with_tutors) > 0:
    # Group by time
    from collections import defaultdict
    by_time = defaultdict(list)
    
    for slot in slots_with_tutors:
        time = slot['start_time']
        tutor_name = slot['tutors']['tutor_name'] if slot.get('tutors') else 'Unknown'
        by_time[time].append(tutor_name)
    
    print(f"\n⏰ Slots by time:")
    for time in sorted(by_time.keys()):
        tutors = by_time[time]
        print(f"\n  {time}:")
        print(f"    {len(tutors)} tutors available")
        for tutor in sorted(tutors):
            print(f"      - {tutor}")

# Show table structure
print("\n\n📋 TABLE STRUCTURE")
print("="*70)
print("""
Table: available_slots

Columns:
  - slot_id (UUID, Primary Key)
  - tutor_id (UUID, Foreign Key → tutors.tutor_id)
  - slot_date (DATE)
  - start_time (TIME)
  - end_time (TIME)
  - is_booked (BOOLEAN, default: false)
  - source (VARCHAR, default: 'wconline')
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

Unique Constraint: (tutor_id, slot_date, start_time, end_time)
""")

print("\n✅ All slots are stored in: available_slots table")
print("✅ Tutors are stored in: tutors table")
print("✅ Relationship: available_slots.tutor_id → tutors.tutor_id")
