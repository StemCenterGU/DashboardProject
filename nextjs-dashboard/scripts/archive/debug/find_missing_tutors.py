#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
import requests
import pandas as pd

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

API_KEY = "a519p8qKJGpnjo8asdgOIUNHLJ5342"
BASE_URL = "https://gannon.mywconline.com/api"

missing_tutors = ['Emily B.', 'Grady S.', 'Hannah P.', 'Hope T.']

print("🔍 Searching for missing tutors in ALL WCOnline data types\n")
print("="*70)
print(f"Looking for: {', '.join(missing_tutors)}\n")

# Check each data type
for data_type in ['AVAIL', 'CUSTOM', 'APPTS', 'SCHED', 'STAFF']:
    print(f"\n📡 Checking {data_type} type...")
    try:
        response = requests.get(
            f"{BASE_URL}?type={data_type}&date=20260125",
            headers={"Authorization": f"Bearer {API_KEY}"}
        )
        data = response.json()
        
        if not isinstance(data, list):
            print(f"  ⚠️ Response is not a list: {type(data)}")
            continue
            
        df = pd.DataFrame(data)
        print(f"  ✅ Total entries: {len(df)}")
        print(f"  📋 Columns: {list(df.columns)}")
        
        # Filter for STEM Center
        if "Schedule Title" in df.columns:
            stem_df = df[df["Schedule Title"].str.upper().str.contains("STEM CENTER", na=False)]
            print(f"  ✅ STEM Center entries: {len(stem_df)}")
            
            # Check for our missing tutors
            for col in df.columns:
                if 'staff' in col.lower() or 'resource' in col.lower() or 'name' in col.lower():
                    print(f"\n  🔍 Checking column '{col}':")
                    for tutor in missing_tutors:
                        # Check both full dataframe and STEM-filtered
                        matches_all = df[df[col].astype(str).str.contains(tutor.split()[0], case=False, na=False)]
                        matches_stem = stem_df[stem_df[col].astype(str).str.contains(tutor.split()[0], case=False, na=False)]
                        
                        if len(matches_all) > 0:
                            print(f"    ✅ Found '{tutor}' in ALL data: {len(matches_all)} entries")
                            if len(matches_stem) > 0:
                                print(f"       ✅ Found in STEM Center: {len(matches_stem)} entries")
                                # Show sample
                                sample = matches_stem.iloc[0]
                                print(f"       Sample: {sample.get('Start Time', 'N/A')} - Schedule: {sample.get('Schedule Title', 'N/A')}")
                            else:
                                print(f"       ❌ NOT in STEM Center data")
                                # Show what schedule they're in
                                sample = matches_all.iloc[0]
                                print(f"       Schedule: {sample.get('Schedule Title', 'N/A')}")
        else:
            print(f"  ⚠️ No 'Schedule Title' column in {data_type}")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")

print("\n\n" + "="*70)
print("🔍 Detailed AVAIL data analysis")
print("="*70)

# Get AVAIL data and show all unique resources
response = requests.get(
    f"{BASE_URL}?type=AVAIL&date=20260125",
    headers={"Authorization": f"Bearer {API_KEY}"}
)
avail_data = response.json()
df = pd.DataFrame(avail_data)

if "Schedule Title" in df.columns:
    stem_df = df[df["Schedule Title"].str.upper().str.contains("STEM CENTER", na=False)]
    
    print(f"\nAll unique resources in STEM Center AVAIL data:")
    if 'Resource' in stem_df.columns:
        unique_resources = stem_df['Resource'].unique()
        for i, resource in enumerate(sorted(unique_resources), 1):
            print(f"  {i}. {resource}")
