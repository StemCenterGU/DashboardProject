#!/usr/bin/env python3
"""
Merge duplicate tutors - keep correct spelling, merge data, delete duplicates
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

# Define duplicates to merge: (keep_name, delete_names)
# The first name is the one to KEEP, the rest will be merged into it and deleted
merge_groups = [
    ('Zoë G.', ['Zoe G']),
    ('Isaac W.', ['Issac W']),
    ('Lili Ú.', ['Lili .', 'Lili U']),
    ('Makayla L.', ['Makalya L']),
]

def get_tutor_id(name):
    """Get tutor_id by exact name"""
    r = requests.get(
        f'{url}/rest/v1/tutors?tutor_name=eq.{name}&select=tutor_id',
        headers=headers
    )
    data = r.json()
    return data[0]['tutor_id'] if data else None

def merge_tutor(keep_id, delete_id, keep_name, delete_name):
    """Merge delete_id into keep_id"""
    print(f"\n  Merging '{delete_name}' -> '{keep_name}'")
    
    # Update appointments
    r = requests.patch(
        f'{url}/rest/v1/appointments?tutor_id=eq.{delete_id}',
        headers=headers,
        json={'tutor_id': keep_id}
    )
    print(f"    [OK] Updated appointments")
    
    # Update available_slots
    r = requests.patch(
        f'{url}/rest/v1/available_slots?tutor_id=eq.{delete_id}',
        headers=headers,
        json={'tutor_id': keep_id}
    )
    print(f"    [OK] Updated available_slots")
    
    # Update tutor_availability
    r = requests.patch(
        f'{url}/rest/v1/tutor_availability?tutor_id=eq.{delete_id}',
        headers=headers,
        json={'tutor_id': keep_id}
    )
    print(f"    [OK] Updated tutor_availability")
    
    # Delete the duplicate tutor
    r = requests.delete(
        f'{url}/rest/v1/tutors?tutor_id=eq.{delete_id}',
        headers=headers
    )
    if r.status_code in [200, 204]:
        print(f"    [OK] Deleted duplicate tutor '{delete_name}'")
    else:
        print(f"    [X] Failed to delete: {r.status_code} - {r.text}")

print("="*70)
print("[*] Merging Duplicate Tutors")
print("="*70)

for keep_name, delete_names in merge_groups:
    keep_id = get_tutor_id(keep_name)
    
    if not keep_id:
        print(f"\n[!] Could not find tutor to keep: '{keep_name}'")
        continue
    
    print(f"\n[>] Keeping: '{keep_name}' (ID: {keep_id})")
    
    for delete_name in delete_names:
        delete_id = get_tutor_id(delete_name)
        
        if not delete_id:
            print(f"  [!] Duplicate not found: '{delete_name}' (already merged?)")
            continue
        
        merge_tutor(keep_id, delete_id, keep_name, delete_name)

print("\n" + "="*70)
print("[OK] Duplicate merge complete!")
print("="*70)
print("\nRun this to verify: python scripts/check_zoe.py")
