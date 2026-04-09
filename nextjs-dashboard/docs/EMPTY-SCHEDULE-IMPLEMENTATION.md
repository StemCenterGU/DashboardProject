# Empty Schedule Template Implementation

## Overview

Implemented functionality for new tutors with zero availability slots to see their empty schedule with all 7 days displayed, including a 2PM-8PM template suggestion.

## User Story

**Before:**
- New tutor logs in → sees "No Schedules Found" card
- No indication they have a tutor profile
- Unclear how to start adding availability

**After:**
- New tutor logs in → sees their name in accordion with "0 slots" badge
- All 7 days (Sunday - Saturday) appear with "0" badges
- Each day shows "Suggested Hours: 2:00 PM - 8:00 PM" when expanded
- Clear "Add Time Slot" button for each day

## Implementation Details

### 1. API Changes (`app/api/schedule/route.ts`)

**Location:** Lines 190-212

**Logic:**
```typescript
// Special case: When viewing own schedule and tutor has 0 slots,
// create empty schedule structure with all 7 days
if (filterByTutorId && schedules.length === 0 && tutors && tutors.length > 0) {
  const tutor = tutors[0]
  schedules = [{
    tutorId: tutor.tutor_id,
    tutorName: tutor.tutor_name,
    role: tutor.role || 'tutor',
    days: {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: []
    },
    totalSlots: 0,
    isEmpty: true
  }]
}
```

**When This Applies:**
- ✅ Only when `viewMode='own'` (user viewing their own schedule)
- ✅ Only when tutor exists in database but has no availability records
- ❌ NOT when lead tutors view "All Schedules" (preserves existing behavior)

### 2. Component Changes (`components/schedule/TutorScheduleView.tsx`)

#### Change 1: Show All Days for Empty Schedules

**Location:** Lines 92-96

```typescript
// OLD: const sortedDays = DAY_ORDER.filter(day => tutor.days[day])
// NEW:
const sortedDays = tutor.totalSlots === 0
  ? DAY_ORDER  // Show all 7 days if no slots
  : DAY_ORDER.filter(day => tutor.days[day])  // Show only days with slots
```

**Effect:**
- Tutors with 0 slots: See all 7 days
- Tutors with 1+ slots: See only days with availability (existing behavior)

#### Change 2: Safe Badge Rendering

**Location:** Line 120

```typescript
// OLD: {tutor.days[day].length}
// NEW:
{tutor.days[day]?.length || 0}
```

**Effect:** Prevents crash when `tutor.days[day]` is an empty array or undefined

#### Change 3: Empty Day Template

**Location:** Lines 126-166

**Added conditional rendering:**
```typescript
{tutor.days[day] && tutor.days[day].length > 0 ? (
  // Existing: Show slots
) : (
  // NEW: Empty day template
  <div className="text-center py-6 px-4">
    <p className="text-sm font-medium">No availability set for {day}</p>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-xs text-blue-700 font-medium">Suggested Hours</p>
      <p className="text-sm text-blue-900">2:00 PM - 8:00 PM</p>
      <p className="text-xs text-blue-600">Standard tutoring hours</p>
    </div>
    <Button onClick={...}>Add Time Slot for {day}</Button>
  </div>
)}
```

## Visual Design

### Empty Day Template Design

```
┌─────────────────────────────────────────┐
│  No availability set for Monday         │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │   Suggested Hours               │   │
│  │   2:00 PM - 8:00 PM            │   │
│  │   Standard tutoring hours       │   │
│  └─────────────────────────────────┘   │
│                                          │
│  [+ Add Time Slot for Monday]          │
└─────────────────────────────────────────┘
```

**Colors:**
- Background: Light blue (`bg-blue-50`)
- Border: Blue (`border-blue-200`)
- Text: Blue shades (`text-blue-700`, `text-blue-900`, `text-blue-600`)

## Testing Guide

### Test Case 1: New Tutor with No Slots

**Setup:**
```sql
-- Create tutor in database
INSERT INTO tutors (tutor_id, tutor_name, username, role)
VALUES (gen_random_uuid(), 'John Doe', 'jdoe', 'tutor');

-- Create user with matching email
INSERT INTO users (user_id, email, role)
VALUES (gen_random_uuid(), 'jdoe@gannon.edu', 'tutor');

-- DO NOT add any tutor_availability records
```

**Test Steps:**
1. Log in as `jdoe@gannon.edu`
2. Navigate to Tutor Schedules page
3. **Expected:** See accordion with "John Doe" and "0 slots" badge
4. Expand tutor accordion
5. **Expected:** See all 7 days (Sunday through Saturday) each with "0" badge
6. Expand "Monday"
7. **Expected:** See:
   - Message: "No availability set for Monday"
   - Blue box with "Suggested Hours: 2:00 PM - 8:00 PM"
   - Button: "Add Time Slot for Monday"

