#!/usr/bin/env python3
"""Check today's appointments"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}'
}

today = '2026-02-04'

print(f"=== Appointments for {today} ===")
r = requests.get(
    f'{url}/rest/v1/appointments?appointment_date=eq.{today}&select=appointment_id,appointment_date,start_time,end_time,student_name,tutor_id,status&order=start_time',
    headers=headers
)

if r.status_code == 200:
    appts = r.json()
    print(f"Found: {len(appts)} appointments\n")
    for i, apt in enumerate(appts, 1):
        print(f"{i}. {apt['start_time']}-{apt['end_time']} | {apt['student_name']} | {apt['status']}")
else:
    print(f"Error: {r.status_code}")

# Also test the API endpoint
print("\n=== Testing Local API ===")
try:
    r2 = requests.get(f"http://localhost:3000/api/scheduling/appointments?start_date={today}&end_date={today}&sort=asc&limit=50", timeout=5)
    if r2.status_code == 200:
        data = r2.json()
        print(f"API returned: {data.get('count', 0)} appointments (total: {data.get('total', 0)})")
    else:
        print(f"API Error: {r2.status_code} - {r2.text[:200]}")
except Exception as e:
    print(f"Request failed: {e}")
