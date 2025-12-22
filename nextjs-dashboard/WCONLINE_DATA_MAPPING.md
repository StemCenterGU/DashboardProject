# WCOnline API Data Mapping to Supabase Tables

This document explains what data from WCOnline API can be synced to which Supabase tables.

## Currently Syncing ✅

### 1. **CUSTOM Type** → `available_slots` table
**What we're syncing:**
- `Staff or Resource` → `tutor_id` (via `find_or_create_tutor`)
- `Start Time` → `start_time` (converted to 24-hour format)
- `End Time` → `end_time` (converted to 24-hour format)
- Date → `slot_date`
- `source` = 'wconline'
- `is_booked` = false

**Fields available but NOT currently synced:**
- `Schedule Title` (used for filtering only)
- `Staff Email` (could be used for better tutor matching)

### 2. **AVAIL Type** → `appointments` table
**What we're syncing:**
- `Staff or Resource` → `tutor_id` (via `find_or_create_tutor`)
- `Student Name` → `student_name`
- `Start Time` → `start_time` (converted to 24-hour format)
- `End Time` → `end_time` (converted to 24-hour format)
- Date → `appointment_date`
- `source` = 'wconline'
- `status` = 'scheduled'

**Fields available but NOT currently synced:**
- `Course Code` → Could map to `course_id` (via `courses` table)
- `Course Name` → Could map to `course_id` (via `courses` table)
- `Student Email` → Could map to `student_email`
- `Notes` → Could map to `notes`
- `Staff Email` (could be used for better tutor matching)

## Additional Data We Can Sync 🔄

### 3. **APPTS Type** → `appointments` table (More detailed)
**Available fields:**
- `Staff or Resource` → `tutor_id`
- `Student Name` → `student_name`
- `Student Email` → `student_email` ⭐ **NOT SYNCED YET**
- `Course Code` → `course_id` ⭐ **NOT SYNCED YET**
- `Course Name` → `course_id` ⭐ **NOT SYNCED YET**
- `Start Time` → `start_time`
- `End Time` → `end_time`
- `Notes` → `notes` ⭐ **NOT SYNCED YET**
- `Appointment ID` → `appointment_id` (if available)

**Benefits:**
- More complete appointment data
- Better course tracking
- Student contact information

### 4. **STAFF Type** → `users` + `tutors` tables
**Available fields:**
- `Staff Name` → `users.full_name`
- `Staff Email` → `users.email`
- `Staff ID` → Could be stored in `users.tutor_id`
- Availability status → `tutors.is_available`

**Benefits:**
- Pre-populate tutor information
- Better tutor matching
- Keep tutor list up-to-date

### 5. **SCHED Type** → `tutor_availability` table
**Available fields:**
- `Staff or Resource` → `tutor_id`
- `Day of Week` → `day_of_week` (0-6, Sunday-Saturday)
- `Start Time` → `start_time`
- `End Time` → `end_time`

**Benefits:**
- Recurring weekly schedule
- Better availability prediction
- Shift planning

### 6. **Course Information** → `courses` table
**From AVAIL/APPTS data:**
- `Course Code` → `courses.course_code`
- `Course Name` → `courses.course_name`

**Benefits:**
- Centralized course management
- Better appointment tracking
- Analytics by course

## Recommended Enhancements 🚀

### Priority 1: Course Information
**Why:** Appointments are incomplete without course information
**How:** Extract `Course Code` and `Course Name` from AVAIL/APPTS data
**Tables:** `courses`, `appointments`

### Priority 2: Student Email
**Why:** Contact information for follow-ups
**How:** Extract `Student Email` from AVAIL/APPTS data
**Tables:** `appointments`

### Priority 3: Appointment Notes
**Why:** Important context for appointments
**How:** Extract `Notes` field from AVAIL/APPTS data
**Tables:** `appointments`

### Priority 4: APPTS Type Integration
**Why:** More detailed appointment data than AVAIL
**How:** Add APPTS type fetching alongside AVAIL
**Tables:** `appointments`

### Priority 5: STAFF Type Integration
**Why:** Better tutor management
**How:** Fetch STAFF data periodically to update tutor list
**Tables:** `users`, `tutors`

### Priority 6: SCHED Type Integration
**Why:** Recurring schedule management
**How:** Fetch SCHED data to populate weekly availability
**Tables:** `tutor_availability`

## Current Limitations ⚠️

1. **No course information** - Appointments don't link to courses
2. **No student emails** - Missing contact information
3. **No appointment notes** - Missing context
4. **Limited tutor info** - Only name matching, no email matching
5. **No recurring schedules** - Only daily slots, no weekly patterns

## Next Steps 📋

1. **Enhance appointment syncing** to include:
   - Course code/name → `course_id`
   - Student email → `student_email`
   - Notes → `notes`

2. **Add APPTS type fetching** for more complete appointment data

3. **Add STAFF type fetching** for better tutor management

4. **Add SCHED type fetching** for recurring availability

5. **Improve tutor matching** using email addresses from STAFF data

