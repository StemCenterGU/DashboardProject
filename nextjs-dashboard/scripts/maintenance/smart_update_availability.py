#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Smart Update Tutor Availability
Analyzes available_slots and correctly handles split shifts (gaps in schedule)
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

print("📊 Smart Updating Tutor Availability (Handling Split Shifts)")
print("="*70)

# Date range to analyze
start_date = '2026-01-25'
end_date = '2026-01-30'

print(f"\n📅 Analyzing schedule from {start_date} to {end_date}...")

# Fetch all available slots
response = requests.get(
    f'{url}/rest/v1/available_slots?slot_date=gte.{start_date}&slot_date=lte.{end_date}&select=tutor_id,slot_date,start_time,end_time',
    headers=headers
)

slots = response.json()
print(f"✅ Found {len(slots)} total slots")

# Fetch tutors for names
tutors_response = requests.get(f'{url}/rest/v1/tutors?select=tutor_id,tutor_name', headers=headers)
tutors_dict = {t['tutor_id']: t['tutor_name'] for t in tutors_response.json()}

# Group slots by tutor and day of week
tutor_schedules = defaultdict(lambda: defaultdict(list))

for slot in slots:
    tutor_id = slot['tutor_id']
    tutor_name = tutors_dict.get(tutor_id, 'Unknown')
    slot_date = datetime.strptime(slot['slot_date'], '%Y-%m-%d')
    day_of_week = slot_date.strftime('%A')
    
    tutor_schedules[tutor_id][day_of_week].append({
        'start': slot['start_time'],
        'end': slot['end_time'],
        'tutor_name': tutor_name
    })

print(f"✅ Analyzed schedules for {len(tutor_schedules)} tutors", flush=True)

# Function to merge continuous slots and identify gaps
def get_continuous_blocks(slots):
    if not slots:
        return []
    
    # Sort by start time
    sorted_slots = sorted(slots, key=lambda x: x['start'])
    
    blocks = []
    if not sorted_slots:
        return blocks
        
    current_block_start = sorted_slots[0]['start']
    current_block_end = sorted_slots[0]['end']
    
    for i in range(1, len(sorted_slots)):
        next_slot = sorted_slots[i]
        
        # Check if continuous (allowing for discrepancies like seconds)
        # Convert to datetime for comparison
        curr_end_dt = datetime.strptime(current_block_end, '%H:%M:%S')
        next_start_dt = datetime.strptime(next_slot['start'], '%H:%M:%S')
        
        # If gap is less than 5 minutes, consider it continuous
        gap = (next_start_dt - curr_end_dt).total_seconds()
        
        if gap <= 300: # 5 minutes tolerance
            # Extend current block
            current_block_end = next_slot['end']
        else:
            # Gap detected! Save current block and start new one
            blocks.append((current_block_start, current_block_end))
            current_block_start = next_slot['start']
            current_block_end = next_slot['end']
            
    # Add final block
    blocks.append((current_block_start, current_block_end))
    return blocks

# Update database
print(f"\n💾 Updating database with correct split shifts...")

day_mapping = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
}

updated_count = 0
failed_count = 0

for tutor_id, weekly_schedule in tutor_schedules.items():
    tutor_name = tutors_dict.get(tutor_id, 'Unknown')
    
    for day_name, time_slots in weekly_schedule.items():
        day_num = day_mapping.get(day_name)
        
        # Calculate correct blocks
        blocks = get_continuous_blocks(time_slots)
        
        # Delete existing availability for this tutor/day
        try:
            del_resp = requests.delete(
                f'{url}/rest/v1/tutor_availability?tutor_id=eq.{tutor_id}&day_of_week=eq.{day_num}',
                headers=headers
            )
        except Exception as e:
            print(f"  ❌ Error clearing old data for {tutor_name}: {e}")
            continue
            
        # Insert new blocks
        for start, end in blocks:
            data = {
                'tutor_id': tutor_id,
                'day_of_week': day_num,
                'start_time': start,
                'end_time': end,
                'is_available': True
            }
            
            try:
                resp = requests.post(f'{url}/rest/v1/tutor_availability', headers=headers, json=data)
                if resp.status_code in [200, 201]:
                    updated_count += 1
                else:
                    failed_count += 1
                    print(f"  ❌ Failed: {tutor_name} - {day_name} ({start}-{end})")
            except Exception as e:
                failed_count += 1
                print(f"  ❌ Error: {e}")
        
        # Log split shifts specifically
        if len(blocks) > 1:
            print(f"  ✅ {tutor_name} - {day_name}: Created {len(blocks)} split blocks")
            for s, e in blocks:
                print(f"     - {s} to {e}")

print(f"\n" + "="*70)
print(f"✅ Summary:")
print(f"   Created: {updated_count} availability records")
print(f"   Failed: {failed_count}")
print(f"✅ Split shifts correctly handled!")
print("="*70)
