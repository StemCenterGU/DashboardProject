#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unified WCOnline Sync Script
Fetches data from WCOnline API and syncs directly to Supabase
Based on api.ipynb approach
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

# Try to load supabase-py, fallback to direct API calls if not available
try:
    from supabase import create_client, Client
    HAS_SUPABASE_PY = True
except ImportError:
    HAS_SUPABASE_PY = False
    print("⚠️  supabase-py not installed. Install with: pip install supabase")
    print("   Will use direct HTTP requests instead")

# Load environment variables FIRST (before using them)
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

# Supabase configuration (load from environment or .env.local)
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

# Rate limiting: 300 requests per hour
MAX_REQUESTS_PER_HOUR = 300
RATE_LIMIT_WINDOW = 3600
request_times = []

# ============================================================================
# RATE LIMITING
# ============================================================================
def wait_if_needed():
    """Wait if approaching rate limit"""
    now = time.time()
    # Remove old requests
    global request_times
    request_times = [t for t in request_times if t > now - RATE_LIMIT_WINDOW]
    
    if len(request_times) >= MAX_REQUESTS_PER_HOUR:
        wait_time = (request_times[0] + RATE_LIMIT_WINDOW) - now + 1
        if wait_time > 0:
            print(f"⏳ Rate limit approaching. Waiting {int(wait_time)}s...")
            time.sleep(wait_time)
            request_times = [t for t in request_times if t > now - RATE_LIMIT_WINDOW]
    
    request_times.append(time.time())

# ============================================================================
# WCONLINE API FUNCTIONS
# ============================================================================
def format_date(date):
    """Format date to YYYYMMDD format"""
    if isinstance(date, str):
        date = datetime.strptime(date, "%Y-%m-%d")
    return date.strftime("%Y%m%d")

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
        return []
    
    # Filter for STEM Center (case-insensitive, contains match)
    stem_df = df[df["Schedule Title"].str.upper().str.contains("STEM CENTER", na=False)]
    return stem_df.to_dict('records')

# ============================================================================
# SUPABASE FUNCTIONS
# ============================================================================
def get_supabase_client():
    """Get Supabase client"""
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')
    
    if not url or not key:
        print("❌ Supabase credentials not found!")
        print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        print("   Or create .env.local file with these variables")
        return None
    
    # Always use HTTP mode for reliability
    return {'url': url, 'key': key, 'use_http': True}


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

def get_all_tutors(supabase):
    """Fetch all tutors from the database and return a cache."""
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
                # Normalize cache key: lowercase, strip, remove periods (to match lookup logic)
                cache_key = tutor['tutor_name'].lower().strip().replace('.', '')
                tutor_cache[cache_key] = tutor['tutor_id']
            print(f"✅ Loaded {len(tutor_cache)} tutors into cache.")
    except Exception as e:
        print(f"⚠️  Could not fetch tutors: {e}")
    return tutor_cache

def find_tutor_by_name(tutor_cache, tutor_name):
    """Find tutor_id by tutor_name from the cache."""
    if not tutor_name:
        return None
    
    tutor_name_clean = tutor_name.strip().replace('.', '').lower()
    return tutor_cache.get(tutor_name_clean)

