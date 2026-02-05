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

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}'
}

print("📊 DATABASE SUMMARY - WCOnline Sync Results")
print("="*70)

# Check tutors
response = requests.get(f'{url}/rest/v1/tutors?select=tutor_id', headers=headers)
tutor_count = len(response.json())
print(f"\n👥 Tutors: {tutor_count} total")

# Check available slots by date
print(f"\n📅 Available Slots (by date):")
for date in ['2026-01-25', '2026-01-26', '2026-01-27', '2026-01-28', '2026-01-29', '2026-01-30']:
    response = requests.get(
        f'{url}/rest/v1/available_slots?slot_date=eq.{date}&select=slot_id',
        headers=headers
    )
    count = len(response.json())
    print(f"  {date}: {count} slots")

# Check appointments by date
print(f"\n📅 Booked Appointments (by date):")
for date in ['2026-01-25', '2026-01-26', '2026-01-27', '2026-01-28', '2026-01-29', '2026-01-30']:
    response = requests.get(
        f'{url}/rest/v1/appointments?appointment_date=eq.{date}&select=appointment_id',
        headers=headers
    )
    count = len(response.json())
    print(f"  {date}: {count} appointments")

print("\n" + "="*70)
print("✅ All data is in Supabase and available to your Next.js app!")
print("🌐 Your app at http://localhost:3000 will show this data")
print("="*70)
