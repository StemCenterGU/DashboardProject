#!/usr/bin/env python3
"""Check raw data for Avish to debug the issue"""
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

# Get Avish's tutor_id
r = requests.get(f'{url}/rest/v1/tutors?tutor_name=ilike.*avish*&select=tutor_id,tutor_name', headers=headers)
tutors = r.json()
print(f"Tutors matching 'avish': {tutors}")

if tutors:
    tutor_id = tutors[0]['tutor_id']
    print(f"\nTutor ID: {tutor_id}")
    
    # Get available_slots for Avish from Jan 25-30
    print("\n=== AVAILABLE SLOTS (Jan 25-30) ===")
    r = requests.get(
        f'{url}/rest/v1/available_slots?tutor_id=eq.{tutor_id}&slot_date=gte.2026-01-25&slot_date=lte.2026-01-30&select=slot_date,start_time,end_time&order=slot_date,start_time',
        headers=headers
    )
    slots = r.json()
    
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    for slot in slots:
        dt = datetime.strptime(slot['slot_date'], '%Y-%m-%d')
        day = day_names[dt.weekday()]
        print(f"  {slot['slot_date']} ({day}): {slot['start_time']} - {slot['end_time']}")
    
    # Get appointments for Avish from Jan 25-30
    print("\n=== APPOINTMENTS (Jan 25-30) ===")
    r = requests.get(
        f'{url}/rest/v1/appointments?tutor_id=eq.{tutor_id}&appointment_date=gte.2026-01-25&appointment_date=lte.2026-01-30&select=appointment_date,start_time,end_time&order=appointment_date,start_time',
        headers=headers
    )
    appts = r.json()
    
    for appt in appts:
        dt = datetime.strptime(appt['appointment_date'], '%Y-%m-%d')
        day = day_names[dt.weekday()]
        print(f"  {appt['appointment_date']} ({day}): {appt['start_time']} - {appt['end_time']}")
    
    print("\n=== COMBINED BY DAY OF WEEK ===")
    from collections import defaultdict
    by_day = defaultdict(list)
    
    for slot in slots:
        dt = datetime.strptime(slot['slot_date'], '%Y-%m-%d')
        day = day_names[dt.weekday()]
        by_day[day].append((slot['start_time'], slot['end_time'], 'avail'))
    
    for appt in appts:
        dt = datetime.strptime(appt['appointment_date'], '%Y-%m-%d')
        day = day_names[dt.weekday()]
        by_day[day].append((appt['start_time'], appt['end_time'], 'appt'))
    
    for day in ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']:
        if day in by_day:
            times = sorted(by_day[day], key=lambda x: x[0])
            print(f"\n{day}:")
            for t in times:
                print(f"  {t[0]} - {t[1]} ({t[2]})")
