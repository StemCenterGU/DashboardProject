# Schedule Approval Workflow - Implementation Summary

## Overview
A comprehensive schedule approval workflow system has been implemented, allowing tutors to propose schedule changes that require admin approval before being applied to the official schedule.

## Implementation Completed ✅

### 1. Database Schema (Migrations)
**Files Created:**
- `supabase/migrations/20260409000000_create_schedule_change_requests.sql`
- `supabase/migrations/20260409000001_create_notifications.sql`
- `supabase/migrations/20260409000002_add_approved_at_to_availability.sql`

**Key Tables:**
- `schedule_change_requests` - Tracks all schedule change requests
- `schedule_change_slots` - Individual slot changes (add/delete/modify)
- `notifications` - In-app notification system

**Features:**
- Unique constraint ensuring only one pending request per tutor
- Cascade deletes for data integrity
- Helper functions for notification management
- Approval tracking with timestamps and approver IDs

### 2. Backend API Endpoints

#### Draft Management
**File:** `app/api/schedule/draft/route.ts`
- `GET` - Fetch current draft or pending request
- `POST` - Create or update draft with slot changes
- `DELETE` - Discard draft

#### Submit for Approval
**File:** `app/api/schedule/submit/route.ts`
- `POST` - Submit draft to admins for review
- Creates notifications for all admins

#### Admin Request Management
**File:** `app/api/admin/schedule-requests/route.ts`
- `GET` - List all schedule change requests
- Supports filtering by status (pending/all)
- Includes search by tutor name

**File:** `app/api/admin/schedule-requests/[id]/route.ts`
- `GET` - Fetch request details with current schedule comparison
- `PUT` - Approve or reject requests
  - Applies changes to `tutor_availability` on approval
  - Sends notifications to tutors

#### Notifications
**File:** `app/api/notifications/route.ts`
- `GET` - Fetch notifications with pagination
- `PUT` - Mark as read (single, multiple, or all)

**File:** `app/api/notifications/unread-count/route.ts`
- `GET` - Get unread notification count for badge

### 3. Permissions System
**File:** `lib/roles.ts` (Updated)

Added new permissions:
- `CREATE_SCHEDULE_DRAFT` - Tutor level and above
- `SUBMIT_SCHEDULE_CHANGES` - Tutor level and above
- `VIEW_SCHEDULE_REQUESTS` - Manager level and above
- `APPROVE_SCHEDULE_REQUESTS` - Manager level and above
- `REJECT_SCHEDULE_REQUESTS` - Manager level and above

### 4. Frontend Components

#### Tutor Schedule Page (Updated)
**File:** `app/(dashboard)/tutor-schedules/page.tsx`

**New Features:**
- Draft mode state management
- "Edit My Schedule" button for tutors
- Draft change tracking (add/delete/modify actions)
- Save Draft / Submit / Discard functionality
- Automatic draft status checking
- Approved notification modal

**New States:**
- `draftMode` - Whether user is editing in draft mode
- `draftChanges` - Array of pending changes
- `currentRequest` - Current draft or pending request
- `showApprovedModal` - Shows approval notification

#### Banner Components
**File:** `components/schedule/DraftModeBanner.tsx`
- Shown when in draft mode with unsaved changes
- Shows Save Draft, Submit, and Discard buttons
- Displays change count

**File:** `components/schedule/PendingRequestBanner.tsx`
- Shown when tutor has a pending approval request
- Displays submission date and change count
- Prevents editing while pending

**File:** `components/schedule/ApprovedNotificationModal.tsx`
- Modal shown when request is approved
- Shows admin notes if provided
- One-time display using sessionStorage

#### Admin Pages
**File:** `app/(dashboard)/admin/schedule-requests/page.tsx`
- Lists all schedule change requests
- Filter by pending/all status
- Search by tutor name
- Shows change counts (added/modified/deleted)

**File:** `app/(dashboard)/admin/schedule-requests/[id]/page.tsx`
- Detailed request view
- Side-by-side comparison of changes
- Approve/Reject dialogs
- Admin notes and rejection reason fields
- Visual indicators for action types (add/delete/modify)

#### Notification System
**File:** `components/notifications/NotificationBell.tsx`
- Bell icon with unread count badge
- Polls for new notifications every 30 seconds
- Popover dropdown with notification list

**File:** `components/notifications/NotificationDropdown.tsx`
- Notification list with scroll
- Mark all as read button
- Individual notification items

**File:** `components/notifications/NotificationItem.tsx`
- Individual notification display
- Click to navigate to related page
- Visual unread indicator
- Time ago formatting

#### Navbar (Updated)
**File:** `components/navbar.tsx`
- Added notification bell
- Added "Schedule Requests" link for managers/admins

## User Flow

### Tutor Workflow
1. **View Schedule**: Tutor navigates to "Tutor Schedules" page
2. **Edit Schedule**: Clicks "Edit My Schedule" button to enter draft mode
3. **Make Changes**:
   - Add new time slots
   - Modify existing slots
   - Delete slots
4. **Save Draft**: Clicks "Save Draft" to save progress (optional)
5. **Submit**: Clicks "Submit for Approval" when ready
6. **Wait**: Yellow banner shows "Pending Approval" status
7. **Get Notified**:
   - Receives notification when approved/rejected
   - Modal shows approval with admin notes
   - Can view updated schedule

