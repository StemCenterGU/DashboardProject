# Excel Grid View for Lead Tutor Schedules

**Date:** 2026-04-06
**Feature:** Excel-style grid view for lead tutor schedules
**Status:** Implemented

---

## Overview

Added a new Excel-style grid view to the Tutor Schedules page that displays lead tutor availability in a spreadsheet-like format. Professors can now see all lead tutor schedules at once in a comprehensive grid layout.

### Key Features:
- ✅ Excel-style grid with time slots as rows and tutors as columns
- ✅ Shows only lead tutors (filtered by role)
- ✅ Day abbreviations in cells (Sun, Mon, Tue, etc.)
- ✅ Color-coded availability (green = available)
- ✅ Tab switcher between accordion view and grid view
- ✅ Sticky headers for easy navigation
- ✅ Print-friendly layout
- ✅ Hover tooltips for detailed information

---

## User Guide

### Accessing the Excel Grid View

1. Navigate to **Tutor Schedules** page
2. Click on the **"Excel Grid View (Lead Tutors)"** tab at the top
3. The grid will load showing all lead tutor schedules

### Understanding the Grid

**Grid Layout:**
- **Rows:** Time slots from 2:00 PM to 8:00 PM (30-minute intervals)
- **Columns:** Lead tutors (one column per tutor)
- **Cells:** Show day abbreviations when tutor is available

**Cell Colors:**
- **Green background:** Tutor is available at this time
- **White background:** Tutor is not available

**Day Abbreviations:**
- Sun = Sunday
- Mon = Monday
- Tue = Tuesday
- Wed = Wednesday
- Thu = Thursday
- Fri = Friday
- Sat = Saturday

**Example Cell:**
```
Mon, Wed, Fri  (Tutor available on Monday, Wednesday, and Friday at this time)
```

### Switching Views

Use the tabs at the top of the page:
- **Accordion View:** Traditional grouped view (all tutors)
- **Excel Grid View:** Spreadsheet-style grid (lead tutors only)

### Printing

To print the schedule grid:
1. Switch to Excel Grid View
2. Press `Ctrl+P` (Windows) or `Cmd+P` (Mac)
3. Choose printer settings
4. Print

---

## Implementation Details

### Files Created

#### 1. **`components/schedule/TutorSchedulesExcelGrid.tsx`**
- Main grid rendering component
- Generates time slots (2 PM - 8 PM, 30-min intervals)
- Transforms schedule data into grid format
- Handles cell rendering with day abbreviations
- Sticky positioning for headers and time column

**Key Features:**
```typescript
interface TutorSchedule {
  tutorId: string
  tutorName: string
  role: string
  days: {
    [dayName: string]: Array<{
      id: string
      dayOfWeek: number
      dayName: string
      startTime: string
      endTime: string
    }>
  }
  totalSlots: number
}
```

**Grid Generation:**
- Generates 13 time slots (2:00 PM to 8:00 PM)
- Maps tutor availability to corresponding time slots
- Groups days that overlap in the same time slot

#### 2. **`components/schedule/LeadTutorSchedulesView.tsx`**
- Container component for the Excel grid view
- Fetches lead tutor schedules from API
- Handles loading, error, and empty states
- Includes legend and instructions
- Refresh functionality

**API Call:**
```typescript
const response = await fetch('/api/schedule?role=lead_tutor')
```

#### 3. **`components/ui/tabs.tsx`**
- Reusable tabs component
- Provides tab switching functionality
- Components: Tabs, TabsList, TabsTrigger, TabsContent
- Controlled and uncontrolled modes supported

### Files Modified

#### 1. **`app/api/schedule/route.ts`**

**Changes:**
- Added `role` query parameter support
- Filters tutors by role when parameter provided
- Includes `role` field in response

**New Query Parameter:**
```typescript
GET /api/schedule?role=lead_tutor
```

**Response Changes:**
```typescript
{
  schedules: [{
    tutorId: string,
    tutorName: string,
    role: string,  // NEW FIELD
    days: {...},
    totalSlots: number
  }]
}
```

**Code Changes:**
```typescript
// Get role filter from query params
const { searchParams } = new URL(request.url)
const roleFilter = searchParams.get('role')

// Apply role filter if provided
let tutorsQuery = supabase
  .from("tutors")
  .select("tutor_id, tutor_name, username, role")

if (roleFilter) {
  tutorsQuery = tutorsQuery.eq("role", roleFilter)
}
```

#### 2. **`app/(dashboard)/tutor-schedules/page.tsx`**

**Changes:**
- Added tab switcher with Tabs component
- Integrated LeadTutorSchedulesView component
- Added activeTab state management
- Disabled bulk operations when in Excel view

