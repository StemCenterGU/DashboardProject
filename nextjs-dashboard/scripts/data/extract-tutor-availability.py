#!/usr/bin/env python3
"""
Extract Tutor Availability from Available Slots
Analyzes available_slots to find recurring weekly patterns and stores in tutor_availability table
"""

import requests
import sys
import os
from datetime import datetime
from collections import defaultdict
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
# Supabase configuration (load from environment or .env.local)
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
        print("   Or create .env.local file with these variables")
        return None
    
    if HAS_SUPABASE_PY:
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            return supabase
        except Exception as e:
            print(f"❌ Error creating Supabase client: {e}")
            return None
    else:
        # Return a simple dict-based client for HTTP requests
        return {'url': SUPABASE_URL, 'key': SUPABASE_KEY, 'use_http': True}

def fetch_tutor_names(supabase):
    """Fetch tutor names mapped to tutor_ids"""
    print("📡 Fetching tutor information...")
    
    tutor_names = {}
    
    try:
        use_http = isinstance(supabase, dict) and supabase.get('use_http')
        
        if use_http:
            url = supabase['url']
            key = supabase['key']
            headers = {
                'apikey': key,
                'Authorization': f'Bearer {key}',
                'Content-Type': 'application/json'
            }
            # Join tutors with users to get names
            response = requests.get(
                f"{url}/rest/v1/tutors?select=tutor_id,users(full_name,email)",
                headers=headers
            )
            if response.status_code == 200:
                tutors = response.json()
                for tutor in tutors:
                    tutor_id = tutor.get('tutor_id')
                    user_info = tutor.get('users')
                    if tutor_id and user_info:
                        if isinstance(user_info, list) and len(user_info) > 0:
                            tutor_names[tutor_id] = user_info[0].get('full_name', f"Tutor {tutor_id[:8]}")
                        elif isinstance(user_info, dict):
                            tutor_names[tutor_id] = user_info.get('full_name', f"Tutor {tutor_id[:8]}")
        else:
            # Use supabase-py
            result = supabase.table('tutors').select('tutor_id,users(full_name,email)').execute()
            if result.data:
                for tutor in result.data:
                    tutor_id = tutor.get('tutor_id')
                    user_info = tutor.get('users')
                    if tutor_id and user_info:
                        if isinstance(user_info, list) and len(user_info) > 0:
                            tutor_names[tutor_id] = user_info[0].get('full_name', f"Tutor {tutor_id[:8]}")
                        elif isinstance(user_info, dict):
                            tutor_names[tutor_id] = user_info.get('full_name', f"Tutor {tutor_id[:8]}")
    except Exception as e:
        print(f"⚠️  Warning: Could not fetch tutor names: {e}")
    
    print(f"✅ Loaded {len(tutor_names)} tutor names")
    return tutor_names

