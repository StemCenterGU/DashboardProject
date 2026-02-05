#!/usr/bin/env python3
"""Test the appointments API"""
import requests

# Test the API directly
url = "http://localhost:3000/api/scheduling/appointments"

# Test without filter
print("=== Without date filter ===")
r = requests.get(f"{url}?limit=10")
if r.status_code == 200:
    data = r.json()
    print(f"Count: {data.get('count', 0)}")
    for apt in data.get('appointments', [])[:5]:
        print(f"  {apt.get('appointment_date')} {apt.get('start_time')} - {apt.get('student_name')}")
else:
    print(f"Error: {r.status_code} - {r.text}")

# Test with date filter (today = 2026-02-04)
print("\n=== With start_date=2026-02-04 ===")
r = requests.get(f"{url}?limit=10&start_date=2026-02-04&sort=asc")
if r.status_code == 200:
    data = r.json()
    print(f"Count: {data.get('count', 0)}")
    for apt in data.get('appointments', [])[:5]:
        print(f"  {apt.get('appointment_date')} {apt.get('start_time')} - {apt.get('student_name')}")
else:
    print(f"Error: {r.status_code} - {r.text}")

# Check what date the browser would use
from datetime import datetime
print(f"\n=== System date ===")
print(f"Current system date: {datetime.now().strftime('%Y-%m-%d')}")
