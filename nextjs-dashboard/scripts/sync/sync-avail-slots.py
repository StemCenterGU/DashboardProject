#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WCOnline AVAIL Data Sync Script
Fetches AVAIL type data (available slots) from WCOnline API and syncs to Supabase available_slots table
Matches tutors with the tutors table (not users table)
"""

import sys
import io

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import requests
import pandas as pd
import json
import os
import time
import re
from datetime import datetime, timedelta
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except:
    pass

# ============================================================================
# CONFIGURATION
# ============================================================================
API_KEY = "a519p8qKJGpnjo8asdgOIUNHLJ5342"
BASE_URL = "https://gannon.mywconline.com/api"

# Supabase configuration
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

# Rate limiting: 300 requests per hour
MAX_REQUESTS_PER_HOUR = 300
RATE_LIMIT_WINDOW = 3600
request_times = []

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def wait_if_needed():
    """Wait if approaching rate limit"""
    now = time.time()
    global request_times
    request_times = [t for t in request_times if t > now - RATE_LIMIT_WINDOW]
    
    if len(request_times) >= MAX_REQUESTS_PER_HOUR:
        wait_time = (request_times[0] + RATE_LIMIT_WINDOW) - now + 1
        if wait_time > 0:
            print(f"⏳ Rate limit approaching. Waiting {int(wait_time)}s...")
            time.sleep(wait_time)
            request_times = [t for t in request_times if t > now - RATE_LIMIT_WINDOW]
    
    request_times.append(time.time())

def format_date(date):
    """Format date to YYYYMMDD format"""
    if isinstance(date, str):
        date = datetime.strptime(date, "%Y-%m-%d")
    return date.strftime("%Y%m%d")

def convert_to_24_hour(time_str):
    """Convert 12-hour time to 24-hour format"""
    if not time_str:
        return time_str
    
    time_str = str(time_str).strip()
    
    # If already in 24-hour format (HH:MM)
    if re.match(r'^\d{1,2}:\d{2}$', time_str):
        parts = time_str.split(':')
        return f"{int(parts[0]):02d}:{parts[1]}"
    
    time_lower = time_str.lower()
    is_pm = 'pm' in time_lower
    is_am = 'am' in time_lower
    
    match = re.search(r'(\d{1,2}):(\d{2})', time_lower)
    if not match:
        return time_str
    
    hours = int(match.group(1))
    minutes = match.group(2)
    
    if is_pm and hours != 12:
        hours += 12
    elif is_am and hours == 12:
        hours = 0
    
    return f"{hours:02d}:{minutes}"

# ============================================================================
# WCONLINE API FUNCTIONS
# ============================================================================
def fetch_wconline_data(request_type, date):
    """Fetch data from WCOnline API"""
    wait_if_needed()
    
    request_date = format_date(date)
    url = f"{BASE_URL}?type={request_type}&date={request_date}"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    print(f"📡 Fetching {request_type} data for {request_date}...")
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 429:
        print(f"⚠️ Rate limited. Waiting 5 seconds...")
        time.sleep(5)
        response = requests.get(url, headers=headers)
    
    response.raise_for_status()
    return response.json()

def filter_stem_center(data):
    """Filter data for STEM Center schedule"""
    if not isinstance(data, list):
        return []
    
    df = pd.DataFrame(data)
    if "Schedule Title" not in df.columns:
        print("⚠️ No 'Schedule Title' column found in data")
        return []
    
    # Filter for STEM Center (case-insensitive, contains match)
    stem_df = df[df["Schedule Title"].str.upper().str.contains("STEM CENTER", na=False)]
    print(f"✅ Filtered {len(stem_df)} STEM Center entries from {len(df)} total")
    return stem_df.to_dict('records')

# ============================================================================
# SUPABASE FUNCTIONS
# ============================================================================
def get_supabase_client():
    """Get Supabase client configuration"""
    url = SUPABASE_URL
    key = SUPABASE_KEY
    
    if not url or not key:
        print("❌ Supabase credentials not found!")
        print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        print("   Or create .env.local file with these variables")
        return None
    
    return {'url': url, 'key': key}

def get_all_tutors(supabase):
    """Fetch all tutors from the database and return a cache"""
    print("📡 Fetching all tutors from database...")
    tutor_cache = {}
    try:
        url = supabase['url']
        key = supabase['key']
        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}'
        }
        response = requests.get(
            f"{url}/rest/v1/tutors?select=tutor_id,tutor_name",
            headers=headers
        )
        if response.status_code == 200:
            tutors = response.json()
            for tutor in tutors:
                # Normalize tutor name for matching - remove periods, extra spaces, lowercase
                normalized_name = tutor['tutor_name'].strip().replace('.', '').replace('  ', ' ').lower()
                tutor_cache[normalized_name] = tutor['tutor_id']
            print(f"✅ Loaded {len(tutor_cache)} tutors into cache")
            print(f"   Tutors: {', '.join([name.title() for name in list(tutor_cache.keys())[:5]])}...")
        else:
            print(f"⚠️ Failed to fetch tutors: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Could not fetch tutors: {e}")
    return tutor_cache

def find_tutor_by_name(tutor_cache, tutor_name):
    """Find tutor_id by tutor_name from the cache"""
    if not tutor_name:
        return None
    
    # Normalize the tutor name - remove periods, extra spaces, lowercase
    tutor_name_clean = tutor_name.strip().replace('.', '').replace('  ', ' ').lower()
    return tutor_cache.get(tutor_name_clean)

def create_tutor(supabase, tutor_name):
    """Create a new tutor in the tutors table"""
    print(f"      Creating new tutor: '{tutor_name}'")
    
    url = supabase['url']
    key = supabase['key']
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    try:
        response = requests.post(
            f"{url}/rest/v1/tutors",
            headers=headers,
            json={'tutor_name': tutor_name.strip()}
        )
        
        if response.status_code in [200, 201] and response.text:
            try:
                data = response.json()
                if data:
                    new_tutor_id = data[0]['tutor_id']
                    print(f"      ✅ Created tutor with ID: {new_tutor_id}")
                    return new_tutor_id
            except json.JSONDecodeError:
                print(f"      ❌ Failed to decode JSON response: {response.text}")
                return None
        else:
            print(f"      ❌ Failed to create tutor: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"      ❌ Error creating tutor: {e}")
        return None

def find_or_create_tutor(supabase, tutor_cache, tutor_name):
    """Find or create tutor in Supabase tutors table"""
    if not tutor_name:
        return None
    
    # First try to find by name in the cache
    tutor_id = find_tutor_by_name(tutor_cache, tutor_name)
    if tutor_id:
        return tutor_id
    
    # If not found, create a new tutor
    new_tutor_id = create_tutor(supabase, tutor_name)
    if new_tutor_id:
        # Add to cache with normalized name
        normalized_name = tutor_name.strip().replace('.', '').replace('  ', ' ').lower()
        tutor_cache[normalized_name] = new_tutor_id
    return new_tutor_id

def sync_available_slot(supabase, tutor_cache, slot, date_str):
    """Sync an available slot to Supabase available_slots table"""
    tutor_name = slot.get('Staff or Resource') or slot.get('Resource', '')
    
    if not tutor_name or not tutor_name.strip():
        print(f"      ⚠️ Missing tutor name")
        return False
    
    # Skip if it's clearly not a tutor name (e.g., exam names, events)
    skip_keywords = ['exam', 'test', 'workshop', 'seminar', 'event', 'meeting', 'readiness']
    if any(keyword in tutor_name.lower() for keyword in skip_keywords):
        print(f"      ⚠️ Skipping non-tutor resource: '{tutor_name}'")
        return True  # Return True to not count it as a failure
    
    tutor_id = find_or_create_tutor(supabase, tutor_cache, tutor_name)
    
    if not tutor_id:
        print(f"      ❌ Could not find or create tutor: '{tutor_name}'")
        return False
    
    start_time = convert_to_24_hour(slot.get('Start Time', ''))
    end_time_raw = slot.get('End Time', '')
    
    # Validate start time
    if not start_time or not re.match(r'^\d{2}:\d{2}$', start_time):
        print(f"      ⚠️ Invalid start time: {start_time}")
        return False
    
    # Handle missing end time - AVAIL type doesn't provide end times
    # Default to 1 hour after start time
    if not end_time_raw or end_time_raw.strip() == '':
        from datetime import datetime, timedelta
        start_dt = datetime.strptime(start_time, '%H:%M')
        end_dt = start_dt + timedelta(hours=1)
        end_time = end_dt.strftime('%H:%M')
        # print(f"      ℹ️ No end time provided, using 1-hour default: {end_time}")
    else:
        end_time = convert_to_24_hour(end_time_raw)
        if not end_time or not re.match(r'^\d{2}:\d{2}$', end_time):
            # If end time is invalid, use 1-hour default
            from datetime import datetime, timedelta
            start_dt = datetime.strptime(start_time, '%H:%M')
            end_dt = start_dt + timedelta(hours=1)
            end_time = end_dt.strftime('%H:%M')
    
    # Helper function to safely convert to boolean
    def safe_bool(value):
        if value is None or value == '':
            return False
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ['true', 'yes', '1', 'y']
        return bool(value)
    
    slot_data = {
        'tutor_id': tutor_id,
        'slot_date': date_str,
        'start_time': start_time,
        'end_time': end_time,
        'is_booked': False,
        'source': 'wconline',
    }
    
    try:
        url = supabase['url']
        key = supabase['key']
        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        }
        response = requests.post(
            f"{url}/rest/v1/available_slots",
            headers=headers,
            json=slot_data
        )
        
        if response.status_code in [200, 201]:
            return True
        else:
            print(f"      ❌ Failed to sync slot: {response.status_code} - {response.text[:100]}")
            return False
    except Exception as e:
        print(f"      ❌ Error syncing slot: {e}")
        return False

def delete_existing_slots(supabase, date_str):
    """Delete existing slots for a given date from WCOnline source"""
    try:
        url = supabase['url']
        key = supabase['key']
        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}'
        }
        print(f"🗑️  Deleting existing slots for {date_str}...")
        response = requests.delete(
            f"{url}/rest/v1/available_slots?slot_date=eq.{date_str}&source=eq.wconline",
            headers=headers
        )
        if response.status_code in [200, 204]:
            print("✅ Old slots deleted")
            return True
        else:
            print(f"⚠️ Delete response: {response.status_code}")
            return False
    except Exception as e:
        print(f"⚠️ Error deleting old slots: {e}")
        return False

# ============================================================================
# MAIN SYNC FUNCTION
# ============================================================================
def sync_avail_slots_for_date(date, supabase, tutor_cache):
    """Fetch and sync AVAIL data (available slots) for a specific date"""
    date_str = date if isinstance(date, str) else date.strftime("%Y-%m-%d")
    
    print(f"\n{'='*70}")
    print(f"📅 Syncing AVAIL slots for date: {date_str}")
    print(f"{'='*70}\n")
    
    try:
        # Fetch AVAIL data
        avail_data = fetch_wconline_data('AVAIL', date)
        avail_slots = filter_stem_center(avail_data if isinstance(avail_data, list) else [])
        
        if len(avail_slots) == 0:
            print(f"ℹ️  No AVAIL slots found for {date_str}")
            return
        
        print(f"✅ Found {len(avail_slots)} available slots")
        
        # Delete existing slots for this date
        delete_existing_slots(supabase, date_str)
        
        # Sync new slots
        print(f"\n💾 Syncing {len(avail_slots)} available slots...")
        synced_count = 0
        failed_count = 0
        
        for idx, slot in enumerate(avail_slots, 1):
            tutor_name = slot.get('Staff or Resource') or slot.get('Resource', 'Unknown')
            start_time = slot.get('Start Time', '')
            end_time = slot.get('End Time', '')
            print(f"   [{idx}/{len(avail_slots)}] {tutor_name} ({start_time} - {end_time})...", end=' ')
            
            if sync_available_slot(supabase, tutor_cache, slot, date_str):
                synced_count += 1
                print("✅")
            else:
                failed_count += 1
                print("❌")
        
        print(f"\n✅ Synced {synced_count}/{len(avail_slots)} available slots")
        if failed_count > 0:
            print(f"❌ Failed: {failed_count} slots")
    
    except Exception as e:
        print(f"❌ Error syncing AVAIL data for {date_str}: {e}")

def sync_date_range(start_date, end_date, supabase):
    """Sync AVAIL slots for a range of dates"""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    # Load tutor cache once
    tutor_cache = get_all_tutors(supabase)
    
    current = start
    while current <= end:
        sync_avail_slots_for_date(current, supabase, tutor_cache)
        if current < end:
            time.sleep(2)  # Small delay between dates
        current += timedelta(days=1)

# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__":
    # Check Supabase connection
    supabase = get_supabase_client()
    if not supabase:
        print("\n❌ Cannot proceed without Supabase connection")
        sys.exit(1)
    
    print(f"✅ Connected to Supabase: {supabase['url']}")
    
    # Parse command line arguments
    if len(sys.argv) == 3:
        start_date_str = sys.argv[1]
        end_date_str = sys.argv[2]
    elif len(sys.argv) == 1:
        # Default: sync for the next 7 days
        start_date = datetime.now()
        end_date = start_date + timedelta(days=6)
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
    else:
        print("Usage:")
        print("  python sync-avail-slots.py                    # Sync for the next 7 days")
        print("  python sync-avail-slots.py <start> <end>      # Sync for a specific date range (YYYY-MM-DD)")
        print("\nExample:")
        print("  python sync-avail-slots.py 2026-01-25 2026-01-31")
        sys.exit(1)
    
    try:
        # Validate dates
        datetime.strptime(start_date_str, "%Y-%m-%d")
        datetime.strptime(end_date_str, "%Y-%m-%d")
    except ValueError:
        print("❌ Invalid date format. Use YYYY-MM-DD.")
        sys.exit(1)
    
    print(f"\n🚀 Starting sync for date range: {start_date_str} to {end_date_str}\n")
    
    # Run the sync
    sync_date_range(start_date_str, end_date_str, supabase)
    
    print("\n✨ All done!")