def fetch_all_available_slots(supabase):
    """Fetch all available slots from Supabase"""
    print("📡 Fetching all available slots from database...")
    
    try:
        # Check if using HTTP client (dict) or supabase-py client (object)
        use_http = isinstance(supabase, dict) and supabase.get('use_http')
        
        if use_http:
            url = supabase['url']
            key = supabase['key']
            headers = {
                'apikey': key,
                'Authorization': f'Bearer {key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
            # Fetch all slots (you might want to add pagination for large datasets)
            response = requests.get(
                f"{url}/rest/v1/available_slots?select=*&order=slot_date.asc,start_time.asc",
                headers=headers
            )
            if response.status_code == 200:
                slots = response.json()
                print(f"✅ Fetched {len(slots)} available slots")
                return slots
            else:
                print(f"❌ Error fetching slots: {response.status_code} - {response.text}")
                return []
        else:
            # Use supabase-py
            result = supabase.table('available_slots').select('*').order('slot_date').order('start_time').execute()
            if result.data:
                print(f"✅ Fetched {len(result.data)} available slots")
                return result.data
            else:
                print("ℹ️  No available slots found")
                return []
    except Exception as e:
        print(f"❌ Error fetching available slots: {e}")
        return []

def extract_recurring_patterns(slots):
    """
    Extract weekly schedule patterns from available slots
    Every week has the same schedule, so if a time slot appears on a day of week,
    it's part of the tutor's weekly schedule (add only once per unique time slot)
    """
    print("\n🔍 Analyzing slots for weekly schedule patterns...")
    
    # Group by tutor, day of week, and time
    # Structure: {(tutor_id, day_of_week, start_time, end_time): [dates]}
    # We'll add each unique pattern only once, regardless of how many times it appears
    patterns = {}
    
    for slot in slots:
        tutor_id = slot.get('tutor_id')
        slot_date = slot.get('slot_date')
        start_time = slot.get('start_time')
        end_time = slot.get('end_time')
        
        if not all([tutor_id, slot_date, start_time, end_time]):
            continue
        
        # Parse date to get day of week (0=Sunday, 6=Saturday)
        # Python weekday(): Monday=0, Tuesday=1, ..., Sunday=6
        # Database expects: Sunday=0, Monday=1, ..., Saturday=6
        try:
            date_obj = datetime.strptime(slot_date, "%Y-%m-%d")
            python_weekday = date_obj.weekday()  # Monday=0, Sunday=6
            # Convert: Monday(0)->1, Tuesday(1)->2, ..., Saturday(5)->6, Sunday(6)->0
            day_of_week = (python_weekday + 1) % 7
        except:
            continue
        
        # Create pattern key - if this pattern doesn't exist yet, add it
        pattern_key = (tutor_id, day_of_week, start_time, end_time)
        
        if pattern_key not in patterns:
            # First time seeing this pattern - add it (only once)
            patterns[pattern_key] = {
                'tutor_id': tutor_id,
                'day_of_week': day_of_week,
                'start_time': start_time,
                'end_time': end_time,
                'occurrence_count': 1,
                'dates': [slot_date]
            }
        else:
            # Pattern already exists - just track the occurrence
            patterns[pattern_key]['occurrence_count'] += 1
            if slot_date not in patterns[pattern_key]['dates']:
                patterns[pattern_key]['dates'].append(slot_date)
    
    print(f"✅ Found {len(patterns)} unique weekly schedule patterns")
    print(f"   (Each pattern represents a recurring weekly time slot)")
    return patterns

def sync_tutor_availability(supabase, recurring_patterns, tutor_names=None):
    """Sync weekly schedule patterns to tutor_availability table"""
    print(f"\n💾 Syncing {len(recurring_patterns)} weekly schedule patterns to tutor_availability table...")
    
    if tutor_names is None:
        tutor_names = {}
    
    # Group by tutor for better organization
    tutor_groups = defaultdict(list)
    for pattern_key, pattern_data in recurring_patterns.items():
        tutor_id = pattern_data['tutor_id']
        tutor_groups[tutor_id].append(pattern_data)
    
    # Sort each tutor's patterns by day_of_week, then start_time
    for tutor_id in tutor_groups:
        tutor_groups[tutor_id].sort(key=lambda x: (x['day_of_week'], x['start_time']))
    
    print(f"📊 Processing {len(tutor_groups)} tutors...")
    print("\n" + "="*70)
    
    synced_count = 0
    error_count = 0
    
    for tutor_id, patterns in tutor_groups.items():
        tutor_name = tutor_names.get(tutor_id, f"Tutor {tutor_id[:8]}...")
        print(f"\n👤 {tutor_name} (ID: {tutor_id[:8]}...)")
        print(f"   📅 {len(patterns)} weekly time slots:")
        
        for pattern in patterns:
            availability_data = {
                'tutor_id': pattern['tutor_id'],
                'day_of_week': pattern['day_of_week'],
                'start_time': pattern['start_time'],
                'end_time': pattern['end_time'],
                'is_available': True
            }
            
            try:
                # Check if using HTTP client (dict) or supabase-py client (object)
                use_http = isinstance(supabase, dict) and supabase.get('use_http')
                
                if use_http:
                    url = supabase['url']
                    key = supabase['key']
                    headers = {
                        'apikey': key,
                        'Authorization': f'Bearer {key}',
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    }
                    
                    # Upsert using POST with Prefer header
                    # Note: Supabase REST API upsert requires the unique constraint to be properly defined
                    upsert_headers = headers.copy()
                    upsert_headers['Prefer'] = 'resolution=merge-duplicates'
                    
                    response = requests.post(
                        f"{url}/rest/v1/tutor_availability",
                        headers=upsert_headers,
                        json=availability_data
                    )
                    
                    if response.status_code in [200, 201]:
                        synced_count += 1
                        day_name = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern['day_of_week']]
                        print(f"      ✅ {day_name:9} {pattern['start_time']}-{pattern['end_time']:5} ({pattern['occurrence_count']:2} occurrences)")
                    else:
                        error_count += 1
                        day_name = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern['day_of_week']]
                        print(f"      ❌ {day_name:9} {pattern['start_time']}-{pattern['end_time']:5} - Error: {response.status_code}")
                else:
                    # Using supabase-py client
                    # Use supabase-py - upsert with conflict resolution
                    # First try to find existing
                    existing = supabase.table('tutor_availability').select('availability_id').eq(
                        'tutor_id', pattern['tutor_id']
                    ).eq('day_of_week', pattern['day_of_week']).eq(
                        'start_time', pattern['start_time']
                    ).eq('end_time', pattern['end_time']).limit(1).execute()
                    
                    if existing.data and len(existing.data) > 0:
                        # Update existing
                        result = supabase.table('tutor_availability').update(
                            availability_data
                        ).eq('availability_id', existing.data[0]['availability_id']).execute()
                    else:
                        # Insert new
                        result = supabase.table('tutor_availability').insert(
                            availability_data
                        ).execute()
                    
                    if result.data:
                        synced_count += 1
                        day_name = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern['day_of_week']]
                        print(f"      ✅ {day_name:9} {pattern['start_time']}-{pattern['end_time']:5} ({pattern['occurrence_count']:2} occurrences)")
                    else:
                        error_count += 1
                        day_name = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern['day_of_week']]
                        print(f"      ❌ {day_name:9} {pattern['start_time']}-{pattern['end_time']:5} - Error upserting")
            except Exception as e:
                error_count += 1
                day_name = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pattern['day_of_week']]
                print(f"      ❌ {day_name:9} {pattern['start_time']}-{pattern['end_time']:5} - Exception: {e}")
    
    print("\n" + "="*70)
    print(f"\n✅ Summary:")
    print(f"   Tutors processed: {len(tutor_groups)}")
    print(f"   Patterns synced: {synced_count}")
    print(f"   Errors: {error_count}")
    return synced_count, error_count

def main():
    """Main function"""
    print("="*70)
    print("📅 Extract Tutor Availability from Available Slots")
    print("="*70)
    
    # Get Supabase client
    supabase = get_supabase_client()
    if not supabase:
        print("\n❌ Cannot proceed without Supabase connection")
        sys.exit(1)
    
    # Fetch tutor names for better display
    tutor_names = fetch_tutor_names(supabase)
    
    # Fetch all available slots
    slots = fetch_all_available_slots(supabase)
    if not slots:
        print("\n⚠️  No available slots found. Nothing to extract.")
        sys.exit(0)
    
    # Extract recurring patterns
    recurring_patterns = extract_recurring_patterns(slots)
    if not recurring_patterns:
        print("\n⚠️  No recurring patterns found.")
        sys.exit(0)
    
    # Sync to tutor_availability table
    synced, errors = sync_tutor_availability(supabase, recurring_patterns, tutor_names)
    
    print("\n" + "="*70)
    print("✨ Extraction complete!")
    print("="*70)

if __name__ == "__main__":
    main()

