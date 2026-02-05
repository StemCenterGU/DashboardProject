#!/usr/bin/env python3
"""Check appointments directly from Supabase"""
import requests
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}'
}

# Check current system date
print(f"=== System Date ===")
print(f"System date: {datetime.now().strftime('%Y-%m-%d')}")

# Get appointments from Feb 4 onwards
print("\n=== Appointments from 2026-02-04 onwards ===")
r = requests.get(
    f'{url}/rest/v1/appointments?appointment_date=gte.2026-02-04&select=appointment_id,appointment_date,start_time,tutor_id,student_name,status&order=appointment_date,start_time&limit=10',
    headers=headers
)
if r.status_code == 200:
    appts = r.json()
    print(f"Found: {len(appts)} appointments")
    for apt in appts:
        print(f"  {apt['appointment_date']} {apt['start_time']} - {apt['student_name']} ({apt['status']})")
else:
    print(f"Error: {r.status_code}")

# The ISSUE: Browser uses system date, not 2026-02-04
# If system date is 2025, it will filter for appointments >= 2025, showing nothing from 2026
print("\n=== THE ISSUE ===")
print(f"Browser's 'today' will be: {datetime.now().strftime('%Y-%m-%d')}")
print(f"But appointments are in: 2026-02-04")
print(f"If system date is in the past, no upcoming appointments will be found!")