def find_or_create_tutor(supabase, tutor_cache, tutor_name):
    """Find or create tutor in Supabase tutors table, using a cache."""
    if not tutor_name:
        return None
    
    # First try to find by name in the cache
    tutor_id = find_tutor_by_name(tutor_cache, tutor_name)
    if tutor_id:
        return tutor_id
    
    # If not found, create a new tutor
    print(f"      Creating new tutor: '{tutor_name}'")
    
    # Use HTTP requests directly
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
                    # Add the new tutor to the cache
                    tutor_cache[tutor_name.strip().lower()] = new_tutor_id
                    return new_tutor_id
            except json.JSONDecodeError:
                print(f"      ❌ Failed to decode JSON response when creating tutor: {response.text}")
                return None
        else:
            print(f"      ❌ Failed to create tutor: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"      ❌ An unexpected error occurred while creating tutor: {e}")
        return None

def find_or_create_course(supabase, course_code=None, course_name=None):
    """Find or create course in Supabase"""
    if not course_code and not course_name:
        return None
    
    # Check if using HTTP mode (dict) or supabase-py client
    use_http = isinstance(supabase, dict) and supabase.get('use_http')
    
    if use_http:
        url = supabase['url']
        key = supabase['key']
        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json'
        }
        
        # Try to find by course code
        if course_code:
            response = requests.get(
                f"{url}/rest/v1/courses?course_code=eq.{course_code.upper()}&select=course_id",
                headers=headers
            )
            if response.status_code == 200 and response.json():
                return response.json()[0]['course_id']
        
        # Try to find by name
        if course_name:
            response = requests.get(
                f"{url}/rest/v1/courses?course_name=ilike.{course_name}&select=course_id&limit=1",
                headers=headers
            )
            if response.status_code == 200 and response.json():
                return response.json()[0]['course_id']
        
        # Create new course
        course_data = {'active': True}
        if course_code:
            course_data['course_code'] = course_code.upper()
        if course_name:
            course_data['course_name'] = course_name
        elif course_code:
            course_data['course_name'] = course_code
        
        response = requests.post(
            f"{url}/rest/v1/courses",
            headers=headers,
            json=course_data
        )
        if response.status_code in [200, 201] and response.json():
            return response.json()[0]['course_id']
        
        return None
    else:
        # Use HTTP requests for supabase-py client (more reliable)
        import urllib.parse
        url = SUPABASE_URL
        key = SUPABASE_KEY
        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json'
        }
        
        # Try to find by course code
        if course_code:
            encoded_code = urllib.parse.quote(course_code.upper())
            response = requests.get(
                f"{url}/rest/v1/courses?course_code=eq.{encoded_code}&select=course_id&limit=1",
                headers=headers
            )
            if response.status_code == 200 and response.json():
                return response.json()[0]['course_id']
        
        # Try to find by name
        if course_name:
            encoded_name = urllib.parse.quote(course_name)
            response = requests.get(
                f"{url}/rest/v1/courses?course_name=ilike.*{encoded_name}*&select=course_id&limit=1",
                headers=headers
            )
            if response.status_code == 200 and response.json():
                return response.json()[0]['course_id']
        
        # Create new course
        course_data = {'active': True}
        if course_code:
            course_data['course_code'] = course_code.upper()
        if course_name:
            course_data['course_name'] = course_name
        elif course_code:
            course_data['course_name'] = course_code
        
        response = requests.post(
            f"{url}/rest/v1/courses",
            headers={
                'apikey': key,
                'Authorization': f'Bearer {key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            json=course_data
        )
        if response.status_code in [200, 201] and response.json():
            return response.json()[0]['course_id']
        
        return None

def sync_available_slot(supabase, tutor_cache, slot, date_str):
    """Sync an available slot to Supabase with all WCOnline fields"""
    tutor_name = slot.get('Staff or Resource') or slot.get('Resource', '')

    # Skip if it's clearly not a tutor name (e.g., exam names, events)
    skip_keywords = ['exam', 'test', 'workshop', 'seminar', 'event', 'meeting', 'readiness']
    if any(keyword in tutor_name.lower() for keyword in skip_keywords):
        print(f"      ⚠️  Skipping non-tutor resource: '{tutor_name}'")
        return True # Return True to not count it as a failure

    tutor_id = find_or_create_tutor(supabase, tutor_cache, tutor_name)
    
    if not tutor_id:
        return False
    
    start_time = convert_to_24_hour(slot.get('Start Time', ''))
    end_time = convert_to_24_hour(slot.get('End Time', ''))
    
    if not start_time or not end_time or not re.match(r'^\d{2}:\d{2}$', start_time):
        return False
    
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
        # WCOnline specific fields (extract all checked fields)
        'schedule_title': (slot.get('Schedule Title') or 
                         slot.get('schedule_title') or 
                         ''),
        'is_walk_in': safe_bool(slot.get('Walk-In/Drop-In') or 
                               slot.get('Walk-In') or 
                               slot.get('Walk In') or
                               slot.get('walk_in') or
                               False),
        'is_online': safe_bool(slot.get('Online') or 
                              slot.get('online') or
                              False),
        'focus': (slot.get('Focus') or 
                 slot.get('focus') or 
                 ''),
        'created_by': (slot.get('Created By') or 
                      slot.get('created_by') or 
                      ''),
        'modified_by': (slot.get('Modified By') or 
                       slot.get('modified_by') or 
                       ''),
        'is_repeating': safe_bool(slot.get('Repeating') or 
                                 slot.get('repeating') or
                                 False),
        'course_code': (slot.get('Course Code') or 
                       slot.get('Course') or 
                       slot.get('course_code') or 
                       '').upper() if slot.get('Course Code') or slot.get('Course') or slot.get('course_code') else None,
        'course_name': (slot.get('Course Name') or 
                       slot.get('Course') or 
                       slot.get('course_name') or 
                       '') if slot.get('Course Name') or slot.get('Course') or slot.get('course_name') else None,
        'course_instructor': (slot.get('Course Instructor') or 
                             slot.get('Course instructor') or 
                             slot.get('course_instructor') or 
                             ''),
    }
    
    try:
        # Check if using HTTP mode (dict) or supabase-py client
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
            response = requests.post(
                f"{url}/rest/v1/available_slots",
                headers=headers,
                json=slot_data
            )
            return response.status_code in [200, 201]
        else:
            result = supabase.table('available_slots').upsert(
                slot_data,
                on_conflict='tutor_id,slot_date,start_time,end_time'
            ).execute()
            return True
    except Exception as e:
        return False

