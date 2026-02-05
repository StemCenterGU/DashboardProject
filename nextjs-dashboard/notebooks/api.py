#!/usr/bin/env python
# coding: utf-8

# In[1]:

import sys
import io

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

"""
WCOnline API Test Notebook
Simple test script to check WCOnline API responses
"""

import requests
import pandas as pd
import json
from datetime import datetime

API_KEY = "a519p8qKJGpnjo8asdgOIUNHLJ5342"
BASE_URL = "https://gannon.mywconline.com/api"

# ============================================================================
# CONFIGURATION
# ============================================================================
request_type = "AVAIL"  # CUSTOM, AVAIL, APPTS, SCHED, STAFF
request_date = 20260125   # YYYYMMDD format (8 digits) - Change this date

# ============================================================================
# FETCH DATA
# ============================================================================
url = f"{BASE_URL}?type={request_type}&date={request_date}"
headers = {"Authorization": f"Bearer {API_KEY}"}

print(f"📡 Fetching {request_type} data for {request_date}")
print(f"🔗 URL: {url.replace(API_KEY, '***REDACTED***')}\n")

response = requests.get(url, headers=headers)
response_json = response.json()

print("RAW RESPONSE:")
print(json.dumps(response_json, indent=4))

# ============================================================================
# PROCESS DATA
# ============================================================================
df = None

if isinstance(response_json, list):
    df = pd.DataFrame(response_json)
    print(f"\n✅ Response is a LIST with {len(df)} items")
    print("\nFull DataFrame:")
    print(df.to_string())
elif isinstance(response_json, dict):
    for key, value in response_json.items():
        if isinstance(value, list):
            print(f"\n✅ Found list under key '{key}' with {len(value)} items")
            df = pd.DataFrame(value)
            print(df.to_string())
            break
    if df is None:
        print("\n⚠️ No list data found in response")
        print(f"Response keys: {list(response_json.keys())}")
else:
    print(f"\n⚠️ Unexpected format: {type(response_json)}")

# ============================================================================
# FILTER FOR STEM CENTER
# ============================================================================
if df is not None and "Schedule Title" in df.columns:
    stem_df = df[df["Schedule Title"].str.upper().str.contains("STEM CENTER", na=False)]

    print("\n" + "="*70)
    print("⭐ STEM CENTER FILTERED RESULTS ⭐")
    print("="*70)
    print(f"Found {len(stem_df)} STEM Center entries out of {len(df)} total")

    if len(stem_df) > 0:
        print(stem_df.to_string())
    else:
        print("No STEM Center entries found")
else:
    print("\n⚠️ Cannot filter — DataFrame empty or missing 'Schedule Title' column.")
    if df is not None:
        print(f"Available columns: {list(df.columns)}")


# In[ ]:




