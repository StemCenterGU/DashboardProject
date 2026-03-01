# Data Source Policy — Supabase as Single Source of Truth

## Summary

The WCOnline replica **does not fetch data from the WCOnline API**. All data is **stored in and read from Supabase only**. Existing data already in Supabase tables is **not deleted**. New data (appointments, tutors, etc.) is **created on the website** and written to Supabase; all features then reflect that data.

---

## Rules

| Rule | Description |
|------|-------------|
| **No WCOnline API fetch** | The scheduled WCOnline sync is disabled. No cron or job pulls from the WCOnline API. |
| **Read from Supabase** | Schedule grid, calendar, appointments list, tutors, courses, and analytics all read from Supabase tables. |
| **Write to Supabase** | Creating appointments, adding tutors, or making any other changes on the website writes to Supabase. |
| **Keep existing data** | Existing rows in Supabase (from previous syncs or manual entry) are never deleted by this policy. |
| **Dynamic data** | Data is dynamic: it comes only from Supabase. When you create or update data on the site, it is persisted in Supabase and appears everywhere (schedule, calendar, reports). |

---

## Data flow

- **Schedule / calendar / appointments**  
  APIs such as `/api/scheduling/schedule-week`, `/api/scheduling/appointments-by-range`, and `/api/scheduling/appointments` query Supabase only.

- **Creating an appointment**  
  Use `POST /api/scheduling/appointments` with the appointment payload. The API inserts into the `appointments` table with `source: 'replica'` (or `'manual'`). No WCOnline API is called.

- **Creating a tutor**  
  Use `POST /api/scheduling/tutors` with the tutor name. The API inserts into the `tutors` table. All features that list or filter by tutors will show the new row.

- **Other changes**  
  Any future feature that creates or updates data (e.g. availability, courses) should perform inserts/updates in Supabase so that all parts of the system stay in sync.

---

## Source column (appointments)

- `source = 'replica'` — Created by the replica/dashboard (e.g. booking from the schedule UI).
- `source = 'manual'` — Created manually (e.g. dashboard forms).
- `source = 'wconline'` — Legacy rows from the old WCOnline sync; **kept as-is**, no new rows added from WCOnline.

---

## Related

- **REPLICA_VS_WCONLINE.md** — Historical context and use of `source` for replica vs WCOnline.
- **SETUP-REPLICA-DATABASE.md** — Database setup and `replica` source value.
- **WCOnline sync** — Code under `lib/wconline-sync.ts` and `/api/sync/wconline/*` is no longer used for scheduled sync; the scheduled endpoint returns “disabled” and does not call the WCOnline API.
