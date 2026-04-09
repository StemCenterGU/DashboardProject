# Tutor-Specific Schedule Viewing Implementation

## Overview

This document describes the implementation of role-based schedule viewing that allows tutors to log in and view/edit only their own schedules, while lead tutors and managers can toggle between viewing their own schedule and all schedules.

## Features Implemented

### 1. Database Schema Changes

**Migration Files Created:**
- `supabase/migrations/20260408000000_add_user_id_to_tutors.sql`
- `supabase/migrations/20260408000001_link_users_to_tutors.sql`

**Changes:**
- Added `user_id` column to `tutors` table with foreign key to `auth.users(id)`
- Created index on `user_id` for performance
- Migration automatically links existing users to tutors by matching email prefix with username

**Example:**
```sql
-- User with email: anjeh001@gannon.edu
-- Matches tutor with username: anjeh001
```

### 2. Authentication Helpers

**File: `lib/auth.ts`**

**New Interface:**
```typescript
export interface TutorInfo {
  tutor_id: string
  tutor_name: string
  username: string
  student_id?: string
  role?: string
  user_id?: string
}
```

**New Function:**
```typescript
getUserTutor(userId: string): Promise<TutorInfo | null>
```

**Dual Strategy for User-Tutor Linking:**
1. **Primary:** Find tutor by `user_id` (after migration)
2. **Fallback:** Extract username from email and match `tutors.username`
   - Automatically updates `user_id` when found via fallback

### 3. Client-Side Hook

**File: `contexts/AuthContext.tsx`**

**New Hook:**
```typescript
useTutorInfo(): {
  tutorInfo: TutorInfo | null
  isLoading: boolean
  error: Error | null
}
```

**Usage:**
```typescript
const { tutorInfo, isLoading } = useTutorInfo()
if (tutorInfo) {
  console.log('Tutor ID:', tutorInfo.tutor_id)
}
```

### 4. Schedule API Updates

**File: `app/api/schedule/route.ts`**

**New Query Parameter:**
- `viewMode`: `'own'` | `'all'`

**Behavior:**
- `viewMode=own`: Returns only the authenticated user's schedule
- `viewMode=all`: Returns all schedules (requires `VIEW_ALL_SCHEDULES` permission)
- No `viewMode`: Defaults based on user role
  - Regular tutors: automatically get `viewMode=own`
  - Lead tutors+: automatically get `viewMode=all`

**Response Includes:**
```json
{
  "schedules": [...],
  "totalTutors": 1,
  "totalSlots": 15,
  "viewMode": "own",
  "canViewAll": false
}
```

### 5. Permission Checks on Slot Endpoints

**Files Updated:**
- `app/api/schedule/slot/route.ts` (POST - create slot)
- `app/api/schedule/slot/[id]/route.ts` (PUT - edit, DELETE - delete)

**Permission Logic:**
1. **Lead tutors/managers:** Can edit/delete ANY slot (via `EDIT_ALL_SCHEDULES` permission)
2. **Regular tutors:** Can only edit/delete THEIR OWN slots
   - Backend validates slot ownership by checking `tutor_id` matches user's tutor profile
   - Returns 403 if user tries to edit another tutor's slot

**Security:**
- All operations check authentication first
- Ownership validation happens on server-side (cannot be bypassed)
- Clear error messages for permission denials

### 6. UI Updates

**File: `app/(dashboard)/tutor-schedules/page.tsx`**

**New Features:**

1. **View Mode Toggle** (for lead tutors/managers only):
   ```tsx
   <Button onClick={() => setViewMode('own')}>
     My Schedule
   </Button>
   <Button onClick={() => setViewMode('all')}>
     All Schedules
   </Button>
   ```

2. **Automatic Role Detection:**
   - Regular tutors: No toggle shown, always see own schedule
   - Lead tutors+: Toggle appears, default to "All Schedules"

3. **Dynamic Fetching:**
   - Schedules refetch when `viewMode` changes
   - API call includes `viewMode` parameter

**File: `components/schedule/TutorScheduleView.tsx`**

**Changes:**
1. **Conditional Edit Buttons:**
   - Edit/Delete buttons only visible if user has `EDIT_OWN_SCHEDULE` or `EDIT_ALL_SCHEDULES`
   - "Add Time Slot" button only visible with edit permissions

2. **Permission Checks:**
   ```typescript
   const canEditOwn = hasPermission(role, 'EDIT_OWN_SCHEDULE')
   const canEditAll = hasPermission(role, 'EDIT_ALL_SCHEDULES')
   const canEdit = canEditOwn || canEditAll
   ```

