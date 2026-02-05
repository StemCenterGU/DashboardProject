#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
import os
import requests
from dotenv import load_dotenv

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

# Check slots for 2026-01-25
print("📊 Checking available_slots for 2026-01-25...")
response = requests.get(
    f'{url}/rest/v1/available_slots?slot_date=eq.2026-01-25&select=slot_id,tutor_id,start_time,end_time,source',
    headers=headers
)

slots = response.json()
print(f"\n✅ Total slots found: {len(slots)}")

if len(slots) > 0:
    print(f"\n📋 Sample slots (first 10):")
    for i, slot in enumerate(slots[:10], 1):
        print(f"  {i}. {slot['start_time']} - {slot['end_time']} | Tutor: {slot['tutor_id'][:8]}... | Source: {slot['source']}")

# Check tutors
print("\n\n👥 Checking tutors table...")
response = requests.get(
    f'{url}/rest/v1/tutors?select=tutor_id,tutor_name',
    headers=headers
)

tutors = response.json()
print(f"✅ Total tutors: {len(tutors)}")

if len(tutors) > 0:
    print(f"\n📋 Sample tutors (first 10):")
    for i, tutor in enumerate(tutors[:10], 1):
        print(f"  {i}. {tutor['tutor_name']}")

# Check which tutors have slots for 2026-01-25
print("\n\n🔍 Tutors with slots on 2026-01-25:")
tutor_ids_with_slots = set(slot['tutor_id'] for slot in slots)
tutors_with_slots = [t for t in tutors if t['tutor_id'] in tutor_ids_with_slots]
print(f"✅ {len(tutors_with_slots)} tutors have slots on 2026-01-25")

for i, tutor in enumerate(sorted(tutors_with_slots, key=lambda x: x['tutor_name'])[:20], 1):
    tutor_slot_count = len([s for s in slots if s['tutor_id'] == tutor['tutor_id']])
    print(f"  {i}. {tutor['tutor_name']}: {tutor_slot_count} slots")
