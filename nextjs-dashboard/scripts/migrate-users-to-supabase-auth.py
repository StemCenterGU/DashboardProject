#!/usr/bin/env python3
"""
Migrate Existing Users to Supabase Auth
This script helps migrate users from custom authentication to Supabase Auth.

Note: This requires Supabase Admin API access. You may need to manually create
auth users via Supabase Dashboard or use the Supabase Admin API.
"""

import requests
import sys
import os
from urllib.parse import quote

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except:
    pass

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

def get_existing_users():
    """Fetch all users from users table"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Supabase credentials not found!")
        return []

    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/users?select=user_id,email,full_name,role,active",
            headers=headers
        )

        if response.status_code == 200:
            return response.json() or []
        else:
            print(f"❌ Error fetching users: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"❌ Error fetching users: {e}")
        return []

def check_auth_user_exists(email):
    """Check if user exists in Supabase Auth (requires Admin API)"""
    # Note: This requires Supabase Admin API which may not be available
    # You'll need to check manually in Supabase Dashboard
    print(f"   ⚠️  Manual check needed: Does {email} exist in Supabase Auth?")
    return False

def main():
    """Main function"""
    print("="*70)
    print("🔄 Migrate Users to Supabase Auth")
    print("="*70)
    print("\n⚠️  IMPORTANT:")
    print("   This script shows users that need Supabase Auth accounts.")
    print("   You must create Supabase Auth accounts manually or via Admin API.")
    print("   Then update user_id in users table to match auth user ID.\n")

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("\n❌ Supabase credentials not found!")
        print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    # Get existing users
    print("📡 Fetching users from users table...")
    users = get_existing_users()

    if not users:
        print("❌ No users found in users table!")
        sys.exit(1)

    print(f"✅ Found {len(users)} users\n")

    print("="*70)
    print("📋 Migration Checklist")
    print("="*70)
    print("\nFor each user, you need to:")
    print("1. Create Supabase Auth account (via Dashboard or Admin API)")
    print("2. Update user_id in users table to match auth user ID")
    print("3. User can then login with their email and password\n")

    print("="*70)
    print("👥 Users to Migrate")
    print("="*70)
    
    for i, user in enumerate(users, 1):
        print(f"\n{i}. {user.get('email', 'N/A')}")
        print(f"   Name: {user.get('full_name', 'N/A')}")
        print(f"   Role: {user.get('role', 'N/A')}")
        print(f"   Active: {user.get('active', False)}")
        print(f"   Current user_id: {user.get('user_id', 'N/A')}")
        print(f"   ⚠️  Action needed: Create Supabase Auth account")

    print("\n" + "="*70)
    print("📝 SQL to Update user_id After Creating Auth Account")
    print("="*70)
    print("\nAfter creating Supabase Auth account, update user_id:")
    print("\n```sql")
    print("-- Example: Update user_id to match Supabase Auth user ID")
    print("UPDATE users")
    print("SET user_id = 'auth-user-id-from-supabase'")
    print("WHERE email = 'user@example.com';")
    print("```\n")

    print("="*70)
    print("✅ Alternative: User Re-registration")
    print("="*70)
    print("\nIf migration is complex, users can:")
    print("1. Register again with same email via Supabase Auth")
    print("2. Their role will be preserved in users table")
    print("3. user_id will automatically match auth user ID\n")

if __name__ == "__main__":
    main()