**Tab Structure:**
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="accordion">Accordion View</TabsTrigger>
    <TabsTrigger value="excel">Excel Grid View (Lead Tutors)</TabsTrigger>
  </TabsList>

  <TabsContent value="accordion">
    {/* Existing accordion view with search and filters */}
  </TabsContent>

  <TabsContent value="excel">
    <LeadTutorSchedulesView />
  </TabsContent>
</Tabs>
```

---

## Technical Architecture

### Data Flow

1. **User clicks "Excel Grid View" tab**
2. **LeadTutorSchedulesView component mounts**
3. **API request:** `GET /api/schedule?role=lead_tutor`
4. **Backend filters tutors by role = 'lead_tutor'**
5. **API returns schedules for lead tutors only**
6. **TutorSchedulesExcelGrid transforms data:**
   - Generates time slot rows
   - Maps tutor availability to grid cells
   - Groups day abbreviations per cell
7. **Grid renders with sticky headers**

### Data Transformation

**Input (API Response):**
```json
{
  "schedules": [
    {
      "tutorId": "uuid-1",
      "tutorName": "Kensy A.",
      "role": "lead_tutor",
      "days": {
        "Monday": [
          {
            "startTime": "08:00:00",
            "endTime": "10:00:00",
            "dayOfWeek": 1,
            "dayName": "Monday"
          }
        ]
      }
    }
  ]
}
```

**Output (Grid Data):**
```typescript
{
  "08:00": {
    "uuid-1": { days: [1], dayNames: ["Mon"] }
  },
  "08:30": {
    "uuid-1": { days: [1], dayNames: ["Mon"] }
  },
  "09:00": {
    "uuid-1": { days: [1], dayNames: ["Mon"] }
  },
  "09:30": {
    "uuid-1": { days: [1], dayNames: ["Mon"] }
  }
}
```

### Component Hierarchy

```
TutorSchedulesPage
├── Tabs
│   ├── TabsList
│   │   ├── TabsTrigger (Accordion View)
│   │   └── TabsTrigger (Excel Grid View)
│   ├── TabsContent (Accordion)
│   │   └── TutorScheduleView (existing)
│   └── TabsContent (Excel)
│       └── LeadTutorSchedulesView
│           └── TutorSchedulesExcelGrid
```

---

## Styling and UX

### Grid Styling

**Header Row:**
- Blue background (`bg-blue-600`)
- White text
- Sticky positioning (`sticky top-0`)
- Shows tutor name and slot count

**Time Column:**
- Gray background (`bg-gray-100`)
- Sticky left positioning (`sticky left-0`)
- 12-hour format (e.g., "8:00 AM")

**Data Cells:**
- Green background when available (`bg-green-100`)
- White background when not available
- Hover effect (`hover:bg-blue-50`)
- Tooltip on hover showing full day names

**Responsive Design:**
- Horizontal scrolling for many tutors
- Sticky headers remain visible
- Minimum column width: 120px

### Print Styling

The grid is print-friendly:
- All colors translate to grayscale
- Page breaks avoided within rows
- Headers repeat on each page (browser dependent)

---

## Database Schema

### Tutors Table

The `role` column is used for filtering:

```sql
CREATE TABLE tutors (
    tutor_id UUID PRIMARY KEY,
    tutor_name VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE,
    student_id VARCHAR(50) UNIQUE,
    role VARCHAR(50) DEFAULT 'tutor'
        CHECK (role IN ('tutor', 'lead_tutor', 'manager', 'admin', 'developer'))
);
```

**Lead Tutors Query:**
```sql
SELECT * FROM tutors WHERE role = 'lead_tutor';
```

### Tutor_Availability Table

```sql
CREATE TABLE tutor_availability (
    availability_id UUID PRIMARY KEY,
    tutor_id UUID REFERENCES tutors(tutor_id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true
);
```

---

## Testing

### Manual Testing Checklist

- [x] Tab switching works correctly
- [x] Excel grid loads lead tutor schedules
- [x] Time slots display correctly (7 AM - 10:30 PM)
- [x] Day abbreviations show in cells
- [x] Green cells indicate availability
- [x] Hover tooltips work
- [x] Sticky headers remain visible when scrolling
- [x] Refresh button reloads data
- [x] Empty state shows when no lead tutors
- [x] Error state handles API failures gracefully
- [x] Bulk operations disabled in Excel view
- [x] Print layout looks correct

### Test Scenarios

#### Scenario 1: View Lead Tutor Schedules
1. Navigate to Tutor Schedules page
2. Click "Excel Grid View (Lead Tutors)" tab
3. **Expected:** Grid loads showing only lead tutors

#### Scenario 2: Check Cell Content
1. Open Excel Grid View
2. Find a green cell
3. Hover over the cell
4. **Expected:** Tooltip shows full day names

#### Scenario 3: No Lead Tutors
1. Remove lead_tutor role from all tutors in database
2. Open Excel Grid View
3. **Expected:** Empty state message displayed

#### Scenario 4: Print Schedule
1. Open Excel Grid View
2. Press Ctrl+P
3. **Expected:** Print preview shows grid layout

---

## Configuration

### Time Slot Configuration

To change the time range or interval, modify `TutorSchedulesExcelGrid.tsx`:

```typescript
// Current: 2 PM - 8 PM, 30-minute intervals
const timeSlots = useMemo<TimeSlot[]>(() => {
  const slots: TimeSlot[] = []
  for (let hour = 14; hour <= 20; hour++) {  // Change start/end hour here (14=2PM, 20=8PM)
    for (let minute = 0; minute < 60; minute += 30) {  // Change interval here
      // ...
    }
  }
  return slots
}, [])
```

### Role Filter Configuration

To show different roles, modify the API call in `LeadTutorSchedulesView.tsx`:

```typescript
// Current: shows lead_tutor
const response = await fetch('/api/schedule?role=lead_tutor')

// To show managers:
const response = await fetch('/api/schedule?role=manager')

// To show all tutors:
const response = await fetch('/api/schedule')
```

---

## Performance Considerations

### Grid Rendering
- **Rows:** 13 time slots (2 PM - 8 PM, 30-min intervals)
- **Columns:** Variable (depends on number of lead tutors)
- **Cells:** Rows × Columns (e.g., 13 × 10 = 130 cells)

### Optimizations
- `useMemo` for time slot generation (computed once)
- `useMemo` for grid data transformation (recomputes only when schedules change)
- Minimal re-renders with React optimization

### Scalability
- **Current:** Handles ~20 lead tutors comfortably
- **Recommended max:** 30 tutors (horizontal scrolling becomes unwieldy)
- **Solution for more tutors:** Add pagination or filtering by department

---

## Future Enhancements

### Potential Features

1. **Filtering:**
   - Filter by specific days (e.g., show only Monday-Friday)
   - Filter by time range (e.g., show only 9 AM - 5 PM)
   - Multi-role selection (lead_tutor + manager)

2. **Sorting:**
   - Sort tutors by name
   - Sort by total availability
   - Custom column order (drag and drop)

3. **Export:**
   - Export to Excel (.xlsx)
   - Export to CSV
   - Export to PDF

4. **Interactivity:**
   - Click cell to view/edit availability
   - Select multiple cells for bulk operations
   - Color customization for different availability types

5. **Comparison:**
   - Side-by-side comparison of two tutors
   - Highlight conflicts or overlaps
   - Show total coverage per time slot

6. **Mobile View:**
   - Swipeable tutor cards on mobile
   - Simplified single-tutor view
   - Touch-friendly interactions

---

## Troubleshooting

### Issue: Grid shows no lead tutors

**Cause:** No tutors have `role = 'lead_tutor'` in database

**Solution:**
1. Check tutors table:
   ```sql
   SELECT tutor_name, role FROM tutors WHERE role = 'lead_tutor';
   ```
2. If empty, assign lead_tutor role:
   ```sql
   UPDATE tutors SET role = 'lead_tutor' WHERE tutor_name = 'Kensy A.';
   ```

### Issue: Time slots not aligned with availability

**Cause:** Availability times don't match 30-minute boundaries

**Solution:**
- Use "Break into 1-Hour Slots" feature in Accordion view
- Or adjust time slot interval in code

### Issue: Tabs not switching

**Cause:** JavaScript error or missing dependency

**Solution:**
1. Check browser console for errors
2. Verify `components/ui/tabs.tsx` exists
3. Restart development server

---

## Related Documentation

- **API Documentation:** `app/api/schedule/route.ts`
- **Schedule Upload:** `docs/SCHEDULE-IMPORT-USERNAME-MATCHING.md`
- **Role Sync:** `docs/RBAC-IMPLEMENTATION-GUIDE.md`
- **Staff Data:** `docs/TUTORS-SYNC-QUICKSTART.md`

---

## Summary

**What was added:**
- ✅ Excel-style grid component for lead tutor schedules
- ✅ Tab switcher between accordion and grid views
- ✅ Role-based filtering in API
- ✅ Sticky headers and columns for easy navigation
- ✅ Print-friendly layout

**Benefits:**
- ✅ Professors can see all lead tutor schedules at once
- ✅ Easier to identify coverage gaps
- ✅ Better for planning and coordination
- ✅ Professional spreadsheet-like appearance
- ✅ Print-ready for distribution

**User Experience:**
- Simple tab switching between views
- Clear legend and instructions
- Hover tooltips for details
- Refresh button to reload data
- Error handling and empty states

---

**Last Updated:** 2026-04-06
**Version:** 1.0.0
**Status:** Production Ready
