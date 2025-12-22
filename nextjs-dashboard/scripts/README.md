# WCOnline Sync Scripts

## Main Script: `sync-wconline.py`

**One unified script that does everything:**
- Fetches data from WCOnline API (CUSTOM + AVAIL)
- Filters for STEM Center
- Syncs directly to Supabase
- Handles rate limiting automatically

### Setup

1. Install Python dependencies:
```bash
pip install requests pandas python-dotenv
```

2. Optional (for better performance):
```bash
pip install supabase
```

3. Set environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Usage

```bash
# Single date (fetches that date + next 13 days = 14 days total)
python scripts/sync-wconline.py 2025-01-15

# Date range
python scripts/sync-wconline.py 2025-01-01 2025-01-14

# Today + next 13 days
python scripts/sync-wconline.py --today
```

### What It Does

1. ✅ Fetches CUSTOM data (available slots)
2. ✅ Fetches AVAIL data (booked appointments - future dates only)
3. ✅ Filters for STEM Center
4. ✅ Deletes old data for the date
5. ✅ Creates tutors automatically if needed
6. ✅ Syncs slots and appointments to Supabase
7. ✅ Handles rate limiting (300 requests/hour)

## Other Scripts

- `sync-from-python.js` - Syncs from JSON files (if you prefer two-step process)
- `set-admin-role.js` - Set user role to admin
- `sync-date-range.js` - Sync date range via API endpoint

## Test Notebook: `api.ipynb`

Simple test notebook to check WCOnline API responses. Use it to:
- Test different request types
- Check API responses
- Debug data structure

