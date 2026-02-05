#!/usr/bin/env python3
"""Add missing 18:00-19:00 slot for Avish on Sunday Jan 25"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}

# Get Avish's tutor_id
r = requests.get(f'{url}/rest/v1/tutors?tutor_name=ilike.*avish*&select=tutor_id,tutor_name', headers=headers)
tutors = r.json()
print(f"Found tutor: {tutors}")

if tutors:
    tutor_id = tutors[0]['tutor_id']
    
    # Add missing slot for Sunday Jan 25, 18:00-19:00
    slot_data = {
        'tutor_id': tutor_id,
        'slot_date': '2026-01-25',
        'start_time': '18:00:00',
        'end_time': '19:00:00',
        'is_booked': False,
        'source': 'wconline'
    }
    
    r = requests.post(
        f'{url}/rest/v1/available_slots',
        headers=headers,
        json=slot_data
    )
    
    if r.status_code in [200, 201]:
        print("[OK] Added missing slot: Sunday 18:00-19:00 for Avish")
    else:
        print(f"[X] Failed: {r.status_code} - {r.text}")
    
    # Now re-run extract to update tutor_availability
    print("\nNow run: python scripts/extract_tutor_avail.py")
