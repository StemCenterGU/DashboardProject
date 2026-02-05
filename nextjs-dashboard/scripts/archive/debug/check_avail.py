#!/usr/bin/env python3
"""Check tutor_availability table"""
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

# Get tutor_availability with tutor names
print("Fetching tutor_availability table...")
r = requests.get(
    f'{url}/rest/v1/tutor_availability?select=availability_id,tutor_id,day_of_week,start_time,end_time,is_available&order=tutor_id,day_of_week&limit=50',
    headers=headers
)

if r.status_code == 200:
    data = r.json()
    print(f"Found {len(data)} records")
    
    # Get tutor names
    tutors_r = requests.get(f'{url}/rest/v1/tutors?select=tutor_id,tutor_name', headers=headers)
    tutors = {t['tutor_id']: t['tutor_name'] for t in tutors_r.json()}
    
    day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    print("\nSample records:")
    for i, row in enumerate(data[:20]):
        tutor_name = tutors.get(row['tutor_id'], 'Unknown')
        day = day_names[row['day_of_week']] if row['day_of_week'] < 7 else '?'
        print(f"  {tutor_name}: {day} {row['start_time']}-{row['end_time']} (available={row['is_available']})")
else:
    print(f"Error: {r.status_code} - {r.text}")
