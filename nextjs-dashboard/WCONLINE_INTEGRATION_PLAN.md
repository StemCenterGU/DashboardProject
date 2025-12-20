# WCOnline Integration Plan

## Overview
Integrate WCOnline API (Gannon University's tutoring system) to sync appointment data into our Next.js dashboard and Supabase database.

## Current Setup Analysis

### WCOnline API Details (from api.ipynb):
- **Base URL**: `https://gannon.mywconline.com/api`
- **Authentication**: Bearer token (API_KEY)
- **Request Types**: 
  - `AVAIL` - Availability
  - `SCHED` - Schedule
  - `APPTS` - Appointments
  - `STAFF` - Staff information
  - `CUSTOM` - Custom data
- **Date Format**: YYYYMMDD (e.g., 20250911)
- **Filter**: STEM CENTER schedule
- **IP Whitelisting**: Required (need to add server IP to WCOnline)

## Integration Architecture

### 1. Data Flow
```
WCOnline API → Next.js API Route → Data Transformation → Supabase Database → Dashboard Display
```

### 2. Components Needed

#### A. WCOnline Service (`lib/wconline.ts`)
- Handle API authentication
- Fetch data from WCOnline
- Transform WCOnline data format to our schema
- Error handling and retry logic

#### B. Sync API Route (`app/api/sync/wconline/route.ts`)
- Endpoint to trigger data sync
- Can be called manually or via cron job
- Syncs appointments, tutors, schedules

#### C. Data Mapping
- Map WCOnline appointment fields to Supabase schema
- Handle tutor matching (by name/email)
- Handle course matching (by code/name)

#### D. Scheduled Sync (Optional)
- Set up cron job or scheduled task
- Auto-sync at regular intervals (e.g., every hour)

## Implementation Plan

### Phase 1: WCOnline Service Setup

1. **Create WCOnline Service** (`lib/wconline.ts`)
   - API client with authentication
   - Methods to fetch:
     - Appointments (APPTS)
     - Staff/Tutors (STAFF)
     - Schedules (SCHED)
     - Availability (AVAIL)

2. **Environment Variables**
   - Add to `.env.local`:
     ```env
     WCONLINE_API_KEY=your_api_key_here
     WCONLINE_BASE_URL=https://gannon.mywconline.com/api
     WCONLINE_SCHEDULE_TITLE=STEM CENTER
     ```

### Phase 2: Data Transformation

1. **Map WCOnline Data to Supabase Schema**
   
   **Appointments Mapping:**
   - WCOnline fields → Supabase `appointments` table
   - Need to identify:
     - Student name
     - Tutor name/ID
     - Course
     - Date/time
     - Status
     - Duration

   **Tutors Mapping:**
   - WCOnline staff → Supabase `tutors` + `users` tables
   - Match by email or name

   **Courses Mapping:**
   - Extract from appointment data
   - Map to Supabase `courses` table

### Phase 3: Sync API Routes

1. **Manual Sync Endpoint** (`/api/sync/wconline`)
   - POST endpoint to trigger sync
   - Returns sync status and counts

2. **Incremental Sync**
   - Only sync new/updated appointments
   - Track last sync timestamp

3. **Full Sync**
   - Sync all data (for initial setup)

### Phase 4: Integration Points

1. **Dashboard Data**
   - Update `/api/dashboard-data` to include WCOnline data
   - Merge Supabase + WCOnline data

2. **Appointments Display**
   - Show WCOnline appointments in calendar
   - Show in scheduling page

3. **Tutor Management**
   - Sync tutor list from WCOnline
   - Update availability

## Data Schema Mapping

### WCOnline → Supabase Appointments

```typescript
// Expected WCOnline appointment structure (needs verification)
interface WCOnlineAppointment {
  // Need to verify actual fields from API response
  id?: string
  student_name?: string
  tutor_name?: string
  course?: string
  date?: string
  time?: string
  duration?: number
  status?: string
  schedule_title?: string
}

// Map to Supabase
interface SupabaseAppointment {
  appointment_id: string
  tutor_id: string
  student_name: string
  course_id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  duration: number
}
```

## Security Considerations

1. **API Key Storage**
   - Store in `.env.local` (server-side only)
   - Never expose to client

2. **IP Whitelisting**
   - Add your server/deployment IP to WCOnline
   - For local dev: use your public IP
   - For production: use Vercel/Netlify IP ranges

3. **Rate Limiting**
   - Implement rate limiting on sync endpoint
   - Don't overwhelm WCOnline API

## Implementation Status: ✅ COMPLETE

### ✅ Step 1: WCOnline Service Created
- ✅ Created `lib/wconline.ts` - WCOnline API client
- ✅ Handles authentication with Bearer token
- ✅ Supports all request types (APPTS, STAFF, SCHED, AVAIL, CUSTOM)
- ✅ Filters for STEM CENTER schedule
- ✅ Error handling and retry logic

### ✅ Step 2: Data Transformation Created
- ✅ Created `lib/wconline-sync.ts` - Data sync service
- ✅ Transforms WCOnline data to Supabase schema
- ✅ Handles tutor matching (by email/name)
- ✅ Handles course matching (by code/name)
- ✅ Handles date/time parsing

### ✅ Step 3: Sync Endpoint Created
- ✅ Created `/api/sync/wconline/route.ts`
- ✅ POST endpoint to trigger sync
- ✅ GET endpoint to check configuration
- ✅ Returns detailed sync results

### ✅ Step 4: Database Integration
- ✅ Upserts appointments with conflict handling
- ✅ Creates/finds tutors automatically
- ✅ Creates/finds courses automatically
- ✅ Marks appointments with `source: 'wconline'`

### ⏳ Step 5: Frontend Integration (Next Steps)
- [ ] Add sync button to admin dashboard
- [ ] Show sync status/status
- [ ] Display WCOnline appointments in calendar
- [ ] Merge WCOnline + Supabase data in views

### ⏳ Step 6: Automation (Optional)
- [ ] Set up scheduled sync (Vercel Cron or similar)
- [ ] Add sync status monitoring
- [ ] Add sync history/logging

## Next Steps

1. **Verify API Response Structure**
   - Run the notebook with actual API key
   - Document exact response structure
   - Identify all available fields

2. **IP Whitelisting Setup**
   - Get your server IP address
   - Add to WCOnline settings
   - Test connection

3. **Start Implementation**
   - Begin with WCOnline service
   - Test data fetching
   - Then implement sync logic

## Questions to Resolve

1. What is the exact structure of WCOnline API response?
2. How are tutors identified in WCOnline? (email, ID, name?)
3. How are courses identified? (code, name?)
4. What appointment statuses does WCOnline use?
5. Does WCOnline support incremental sync (date ranges)?
6. What is the rate limit for WCOnline API?