def sync_appointment(supabase, tutor_cache, appointment, date_str):
    """Sync a booked appointment from CUSTOM data to Supabase with checked fields only"""
    # Extract checked fields from WCOnline CUSTOM data (booked appointments)
    # Checked fields: Schedule Title, Staff or Resource, Appointment Date, Start Time, End Time,
    # Walk-In/Drop-In, Missed/No-Show, Online, Focus, Created, Created By, Repeating, Course, Course instructor
    
    tutor_name = appointment.get('Staff or Resource', '').strip()
    if not tutor_name:
        print(f"      ⚠️  Missing 'Staff or Resource' field")
        return False
    
    # Skip if it's clearly not a tutor name (e.g., exam names, events)
    skip_keywords = ['exam', 'test', 'workshop', 'seminar', 'event', 'meeting', 'readiness']
    if any(keyword in tutor_name.lower() for keyword in skip_keywords):
        print(f"      ⚠️  Skipping non-tutor resource: '{tutor_name}'")
        return False
    
    # Find or create tutor (using tutor_cache for efficiency)
    tutor_id = find_or_create_tutor(supabase, tutor_cache, tutor_name)
    if not tutor_id:
        print(f"      ⚠️  Could not find or create tutor: '{tutor_name}'")
        return False
    
    # Extract checked time fields
    start_time_raw = appointment.get('Start Time', '')
    end_time_raw = appointment.get('End Time', '')
    start_time = convert_to_24_hour(start_time_raw)
    end_time = convert_to_24_hour(end_time_raw)
    
    if not start_time or not end_time or not re.match(r'^\d{2}:\d{2}$', start_time):
        print(f"      ⚠️  Invalid time format: Start='{start_time_raw}' -> '{start_time}', End='{end_time_raw}' -> '{end_time}'")
        return False
    
    # Extract course information from focus field
    # Format: "course_name - course_instructor"
    focus_field = appointment.get('Focus') or appointment.get('focus') or ''
    course_name = ''
    course_instructor = ''
    
    if focus_field and '-' in focus_field:
        # Split by "-" to get course_name (before) and course_instructor (after)
        parts = focus_field.split('-', 1)
        course_name = parts[0].strip() if len(parts) > 0 else ''
        course_instructor = parts[1].strip() if len(parts) > 1 else ''
    else:
        # Fallback to direct fields if focus doesn't have the format
        course_name = appointment.get('Course Name') or appointment.get('Course') or ''
        course_instructor = appointment.get('Course Instructor') or appointment.get('Course instructor') or ''
    
    # Note: course_id column removed from appointments table
    # Course information is stored in course_name and course_instructor fields instead
    
    # Extract checked Missed/No-Show field
    status = 'scheduled'
    is_missed = False
    missed_value = appointment.get('Missed/No-Show') or appointment.get('Missed/No Show') or ''
    if missed_value and str(missed_value).lower() not in ['', 'false', '0', 'no']:
        is_missed = True
        if 'no-show' in str(missed_value).lower() or 'no show' in str(missed_value).lower():
            status = 'no_show'
        else:
            status = 'missed'
    
    # Generate appointment ID
    appointment_id = (appointment.get('Appointment ID') or 
                     appointment.get('AppointmentID') or 
                     appointment.get('ID') or
                     f"{tutor_id}-{date_str}-{start_time}".replace(':', '-').replace(' ', '-'))
    
    # Calculate duration in hours
    try:
        start_dt = datetime.strptime(f"{date_str} {start_time}", "%Y-%m-%d %H:%M")
        end_dt = datetime.strptime(f"{date_str} {end_time}", "%Y-%m-%d %H:%M")
        duration = (end_dt - start_dt).total_seconds() / 3600.0
    except:
        duration = None
    
    # Helper function to safely convert to boolean
    def safe_bool(value):
        if value is None or value == '':
            return False
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            # WCOnline writes "ONLINE" for online appointments
            return value.lower() in ['true', 'yes', '1', 'y', 'online']
        return bool(value)
    
    # Extract student name: Use "Created By" if it doesn't match tutor name
    created_by = appointment.get('Created By') or ''
    student_name_field = appointment.get('Student Name') or appointment.get('student_name') or ''
    
    # If "Created By" exists and doesn't match tutor name, use it as student name
    if created_by and created_by.strip().lower() != tutor_name.strip().lower():
        student_name = created_by.strip()
    elif student_name_field:
        student_name = student_name_field.strip()
    else:
        student_name = 'Unknown'
    
    # Build appointment data with ONLY checked fields from the image
    appointment_data = {
        'appointment_id': appointment_id,
        'tutor_id': tutor_id,
        'tutor_name': tutor_name.strip(),  # Store tutor name directly from "Staff or Resource"
        'student_name': student_name,  # Extracted from "Created By" if different from tutor
        # Note: course_id and student_email removed - not in appointments table schema
        'appointment_date': date_str,
        'start_time': start_time,
        'end_time': end_time,
        'duration': duration,
        'status': status,
        'source': 'wconline',
        # Checked WCOnline fields only:
        'schedule_title': appointment.get('Schedule Title') or '',  # ✓ Schedule Title
        'is_walk_in': safe_bool(appointment.get('Walk-In/Drop-In')),  # ✓ Walk-In/Drop-In
        'is_missed': is_missed,  # ✓ Missed/No-Show
        'is_online': safe_bool(appointment.get('Online')),  # ✓ Online
        'focus': focus_field,  # ✓ Focus (original field, contains "course_name - course_instructor")
        'is_repeating': safe_bool(appointment.get('Repeating')),  # ✓ Repeating
        'course_instructor': course_instructor,  # ✓ Course instructor (extracted from focus)
        'course_name': course_name if course_name else None,  # ✓ Course (extracted from focus)
    }
    
    try:
        # Check if using HTTP mode (dict) or supabase-py client
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
            response = requests.post(
                f"{url}/rest/v1/appointments",
                headers=headers,
                json=appointment_data
            )
            if response.status_code not in [200, 201]:
                print(f"      ⚠️  Failed to sync appointment {appointment_id}: {response.status_code} - {response.text[:100]}")
            return response.status_code in [200, 201]
        else:
            # Use supabase-py client
            result = supabase.table('appointments').upsert(
                appointment_data,
                on_conflict='appointment_id'
            ).execute()
            return True
    except Exception as e:
        print(f"      ⚠️  Error syncing appointment {appointment_id}: {e}")
        return False

