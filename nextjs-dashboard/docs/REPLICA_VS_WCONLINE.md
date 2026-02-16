# WCOnline Replica vs WCOnline API — Database Strategy

## Summary: **No new tables needed**

Keep using the same **`appointments`** and **`available_slots`** tables. Use the **`source`** column to distinguish data origin. The existing WCOnline sync will continue to work and will **not** touch replica data.

---

## How it works today

| Table              | `source` column | Current values                          |
|--------------------|-----------------|-----------------------------------------|
| `appointments`     | `VARCHAR(50)`   | `'manual'`, `'wconline'`                |
| `available_slots`  | `VARCHAR(50)`   | `'wconline'`, `'manual'`, `'tutor_availability'` |

- **WCOnline sync script** only deletes/updates rows where `source = 'wconline'` for the synced dates. It never touches `manual` or any other source.
- **Dashboard/analytics** already support filtering by `source` (see `lib/analytics/scheduling.ts` — `filters.source` can be a single value or array).

---

## What to do for the WCOnline replica

1. **Use the same tables**  
   - `appointments`  
   - `available_slots`  
   - (and existing `tutors`, `courses`, `tutor_availability` as needed)

2. **Set `source = 'replica'`** for all data created by your replica:
   - When a student books via the replica UI → insert into `appointments` with `source = 'replica'`.
   - When you create or update slots in the replica → use `available_slots` with `source = 'replica'` (or keep using `tutor_availability` and existing slot logic if that fits better).

3. **Keep the old WCOnline integration as-is**  
   - Continue running the WCOnline sync script. It will only affect rows with `source = 'wconline'`.  
   - Replica rows (`source = 'replica'`) are never deleted or overwritten by the sync.

4. **Unified or filtered views**  
   - **Unified:** Don’t filter by `source` in the dashboard so all appointments/slots (WCOnline + replica) show together.  
   - **Filtered:** Use `filters.source = ['wconline', 'replica']` or add a UI toggle (e.g. “Show: All | WCOnline | Replica”) using the existing `source` filter.

---

## Why not create new tables?

- **Same shape:** Replica appointments and slots have the same fields (tutor, time, course, etc.). Duplicating tables would duplicate schema and all the dashboard/analytics code that reads from them.
- **One place to query:** Charts, schedule grid, and reports can keep reading from `appointments` and `available_slots`; you only need to decide whether to filter by `source`.
- **Safe coexistence:** The sync script is already scoped to `source = 'wconline'`, so replica data is safe.

---

## Optional: document allowed `source` values

If you want to make allowed values explicit in the database, you can run the migration in `database/migration-add-replica-source.sql`. It adds a CHECK constraint so `source` is one of the known values (including `'replica'`). This is optional; the app works without it.

---

## Replica implementation checklist

- [ ] When creating an appointment from the replica UI → insert into `appointments` with `source = 'replica'`.
- [ ] When creating/updating available slots from the replica → use `available_slots` with `source = 'replica'` (or your chosen value).
- [ ] Use the same `tutor_id` (from `tutors`), `course_id` (from `courses`) as the rest of the app.
- [ ] For `appointment_id`, use a UUID or another unique id (e.g. `replica-<uuid>`) so replica rows don’t clash with WCOnline IDs.
- [ ] Do **not** change the WCOnline sync script’s behavior; it should continue to only delete/update `source = 'wconline'` rows.

---

## Summary

| Question                         | Answer                                                                 |
|---------------------------------|------------------------------------------------------------------------|
| Create new tables?               | **No.** Use existing `appointments` and `available_slots`.           |
| How to keep “older” WCOnline?   | Keep syncing; sync only touches `source = 'wconline'`.                |
| How to mark replica data?       | Set `source = 'replica'` on insert/update from the replica.           |
| Will dashboard show both?       | Yes; omit `source` filter for “all”, or filter by source for toggles. |
