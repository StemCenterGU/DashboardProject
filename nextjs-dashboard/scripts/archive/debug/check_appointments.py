#!/usr/bin/env python3
"""Check upcoming appointments"""
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

today = '2026-02-04'

print(f"=== Appointments from {today} onwards ===")
r = requests.get(
    f'{url}/rest/v1/appointments?appointment_date=gte.{today}&select=appointment_id,appointment_date,start_time,end_time,tutor_id,student_name,status&order=appointment_date,start_time&limit=20',
    headers=headers
)
appts = r.json()
print(f"Found: {len(appts)} appointments\n")

# Get tutor names
r2 = requests.get(f'{url}/rest/v1/tutors?select=tutor_id,tutor_name', headers=headers)
tutors = {t['tutor_id']: t['tutor_name'] for t in r2.json()}

for appt in appts:
    tutor_name = tutors.get(appt['tutor_id'], 'Unknown')
    print(f"  {appt['appointment_date']} {appt['start_time']}-{appt['end_time']}")
    print(f"    Tutor: {tutor_name}")
    print(f"    Student: {appt.get('student_name', 'N/A')}")
    print(f"    Status: {appt.get('status', 'N/A')}")
    print()

# Check the structure of appointments table
print("\n=== Sample appointment structure ===")
if appts:
    import json
    print(json.dumps(appts[0], indent=2))
