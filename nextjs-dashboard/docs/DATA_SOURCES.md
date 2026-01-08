# Data Sources Documentation

This document verifies that all filter options and data are dynamically fetched from Supabase, ensuring the system stays up-to-date automatically.

## ✅ All Data Sources from Supabase

### 1. **Tutors Filter**
- **Source:** `/api/analytics/tutors`
- **Database Table:** `tutors`
- **Query:** 
  ```sql
  SELECT tutor_id, tutor_name FROM tutors ORDER BY tutor_name
  ```
- **Status:** ✅ Fully dynamic - Fetches from Supabase `tutors` table
- **Updates:** Automatically updates when tutors are added/removed from database

### 2. **Courses Filter**
- **Source:** `/api/analytics/courses`
- **Database Table:** `courses`
- **Query:**
  ```sql
  SELECT course_id, course_code, course_name 
  FROM courses 
  WHERE active = true
  ```
- **Status:** ✅ Fully dynamic - Fetches from Supabase `courses` table
- **Updates:** Automatically updates when courses are added/removed or active status changes

### 3. **Status Filter**
- **Source:** `/api/analytics/statuses`
- **Database Table:** `appointments`
- **Query:**
  ```sql
  SELECT DISTINCT status FROM appointments WHERE status IS NOT NULL
  ```
- **Status:** ✅ Fully dynamic - Extracts unique statuses from `appointments` table
- **Updates:** Automatically updates when new status values appear in appointments

### 4. **Course Instructor Filter**
- **Source:** `/api/analytics/instructors`
- **Database Table:** `appointments`
- **Query:**
  ```sql
  SELECT DISTINCT course_instructor 
  FROM appointments 
  WHERE course_instructor IS NOT NULL AND course_instructor != ''
  ```
- **Status:** ✅ Fully dynamic - Extracts unique instructors from `appointments` table
- **Updates:** Automatically updates when new instructors appear in appointment data

### 5. **Appointment Data (Charts & Statistics)**
- **Source:** `/api/analytics/chart-data` and `/api/analytics/summary`
- **Database Table:** `appointments`
- **Query:** Dynamic queries based on active filters
- **Status:** ✅ Fully dynamic - All appointment data comes from Supabase
- **Updates:** Real-time data from database

## 📊 Static/Constant Data (Not from Database)

### Days of Week
- **Source:** Hardcoded constant
- **Reason:** Days of week are constant (Sunday-Saturday) and don't change
- **Location:** `DAYS_OF_WEEK` array in `page.tsx`
- **Status:** ✅ Appropriate - This is constant data that doesn't need to be in database

### Chart Colors
- **Source:** Hardcoded color array
- **Reason:** UI styling constants
- **Location:** `COLORS` array in `page.tsx`
- **Status:** ✅ Appropriate - UI constants, not data

## 🔄 Data Flow

```
Supabase Database
    ↓
API Endpoints (/api/analytics/*)
    ↓
Frontend State (useState)
    ↓
Filter UI Components
    ↓
Chart Updates
```

## ✅ Verification Checklist

- [x] Tutors - Fetched from `tutors` table
- [x] Courses - Fetched from `courses` table  
- [x] Statuses - Extracted from `appointments` table
- [x] Instructors - Extracted from `appointments` table
- [x] Appointment Data - Fetched from `appointments` table
- [x] All filters update automatically when database changes
- [x] No hardcoded filter options (except constants like days of week)

## 🎯 Summary

**All filter options and data are dynamically fetched from Supabase:**
- ✅ Tutors: From `tutors` table
- ✅ Courses: From `courses` table
- ✅ Statuses: Extracted from `appointments` table
- ✅ Instructors: Extracted from `appointments` table
- ✅ All appointment data: From `appointments` table

**When Supabase tables are updated:**
- New tutors automatically appear in filter
- New courses automatically appear in filter
- New statuses automatically appear in filter
- New instructors automatically appear in filter
- All charts and statistics update with latest data

**No manual updates required** - Everything is fully dynamic and database-driven!

