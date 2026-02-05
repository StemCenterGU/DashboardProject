# 🚀 Quick Reference: WCOnline to Supabase Sync

## Two Sync Scripts

### 1. AVAIL Slots Sync (NEW! ✅)
**Purpose**: Sync available time slots  
**Script**: `scripts/sync/sync-avail-slots.py`  
**Source**: WCOnline AVAIL type  
**Destination**: Supabase `available_slots` table  
**Tutor Matching**: Uses `tutors` table only (NO relation to `users`)

```bash
# Sync next 7 days
python scripts/sync/sync-avail-slots.py

# Sync specific dates
python scripts/sync/sync-avail-slots.py 2026-01-25 2026-01-31
```

### 2. Appointments Sync (Existing)
**Purpose**: Sync booked appointments  
**Script**: `scripts/sync/sync-wconline.py`  
**Source**: WCOnline CUSTOM type  
**Destination**: Supabase `appointments` table  
**Tutor Matching**: Uses `tutors` table

```bash
# Sync next 7 days
python scripts/sync/sync-wconline.py

# Sync specific dates
python scripts/sync/sync-wconline.py 2026-01-25 2026-01-31
```

## Data Flow

```
WCOnline API
    │
    ├─ AVAIL Type ──────────────────────────────┐
    │   (Available time slots)                  │
    │                                            ▼
    │                                    available_slots
    │                                       (Supabase)
    │                                            │
    │                                            └─ tutor_id → tutors table
    │
    └─ CUSTOM Type ─────────────────────────────┐
        (Booked appointments)                   │
                                                ▼
                                        appointments
                                          (Supabase)
                                                │
                                                └─ tutor_id → tutors table
```

## Database Tables

### `tutors` table
- **Purpose**: Central tutor registry
- **Used by**: Both sync scripts
- **Key**: `tutor_id` (UUID)
- **Unique**: `tutor_name`
- **Auto-created**: Yes, if tutor not found

### `available_slots` table
- **Purpose**: Available time slots from WCOnline
- **Populated by**: AVAIL sync script
- **Key fields**: `tutor_id`, `slot_date`, `start_time`, `end_time`
- **Source**: Always 'wconline'
- **Booked**: Always false

### `appointments` table
- **Purpose**: Booked appointments
- **Populated by**: CUSTOM sync script
- **Key fields**: `tutor_id`, `appointment_date`, `start_time`, `student_name`
- **Source**: 'wconline' or 'manual'
- **Status**: 'scheduled', 'completed', 'missed', etc.

## Important Notes

### ✅ Tutor Matching
- **Both scripts use ONLY the `tutors` table**
- **NO relation to `users` table**
- Tutors are matched by name (case-insensitive, normalized)
- New tutors are automatically created if not found

### ⚠️ Known Issues

**AVAIL Sync**:
- ~91% of slots have missing end times (WCOnline data issue)
- These slots are skipped during sync
- Only slots with complete data are synced

**CUSTOM Sync**:
- Student names extracted from "Created By" field
- Course info extracted from "Focus" field

## File Structure

```
nextjs-dashboard/
├── scripts/
│   └── sync/
│       ├── sync-avail-slots.py      ← NEW! AVAIL → available_slots
│       ├── sync-wconline.py         ← Existing: CUSTOM → appointments
│       ├── README-AVAIL-SYNC.md     ← AVAIL sync documentation
│       └── __pycache__/
├── docs/
│   ├── WCONLINE_DATA_MAPPING.md     ← Data mapping reference
│   └── AVAIL_SYNC_SUMMARY.md        ← Implementation summary
├── database/
│   └── supabase-schema.sql          ← Database schema
└── .env.local                        ← Supabase credentials
```

## Environment Setup

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Required Python packages:
```bash
pip install requests pandas python-dotenv
```

## Testing

### Test AVAIL Sync
```bash
# Test with tomorrow's date
python scripts/sync/sync-avail-slots.py 2026-01-25 2026-01-25
```

### Test CUSTOM Sync
```bash
# Test with tomorrow's date
python scripts/sync/sync-wconline.py 2026-01-25 2026-01-25
```

## Monitoring

Check Supabase tables after sync:
```sql
-- Check available slots
SELECT COUNT(*), slot_date 
FROM available_slots 
WHERE source = 'wconline' 
GROUP BY slot_date 
ORDER BY slot_date;

-- Check appointments
SELECT COUNT(*), appointment_date 
FROM appointments 
WHERE source = 'wconline' 
GROUP BY appointment_date 
ORDER BY appointment_date;

-- Check tutors
SELECT COUNT(*) FROM tutors;
```

## Troubleshooting

### "Supabase credentials not found"
→ Check `.env.local` file exists and has correct variables

### "Failed to create tutor"
→ Check Supabase RLS policies on `tutors` table

### "Missing or invalid end time"
→ WCOnline data issue - slots are skipped automatically

### "Rate limit approaching"
→ Script will wait automatically - reduce date range if needed

---

**Last Updated**: 2026-01-24  
**Status**: ✅ Both scripts tested and working
