#!/usr/bin/env python3
"""Check for duplicate Zoe entries"""
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

# Search for all tutors with "zo" in name
r = requests.get(f'{url}/rest/v1/tutors?tutor_name=ilike.*zo*&select=tutor_id,tutor_name', headers=headers)
tutors = r.json()

print("=== Tutors matching 'zo' ===")
for t in tutors:
    name = t['tutor_name']
    # Show character codes to see special characters
    print(f"  ID: {t['tutor_id']}")
    print(f"  Name: '{name}'")
    print(f"  Chars: {[hex(ord(c)) for c in name]}")
    print()

# Also check for similar names
print("\n=== All tutors (sorted) ===")
r = requests.get(f'{url}/rest/v1/tutors?select=tutor_id,tutor_name&order=tutor_name', headers=headers)
all_tutors = r.json()

for t in all_tutors:
    print(f"  {t['tutor_name']}")
