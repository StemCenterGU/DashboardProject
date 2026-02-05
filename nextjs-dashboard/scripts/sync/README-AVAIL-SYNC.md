# WCOnline AVAIL Slots Sync

This script fetches **AVAIL** type data (available time slots) from the WCOnline API and syncs it to the Supabase `available_slots` table.

## What It Does

1. **Fetches AVAIL data** from WCOnline API for specified date range
2. **Filters for STEM Center** schedule entries only
3. **Matches tutors** with the `tutors` table (creates new tutors if needed)
4. **Syncs to `available_slots` table** in Supabase
5. **Replaces existing data** for each date to keep it fresh

## Prerequisites

1. **Python packages**:
   ```bash
   pip install requests pandas python-dotenv
   ```

2. **Environment variables** in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Usage

### Sync next 7 days (default)
```bash
python scripts/sync/sync-avail-slots.py
```

### Sync specific date range
```bash
python scripts/sync/sync-avail-slots.py 2026-01-25 2026-01-31
```

### Sync single day
```bash
python scripts/sync/sync-avail-slots.py 2026-01-25 2026-01-25
```

## Data Mapping

From WCOnline AVAIL API to Supabase `available_slots` table:

| WCOnline Field | Supabase Column | Notes |
|----------------|-----------------|-------|
| Staff or Resource | `tutor_id` | Matched/created in `tutors` table |
| Date | `slot_date` | YYYY-MM-DD format |
| Start Time | `start_time` | Converted to 24-hour format |
| End Time | `end_time` | Converted to 24-hour format |
| Schedule Title | `schedule_title` | Filtered for "STEM CENTER" |
| Walk-In/Drop-In | `is_walk_in` | Boolean |
| Online | `is_online` | Boolean |
| Focus | `focus` | Text field |
| Created By | `created_by` | Text field |
| Modified By | `modified_by` | Text field |
| Repeating | `is_repeating` | Boolean |
| Course Code | `course_code` | Uppercase |
| Course Name | `course_name` | Text field |
| Course Instructor | `course_instructor` | Text field |
| - | `is_booked` | Always `false` for AVAIL slots |
| - | `source` | Always `'wconline'` |

## Tutor Matching

- **No relation to `users` table** - only uses `tutors` table
- Tutors are matched by name (case-insensitive, normalized)
- New tutors are automatically created if not found
- Tutor cache is loaded once per sync run for efficiency

## Rate Limiting

- WCOnline API limit: **300 requests per hour**
- Script automatically waits if approaching limit
- 2-second delay between dates to be respectful

## Output Example

```
✅ Connected to Supabase: https://your-project.supabase.co

🚀 Starting sync for date range: 2026-01-25 to 2026-01-31

======================================================================
📅 Syncing AVAIL slots for date: 2026-01-25
======================================================================

📡 Fetching AVAIL data for 20260125...
✅ Filtered 15 STEM Center entries from 45 total
✅ Found 15 available slots
🗑️  Deleting existing slots for 2026-01-25...
✅ Old slots deleted

💾 Syncing 15 available slots...
   [1/15] John Smith (09:00 - 10:00)... ✅
   [2/15] Jane Doe (10:00 - 11:00)... ✅
   ...
   [15/15] Bob Johnson (16:00 - 17:00)... ✅

✅ Synced 15/15 available slots

✨ All done!
```

## Troubleshooting

### "Supabase credentials not found"
- Make sure `.env.local` exists in the project root
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### "Failed to create tutor"
- Check Supabase RLS policies on `tutors` table
- Ensure service role key has proper permissions

### "Rate limit approaching"
- Script will automatically wait
- Reduce date range if syncing large periods

### "No AVAIL slots found"
- Check if WCOnline has data for that date
- Verify "STEM CENTER" is in the Schedule Title
- Try running `notebooks/api.py` to see raw API response

## Related Files

- **Main sync script**: `scripts/sync/sync-wconline.py` (syncs CUSTOM/appointments)
- **API test notebook**: `notebooks/api.py` (test WCOnline API responses)
- **Documentation**: `docs/WCONLINE_DATA_MAPPING.md`
- **Database schema**: `database/supabase-schema.sql`
