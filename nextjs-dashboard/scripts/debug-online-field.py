#!/usr/bin/env python3
"""
Debug WCOnline Online Field
Check what WCOnline returns for the 'Online' field
"""

import requests
import sys
from datetime import datetime

API_KEY = "a519p8qKJGpnjo8asdgOIUNHLJ5342"
BASE_URL = "https://gannon.mywconline.com/api"

def fetch_wconline_data(date_str):
    """Fetch CUSTOM data from WCOnline for a specific date"""
    # Format date to YYYYMMDD
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    request_date = date_obj.strftime("%Y%m%d")
    
    url = f"{BASE_URL}?type=CUSTOM&date={request_date}"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    print(f"📡 Fetching data for {date_str} ({request_date})...")
    print(f"URL: {url}\n")
    
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def main():
    if len(sys.argv) < 2:
        print("Usage: python debug-online-field.py YYYY-MM-DD")
        print("Example: python debug-online-field.py 2025-08-24")
        sys.exit(1)
    
    date_str = sys.argv[1]
    
    print("="*70)
    print("🔬 Debugging WCOnline 'Online' Field")
    print("="*70 + "\n")
    
    # Fetch data
    data = fetch_wconline_data(date_str)
    
    if not isinstance(data, list):
        print(f"❌ Unexpected data format: {type(data)}")
        return
    
    # Filter for STEM Center
    stem_appointments = [
        apt for apt in data 
        if 'Schedule Title' in apt and 'STEM CENTER' in str(apt.get('Schedule Title', '')).upper()
    ]
    
    print(f"✅ Found {len(stem_appointments)} STEM Center appointments\n")
    print("="*70)
    
    # Analyze each appointment
    for idx, apt in enumerate(stem_appointments, 1):
        print(f"\n📋 Appointment #{idx}")
        print("-" * 70)
        print(f"  Staff: {apt.get('Staff or Resource', 'Unknown')}")
        print(f"  Student: {apt.get('Created By', 'Unknown')}")
        print(f"  Time: {apt.get('Start Time', '')} - {apt.get('End Time', '')}")
        print(f"  Schedule Title: {apt.get('Schedule Title', '')}")
        print(f"  Focus: {apt.get('Focus', '')}")
        print(f"  Online field: {apt.get('Online', 'NOT PRESENT')}")
        print(f"  Walk-In: {apt.get('Walk-In/Drop-In', 'NOT PRESENT')}")
        
        # Check all field keys that might indicate online
        online_keywords = ['online', 'zoom', 'virtual', 'remote']
        potential_online_fields = []
        
        for key, value in apt.items():
            if any(keyword in str(key).lower() for keyword in online_keywords):
                potential_online_fields.append(f"{key}: {value}")
            if any(keyword in str(value).lower() for keyword in online_keywords):
                potential_online_fields.append(f"{key}: {value}")
        
        if potential_online_fields:
            print(f"  🔍 Fields containing online keywords:")
            for field in potential_online_fields:
                print(f"     - {field}")
    
    # Summary
    print("\n" + "="*70)
    print("📊 Summary")
    print("="*70)
    
    with_online_true = sum(1 for apt in stem_appointments if apt.get('Online') == True or apt.get('Online') == 'true' or apt.get('Online') == 'True')
    with_online_field = sum(1 for apt in stem_appointments if 'Online' in apt)
    
    print(f"  Total appointments: {len(stem_appointments)}")
    print(f"  Appointments with 'Online' field: {with_online_field}")
    print(f"  Appointments with Online=true: {with_online_true}")
    
    # Print all unique field names
    all_fields = set()
    for apt in stem_appointments:
        all_fields.update(apt.keys())
    
    print(f"\n  All field names in WCOnline data:")
    for field in sorted(all_fields):
        print(f"    - {field}")

if __name__ == "__main__":
    main()
