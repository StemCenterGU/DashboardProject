#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verify split shifts for Avish M. on Tuesday
"""

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

print("🔍 Checking Avish M.'s Tuesday Schedule")
print("="*70)

# 1. Find Avish M's ID
response = requests.get(f'{url}/rest/v1/tutors?tutor_name=ilike.Avish M*&select=tutor_id,tutor_name', headers=headers)
tutors = response.json()
if not tutors:
    print("❌ Tutor not found")
    sys.exit(1)

tutor_id = tutors[0]['tutor_id']
tutor_name = tutors[0]['tutor_name']
print(f"✅ Found tutor: {tutor_name} (ID: {tutor_id})")

# 2. Get available slots for Tuesday (Jan 27, 2026 is a Tuesday)
date = '2026-01-27'
print(f"\n📊 Available Slots on {date} (Tuesday):")
response = requests.get(
    f'{url}/rest/v1/available_slots?tutor_id=eq.{tutor_id}&slot_date=eq.{date}&select=start_time,end_time&order=start_time',
    headers=headers
)
slots = response.json()

for slot in slots:
    print(f"  - {slot['start_time']} to {slot['end_time']}")

# 3. Get current availability record
print(f"\n📋 Current Availability Record in tutor_availability table:")
# Tuesday is day 2
response = requests.get(
    f'{url}/rest/v1/tutor_availability?tutor_id=eq.{tutor_id}&day_of_week=eq.2&select=start_time,end_time',
    headers=headers
)
avail_records = response.json()

for rec in avail_records:
    print(f"  - {rec['start_time']} to {rec['end_time']}")

print("\n" + "="*70)
print("Analysis:")
if len(avail_records) == 1 and len(slots) > 1:
    # Check for gaps
    has_gap = False
    sorted_slots = sorted(slots, key=lambda x: x['start_time'])
    for i in range(len(sorted_slots) - 1):
        current_end = sorted_slots[i]['end_time']
        next_start = sorted_slots[i+1]['start_time']
        if current_end != next_start:
            print(f"⚠️  GAP DETECTED: {current_end} to {next_start}")
            has_gap = True
    
    if has_gap:
        print("❌ Current record incorrectly merges split shifts!")
    else:
        print("✅ Continuous shift, single record is correct.")
