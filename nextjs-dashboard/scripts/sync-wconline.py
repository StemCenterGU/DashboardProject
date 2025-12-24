#!/usr/bin/env python3
"""
Unified WCOnline Sync Script
Fetches data from WCOnline API and syncs directly to Supabase
Based on api.ipynb approach
"""

import requests
import pandas as pd
import json
import sys
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
    # Try to load from .env.local
    try:
        from dotenv import load_dotenv
        load_dotenv('.env.local')
    except:
        pass
    
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')
    
    if not url or not key:
        print("❌ Supabase credentials not found!")
        print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        print("   Or create .env.local file with these variables")
        return None
    
    if HAS_SUPABASE_PY:
        try:
            supabase = create_client(url, key)
            return supabase
        except Exception as e:
            print(f"❌ Error creating Supabase client: {e}")
            return None
    else:
        # Return a simple dict-based client for HTTP requests
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

def find_or_create_tutor(supabase, tutor_name, tutor_email=None):
    """Find or create tutor in Supabase"""
    if not tutor_name:
        return None
    
    # Generate placeholder email if needed
    if not tutor_email:
        tutor_email = f"{tutor_name.lower().replace(' ', '').replace('.', '')}@tutor.gannon.edu"
    
    if supabase.get('use_http'):
        # Use HTTP requests directly
        url = supabase['url']
        key = supabase['key']
        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json'
        }
        
        # Find user by email
        response = requests.get(
            f"{url}/rest/v1/users?email=eq.{tutor_email.lower()}&select=user_id",
            headers=headers
        )
        
        if response.status_code == 200 and response.json():
            user_id = response.json()[0]['user_id']
        else:
            # Create new user
            response = requests.post(
                f"{url}/rest/v1/users",
                headers=headers,
                json={
                    'email': tutor_email.lower(),
                    'full_name': tutor_name,
                    'role': 'tutor',
                    'active': True
                }
            )
            if response.status_code in [200, 201] and response.json():
                user_id = response.json()[0]['user_id']
            else:
                return None
        
        # Find or create tutor
        response = requests.get(
            f"{url}/rest/v1/tutors?user_id=eq.{user_id}&select=tutor_id",
            headers=headers
        )
        
        if response.status_code == 200 and response.json():
            return response.json()[0]['tutor_id']
        else:
            response = requests.post(
                f"{url}/rest/v1/tutors",
                headers=headers,
                json={'user_id': user_id, 'is_available': True}
            )
            if response.status_code in [200, 201] and response.json():
                return response.json()[0]['tutor_id']
        
        return None
    else:
        # Use supabase-py
        result = supabase.table('users').select('user_id').eq('email', tutor_email.lower()).limit(1).execute()
        
        if result.data and len(result.data) > 0:
            user_id = result.data[0]['user_id']
        else:
            result = supabase.table('users').insert({
                'email': tutor_email.lower(),
                'full_name': tutor_name,
                'role': 'tutor',
                'active': True
            }).select('user_id').execute()
            
            if not result.data:
                return None
            user_id = result.data[0]['user_id']
        
        result = supabase.table('tutors').select('tutor_id').eq('user_id', user_id).limit(1).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]['tutor_id']
        else:
            result = supabase.table('tutors').insert({
                'user_id': user_id,
                'is_available': True
            }).select('tutor_id').execute()
            
            if result.data:
                return result.data[0]['tutor_id']
        
        return None

def find_or_create_course(supabase, course_code=None, course_name=None):
    """Find or create course in Supabase"""
    if not course_code and not course_name:
        return None
    
    if supabase.get('use_http'):
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
        # Use supabase-py
        # Try to find by course code
        if course_code:
            result = supabase.table('courses').select('course_id').eq('course_code', course_code.upper()).limit(1).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]['course_id']
        
        # Try to find by name
        if course_name:
            result = supabase.table('courses').select('course_id').ilike('course_name', f'%{course_name}%').limit(1).execute()
            if result.data and len(result.data) > 0:
                return result.data[0]['course_id']
        
        # Create new course
        course_data = {'active': True}
        if course_code:
            course_data['course_code'] = course_code.upper()
        if course_name:
            course_data['course_name'] = course_name
        elif course_code:
            course_data['course_name'] = course_code
        
        result = supabase.table('courses').insert(course_data).select('course_id').single().execute()
        if result.data:
            return result.data[0]['course_id']
        
        return None

