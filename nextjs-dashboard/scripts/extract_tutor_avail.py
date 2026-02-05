#!/usr/bin/env python3
"""
Extract tutor availability from Jan 25-30 data (available_slots + appointments)
and populate the tutor_availability table.
PROPERLY handles non-contiguous shifts (e.g., 2-4 and 6-8 as separate records)
"""
import requests
import os
import sys
from collections import defaultdict
from datetime import datetime, timedelta

# Fix Windows console encoding
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except:
        pass

from dotenv import load_dotenv
load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}

def time_to_minutes(time_str):
    """Convert HH:MM:SS to minutes since midnight"""
    parts = time_str.split(':')
    return int(parts[0]) * 60 + int(parts[1])

def minutes_to_time(minutes):
    """Convert minutes since midnight to HH:MM:SS"""
    h = minutes // 60
    m = minutes % 60
    return f"{h:02d}:{m:02d}:00"

def merge_contiguous_slots(time_slots):
    """
    Merge only contiguous time slots, keeping gaps separate.
    Returns list of (start, end) tuples for each contiguous block.
    """
    if not time_slots:
        return []
    
    # Convert to minutes and sort
    slots_minutes = []
    for start, end in time_slots:
        s = time_to_minutes(start)
        e = time_to_minutes(end)
        slots_minutes.append((s, e))
    
    slots_minutes.sort(key=lambda x: x[0])
    
    # Merge only contiguous/overlapping slots
    merged = []
    current_start, current_end = slots_minutes[0]
    
    for start, end in slots_minutes[1:]:
        # If this slot starts at or before current end, it's contiguous/overlapping
        if start <= current_end:
            current_end = max(current_end, end)
        else:
            # Gap found - save current block and start new one
            merged.append((current_start, current_end))
            current_start, current_end = start, end
    
    # Don't forget the last block
    merged.append((current_start, current_end))
    
    # Convert back to time strings
    result = []
    for start_min, end_min in merged:
        result.append((minutes_to_time(start_min), minutes_to_time(end_min)))
    
    return result

print("="*70)
print("[*] Extracting Tutor Availability from Jan 25-30 Data")
print("[*] PROPERLY handling non-contiguous shifts")
print("="*70)

# Step 1: Clear existing tutor_availability table
print("\n[>] Clearing existing tutor_availability table...")
r = requests.delete(
    f'{url}/rest/v1/tutor_availability?is_available=not.is.null',
    headers=headers
)
if r.status_code in [200, 204]:
    print("[OK] Cleared tutor_availability table")
else:
    print(f"[!] Warning: Could not clear table: {r.status_code}")

# Step 2: Fetch available_slots from Jan 25-30
print("\n[>] Fetching available_slots data (Jan 25-30)...")
r = requests.get(
    f'{url}/rest/v1/available_slots?slot_date=gte.2026-01-25&slot_date=lte.2026-01-30&select=tutor_id,slot_date,start_time,end_time',
    headers=headers
)
available_slots = r.json() if r.status_code == 200 else []
print(f"[OK] Found {len(available_slots)} available slots")

# Step 3: Fetch appointments from Jan 25-30
print("\n[>] Fetching appointments data (Jan 25-30)...")
r = requests.get(
    f'{url}/rest/v1/appointments?appointment_date=gte.2026-01-25&appointment_date=lte.2026-01-30&select=tutor_id,appointment_date,start_time,end_time',
    headers=headers
)
appointments = r.json() if r.status_code == 200 else []
print(f"[OK] Found {len(appointments)} appointments")

# Step 4: Get tutor names
print("\n[>] Fetching tutor names...")
r = requests.get(f'{url}/rest/v1/tutors?select=tutor_id,tutor_name', headers=headers)
tutors = {t['tutor_id']: t['tutor_name'] for t in r.json()}
print(f"[OK] Found {len(tutors)} tutors")

# Step 5: Combine data and extract weekly patterns
print("\n[>] Extracting weekly patterns (preserving gaps)...")

# Collect all time slots per tutor per day of week
# {tutor_id: {day_of_week: [(start, end), ...]}}
tutor_schedules = defaultdict(lambda: defaultdict(list))

day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

# Process available slots
for slot in available_slots:
    tutor_id = slot['tutor_id']
    slot_date = datetime.strptime(slot['slot_date'], '%Y-%m-%d')
    # Python weekday: Monday=0, Sunday=6
    # Convert to: Sunday=0, Monday=1, etc.
    py_weekday = slot_date.weekday()
    day_of_week = (py_weekday + 1) % 7  # Sunday=0
    
    start = slot['start_time']
    end = slot['end_time']
    tutor_schedules[tutor_id][day_of_week].append((start, end))

# Process appointments (they also represent when tutor is available)
for appt in appointments:
    tutor_id = appt['tutor_id']
    appt_date = datetime.strptime(appt['appointment_date'], '%Y-%m-%d')
    py_weekday = appt_date.weekday()
    day_of_week = (py_weekday + 1) % 7
    
    start = appt['start_time']
    end = appt['end_time']
    tutor_schedules[tutor_id][day_of_week].append((start, end))

print(f"[OK] Found schedules for {len(tutor_schedules)} tutors")

# Step 6: Insert into tutor_availability (with proper gap handling)
print("\n[>] Inserting into tutor_availability table...")

created_count = 0
failed_count = 0

for tutor_id, weekly_schedule in tutor_schedules.items():
    tutor_name = tutors.get(tutor_id, 'Unknown')
    
    for day_of_week, time_slots in weekly_schedule.items():
        if not time_slots:
            continue
        
        # Merge only contiguous slots, keeping gaps separate
        merged_blocks = merge_contiguous_slots(time_slots)
        
        day_name = day_names[day_of_week]
        
        for start_time, end_time in merged_blocks:
            availability_data = {
                'tutor_id': tutor_id,
                'day_of_week': day_of_week,
                'start_time': start_time,
                'end_time': end_time,
                'is_available': True
            }
            
            try:
                response = requests.post(
                    f'{url}/rest/v1/tutor_availability',
                    headers=headers,
                    json=availability_data
                )
                
                if response.status_code in [200, 201]:
                    created_count += 1
                    print(f"  [OK] {tutor_name} - {day_name} ({start_time}-{end_time})")
                else:
                    failed_count += 1
                    print(f"  [X] Failed: {tutor_name} - {day_name}: {response.text[:50]}")
            except Exception as e:
                failed_count += 1
                print(f"  [X] Error: {tutor_name} - {e}")

print("\n" + "="*70)
print("[OK] Complete!")
print("="*70)
print(f"\n[*] Summary:")
print(f"   Created: {created_count} availability records")
if failed_count > 0:
    print(f"   Failed: {failed_count} records")
print(f"   Tutors: {len(tutor_schedules)}")
