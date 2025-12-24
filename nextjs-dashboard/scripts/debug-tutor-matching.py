#!/usr/bin/env python3
"""
Debug Tutor Name Matching
Tests why tutors from WCOnline aren't matching database records
"""

import requests
import os
import sys

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except:
    pass

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

def get_all_tutors():
    """Fetch all tutors from database"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Supabase credentials not found!")
        return []
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/tutors?select=tutor_id,tutor_name&limit=1000",
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error fetching tutors: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        return []

def test_name_matching(wconline_name, db_tutors):
    """Test if WCOnline name matches any database tutor"""
    # Normalize WCOnline name (same logic as sync script)
    wconline_clean = wconline_name.strip().replace('.', '').strip()
    wconline_normalized = wconline_clean.lower()
    
    print(f"\n🔍 Testing: '{wconline_name}'")
    print(f"   Cleaned: '{wconline_clean}'")
    print(f"   Normalized: '{wconline_normalized}'")
    
    # Try to find match
    matches = []
    for tutor in db_tutors:
        db_name = tutor.get('tutor_name', '').strip()
        db_normalized = db_name.lower().replace('.', '').strip()
        
        if wconline_normalized == db_normalized:
            matches.append(tutor)
            print(f"   ✅ MATCH: '{db_name}' (ID: {tutor['tutor_id'][:8]}...)")
    
    if not matches:
        print(f"   ❌ NO MATCH FOUND")
        # Show similar names
        similar = []
        for tutor in db_tutors:
            db_name = tutor.get('tutor_name', '').strip()
            if wconline_clean.lower() in db_name.lower() or db_name.lower() in wconline_clean.lower():
                similar.append(db_name)
        
        if similar:
            print(f"   💡 Similar names in DB: {', '.join(similar[:5])}")
    
    return matches

def main():
    print("="*70)
    print("🔬 Tutor Name Matching Debug Tool")
    print("="*70)
    
    # Fetch all tutors from database
    print("\n📊 Fetching tutors from database...")
    db_tutors = get_all_tutors()
    
    if not db_tutors:
        print("❌ No tutors found in database!")
        sys.exit(1)
    
    print(f"✅ Found {len(db_tutors)} tutors in database\n")
    
    # Show first 10 tutors
    print("📋 First 10 tutors in database:")
    for i, tutor in enumerate(db_tutors[:10], 1):
        name = tutor.get('tutor_name', 'Unknown')
        print(f"   {i}. '{name}'")
    
    if len(db_tutors) > 10:
        print(f"   ... and {len(db_tutors) - 10} more")
    
    # Test WCOnline names that failed
    print("\n" + "="*70)
    print("🧪 Testing WCOnline Names")
    print("="*70)
    
    wconline_names = [
        "Robert T.",
        "Eva S.",
        "Ethan W.",
        "Calculus Readiness Exam"  # This should be skipped
    ]
    
    for name in wconline_names:
        test_name_matching(name, db_tutors)
    
    # Summary
    print("\n" + "="*70)
    print("💡 Diagnosis Complete")
    print("="*70)
    print("\nIf names show NO MATCH but similar names exist:")
    print("  → Check exact spelling and spacing in database")
    print("  → Verify period handling (e.g., 'T.' vs 'T')")
    print("\nIf NO similar names found:")
    print("  → Tutors may need to be added to database")

if __name__ == "__main__":
    main()
