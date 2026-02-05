#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
import requests
import pandas as pd
import json

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

API_KEY = "a519p8qKJGpnjo8asdgOIUNHLJ5342"
BASE_URL = "https://gannon.mywconline.com/api"

missing_tutors = ['Emily B.', 'Grady S.', 'Hannah P.', 'Hope T.']

print("🔍 Checking SCHED type for recurring weekly schedules\n")
print("="*70)

# Try SCHED without date (might need different parameters)
for date_param in [None, '20260125']:
    print(f"\n📡 Trying SCHED type" + (f" with date={date_param}" if date_param else " without date") + "...")
    try:
        url = f"{BASE_URL}?type=SCHED"
        if date_param:
            url += f"&date={date_param}"
            
        response = requests.get(url, headers={"Authorization": f"Bearer {API_KEY}"})
        data = response.json()
        
        print(f"  Response type: {type(data)}")
        
        if isinstance(data, dict):
            print(f"  Keys: {list(data.keys())}")
            # Try to find list data
            for key, value in data.items():
                if isinstance(value, list) and len(value) > 0:
                    print(f"\n  Found list under key '{key}' with {len(value)} items")
                    df = pd.DataFrame(value)
                    print(f"  Columns: {list(df.columns)}")
                    
                    # Filter for STEM Center
                    if "Schedule Title" in df.columns:
                        stem_df = df[df["Schedule Title"].str.upper().str.contains("STEM", na=False)]
                        print(f"  STEM entries: {len(stem_df)}")
                        
                        # Show all unique staff/resources
                        for col in df.columns:
                            if 'staff' in col.lower() or 'resource' in col.lower():
                                print(f"\n  Unique values in '{col}' (STEM only):")
                                unique_vals = stem_df[col].unique()
                                for val in sorted([str(v) for v in unique_vals if pd.notna(v)])[:30]:
                                    print(f"    - {val}")
                                    
                        # Check for missing tutors
                        for col in df.columns:
                            if 'staff' in col.lower() or 'resource' in col.lower():
                                for tutor in missing_tutors:
                                    first_name = tutor.split()[0]
                                    matches = stem_df[stem_df[col].astype(str).str.contains(first_name, case=False, na=False)]
                                    if len(matches) > 0:
                                        print(f"\n  ✅ Found '{tutor}' in SCHED STEM data!")
                                        print(f"     Entries: {len(matches)}")
                                        sample = matches.iloc[0]
                                        print(f"     Sample: {dict(sample)}")
                                        
        elif isinstance(data, list):
            print(f"  List with {len(data)} items")
            if len(data) > 0:
                df = pd.DataFrame(data)
                print(f"  Columns: {list(df.columns)}")
        else:
            print(f"  Unexpected format")
            print(f"  Data: {str(data)[:200]}")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")

# Also check if there's a way to get ALL schedules
print("\n\n" + "="*70)
print("🔍 Checking all available API endpoints")
print("="*70)

for endpoint_type in ['SCHEDULES', 'LOCATIONS', 'CENTERS']:
    print(f"\n📡 Trying type={endpoint_type}...")
    try:
        response = requests.get(
            f"{BASE_URL}?type={endpoint_type}",
            headers={"Authorization": f"Bearer {API_KEY}"}
        )
        data = response.json()
        print(f"  Response: {type(data)}")
        if isinstance(data, list):
            print(f"  Items: {len(data)}")
        elif isinstance(data, dict):
            print(f"  Keys: {list(data.keys())}")
    except Exception as e:
        print(f"  Error: {e}")
