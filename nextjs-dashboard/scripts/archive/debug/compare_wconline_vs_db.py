#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
import os
import requests
from dotenv import load_dotenv

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv('.env.local')

# WCOnline API
API_KEY = "a519p8qKJGpnjo8asdgOIUNHLJ5342"
BASE_URL = "https://gannon.mywconline.com/api"

# Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}'
}

print("🔍 Comparing WCOnline AVAIL data vs Database slots\n")
print("="*70)

# Fetch WCOnline AVAIL data
print("\n📡 Fetching AVAIL data from WCOnline...")
response = requests.get(
    f"{BASE_URL}?type=AVAIL&date=20260125",
    headers={"Authorization": f"Bearer {API_KEY}"}
)
wconline_data = response.json()
print(f"✅ Total entries from WCOnline: {len(wconline_data)}")

# Filter for STEM Center
import pandas as pd
df = pd.DataFrame(wconline_data)
stem_df = df[df["Schedule Title"].str.upper().str.contains("STEM CENTER", na=False)]
print(f"✅ STEM Center entries: {len(stem_df)}")

# Get unique tutors from WCOnline (using 'Resource' column)
wconline_tutors = set()
for _, row in stem_df.iterrows():
    resource = row.get('Resource', '')
    if resource and resource.strip():
        # Skip exam entries
        if 'exam' not in resource.lower() and 'readiness' not in resource.lower():
            wconline_tutors.add(resource.strip())

print(f"✅ Unique tutors in WCOnline AVAIL: {len(wconline_tutors)}")
print(f"\nWCOnline tutors:")
for i, tutor in enumerate(sorted(wconline_tutors), 1):
    print(f"  {i}. {tutor}")

# Fetch database tutors
print(f"\n\n📊 Fetching tutors from database...")
response = requests.get(
    f'{SUPABASE_URL}/rest/v1/tutors?select=tutor_id,tutor_name',
    headers=headers
)
db_tutors = response.json()
db_tutor_names = set(t['tutor_name'] for t in db_tutors)
print(f"✅ Total tutors in database: {len(db_tutors)}")

# Fetch slots for 2026-01-25
print(f"\n📊 Fetching slots for 2026-01-25...")
response = requests.get(
    f'{SUPABASE_URL}/rest/v1/available_slots?slot_date=eq.2026-01-25&select=tutor_id',
    headers=headers
)
db_slots = response.json()
tutor_ids_with_slots = set(s['tutor_id'] for s in db_slots)

# Get tutor names with slots
tutors_with_slots = [t for t in db_tutors if t['tutor_id'] in tutor_ids_with_slots]
tutor_names_with_slots = set(t['tutor_name'] for t in tutors_with_slots)

print(f"✅ Tutors with slots on 2026-01-25: {len(tutors_with_slots)}")

# Compare
print(f"\n\n🔍 ANALYSIS:")
print("="*70)

# Normalize names for comparison
def normalize_name(name):
    return name.strip().replace('.', '').replace('  ', ' ').lower()

wconline_normalized = {normalize_name(n): n for n in wconline_tutors}
db_normalized = {normalize_name(n): n for n in db_tutor_names}
slots_normalized = {normalize_name(n): n for n in tutor_names_with_slots}

# Find missing tutors
missing_in_db = set(wconline_normalized.keys()) - set(db_normalized.keys())
missing_slots = set(wconline_normalized.keys()) - set(slots_normalized.keys())

print(f"\n❌ Tutors in WCOnline but NOT in database: {len(missing_in_db)}")
if missing_in_db:
    for name in sorted(missing_in_db):
        print(f"  - {wconline_normalized[name]}")

print(f"\n⚠️  Tutors in WCOnline but NO SLOTS in database: {len(missing_slots)}")
if missing_slots:
    for name in sorted(missing_slots):
        original_name = wconline_normalized[name]
        in_db = name in db_normalized
        print(f"  - {original_name} {'(in tutors table)' if in_db else '(NOT in tutors table)'}")

print(f"\n✅ Tutors successfully synced with slots: {len(slots_normalized)}")

# Show time distribution
print(f"\n\n⏰ Time distribution of WCOnline AVAIL data:")
print("="*70)
time_counts = stem_df['Start Time'].value_counts().sort_index()
for time, count in time_counts.items():
    print(f"  {time}: {count} entries")
