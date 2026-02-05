#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Update Tutor Availability Table
Analyzes available_slots data to determine each tutor's weekly recurring schedule
and updates the tutor_availability table
"""

import sys
import io
import os
import requests
from dotenv import load_dotenv
from collections import defaultdict
from datetime import datetime

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
    'Content-Type': 'application/json'
}

print("📊 Updating Tutor Availability Table from Latest Schedule")
print("="*70)

# Date range to analyze
start_date = '2026-01-25'
end_date = '2026-01-30'

print(f"\n📅 Analyzing schedule from {start_date} to {end_date}...")

# Fetch all available slots for the date range
print(f"Querying: {url}/rest/v1/available_slots?slot_date=gte.{start_date}&slot_date=lte.{end_date}")
response = requests.get(
    f'{url}/rest/v1/available_slots?slot_date=gte.{start_date}&slot_date=lte.{end_date}&select=tutor_id,slot_date,start_time,end_time',
    headers=headers
)

print(f"Response status: {response.status_code}")
slots = response.json()
print(f"✅ Found {len(slots)} total slots")

if len(slots) == 0:
    print("⚠️  No slots found! Check if data exists in available_slots table.")
    sys.exit(0)

# Fetch all tutors to get names
tutors_response = requests.get(
    f'{url}/rest/v1/tutors?select=tutor_id,tutor_name',
    headers=headers
)
tutors_dict = {t['tutor_id']: t['tutor_name'] for t in tutors_response.json()}

# Group slots by tutor and day of week
tutor_schedules = defaultdict(lambda: defaultdict(list))

for slot in slots:
    tutor_id = slot['tutor_id']
    tutor_name = tutors_dict.get(tutor_id, 'Unknown')
    slot_date = datetime.strptime(slot['slot_date'], '%Y-%m-%d')
    day_of_week = slot_date.strftime('%A')  # Monday, Tuesday, etc.
    start_time = slot['start_time']
    end_time = slot['end_time']
    
    # Store time slot for this tutor on this day
    tutor_schedules[tutor_id][day_of_week].append({
        'start_time': start_time,
        'end_time': end_time,
        'tutor_name': tutor_name
    })

print(f"✅ Analyzed schedules for {len(tutor_schedules)} tutors")

# Now update tutor_availability table
print(f"\n💾 Updating tutor_availability table...")

updated_count = 0
created_count = 0
failed_count = 0

for tutor_id, weekly_schedule in tutor_schedules.items():
    tutor_name = None
    
    # Process each day of the week
    for day_name, time_slots in weekly_schedule.items():
        if not time_slots:
            continue
            
        tutor_name = time_slots[0]['tutor_name']
        
        # Combine all time slots for this day
        # Sort by start time
        time_slots_sorted = sorted(time_slots, key=lambda x: x['start_time'])
        
        # For simplicity, we'll store the earliest start and latest end
        earliest_start = time_slots_sorted[0]['start_time']
        latest_end = time_slots_sorted[-1]['end_time']
        
        # Map day name to day number (0=Sunday, 1=Monday, etc.)
        day_mapping = {
            'Sunday': 0,
            'Monday': 1,
            'Tuesday': 2,
            'Wednesday': 3,
            'Thursday': 4,
            'Friday': 5,
            'Saturday': 6
        }
        day_of_week = day_mapping.get(day_name)
        
        # Check if this availability already exists
        check_response = requests.get(
            f'{url}/rest/v1/tutor_availability?tutor_id=eq.{tutor_id}&day_of_week=eq.{day_of_week}',
            headers=headers
        )
        
        existing = check_response.json()
        
        availability_data = {
            'tutor_id': tutor_id,
            'day_of_week': day_of_week,
            'start_time': earliest_start,
            'end_time': latest_end,
            'is_available': True
        }
        
        try:
            if existing and len(existing) > 0:
                # Update existing record
                availability_id = existing[0]['availability_id']
                response = requests.patch(
                    f'{url}/rest/v1/tutor_availability?availability_id=eq.{availability_id}',
                    headers=headers,
                    json=availability_data
                )
                if response.status_code in [200, 204]:
                    updated_count += 1
                    print(f"  ✅ Updated: {tutor_name} - {day_name} ({earliest_start}-{latest_end})")
                else:
                    failed_count += 1
                    print(f"  ❌ Failed to update: {tutor_name} - {day_name}")
            else:
                # Create new record
                response = requests.post(
                    f'{url}/rest/v1/tutor_availability',
                    headers=headers,
                    json=availability_data
                )
                if response.status_code in [200, 201]:
                    created_count += 1
                    print(f"  ✅ Created: {tutor_name} - {day_name} ({earliest_start}-{latest_end})")
                else:
                    failed_count += 1
                    print(f"  ❌ Failed to create: {tutor_name} - {day_name} - {response.text[:100]}")
        except Exception as e:
            failed_count += 1
            print(f"  ❌ Error: {tutor_name} - {day_name}: {e}")

print(f"\n" + "="*70)
print(f"✅ Summary:")
print(f"   Created: {created_count} new availability records")
print(f"   Updated: {updated_count} existing records")
if failed_count > 0:
    print(f"   ❌ Failed: {failed_count} records")
print(f"\n✅ Tutor availability table updated with latest schedule!")
print("="*70)
