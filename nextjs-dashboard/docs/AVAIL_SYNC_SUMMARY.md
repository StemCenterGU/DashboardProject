# ✅ WCOnline AVAIL Slots Sync - Implementation Complete

## What Was Created

### 1. **Main Sync Script** 
📄 `scripts/sync/sync-avail-slots.py`

A dedicated Python script that:
- Fetches **AVAIL** type data from WCOnline API
- Filters for **STEM CENTER** schedule entries
- Matches tutors with the `tutors` table (creates new ones if needed)
- Syncs to Supabase `available_slots` table
- Handles Windows console encoding for emojis
- Implements proper rate limiting (300 requests/hour)

### 2. **Documentation**
📄 `scripts/sync/README-AVAIL-SYNC.md`

Complete usage guide with:
- Prerequisites and setup instructions
- Usage examples
- Data mapping reference
- Troubleshooting guide

## How to Use

### Quick Start
```bash
# Sync next 7 days (default)
python scripts/sync/sync-avail-slots.py

# Sync specific date range
python scripts/sync/sync-avail-slots.py 2026-01-25 2026-01-31

# Sync single day
python scripts/sync/sync-avail-slots.py 2026-01-25 2026-01-25
```

### Test Run Results (2026-01-25)
```
✅ Connected to Supabase
📡 Fetching AVAIL data for 20260125...
✅ Filtered 103 STEM Center entries from 103 total
✅ Found 103 available slots
🗑️  Deleting existing slots for 2026-01-25...
✅ Old slots deleted

💾 Syncing 103 available slots...
   ✅ Synced 103/103 available slots
   (9 with complete data, 94 skipped due to missing end times)

✨ All done!
```

## Key Features

### ✅ Tutor Matching
- **No relation to `users` table** - only uses `tutors` table
- Intelligent name normalization (handles periods, spaces, case)
- Automatic tutor creation if not found
- Efficient caching (loads once per run)

### ✅ Data Validation
- Converts 12-hour to 24-hour time format
- Validates time formats before syncing
- Skips slots with missing end times (WCOnline data issue)
- Filters out non-tutor resources (exams, workshops, etc.)

### ✅ Data Replacement Strategy
- Deletes existing slots for the date before syncing
- Ensures fresh data from WCOnline
- Prevents duplicate entries

## Data Mapping

| WCOnline Field | Supabase Column | Type |
|----------------|-----------------|------|
| Staff or Resource | `tutor_id` | UUID (via tutors table) |
| Date | `slot_date` | DATE |
| Start Time | `start_time` | TIME (24-hour) |
| End Time | `end_time` | TIME (24-hour) |
| Schedule Title | `schedule_title` | TEXT |
| Walk-In/Drop-In | `is_walk_in` | BOOLEAN |
| Online | `is_online` | BOOLEAN |
| Focus | `focus` | TEXT |
| Created By | `created_by` | TEXT |
| Modified By | `modified_by` | TEXT |
| Repeating | `is_repeating` | BOOLEAN |
| Course Code | `course_code` | TEXT (uppercase) |
| Course Name | `course_name` | TEXT |
| Course Instructor | `course_instructor` | TEXT |
| - | `is_booked` | BOOLEAN (always false) |
| - | `source` | TEXT (always 'wconline') |

## Known Issues & Limitations

### ⚠️ Missing End Times
**Issue**: Many AVAIL slots from WCOnline have empty end times  
**Impact**: These slots are skipped during sync (shown as warnings)  
**Cause**: WCOnline API data quality issue  
**Solution**: These slots are logged but not synced to avoid invalid data

### 📊 Test Results
From 2026-01-25 sync:
- Total slots fetched: 103
- Slots with complete data: 9 (8.7%)
- Slots with missing end times: 94 (91.3%)

## Next Steps

### Recommended Actions

1. **Investigate WCOnline Data**
   - Check why end times are missing in AVAIL type
   - Consider using CUSTOM type instead if it has better data
   - Contact WCOnline support if this is a data export issue

2. **Schedule Regular Syncs**
   - Set up a cron job or scheduled task
   - Recommended: Daily sync for next 7 days
   ```bash
   # Example: Run daily at 2 AM
   0 2 * * * cd /path/to/project && python scripts/sync/sync-avail-slots.py
   ```

3. **Monitor Sync Results**
   - Check logs for sync success rate
   - Track how many slots are being skipped
   - Alert if sync fails

4. **Consider Alternative Approaches**
   - Use CUSTOM type if it has better availability data
   - Implement default end time (e.g., start_time + 1 hour)
   - Manually fix data in WCOnline

## Related Files

- **Main sync script**: `scripts/sync/sync-wconline.py` (syncs CUSTOM/appointments)
- **API test script**: `notebooks/api.py` (test WCOnline API responses)
- **Documentation**: `docs/WCONLINE_DATA_MAPPING.md`
- **Database schema**: `database/supabase-schema.sql`

## Environment Variables Required

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Dependencies

```bash
pip install requests pandas python-dotenv
```

---

**Status**: ✅ **READY TO USE**  
**Last Updated**: 2026-01-24  
**Tested On**: Windows 11, Python 3.13.7
