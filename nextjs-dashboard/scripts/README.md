# Scripts Documentation

This directory contains all utility scripts organized by category.

## 📁 Directory Structure

```
scripts/
├── sync/              # WCOnline synchronization scripts
│   └── sync-wconline.py
├── data/              # Data management and import scripts
│   ├── import-courses-from-appointments.py
│   ├── import-tutor-availability.py
│   ├── extract-tutor-availability.py
│   └── populate-available-slots.py
└── utils/             # Utility scripts
    └── set-admin-role.js
```

## 🔄 Sync Scripts (`sync/`)

### `sync-wconline.py`

**Main WCOnline synchronization script** - Fetches data from WCOnline API and syncs to Supabase.

**Features:**
- Fetches CUSTOM data (booked appointments)
- Fetches AVAIL data (available slots)
- Filters for STEM Center schedule
- Automatically creates tutors and courses if needed
- Handles rate limiting (300 requests/hour)
- Syncs directly to Supabase

**Setup:**
```bash
pip install requests pandas python-dotenv
# Optional: pip install supabase
```

**Usage:**
```bash
# Single date
python scripts/sync/sync-wconline.py 2025-01-15

# Date range
python scripts/sync/sync-wconline.py 2025-01-01 2025-01-14

# Multiple specific dates
python scripts/sync/sync-wconline.py 2025-01-15 2025-01-16 2025-01-17
```

**What It Does:**
1. ✅ Fetches CUSTOM data (booked appointments)
2. ✅ Filters for STEM Center
3. ✅ Automatically creates tutors if they don't exist
4. ✅ Automatically creates courses if they don't exist
5. ✅ Syncs appointments to Supabase
6. ✅ Handles rate limiting automatically

## 📊 Data Management Scripts (`data/`)

### `import-courses-from-appointments.py`

Extracts unique course names from the appointments table and adds them to the courses table.

**Usage:**
```bash
python scripts/data/import-courses-from-appointments.py
```

**What It Does:**
- Fetches all unique course names from appointments
- Compares with existing courses
- Adds new courses to the courses table
- Skips courses that already exist

### `import-tutor-availability.py`

Imports tutor availability schedule from a text file into the `tutor_availability` table.

**Usage:**
```bash
python scripts/data/import-tutor-availability.py
```

**Requirements:**
- `data/tutor-availability-schedule.txt` file must exist
- Tutors must already exist in the tutors table

**What It Does:**
- Parses tutor availability schedule from text file
- Matches tutors by name
- Inserts availability patterns into `tutor_availability` table

### `extract-tutor-availability.py`

Analyzes `available_slots` to find recurring weekly patterns and stores them in `tutor_availability` table.

**Usage:**
```bash
python scripts/data/extract-tutor-availability.py
```

**What It Does:**
- Analyzes available_slots for recurring patterns
- Identifies weekly availability patterns
- Stores patterns in `tutor_availability` table

### `populate-available-slots.py`

Generates `available_slots` entries from `tutor_availability` patterns, excluding booked appointments.

**Usage:**
```bash
python scripts/data/populate-available-slots.py 2025-01-01 2025-12-07
```

**What It Does:**
- Reads tutor availability patterns
- Generates available slots for date range
- Excludes already-booked appointments
- Inserts into `available_slots` table

## 🛠️ Utility Scripts (`utils/`)

### `set-admin-role.js`

Sets a user's role to admin via the API.

**Usage:**
```bash
npm run set-admin your-email@example.com
# or
node scripts/utils/set-admin-role.js your-email@example.com
```

**Requirements:**
- Next.js dev server must be running
- User must already be registered
- `.env.local` must have Supabase credentials

**What It Does:**
- Calls `/api/admin/set-role` endpoint
- Updates user role to 'admin'
- Requires authentication

## 📝 Environment Variables

All scripts require these environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🔗 Related Documentation

- [Main README](../README.md) - Full project documentation
- [WCOnline Integration](../docs/WCONLINE_DATA_MAPPING.md) - WCOnline data mapping details
- [Database Schema](../database/supabase-schema.sql) - Database structure
