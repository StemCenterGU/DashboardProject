#!/usr/bin/env python3
"""Test the today's appointments API call"""
import requests

today = '2026-02-04'
url = f"http://localhost:3000/api/scheduling/appointments?limit=50&start_date={today}&end_date={today}&sort=asc"

print(f"=== Testing API: {url} ===")
try:
    r = requests.get(url, timeout=5)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Count: {data.get('count', 0)}")
        print(f"Total: {data.get('total', 0)}")
        print("\nAppointments:")
        for apt in data.get('appointments', []):
            print(f"  {apt.get('start_time')} - {apt.get('student_name')} ({apt.get('tutor_name')})")
    else:
        print(f"Error: {r.text[:200]}")
except Exception as e:
    print(f"Request failed: {e}")