def check_existing_data(supabase, date_str):
    """Check if old data exists in database for a given date"""
    has_existing_slots = False
    has_existing_appts = False
    
    try:
        # Check if using HTTP mode (dict) or supabase-py client
        use_http = isinstance(supabase, dict) and supabase.get('use_http')
        
        if use_http:
            url = supabase['url']
            key = supabase['key']
            headers = {
                'apikey': key,
                'Authorization': f'Bearer {key}'
            }
            # Check for existing slots
            response = requests.get(
                f"{url}/rest/v1/available_slots?slot_date=eq.{date_str}&source=eq.wconline&select=slot_id&limit=1",
                headers=headers
            )
            if response.status_code == 200 and response.json():
                has_existing_slots = len(response.json()) > 0
            
            # Check for existing appointments
            response = requests.get(
                f"{url}/rest/v1/appointments?appointment_date=eq.{date_str}&source=eq.wconline&select=appointment_id&limit=1",
                headers=headers
            )
            if response.status_code == 200 and response.json():
                has_existing_appts = len(response.json()) > 0
        else:
            # Check for existing slots
            result = supabase.table('available_slots').select('slot_id').eq('slot_date', date_str).eq('source', 'wconline').limit(1).execute()
            has_existing_slots = result.data and len(result.data) > 0
            
            # Check for existing appointments
            result = supabase.table('appointments').select('appointment_id').eq('appointment_date', date_str).eq('source', 'wconline').limit(1).execute()
            has_existing_appts = result.data and len(result.data) > 0
    except Exception as e:
        print(f"⚠️ Error checking existing data: {e}")
    
    return has_existing_slots, has_existing_appts

