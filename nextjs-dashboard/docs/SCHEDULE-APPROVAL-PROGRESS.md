# Schedule Approval Workflow - Implementation Progress

## ✅ Completed (Phase 1 - Partial)

### Database Migrations Created
1. ✅ `20260409000000_create_schedule_change_requests.sql`
   - `schedule_change_requests` table (request tracking)
   - `schedule_change_slots` table (individual slot changes)
   - Constraints: one pending request per tutor
   - Auto-update timestamp triggers

2. ✅ `20260409000001_create_notifications.sql`
   - `notifications` table
   - Helper functions: create_notification, mark_as_read, get_unread_count
   - Indexes for performance

3. ✅ `20260409000002_add_approved_at_to_availability.sql`
   - Added `approved_at` column to `tutor_availability`
   - Added `approved_by` column to track admin

### API Endpoints Created
1. ✅ `app/api/schedule/draft/route.ts`
   - GET: Fetch current draft/pending request
   - POST: Create/update draft
   - DELETE: Discard draft

## 📋 Remaining Work

### Phase 1: Backend APIs (Remaining)

#### 1. Submit for Approval API
**File**: `app/api/schedule/submit/route.ts`
```typescript
// POST - Submit draft for approval
// - Change status from 'draft' to 'pending'
// - Set submitted_at timestamp
// - Create notifications for all admins
// - Return success with request ID
```

#### 2. Admin Schedule Requests List API
**File**: `app/api/admin/schedule-requests/route.ts`
```typescript
// GET - List all schedule requests
// - Filter by status (pending/all)
// - Filter by tutor
// - Include tutor info and change count
// - Pagination support
```

#### 3. Admin Review API
**File**: `app/api/admin/schedule-requests/[id]/route.ts`
```typescript
// GET - Get request details
// PUT - Approve or reject request
//   On approve:
//     - Copy slots to tutor_availability
//     - Set approved_at, approved_by
//     - Change status to 'approved'
//     - Create notification for tutor
//   On reject:
//     - Set status to 'rejected'
//     - Save rejection_reason
//     - Create notification for tutor
```

#### 4. Notifications API
**File**: `app/api/notifications/route.ts`
```typescript
// GET - Fetch user's notifications
// PUT - Mark notification(s) as read
```

**File**: `app/api/notifications/unread-count/route.ts`
```typescript
// GET - Get unread count for badge
```

### Phase 2: Tutor UI

#### 1. Update Tutor Schedules Page
**File**: `app/(dashboard)/tutor-schedules/page.tsx`

**Add States**:
```typescript
const [draftMode, setDraftMode] = useState(false)
const [hasPendingRequest, setHasPendingRequest] = useState(false)
const [draftChanges, setDraftChanges] = useState([])
const [currentRequest, setCurrentRequest] = useState(null)
```

**Add Functions**:
- `fetchDraftStatus()` - Check if draft/pending exists
- `enterDraftMode()` - Enable editing
- `saveDraft()` - Save changes to draft
- `submitForApproval()` - Submit draft to admin
- `discardDraft()` - Delete draft

**Add UI Components**:
- Draft Mode Banner (yellow)
- Pending Request Banner (blue)
- Save Draft Button
- Submit for Approval Button
- Discard Draft Button

#### 2. Create Schedule Editor Component
**File**: `components/schedule/TutorScheduleEditor.tsx`
- Extended version of TutorScheduleView
- Tracks changes (add/delete/modify)
- Visual diff indicators (green/red/yellow)
- Shows both current and draft states

#### 3. Create Banner Components
**Files**:
- `components/schedule/DraftModeBanner.tsx`
- `components/schedule/PendingRequestBanner.tsx`
- `components/schedule/ApprovedNotificationModal.tsx`

### Phase 3: Admin UI

#### 1. Create Admin Requests List Page
**File**: `app/(dashboard)/admin/schedule-requests/page.tsx`
- Table of all pending requests
- Columns: Tutor, Date, Changes, Status, Actions
- Filter and search functionality
- Click row to open review page

#### 2. Create Admin Review Page
**File**: `app/(dashboard)/admin/schedule-requests/[id]/page.tsx`
- Side-by-side comparison (current vs proposed)
- Editable proposed schedule
- Approve/Reject buttons with confirmation
- Rejection reason textarea
- Admin notes field

#### 3. Create Review Components
**Files**:
- `components/schedule/ScheduleComparison.tsx` - Side-by-side view
- `components/schedule/SlotDiffIndicator.tsx` - Visual markers
- `components/admin/AdminReviewControls.tsx` - Approve/reject UI

### Phase 4: Notifications UI

#### 1. Add Notification Bell to Navbar
**File**: `components/navbar.tsx`
- Bell icon with badge (unread count)
- Dropdown with recent notifications
- Click notification → navigate to link
- Mark as read on click

#### 2. Create Notification Components
**Files**:
- `components/notifications/NotificationBell.tsx`
- `components/notifications/NotificationDropdown.tsx`
- `components/notifications/NotificationItem.tsx`

#### 3. Add Polling for Real-time Updates
- Poll `/api/notifications/unread-count` every 30 seconds
- Update badge number
- Optional: Add sound/toast for new notifications

### Phase 5: Email Integration (Optional)

#### 1. Set up Email Service
- Use Supabase Edge Functions OR
- Use SendGrid/Resend API
- Create email templates

#### 2. Send Emails on Events
- **Tutor submits**: Email all admins
- **Admin approves**: Email tutor
- **Admin rejects**: Email tutor with feedback

## Next Steps

### Immediate (Continue Implementation):
1. Run the 3 migrations in Supabase
2. Create remaining API endpoints (submit, admin review, notifications)
3. Update tutor schedule page with draft mode
4. Create admin pages

### Testing Plan:
1. Test draft save/update/delete
2. Test submit for approval
3. Test admin approve flow
4. Test admin reject flow
5. Test notifications
6. Test edge cases (concurrent edits, etc.)

## Key Files Reference

### Database
- `supabase/migrations/20260409000000_create_schedule_change_requests.sql` ✅
- `supabase/migrations/20260409000001_create_notifications.sql` ✅
- `supabase/migrations/20260409000002_add_approved_at_to_availability.sql` ✅

### API (Backend)
- `app/api/schedule/draft/route.ts` ✅
- `app/api/schedule/submit/route.ts` ⏳
- `app/api/admin/schedule-requests/route.ts` ⏳
- `app/api/admin/schedule-requests/[id]/route.ts` ⏳
- `app/api/notifications/route.ts` ⏳
- `app/api/notifications/unread-count/route.ts` ⏳

### Pages (Frontend)
- `app/(dashboard)/tutor-schedules/page.tsx` (update) ⏳
- `app/(dashboard)/admin/schedule-requests/page.tsx` (new) ⏳
- `app/(dashboard)/admin/schedule-requests/[id]/page.tsx` (new) ⏳

### Components
- Tutor schedule editor ⏳
- Draft mode banners ⏳
- Admin review UI ⏳
- Notifications system ⏳

## Estimated Time Remaining
- Backend APIs: 1-2 days
- Tutor UI: 2-3 days
- Admin UI: 2-3 days
- Notifications: 1 day
- Testing & Polish: 1-2 days

**Total**: 7-11 days remaining

## Notes
- Migrations must be run before testing APIs
- Test in order: Draft → Submit → Admin Review → Notifications
- Consider adding Storybook for component development