## Permission Matrix

| Role | View Own | View All | Edit Own | Edit All |
|------|----------|----------|----------|----------|
| tutor | ✅ | ❌ | ✅ | ❌ |
| lead_tutor | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| developer | ✅ | ✅ | ✅ | ✅ |

## User Flow Examples

### Regular Tutor (e.g., anjeh001@gannon.edu)

1. Logs in with Gannon email
2. Navigates to "Tutor Schedules" page
3. Sees ONLY their own schedule (no toggle button)
4. Can add/edit/delete their own time slots
5. Cannot see other tutors' schedules

### Lead Tutor

1. Logs in with credentials
2. Navigates to "Tutor Schedules" page
3. Sees toggle: **"My Schedule"** | "All Schedules"
4. Can switch between views:
   - **My Schedule:** Shows only their schedule
   - **All Schedules:** Shows all tutors (with search/filter)
5. Can edit ANY tutor's schedule in either view

## Testing Checklist

- [ ] Run migrations to add `user_id` column
- [ ] Verify existing users are linked to tutors
- [ ] Test regular tutor login
  - [ ] Can only see own schedule
  - [ ] Can edit own slots
  - [ ] Cannot edit other tutors' slots (403 error)
  - [ ] No toggle button visible
- [ ] Test lead tutor login
  - [ ] Toggle button appears
  - [ ] "My Schedule" shows only their schedule
  - [ ] "All Schedules" shows all tutors
  - [ ] Can edit any slot in either view
- [ ] Test username matching
  - [ ] Create user with email format: username@gannon.edu
  - [ ] Verify auto-linking to tutor with matching username

## Migration Instructions

1. **Apply Database Migrations:**
   ```bash
   # Using Supabase CLI
   supabase db push

   # Or apply manually in Supabase Dashboard SQL Editor
   ```

2. **Verify Migration:**
   ```sql
   -- Check user_id column was added
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'tutors' AND column_name = 'user_id';

   -- Check how many tutors were linked
   SELECT COUNT(*) FROM tutors WHERE user_id IS NOT NULL;
   ```

3. **Test User-Tutor Linking:**
   ```sql
   -- Find your test user
   SELECT u.email, t.username, t.tutor_name, t.user_id
   FROM users u
   LEFT JOIN tutors t ON t.user_id = u.user_id
   WHERE u.email LIKE '%@gannon.edu';
   ```

## API Examples

### Fetch Own Schedule
```javascript
const response = await fetch('/api/schedule?viewMode=own')
const data = await response.json()
// Returns: { schedules: [...], viewMode: 'own', canViewAll: false }
```

### Fetch All Schedules (requires permission)
```javascript
const response = await fetch('/api/schedule?viewMode=all')
const data = await response.json()
// Returns: { schedules: [...], viewMode: 'all', canViewAll: true }
```

### Edit Own Slot
```javascript
const response = await fetch('/api/schedule/slot/123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    start_time: '14:00:00',
    end_time: '15:00:00'
  })
})
// Success if slot belongs to user OR user has EDIT_ALL_SCHEDULES
```

## Files Modified

### Database
- ✅ `supabase/migrations/20260408000000_add_user_id_to_tutors.sql`
- ✅ `supabase/migrations/20260408000001_link_users_to_tutors.sql`

### Backend
- ✅ `lib/auth.ts` - Added `getUserTutor()` helper
- ✅ `app/api/schedule/route.ts` - Added viewMode support
- ✅ `app/api/schedule/slot/route.ts` - Added permission checks (POST)
- ✅ `app/api/schedule/slot/[id]/route.ts` - Added permission checks (PUT, DELETE)

### Frontend
- ✅ `contexts/AuthContext.tsx` - Added `useTutorInfo()` hook
- ✅ `app/(dashboard)/tutor-schedules/page.tsx` - Added toggle and viewMode
- ✅ `components/schedule/TutorScheduleView.tsx` - Conditional edit buttons

## Security Considerations

1. **Backend Validation:** All permission checks happen server-side
2. **Ownership Verification:** Slot operations verify tutor_id matches user's profile
3. **SQL Injection:** Uses parameterized queries via Supabase client
4. **Authorization:** Leverages existing RBAC system from `lib/roles.ts`
5. **Fallback Strategy:** Username matching has no security implications (read-only lookup)

## Future Enhancements

- [ ] Add audit logging for schedule modifications
- [ ] Email notifications when schedule is edited by lead tutor
- [ ] Bulk edit operations for lead tutors
- [ ] Schedule export for individual tutors (PDF/CSV)
- [ ] Mobile-responsive view mode toggle