# ============================================================================
# MAIN SYNC FUNCTION
# ============================================================================
def sync_date_to_supabase(date, supabase):
    """Fetch and sync data for a specific date"""
    date_str = date if isinstance(date, str) else date.strftime("%Y-%m-%d")
    
    print(f"\n{'='*70}")
    print(f"📅 Syncing date: {date_str}")
    print(f"{'='*70}\n")
    
    # Load tutor cache once for this date
    tutor_cache = get_all_tutors(supabase)
    
    # Check if old data exists in database
    has_existing_slots, has_existing_appts = check_existing_data(supabase, date_str)
    if has_existing_appts:
        print(f"ℹ️  Found existing appointments in database")
    
    # Track fetch success and new data
    custom_fetch_success = False
    has_new_custom_data = False
    custom_appointments = []
    
    # Fetch CUSTOM data (booked appointments) - this contains the checked fields
    print("\n📡 Fetching CUSTOM data (booked appointments)...")
    try:
        custom_data = fetch_wconline_data('CUSTOM', date)
        custom_fetch_success = True
        custom_appointments = filter_stem_center(custom_data if isinstance(custom_data, list) else [])
        if len(custom_appointments) > 0:
            has_new_custom_data = True
            print(f"✅ Found {len(custom_appointments)} booked appointments")
        else:
            print(f"ℹ️  API returned 0 appointments")
            # If fetch succeeded but no data, and old data exists, keep old data
            if has_existing_appts:
                print(f"💾 Keeping existing appointments (API returned empty but old data exists)")
    except Exception as e:
        print(f"❌ Error fetching CUSTOM data: {e}")
        print(f"ℹ️  Keeping existing data for this date")
    
    # CRITICAL: Only delete old data if we have NEW data (len > 0) to replace it
    # If fetch succeeded but returned 0 results, DO NOT delete old data
    should_replace = has_new_custom_data and len(custom_appointments) > 0
    
    # Additional safeguard: Never delete if fetch succeeded but returned empty
    if custom_fetch_success and len(custom_appointments) == 0:
        should_replace = False
        print(f"🔒 Safeguard: Fetch succeeded but returned 0 appointments - NOT deleting old data")
    
    if should_replace:
        print("\n🗑️  Replacing old appointments with new data...")
        try:
            # Check if using HTTP mode (dict) or supabase-py client
            use_http = isinstance(supabase, dict) and supabase.get('use_http')
            
            if use_http:
                url = supabase['url']
                key = supabase['key']
                headers = {
                    'apikey': key,
                    'Authorization': f'Bearer {key}'
                }
                print(f"   Deleting old appointments...")
                response = requests.delete(
                    f"{url}/rest/v1/appointments?appointment_date=eq.{date_str}&source=eq.wconline",
                    headers=headers
                )
                if response.status_code in [200, 204]:
                    print("✅ Old data deleted")
                else:
                    print(f"⚠️  Delete response: {response.status_code}")
            else:
                print(f"   Deleting old appointments...")
                supabase.table('appointments').delete().eq('appointment_date', date_str).eq('source', 'wconline').execute()
                print("✅ Old data deleted")
        except Exception as e:
            print(f"⚠️ Error deleting old data: {e}")
    else:
        # No replacement happening - explain why
        print(f"\n💾 Keeping existing data for this date:")
        if custom_fetch_success and len(custom_appointments) == 0:
            print(f"   - Fetch succeeded but returned 0 results - NOT deleting old data")
        elif not custom_fetch_success:
            print(f"   - Fetch failed - keeping existing data")
    
    # Sync CUSTOM appointments (only if we have new data)
    if has_new_custom_data:
        print(f"\n💾 Syncing {len(custom_appointments)} booked appointments...")
        synced_appts = 0
        failed_count = 0
        for idx, appointment in enumerate(custom_appointments, 1):
            tutor_name = appointment.get('Staff or Resource', 'Unknown')
            print(f"   [{idx}/{len(custom_appointments)}] {tutor_name}...", end=' ')
            if sync_appointment(supabase, tutor_cache, appointment, date_str):
                synced_appts += 1
                print("✅")
            else:
                failed_count += 1
                print("❌")
        print(f"\n✅ Synced {synced_appts}/{len(custom_appointments)} appointments")
        if failed_count > 0:
            print(f"❌ Failed: {failed_count} appointments")
    
    print(f"\n✅ Completed sync for {date_str}")

