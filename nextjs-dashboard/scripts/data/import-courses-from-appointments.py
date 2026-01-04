#!/usr/bin/env python3
"""
Import Courses from Appointments
Extracts all unique course names from the appointments table and adds them to the courses table.
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
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

def get_unique_course_names():
    """Fetch all unique, non-null course names from appointments table"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Supabase credentials not found!")
        return []

    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }

    try:
        # Fetch distinct course names (non-null)
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/appointments?select=course_name&course_name=not.is.null",
            headers=headers
        )

        if response.status_code == 200:
            appointments = response.json() or []
            # Extract unique course names
            unique_courses = set()
            for apt in appointments:
                course_name = apt.get('course_name')
                if course_name and course_name.strip():
                    unique_courses.add(course_name.strip())
            return sorted(list(unique_courses))
        else:
            print(f"❌ Error fetching appointments: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"❌ Error fetching appointments: {e}")
        return []

def get_existing_courses():
    """Fetch all existing course names from courses table"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return set()

    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/courses?select=course_name",
            headers=headers
        )

        if response.status_code == 200:
            courses = response.json() or []
            return set(course.get('course_name', '').strip() for course in courses if course.get('course_name'))
        else:
            print(f"⚠️  Error fetching existing courses: {response.status_code} - {response.text}")
            return set()
    except Exception as e:
        print(f"⚠️  Error fetching existing courses: {e}")
        return set()

def insert_course(course_name):
    """Insert a new course into the courses table"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False

    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }

    course_data = {
        'course_name': course_name,
        'active': True
    }

    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/courses",
            headers=headers,
            json=course_data
        )

        if response.status_code in [200, 201]:
            return True
        else:
            print(f"   ⚠️  Error inserting course '{course_name}': {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ⚠️  Exception inserting course '{course_name}': {e}")
        return False

def main():
    """Main function"""
    print("="*70)
    print("📚 Import Courses from Appointments")
    print("="*70)

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n❌ Supabase credentials not found!")
        print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    # Fetch unique course names from appointments
    print("\n📡 Fetching unique course names from appointments table...")
    unique_course_names = get_unique_course_names()

    if not unique_course_names:
        print("❌ No course names found in appointments table!")
        sys.exit(1)

    print(f"✅ Found {len(unique_course_names)} unique course names in appointments")

    # Fetch existing courses
    print("\n📡 Fetching existing courses from courses table...")
    existing_courses = get_existing_courses()
    print(f"✅ Found {len(existing_courses)} existing courses")

    # Find courses that need to be added
    new_courses = [name for name in unique_course_names if name not in existing_courses]

    if not new_courses:
        print(f"\n✅ All {len(unique_course_names)} courses already exist in courses table!")
        print("\n📊 Summary:")
        print(f"   Total unique courses in appointments: {len(unique_course_names)}")
        print(f"   Already in courses table: {len(existing_courses)}")
        print(f"   New courses to add: 0")
        return

    print(f"\n💾 Adding {len(new_courses)} new courses to courses table...")
    print(f"   (Skipping {len(unique_course_names) - len(new_courses)} that already exist)")

    inserted = 0
    failed = 0

    for course_name in new_courses:
        if insert_course(course_name):
            inserted += 1
            print(f"   ✅ Added: {course_name}")
        else:
            failed += 1

    print("\n" + "="*70)
    print("✅ Complete!")
    print("="*70)
    print(f"\n📊 Summary:")
    print(f"   Total unique courses in appointments: {len(unique_course_names)}")
    print(f"   Already in courses table: {len(existing_courses)}")
    print(f"   New courses added: {inserted}")
    if failed > 0:
        print(f"   Failed to add: {failed}")

if __name__ == "__main__":
    main()

