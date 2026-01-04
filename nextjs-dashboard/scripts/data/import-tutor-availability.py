#!/usr/bin/env python3
"""
Import Tutor Availability Schedule to Supabase
Parses the tutor availability schedule and inserts into tutor_availability table
"""

import requests
import sys
import os
import re
from datetime import datetime
from pathlib import Path

# Try to load supabase-py, fallback to direct API calls if not available
try:
    from supabase import create_client, Client
    HAS_SUPABASE_PY = True
except ImportError:
    HAS_SUPABASE_PY = False
    print("⚠️  supabase-py not installed. Install with: pip install supabase")
    print("   Will use direct HTTP requests instead")

# ============================================================================
# CONFIGURATION
# ============================================================================
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except:
    pass

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

def get_supabase_client():
    """Get Supabase client"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Supabase credentials not found!")
        print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        return None
    
    if HAS_SUPABASE_PY:
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            return supabase
        except Exception as e:
            print(f"❌ Error creating Supabase client: {e}")
            return None
    else:
        return {'url': SUPABASE_URL, 'key': SUPABASE_KEY, 'use_http': True}

def convert_to_24_hour(time_str):
    """Convert 12-hour time to 24-hour format"""
    if not time_str:
        return None
    
    time_str = str(time_str).strip().upper()
    
    # If already in 24-hour format (HH:MM)
    if re.match(r'^\d{1,2}:\d{2}$', time_str):
        parts = time_str.split(':')
        return f"{int(parts[0]):02d}:{parts[1]}"
    
    # Parse 12-hour format
    match = re.search(r'(\d{1,2}):(\d{2})\s*(AM|PM)', time_str)
    if match:
        hours = int(match.group(1))
        minutes = match.group(2)
        period = match.group(3)
        
        if period == 'PM' and hours != 12:
            hours += 12
        elif period == 'AM' and hours == 12:
            hours = 0
        
        return f"{hours:02d}:{minutes}"
    
    return None

def day_name_to_number(day_name):
    """Convert day name to number (Sunday=0, Monday=1, ..., Saturday=6)"""
    day_map = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
    }
    return day_map.get(day_name.lower(), None)

def find_tutor_id_by_name(supabase, tutor_name):
    """Find tutor_id by tutor_name from simplified tutors table (tutor_id UUID, tutor_name)"""
    try:
        # Always use HTTP requests
        url = SUPABASE_URL
        key = SUPABASE_KEY
        
        if not url or not key:
            print(f"      ❌ Missing Supabase credentials")
            return None
        
        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json'
        }
        
        # Try exact match first
        import urllib.parse
        encoded_name = urllib.parse.quote(tutor_name)
        response = requests.get(
            f"{url}/rest/v1/tutors?tutor_name=eq.{encoded_name}&select=tutor_id",
            headers=headers
        )
        
        if response.status_code == 200 and response.json():
            tutor_id = response.json()[0]['tutor_id']
            return tutor_id
        
        # Try case-insensitive match
        response = requests.get(
            f"{url}/rest/v1/tutors?tutor_name=ilike.{encoded_name}&select=tutor_id,tutor_name&limit=10",
            headers=headers
        )
        
        if response.status_code == 200 and response.json():
            for tutor in response.json():
                db_name = tutor.get('tutor_name', '')
                # Exact case-insensitive match
                if tutor_name.lower() == db_name.lower():
                    return tutor.get('tutor_id')
                # Partial match (handle variations like "Aizirek A" vs "Aizirek")
                if tutor_name.lower() in db_name.lower() or db_name.lower() in tutor_name.lower():
                    return tutor.get('tutor_id')
        
        return None
    except Exception as e:
        print(f"      ❌ Error finding tutor {tutor_name}: {e}")
        return None

def parse_schedule_text(schedule_text):
    """Parse the schedule text and return list of tutor schedules"""
    tutors = []
    current_tutor = None
    
    lines = schedule_text.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check if this is a tutor name line (ends with ':')
        if line.endswith(':'):
            if current_tutor:
                tutors.append(current_tutor)
            current_tutor = {
                'name': line[:-1].strip(),
                'schedules': []
            }
        elif current_tutor and line.startswith('-'):
            # Parse schedule line: "- Monday 02:00PM - 04:00PM"
            match = re.search(r'-\s*(\w+)\s+(\d{1,2}:\d{2}(?:AM|PM)?)\s*-\s*(\d{1,2}:\d{2}(?:AM|PM)?)', line, re.IGNORECASE)
            if match:
                day_name = match.group(1)
                start_time = match.group(2)
                end_time = match.group(3)
                
                day_of_week = day_name_to_number(day_name)
                start_24 = convert_to_24_hour(start_time)
                end_24 = convert_to_24_hour(end_time)
                
                if day_of_week is not None and start_24 and end_24:
                    current_tutor['schedules'].append({
                        'day_of_week': day_of_week,
                        'start_time': start_24,
                        'end_time': end_24
                    })
    
    # Add last tutor
    if current_tutor:
        tutors.append(current_tutor)
    
    return tutors

def insert_tutor_availability(supabase, tutor_id, day_of_week, start_time, end_time):
    """Insert tutor availability (uses UNIQUE constraint to prevent duplicates)"""
    try:
        # Always use HTTP requests directly
        url = SUPABASE_URL
        key = SUPABASE_KEY
        
        if not url or not key:
            return False
        
        # Only required columns: tutor_id, day_of_week, start_time, end_time
        # is_available defaults to True in schema
        availability_data = {
            'tutor_id': tutor_id,
            'day_of_week': day_of_week,
            'start_time': start_time,
            'end_time': end_time
        }
        
        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        }
        
        # Upsert using POST with conflict resolution (UNIQUE constraint handles duplicates)
        response = requests.post(
            f"{url}/rest/v1/tutor_availability",
            headers=headers,
            json=availability_data
        )
        
        return response.status_code in [200, 201]
    except Exception as e:
        print(f"⚠️  Error inserting availability: {e}")
        return False

def main():
    """Main function"""
    print("="*70)
    print("📅 Import Tutor Availability Schedule to Supabase")
    print("="*70)
    
    # Read schedule from file or use provided text
    schedule_file = Path(__file__).parent.parent.parent / 'data' / 'tutor-availability-schedule.txt'
    
    if schedule_file.exists():
        print(f"\n📖 Reading schedule from: {schedule_file}")
        with open(schedule_file, 'r', encoding='utf-8') as f:
            schedule_text = f.read()
    else:
        print("\n📝 Using schedule from script...")
        # Schedule text would be provided here or as command line argument
        print("❌ Please create tutor-availability-schedule.txt file with the schedule")
        print("   Or provide schedule text as command line argument")
        sys.exit(1)
    
    # Parse schedule
    print("\n🔍 Parsing schedule...")
    tutors = parse_schedule_text(schedule_text)
    print(f"✅ Parsed {len(tutors)} tutors")
    
    # Get Supabase client
    supabase = get_supabase_client()
    if not supabase:
        print("\n❌ Cannot proceed without Supabase connection")
        sys.exit(1)
    
    # Import schedules
    print(f"\n💾 Importing schedules to Supabase...")
    print("="*70)
    
    total_schedules = 0
    successful = 0
    failed = 0
    not_found = []
    
    day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    for tutor in tutors:
        tutor_name = tutor['name']
        print(f"\n👤 {tutor_name}")
        
        # Find tutor by name (tutors table has tutor_id and tutor_name)
        tutor_id = find_tutor_id_by_name(supabase, tutor_name)
        
        if not tutor_id:
            print(f"   ⚠️  Tutor not found - skipping")
            not_found.append(tutor_name)
            continue
        
        print(f"   ✅ Found tutor ID: {tutor_id[:8]}...")
        
        # Insert each schedule
        for schedule in tutor['schedules']:
            day_of_week = schedule['day_of_week']
            start_time = schedule['start_time']
            end_time = schedule['end_time']
            
            total_schedules += 1
            
            if insert_tutor_availability(supabase, tutor_id, day_of_week, start_time, end_time):
                successful += 1
                print(f"      ✅ {day_names[day_of_week]:9} {start_time}-{end_time}")
            else:
                failed += 1
                print(f"      ❌ {day_names[day_of_week]:9} {start_time}-{end_time} - Failed")
    
    # Summary
    print("\n" + "="*70)
    print("✅ Import Complete!")
    print("="*70)
    print(f"\n📊 Summary:")
    print(f"   Total schedules: {total_schedules}")
    print(f"   Successful: {successful}")
    print(f"   Failed: {failed}")
    print(f"   Tutors not found: {len(not_found)}")
    
    if not_found:
        print(f"\n⚠️  Tutors not found in database:")
        for name in not_found:
            print(f"   - {name}")
        print(f"\n💡 These tutors may need to be created first in the users/tutors tables")

if __name__ == "__main__":
    main()