### Test Case 2: Tutor Adds First Slot

**Continuing from Test Case 1:**

1. Click "Add Time Slot for Monday"
2. Select Monday, 2:00 PM - 3:00 PM
3. Save
4. **Expected:**
   - Monday now shows "1" badge
   - Monday expanded shows the time slot
   - Other days (Tue-Sun) still show empty template

### Test Case 3: Tutor with Partial Availability

**Setup:**
```sql
-- Tutor exists with 2 slots on Monday only
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time)
VALUES
  ('tutor_uuid', 1, '14:00:00', '15:00:00'),
  ('tutor_uuid', 1, '15:00:00', '16:00:00');
```

**Test Steps:**
1. Log in and navigate to schedules
2. **Expected:**
   - See tutor with "2 slots" badge
   - Expand tutor → see ONLY Monday (because totalSlots > 0, reverts to old behavior)
   - **Note:** This is intentional - template only shows when totalSlots === 0

**Behavior:**
- `totalSlots = 0`: Shows all 7 days with template
- `totalSlots > 0`: Shows only days with actual slots (existing behavior)

### Test Case 4: Lead Tutor Views All Schedules

**Setup:**
- Log in as lead tutor
- Another tutor in system has 0 slots

**Test Steps:**
1. Navigate to Tutor Schedules
2. Toggle to "All Schedules" view
3. **Expected:** Tutors with 0 slots DO NOT appear (existing behavior preserved)

**Why:** The empty template logic ONLY applies when `viewMode='own'`

### Test Case 5: Browser Console Verification

**Run in DevTools Console:**
```javascript
fetch('/api/schedule?viewMode=own')
  .then(r => r.json())
  .then(data => {
    console.log('Schedules:', data.schedules)
    // Expected for tutor with 0 slots:
    // [{
    //   tutorId: "...",
    //   tutorName: "John Doe",
    //   role: "tutor",
    //   days: {
    //     Sunday: [],
    //     Monday: [],
    //     ...
    //   },
    //   totalSlots: 0,
    //   isEmpty: true
    // }]
  })
```

## Edge Cases Handled

### 1. Tutor Exists But No User Link
**Scenario:** Tutor in database but `user_id` is NULL

**Behavior:**
- `getUserTutor()` uses fallback username matching
- Auto-links `user_id` on first API call
- Empty template appears correctly

### 2. User Has No Tutor Profile
**Scenario:** User logs in but no matching tutor record exists

**Behavior:**
- API returns: `{ error: "No tutor profile found", schedules: [] }`
- Page shows: "No tutor profile found for this user"
- Does NOT show empty template (because no tutor exists)

### 3. Multiple Tutors with Same Username
**Scenario:** Database constraint should prevent this

**Safety:**
- `username` should have UNIQUE constraint in tutors table
- If somehow multiple exist, first match is used

### 4. Lead Tutor Viewing Own Empty Schedule
**Scenario:** Lead tutor has no slots and views "My Schedule"

**Behavior:**
- ✅ Shows all 7 days with empty template
- ✅ Can toggle back to "All Schedules"
- ✅ Template only shows in "My Schedule" view

## Files Modified

1. ✅ `app/api/schedule/route.ts` - Added empty schedule structure for viewMode='own'
2. ✅ `components/schedule/TutorScheduleView.tsx` - Show all 7 days + empty template

## Performance Considerations

**Impact:** Minimal
- Empty schedule structure adds ~200 bytes to JSON response
- Only affects users viewing their own empty schedule
- No additional database queries (uses existing tutor data)

## Accessibility

- ✅ Clear text labels ("No availability set for Monday")
- ✅ Semantic HTML structure (accordions, buttons)
- ✅ Color contrast meets WCAG standards (blue on light blue background)
- ✅ Keyboard navigation supported (accordion controls)

## Future Enhancements

- [ ] Pre-fill "Add Slot" dialog with 2PM-8PM when clicked from empty day
- [ ] "Quick Add" button to add all 2PM-8PM slots at once
- [ ] Different suggested hours by day (e.g., weekends different from weekdays)
- [ ] Remember user's typical hours and suggest those instead of 2PM-8PM

## Rollback Plan

If issues arise:

```typescript
// In route.ts, remove lines 193-212 (empty schedule structure)
// In TutorScheduleView.tsx:
// - Revert line 93 to: const sortedDays = DAY_ORDER.filter(day => tutor.days[day])
// - Remove empty template (lines 126-166)
```

This will restore the original "No Schedules Found" behavior.