def sync_available_slot(supabase, slot, date_str):
    """Sync an available slot to Supabase with all WCOnline fields"""
    tutor_name = slot.get('Staff or Resource', '')
    tutor_email = slot.get('Staff Email', '')
    tutor_id = find_or_create_tutor(supabase, tutor_name, tutor_email)
    
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
        if supabase.get('use_http'):
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

def sync_appointment(supabase, appointment, date_str):
    """Sync a booked appointment to Supabase with all WCOnline fields"""
    tutor_name = appointment.get('Staff or Resource', '')
    student_name = appointment.get('Student Name', '')
    tutor_email = appointment.get('Staff Email', '')
    tutor_id = find_or_create_tutor(supabase, tutor_name, tutor_email)
    
    if not tutor_id:
        return False
    
    start_time = convert_to_24_hour(appointment.get('Start Time', ''))
    end_time = convert_to_24_hour(appointment.get('End Time', ''))
    
    if not start_time or not end_time or not re.match(r'^\d{2}:\d{2}$', start_time):
        return False
    
    # Extract all WCOnline fields (try multiple possible field names for flexibility)
    course_code = (appointment.get('Course Code') or 
                   appointment.get('Course') or 
                   appointment.get('course_code') or 
                   '')
    course_name = (appointment.get('Course Name') or 
                   appointment.get('Course') or 
                   appointment.get('course_name') or 
                   '')
    course_instructor = (appointment.get('Course Instructor') or 
                         appointment.get('Course instructor') or 
                         appointment.get('course_instructor') or 
                         '')
    
    # Find or create course
    course_id = None
    if course_code or course_name:
        course_id = find_or_create_course(supabase, course_code, course_name)
    
    # Determine status based on Missed/No-Show (try multiple field names)
    status = 'scheduled'
    is_missed = False
    missed_value = (appointment.get('Missed/No-Show') or 
                   appointment.get('Missed/No Show') or 
                   appointment.get('Missed') or 
                   appointment.get('No-Show') or 
                   appointment.get('No Show') or 
                   '')
    if missed_value and str(missed_value).lower() not in ['', 'false', '0', 'no']:
        is_missed = True
        if 'no-show' in str(missed_value).lower() or 'no show' in str(missed_value).lower():
            status = 'no_show'
        else:
            status = 'missed'
    
    # Generate appointment ID (use WCOnline ID if available)
    appointment_id = (appointment.get('Appointment ID') or 
                     appointment.get('AppointmentID') or 
                     appointment.get('ID') or 
                     appointment.get('id') or
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
            return value.lower() in ['true', 'yes', '1', 'y']
        return bool(value)
    
    # Build appointment data with all WCOnline fields (using flexible field name matching)
    appointment_data = {
        'appointment_id': appointment_id,
        'tutor_id': tutor_id,
        'student_name': student_name,
        'student_email': (appointment.get('Student Email') or 
                         appointment.get('student_email') or 
                         ''),
        'course_id': course_id,
        'appointment_date': date_str,
        'start_time': start_time,
        'end_time': end_time,
        'duration': duration,
        'status': status,
        'notes': (appointment.get('Notes') or 
                 appointment.get('notes') or 
                 appointment.get('Focus') or 
                 appointment.get('focus') or 
                 ''),
        'source': 'wconline',
        # WCOnline specific fields
        'schedule_title': (appointment.get('Schedule Title') or 
                          appointment.get('schedule_title') or 
                          ''),
        'is_walk_in': safe_bool(appointment.get('Walk-In/Drop-In') or 
                               appointment.get('Walk-In') or 
                               appointment.get('Walk In') or
                               appointment.get('walk_in') or
                               False),
        'is_missed': is_missed,
        'is_online': safe_bool(appointment.get('Online') or 
                              appointment.get('online') or
                              False),
        'focus': (appointment.get('Focus') or 
                 appointment.get('focus') or 
                 ''),
        'created_by': (appointment.get('Created By') or 
                      appointment.get('created_by') or 
                      ''),
        'modified_by': (appointment.get('Modified By') or 
                       appointment.get('modified_by') or 
                       ''),
        'is_repeating': safe_bool(appointment.get('Repeating') or 
                                 appointment.get('repeating') or
                                 False),
        'course_instructor': course_instructor,
        'course_code': course_code.upper() if course_code else None,
        'course_name': course_name if course_name else None,
    }
    
    try:
        if supabase.get('use_http'):
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
            return response.status_code in [200, 201]
        else:
            result = supabase.table('appointments').upsert(
                appointment_data,
                on_conflict='appointment_id'
            ).execute()
            return True
    except Exception as e:
        return False

def check_existing_data(supabase, date_str):
    """Check if old data exists in database for a given date"""
    has_existing_slots = False
    has_existing_appts = False
    
    try:
        if supabase.get('use_http'):
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
    
    # Check if old data exists in database
    has_existing_slots, has_existing_appts = check_existing_data(supabase, date_str)
    if has_existing_slots:
        print(f"ℹ️  Found existing CUSTOM slots in database")
    if has_existing_appts:
        print(f"ℹ️  Found existing AVAIL appointments in database")
    
    # Track fetch success and new data
    custom_fetch_success = False
    avail_fetch_success = False
    has_new_custom_data = False
    has_new_avail_data = False
    custom_slots = []
    avail_appointments = []
    
    # Fetch CUSTOM data (available slots) FIRST
    print("\n📡 Fetching CUSTOM data...")
    try:
        custom_data = fetch_wconline_data('CUSTOM', date)
        custom_fetch_success = True
        custom_slots = filter_stem_center(custom_data if isinstance(custom_data, list) else [])
        if len(custom_slots) > 0:
            has_new_custom_data = True
            print(f"✅ Found {len(custom_slots)} CUSTOM slots")
        else:
            print(f"ℹ️  API returned 0 CUSTOM slots")
            # If fetch succeeded but no data, and old data exists, keep old data
            if has_existing_slots:
                print(f"💾 Keeping existing CUSTOM slots (API returned empty but old data exists)")
    except Exception as e:
        print(f"❌ Error fetching CUSTOM data: {e}")
        print(f"ℹ️  Keeping existing data for this date")
    
    # Wait between requests
    time.sleep(15)
    
    # Fetch AVAIL data (booked appointments) - only for future dates
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    if date_obj >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0):
        print("\n📡 Fetching AVAIL data...")
        try:
            avail_data = fetch_wconline_data('AVAIL', date)
            avail_fetch_success = True
            avail_appointments = filter_stem_center(avail_data if isinstance(avail_data, list) else [])
            if len(avail_appointments) > 0:
                has_new_avail_data = True
                print(f"✅ Found {len(avail_appointments)} AVAIL appointments")
            else:
                print(f"ℹ️  API returned 0 AVAIL appointments")
                # If fetch succeeded but no data, and old data exists, keep old data
                if has_existing_appts:
                    print(f"💾 Keeping existing AVAIL appointments (API returned empty but old data exists)")
        except Exception as e:
            print(f"❌ Error fetching AVAIL data: {e}")
            print(f"ℹ️  Keeping existing data for this date")
    else:
        print("\n⏭️  Skipping AVAIL (past date - no appointments available for booking)")
    
    # CRITICAL: Only delete old data if we have NEW data (len > 0) to replace it
    # If fetch succeeded but returned 0 results, DO NOT delete old data
    # Rule: has_new_custom_data is True ONLY if len(custom_slots) > 0
    should_replace_custom = has_new_custom_data and len(custom_slots) > 0
    should_replace_avail = has_new_avail_data and len(avail_appointments) > 0
    
    # Additional safeguard: Never delete if fetch succeeded but returned empty
    if custom_fetch_success and len(custom_slots) == 0:
        should_replace_custom = False
        print(f"🔒 Safeguard: Fetch succeeded but returned 0 CUSTOM slots - NOT deleting old data")
    
    if avail_fetch_success and len(avail_appointments) == 0:
        should_replace_avail = False
        print(f"🔒 Safeguard: Fetch succeeded but returned 0 AVAIL appointments - NOT deleting old data")
    
    if should_replace_custom or should_replace_avail:
        print("\n🗑️  Replacing old data with new data...")
        try:
            if supabase.get('use_http'):
                url = supabase['url']
                key = supabase['key']
                headers = {
                    'apikey': key,
                    'Authorization': f'Bearer {key}'
                }
                if should_replace_custom:
                    print(f"   Deleting old CUSTOM slots...")
                    requests.delete(
                        f"{url}/rest/v1/available_slots?slot_date=eq.{date_str}&source=eq.wconline",
                        headers=headers
                    )
                if should_replace_avail:
                    print(f"   Deleting old AVAIL appointments...")
                    requests.delete(
                        f"{url}/rest/v1/appointments?appointment_date=eq.{date_str}&source=eq.wconline",
                        headers=headers
                    )
            else:
                if should_replace_custom:
                    print(f"   Deleting old CUSTOM slots...")
                    supabase.table('available_slots').delete().eq('slot_date', date_str).eq('source', 'wconline').execute()
                if should_replace_avail:
                    print(f"   Deleting old AVAIL appointments...")
                    supabase.table('appointments').delete().eq('appointment_date', date_str).eq('source', 'wconline').execute()
            print("✅ Old data deleted")
        except Exception as e:
            print(f"⚠️ Error deleting old data: {e}")
    else:
        # No replacement happening - explain why
        print(f"\n💾 Keeping existing data for this date:")
        if custom_fetch_success and len(custom_slots) == 0:
            print(f"   - CUSTOM fetch succeeded but returned 0 results - NOT deleting old data")
        elif not custom_fetch_success:
            print(f"   - CUSTOM fetch failed - keeping existing data")
        
        if date_obj >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0):
            if avail_fetch_success and len(avail_appointments) == 0:
                print(f"   - AVAIL fetch succeeded but returned 0 results - NOT deleting old data")
            elif not avail_fetch_success:
                print(f"   - AVAIL fetch failed - keeping existing data")
    
    # Sync CUSTOM slots (only if we have new data)
    if has_new_custom_data:
        print(f"\n💾 Syncing {len(custom_slots)} CUSTOM slots...")
        synced_slots = 0
        for slot in custom_slots:
            if sync_available_slot(supabase, slot, date_str):
                synced_slots += 1
        print(f"✅ Synced {synced_slots}/{len(custom_slots)} slots")
    
    # Sync AVAIL appointments (only if we have new data)
    if has_new_avail_data:
        print(f"\n💾 Syncing {len(avail_appointments)} AVAIL appointments...")
        synced_appts = 0
        for appointment in avail_appointments:
            if sync_appointment(supabase, appointment, date_str):
                synced_appts += 1
        print(f"✅ Synced {synced_appts}/{len(avail_appointments)} appointments")
    
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

# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__":
    # Check Supabase connection
    supabase = get_supabase_client()
    if not supabase:
        print("\n❌ Cannot proceed without Supabase connection")
        sys.exit(1)
    
    # Parse arguments
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python sync-wconline.py <date>              # Single date (YYYY-MM-DD)")
        print("  python sync-wconline.py <start> <end>       # Date range")
        print("  python sync-wconline.py --today             # Today + 13 days")
        print("\nExample:")
        print("  python sync-wconline.py 2025-01-15")
        print("  python sync-wconline.py 2025-01-01 2025-01-14")
        sys.exit(1)
    
    if sys.argv[1] == "--today":
        start_date = datetime.now()
        end_date = start_date + timedelta(days=13)
        sync_date_range(start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"), supabase)
    elif len(sys.argv) == 2:
        # Single date - fetch 2 weeks
        start_date = datetime.strptime(sys.argv[1], "%Y-%m-%d")
        end_date = start_date + timedelta(days=13)
        sync_date_range(sys.argv[1], end_date.strftime("%Y-%m-%d"), supabase)
    elif len(sys.argv) == 3:
        # Date range
        sync_date_range(sys.argv[1], sys.argv[2], supabase)
    else:
        print("Invalid arguments")
        sys.exit(1)
    
    print("\n✨ All done!")

