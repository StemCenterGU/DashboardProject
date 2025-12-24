#!/usr/bin/env python3
"""
Create All Tutors in Users and Tutors Tables
Reads tutor names from schedule file and creates them in Supabase
"""

import requests
import sys
import os
from pathlib import Path

# ============================================================================
# CONFIGURATION
# ============================================================================
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except:
    pass

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

def extract_tutor_names(schedule_file):
    """Extract all tutor names from schedule file"""
    tutor_names = []
    
    with open(schedule_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for line in lines:
        line = line.strip()
        # Tutor names end with ':'
        if line.endswith(':'):
            tutor_name = line[:-1].strip()
            if tutor_name and tutor_name not in tutor_names:
                tutor_names.append(tutor_name)
    
    return tutor_names

def create_tutor(url, key, tutor_name):
    """Create tutor record only (find existing user, don't create new users)"""
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    # Generate email from name
    clean_name = tutor_name.lower().replace(' ', '').replace('.', '').replace('ú', 'u').replace(' ', '')
    email = f"{clean_name}@tutor.gannon.edu"
    
    # Step 1: Find existing user by email
    response = requests.get(
        f"{url}/rest/v1/users?email=eq.{email}&select=user_id",
        headers=headers
    )
    
    user_id = None
    if response.status_code == 200 and response.json():
        user_id = response.json()[0]['user_id']
        print(f"  ✅ Found user: {tutor_name} ({email})")
    else:
        # Try to find by name (partial match)
        import urllib.parse
        encoded_name = urllib.parse.quote(f'*{tutor_name}*')
        response = requests.get(
            f"{url}/rest/v1/users?full_name=ilike.{encoded_name}&select=user_id,full_name&limit=5",
            headers=headers
        )
        
        if response.status_code == 200 and response.json():
            for user in response.json():
                full_name = user.get('full_name', '')
                if tutor_name.lower() in full_name.lower() or full_name.lower() in tutor_name.lower():
                    user_id = user['user_id']
                    print(f"  ✅ Found user by name: {full_name}")
                    break
    
    if not user_id:
        print(f"  ⚠️  User not found for {tutor_name} - skipping (user must exist first)")
        return False
    
    # Step 2: Check if tutor exists
    response = requests.get(
        f"{url}/rest/v1/tutors?user_id=eq.{user_id}&select=tutor_id",
        headers=headers
    )
    
    if response.status_code == 200 and response.json():
        tutor_id = response.json()[0]['tutor_id']
        print(f"  ✅ Tutor already exists: {tutor_id[:8]}...")
        return True
    else:
        # Step 3: Create tutor record
        tutor_data = {
            'user_id': user_id,
            'is_available': True
        }
        response = requests.post(
            f"{url}/rest/v1/tutors",
            headers=headers,
            json=tutor_data
        )
        
        if response.status_code in [200, 201] and response.json():
            tutor_id = response.json()[0]['tutor_id']
            print(f"  📝 Created tutor: {tutor_id[:8]}...")
            return True
        else:
            print(f"  ❌ Failed to create tutor: {response.status_code} - {response.text}")
            return False

def main():
    """Main function"""
    print("="*70)
    print("👥 Create All Tutors in Tutors Table")
    print("(Uses existing users - does not create new users)")
    print("="*70)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n❌ Supabase credentials not found!")
        print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    
    # Read schedule file
    schedule_file = Path(__file__).parent.parent / 'tutor-availability-schedule.txt'
    
    if not schedule_file.exists():
        print(f"\n❌ Schedule file not found: {schedule_file}")
        sys.exit(1)
    
    print(f"\n📖 Reading tutor names from: {schedule_file}")
    tutor_names = extract_tutor_names(schedule_file)
    print(f"✅ Found {len(tutor_names)} tutors\n")
    
    # Create all tutors
    print("💾 Creating tutors...")
    print("="*70)
    
    created = 0
    existing = 0
    failed = 0
    skipped = 0
    
    for tutor_name in tutor_names:
        print(f"\n👤 {tutor_name}")
        result = create_tutor(SUPABASE_URL, SUPABASE_KEY, tutor_name)
        if result:
            created += 1
        else:
            # Check if it was a skip (user not found) or actual failure
            # We'll count all non-success as failed for now
            failed += 1
            skipped += 1
    
    # Summary
    print("\n" + "="*70)
    print("✅ Tutor Creation Complete!")
    print("="*70)
    print(f"\n📊 Summary:")
    print(f"   Total tutors: {len(tutor_names)}")
    print(f"   Created: {created}")
    print(f"   Skipped (user not found): {skipped}")
    print(f"   Failed: {failed - skipped}")
    if skipped > 0:
        print(f"\n⚠️  Note: {skipped} tutors were skipped because their users don't exist.")
        print(f"   Create users first, then run this script again.")
    print(f"\n💡 Next step: Run import-tutor-availability.py to import schedules")

if __name__ == "__main__":
    main()