### Admin Workflow
1. **Get Notified**: Receives notification when tutor submits request
2. **View Requests**: Navigates to "Schedule Requests" page
3. **Review Details**: Clicks on request to see proposed changes
4. **Compare**: Views current schedule vs. proposed changes
5. **Decide**:
   - **Approve**: Adds optional admin notes, clicks "Approve Changes"
   - **Reject**: Provides rejection reason, clicks "Reject Request"
6. **Confirmation**: Tutor receives notification of decision

## Key Features Implemented

### Security
- All endpoints require authentication via `requireAuth()`
- Permission checks using `hasPermissionCheck()`
- User ownership validation (tutors can only edit their own schedules)
- Admin-only access to approval endpoints

### Data Integrity
- Unique constraint: Only one pending request per tutor
- Cascade deletes for related records
- Foreign key relationships maintained
- Transaction-like approval process (all changes applied together)

### User Experience
- Real-time unread notification count
- Visual diff indicators (green/yellow/red for add/delete/modify)
- Clear status banners for draft/pending/approved states
- One-time approval modal using sessionStorage
- Responsive design with loading states
- Automatic polling for new notifications (30s interval)

### Notification Types
- `schedule_submitted` - Admin notified of new request
- `schedule_approved` - Tutor notified of approval
- `schedule_rejected` - Tutor notified of rejection

## Testing Checklist

### Tutor Tests
- [ ] Enter draft mode and make changes
- [ ] Save draft successfully
- [ ] Submit draft for approval
- [ ] Verify cannot edit while pending
- [ ] Receive approval notification
- [ ] See approved changes in schedule
- [ ] Receive rejection notification
- [ ] Resubmit after rejection

### Admin Tests
- [ ] Receive notification when tutor submits
- [ ] View all pending requests
- [ ] Filter by status (pending/all)
- [ ] Search by tutor name
- [ ] View request details
- [ ] Approve request with notes
- [ ] Reject request with reason
- [ ] Verify changes applied to schedule

### Notification Tests
- [ ] Bell shows correct unread count
- [ ] Click notification navigates to correct page
- [ ] Mark single notification as read
- [ ] Mark all as read
- [ ] Unread count updates correctly
- [ ] Polling works (wait 30s for update)

## Database Queries Reference

### Check Pending Requests
```sql
SELECT * FROM schedule_change_requests
WHERE status = 'pending'
ORDER BY submitted_at DESC;
```

### View Request Details
```sql
SELECT
  scr.*,
  t.tutor_name,
  COUNT(scs.change_slot_id) as change_count
FROM schedule_change_requests scr
JOIN tutors t ON scr.tutor_id = t.tutor_id
LEFT JOIN schedule_change_slots scs ON scr.request_id = scs.request_id
WHERE scr.request_id = '<REQUEST_ID>'
GROUP BY scr.request_id, t.tutor_name;
```

### Check Notifications
```sql
SELECT * FROM notifications
WHERE user_id = '<USER_ID>'
ORDER BY created_at DESC
LIMIT 20;
```

## Future Enhancements (Optional)

### Potential Features
1. **Email Notifications**: Integrate SendGrid/Resend for email alerts
2. **Batch Operations**: Approve/reject multiple requests at once
3. **Schedule Version History**: Track all historical changes
4. **Conflict Detection**: Warn if changes conflict with booked appointments
5. **Admin Modifications**: Allow admin to modify proposal before approval
6. **Comments/Discussion**: Add comment thread on requests
7. **Recurring Changes**: Apply changes to multiple weeks
8. **Bulk Import**: CSV upload of schedule change requests
9. **Calendar View**: Visual calendar for reviewing changes
10. **Mobile Optimization**: Better mobile responsive design

## Files Modified/Created

### Created Files (17)
1. `supabase/migrations/20260409000000_create_schedule_change_requests.sql`
2. `supabase/migrations/20260409000001_create_notifications.sql`
3. `supabase/migrations/20260409000002_add_approved_at_to_availability.sql`
4. `app/api/schedule/draft/route.ts`
5. `app/api/schedule/submit/route.ts`
6. `app/api/admin/schedule-requests/route.ts`
7. `app/api/admin/schedule-requests/[id]/route.ts`
8. `app/api/notifications/route.ts`
9. `app/api/notifications/unread-count/route.ts`
10. `components/schedule/DraftModeBanner.tsx`
11. `components/schedule/PendingRequestBanner.tsx`
12. `components/schedule/ApprovedNotificationModal.tsx`
13. `app/(dashboard)/admin/schedule-requests/page.tsx`
14. `app/(dashboard)/admin/schedule-requests/[id]/page.tsx`
15. `components/notifications/NotificationBell.tsx`
16. `components/notifications/NotificationDropdown.tsx`
17. `components/notifications/NotificationItem.tsx`

### Modified Files (2)
1. `lib/roles.ts` - Added schedule approval permissions
2. `app/(dashboard)/tutor-schedules/page.tsx` - Added draft mode functionality
3. `components/navbar.tsx` - Added notification bell and schedule requests link

## Dependencies Used
- Next.js 14 App Router
- Supabase (PostgreSQL + Auth)
- Shadcn UI components
- Lucide React icons
- date-fns (for date formatting)

## Completion Status
✅ **100% Complete** - All planned features have been implemented and are ready for testing.

## Next Steps
1. Apply migrations to Supabase database
2. Test the complete workflow end-to-end
3. Deploy to production
4. Train users on the new workflow
5. Monitor for any issues or feedback

---

**Implementation Date**: April 9, 2026
**Developer**: Claude Code
**Status**: ✅ Complete and Ready for Testing
