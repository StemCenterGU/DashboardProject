#!/usr/bin/env python3
"""Check for Ryan and Isaac tutor entries"""
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

# Check for Ryan
print("=== Tutors matching 'ryan' ===")
r = requests.get(f'{url}/rest/v1/tutors?tutor_name=ilike.*ryan*&select=tutor_id,tutor_name', headers=headers)
for t in r.json():
    print(f"  ID: {t['tutor_id']}")
    print(f"  Name: '{t['tutor_name']}'")
    print(f"  Chars: {[hex(ord(c)) for c in t['tutor_name']]}")
    print()

# Check for Isaac
print("=== Tutors matching 'isaac' ===")
r = requests.get(f'{url}/rest/v1/tutors?tutor_name=ilike.*isaac*&select=tutor_id,tutor_name', headers=headers)
for t in r.json():
    print(f"  ID: {t['tutor_id']}")
    print(f"  Name: '{t['tutor_name']}'")
    print(f"  Chars: {[hex(ord(c)) for c in t['tutor_name']]}")
    print()
