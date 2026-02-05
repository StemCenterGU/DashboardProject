#!/usr/bin/env python3
"""Test the local Next.js API"""
import requests

# Test the local API
url = "http://localhost:3000/api/scheduling/appointments"

print("=== Test 1: Without any filter ===")
try:
    r = requests.get(f"{url}?limit=10", timeout=5)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Count: {data.get('count', 0)}")
        for apt in data.get('appointments', [])[:3]:
            print(f"  {apt.get('appointment_date')} - {apt.get('student_name')}")
    else:
        print(f"Error: {r.text[:200]}")
except Exception as e:
    print(f"Request failed: {e}")

print("\n=== Test 2: With start_date filter ===")
try:
    r = requests.get(f"{url}?limit=10&start_date=2026-02-04&sort=asc", timeout=5)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Count: {data.get('count', 0)}")
        for apt in data.get('appointments', [])[:3]:
            print(f"  {apt.get('appointment_date')} - {apt.get('student_name')}")
    else:
        print(f"Error: {r.text[:200]}")
except Exception as e:
    print(f"Request failed: {e}")
