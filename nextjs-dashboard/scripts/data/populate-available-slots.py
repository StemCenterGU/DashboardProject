#!/usr/bin/env python3
"""
Populate Available Slots from Tutor Availability
Generates available_slots entries from tutor_availability patterns until December 7
Excludes slots that are already booked (exist in appointments table)
"""

import requests
import sys
import os
import io
from datetime import datetime, timedelta

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    try:
        # Python 3.7+ supports reconfigure
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except (AttributeError, io.UnsupportedOperation):
        # Fallback to wrapping
        try:
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
        except:
            pass

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except:
    pass

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

def get_tutor_availability():
    """Fetch all tutor availability patterns from tutor_availability table"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Supabase credentials not found!")
        return []
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/tutor_availability?select=tutor_id,day_of_week,start_time,end_time&is_available=eq.true",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json() or []
        else:
            print(f"❌ Error fetching tutor availability: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def get_appointments_for_date(date_str):
    """Fetch all appointments for a specific date"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/appointments?select=tutor_id,start_time,end_time&appointment_date=eq.{date_str}",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json() or []
        else:
            return []
    except Exception as e:
        return []

def is_slot_booked(slot, appointments):
    """Check if a slot overlaps with any appointment"""
    slot_start = slot['start_time']
    slot_end = slot['end_time']
    
    for apt in appointments:
        if apt['tutor_id'] != slot['tutor_id']:
            continue
        
        apt_start = apt['start_time']
        apt_end = apt['end_time']
        
        # Check if slots overlap
        # Slot overlaps if: slot_start < apt_end AND slot_end > apt_start
        if slot_start < apt_end and slot_end > apt_start:
            return True
    
    return False

def insert_available_slots(slots, date_str):
    """Insert available slots into available_slots table"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return 0
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    
    inserted = 0
    for slot in slots:
        slot_data = {
            'tutor_id': slot['tutor_id'],
            'slot_date': date_str,
            'start_time': slot['start_time'],
            'end_time': slot['end_time'],
            'is_booked': False,
            'source': 'tutor_availability'
        }
        
        try:
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/available_slots",
                headers=headers,
                json=slot_data
            )
            
            if response.status_code in [200, 201]:
                inserted += 1
        except Exception as e:
            print(f"   [!] Error inserting slot: {e}")
    
    return inserted

def main():
    """Main function"""
    print("="*70)
    print("[*] Populate Available Slots from Tutor Availability")
    print("="*70)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n[X] Supabase credentials not found!")
        print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    
    # Parse command-line arguments for dates
    if len(sys.argv) < 3:
        print("\nUsage:")
        print("  python populate-available-slots.py <start_date> <end_date>")
        print("\nExample:")
        print("  python populate-available-slots.py 2025-01-01 2025-12-07")
        sys.exit(1)
    
    try:
        start_date_str = sys.argv[1]
        end_date_str = sys.argv[2]
        
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
        
        # Normalize to start of day
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if start_date > end_date:
            print(f"\n[!] Start date ({start_date.date()}) is after end date ({end_date.date()})")
            sys.exit(1)
        
        print(f"\n[*] Date range: {start_date.date()} to {end_date.date()}")
    except ValueError as e:
        print(f"\n[X] Invalid date format. Use YYYY-MM-DD format (e.g., 2025-01-01)")
        print(f"   Error: {e}")
        sys.exit(1)
    
    # Fetch tutor availability patterns
    print("\n[>] Fetching tutor availability patterns...")
    tutor_availability = get_tutor_availability()
    
    if not tutor_availability:
        print("[X] No tutor availability patterns found!")
        print("   Please run import-tutor-availability.py first to import tutor schedules")
        sys.exit(1)
    
    print(f"[OK] Found {len(tutor_availability)} availability patterns")
    
    # Generate slots for each date
    print(f"\n[>] Generating available slots (excluding booked appointments)...")
    current_date = start_date
    total_slots = 0
    total_inserted = 0
    total_excluded = 0
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        day_of_week = current_date.weekday()  # 0 = Monday, 6 = Sunday
        
        # Convert to Sunday=0 format (tutor_availability uses Sunday=0)
        # Python weekday(): Monday=0, Sunday=6
        # We need: Sunday=0, Monday=1, ..., Saturday=6
        day_of_week_sunday = (day_of_week + 1) % 7
        
        # Filter availability for this day of week
        slots_for_day = [
            avail for avail in tutor_availability 
            if avail['day_of_week'] == day_of_week_sunday
        ]
        
        if slots_for_day:
            # Get appointments for this date
            appointments = get_appointments_for_date(date_str)
            
            # Filter out slots that are booked (overlap with appointments)
            available_slots = [
                slot for slot in slots_for_day
                if not is_slot_booked(slot, appointments)
            ]
            
            excluded_count = len(slots_for_day) - len(available_slots)
            total_excluded += excluded_count
            
            if available_slots:
                inserted = insert_available_slots(available_slots, date_str)
                total_slots += len(available_slots)
                total_inserted += inserted
                if inserted > 0:
                    print(f"   {date_str}: {inserted}/{len(available_slots)} slots (excluded {excluded_count} booked)")
        
        current_date += timedelta(days=1)
    
    print("\n" + "="*70)
    print("[OK] Complete!")
    print("="*70)
    print(f"\n[*] Summary:")
    print(f"   Total available slots generated: {total_slots}")
    print(f"   Successfully inserted: {total_inserted}")
    print(f"   Excluded (booked): {total_excluded}")
    print(f"   Date range: {start_date.date()} to {end_date.date()}")

if __name__ == "__main__":
    main()