def sync_date_range(start_date, end_date, supabase):
    """Sync a range of dates"""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    current = start
    while current <= end:
        sync_date_to_supabase(current, supabase)
        if current < end:
            time.sleep(2)  # Small delay between dates
        current += timedelta(days=1)

def sync_avail_data_for_date_range(start_date, end_date, supabase):
    """Sync a range of dates for AVAIL data"""
    tutor_cache = get_all_tutors(supabase)
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")

    current = start
    while current <= end:
        date_str = current.strftime("%Y-%m-%d")
        print(f"\n{'='*70}")
        print(f"📅 Syncing AVAIL data for date: {date_str}")
        print(f"{'='*70}\n")
        try:
            avail_data = fetch_wconline_data('AVAIL', current)
            avail_slots = filter_stem_center(avail_data if isinstance(avail_data, list) else [])
            if len(avail_slots) > 0:
                print(f"✅ Found {len(avail_slots)} available slots")
                synced_slots = 0
                failed_count = 0
                for idx, slot in enumerate(avail_slots, 1):
                    tutor_name_from_slot = slot.get('Staff or Resource') or slot.get('Resource', '')
                    print(f"   [{idx}/{len(avail_slots)}] Tutor: '{tutor_name_from_slot}'...", end=' ')
                    if sync_available_slot(supabase, tutor_cache, slot, date_str):
                        synced_slots += 1
                        print("✅")
                    else:
                        failed_count += 1
                        print("❌")
                print(f"\n✅ Synced {synced_slots}/{len(avail_slots)} available slots")
                if failed_count > 0:
                    print(f"❌ Failed: {failed_count} available slots")
            else:
                print("ℹ️  API returned 0 available slots")

        except Exception as e:
            print(f"❌ Error fetching AVAIL data: {e}")

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

    start_date_str = None
    end_date_str = None

    if len(sys.argv) == 3:
        start_date_str = sys.argv[1]
        end_date_str = sys.argv[2]
    elif len(sys.argv) == 1:
        start_date = datetime.now()
        end_date = start_date + timedelta(days=6)
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
    else:
        print("Usage:")
        print("  python sync-wconline.py             # Sync for the next 7 days")
        print("  python sync-wconline.py <start_date> <end_date>  # Sync for a specific date range (YYYY-MM-DD)")
        sys.exit(1)
    
    try:
        # Validate dates
        datetime.strptime(start_date_str, "%Y-%m-%d")
        datetime.strptime(end_date_str, "%Y-%m-%d")
    except ValueError:
        print("❌ Invalid date format. Use YYYY-MM-DD.")
        sys.exit(1)

    sync_date_range(start_date_str, end_date_str, supabase)

    print("\n✨ All done!")
