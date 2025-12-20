# WCOnline Integration Setup Guide

## Quick Start

### 1. Get Your WCOnline API Key

1. Log into WCOnline admin panel for Gannon University
2. Navigate to API settings
3. Generate an API key
4. **Important**: Note the IP whitelisting requirement

### 2. Configure IP Whitelisting

WCOnline requires your server IP to be whitelisted:

**For Local Development:**
- Find your public IP: Visit https://whatismyipaddress.com/
- Add this IP to WCOnline's allowed IPs list

**For Production (Vercel/Netlify):**
- Vercel: Use Vercel's IP ranges or enable Vercel Functions
- Netlify: Use Netlify Functions
- Or use a static IP service if needed

### 3. Add Environment Variables

Add to your `.env.local` file:

```env
# WCOnline Configuration
WCONLINE_API_KEY=your_api_key_here
WCONLINE_BASE_URL=https://gannon.mywconline.com/api
WCONLINE_SCHEDULE_TITLE=STEM CENTER
```

### 4. Test the Connection

```bash
# Check if configured
curl http://localhost:3000/api/sync/wconline

# Trigger a sync (today's data)
curl -X POST http://localhost:3000/api/sync/wconline

# Sync specific date
curl -X POST "http://localhost:3000/api/sync/wconline?date=2025-01-15"
```

## How It Works

### Data Flow

1. **Fetch from WCOnline** → `lib/wconline.ts`
   - Authenticates with Bearer token
   - Fetches appointments, tutors, schedules
   - Filters for STEM CENTER

2. **Transform Data** → `lib/wconline-sync.ts`
   - Maps WCOnline fields to Supabase schema
   - Matches tutors by email/name
   - Matches courses by code/name
   - Creates missing tutors/courses

3. **Sync to Supabase** → `/api/sync/wconline`
   - Upserts appointments (insert or update)
   - Creates tutor records if needed
   - Creates course records if needed
   - Returns sync statistics

### Data Mapping

**WCOnline → Supabase Appointments:**
- `student_name` → `student_name`
- `tutor_name/tutor_email` → `tutor_id` (matched)
- `course/course_code` → `course_id` (matched)
- `date` → `appointment_date` (formatted)
- `time/start_time` → `start_time`
- `end_time` → `end_time`
- `duration` → `duration`
- `status` → `status` (mapped)
- All appointments marked with `source: 'wconline'`

## Usage

### Manual Sync

**Via API:**
```bash
POST /api/sync/wconline
POST /api/sync/wconline?date=2025-01-15
```

**Response:**
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "results": {
    "appointments": {
      "fetched": 25,
      "synced": 23,
      "errors": 2
    },
    "tutors": {
      "fetched": 10,
      "synced": 10,
      "errors": 0
    },
    "courses": {
      "fetched": 15,
      "synced": 15,
      "errors": 0
    }
  },
  "errors": [],
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Scheduled Sync (Recommended)

Set up a cron job or scheduled task to sync automatically:

**Vercel Cron:**
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sync/wconline",
    "schedule": "0 * * * *"
  }]
}
```

**Or use a service like:**
- Vercel Cron Jobs
- GitHub Actions (scheduled)
- External cron service (cron-job.org, etc.)

## Troubleshooting

### API Key Not Working

1. Verify API key is correct
2. Check IP whitelisting in WCOnline
3. Test with curl/Postman first
4. Check server logs for errors

### Data Not Syncing

1. Check WCOnline API response structure
2. Verify field names match expected format
3. Check Supabase logs for errors
4. Review sync result errors array

### Tutors Not Matching

- Ensure tutor emails match between WCOnline and Supabase
- Or ensure tutor names are similar
- May need to manually link tutors first

### Courses Not Matching

- Ensure course codes match
- Or course names are similar
- New courses will be created automatically

## Next Steps

1. **Test the Integration**
   - Run a manual sync
   - Verify data appears in Supabase
   - Check dashboard displays data

2. **Add Frontend UI**
   - Add sync button to admin panel
   - Show sync status
   - Display last sync time

3. **Set Up Automation**
   - Configure scheduled syncs
   - Monitor sync health
   - Set up alerts for failures

## Important Notes

- **IP Whitelisting**: Must be configured in WCOnline
- **Rate Limiting**: Don't sync too frequently (max once per hour recommended)
- **Data Conflicts**: WCOnline data will overwrite Supabase data for same appointment_id
- **Source Tracking**: All synced appointments have `source: 'wconline'` field

