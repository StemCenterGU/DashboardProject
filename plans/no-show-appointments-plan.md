# No-Show Appointments Implementation Plan

## Overview
Implement the functionality to properly handle "No Show" or "Missed" appointments. When an appointment is marked as a "No Show," it must immediately vacate its slot on the schedule grid (making it available for other bookings). The database will retain the full appointment record so administrators can view missed sessions and optionally restore them back to the active schedule.

## Execution Steps

### 1. Remove No-Shows from the Schedule Grid (Free Up Slot)
**File:** `nextjs-dashboard/app/api/scheduling/schedule-week/route.ts`
- **Action:** Update the logic that matches `bookedAppointment`s against `tutorAvail`.
- **Change:** Currently, the condition checks `String(apt.status) !== "cancelled"`. We will expand this to `String(apt.status) !== "cancelled" && String(apt.status) !== "no_show" && String(apt.status) !== "missed"`.
- **Result:** The system will ignore these records when painting the schedule grid, naturally resulting in an "available" slot that anyone can re-book.

### 2. Update PATCH Logic to Toggle `is_no_show` Properly
**File:** `nextjs-dashboard/app/api/scheduling/appointments/route.ts`
- **Action:** Modify the `PATCH` handler.
- **Change:** 
  - When `updateFields.status` is `'no_show'` or `'missed'`, ensure `is_no_show = true` and `is_missed = true`.
  - When `updateFields.status` is set back to `'booked'`, reset `is_no_show = false` and `is_missed = false`.

### 3. Provide a "Restore Appointment" Action
**File:** `nextjs-dashboard/components/appointment-detail-dialog.tsx`
- **Action:** Allow admins/tutors to bring a "No Show" appointment back to the schedule if marked by mistake.
- **Change:** Add a "Restore Appointment" dropdown menu item explicitly shown when `isAppointmentNoShow` is true. Clicking it will invoke `handleStatusUpdate("booked")` to put it back exactly in the slot it was. 
- **Permissions Context:** This button will follow strict role-based permissions. Only admins, managers, and lead tutors will be able to perform this action.

### 4. Create an Admin View/Filter for No Shows
**File:** `nextjs-dashboard/app/(dashboard)/scheduling/page.tsx`
- **Action:** Provide a mechanism for admins to find these missing appointments.
- **Change:** Add a "Status Filter" dropdown (All, Booked, No Show, Cancelled) on the existing "Appointments" tab lists (Today and Upcoming). When toggled, the filter will query the API (`?status=no_show`) to retrieve those specific records.

---
**Status:** Approved and finalized. Ready to be executed in a future sprint.
