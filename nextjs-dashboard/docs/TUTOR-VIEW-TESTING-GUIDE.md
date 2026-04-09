# Tutor Schedule View - Testing Guide

## Quick Verification Steps

### 1. Verify Database Migration

Run the verification script in Supabase SQL Editor:
```sql
-- File: scripts/verify-user-tutor-linking.sql
-- Copy and paste the entire file into Supabase SQL Editor
```

**Expected Results:**
- ✅ `user_id` column exists in `tutors` table
- ✅ Foreign key constraint to `auth.users` exists
- ✅ Some tutors have `user_id` populated (based on email matching)
- ✅ No duplicate `user_id` values

### 2. Manual Test - Regular Tutor

**Test Account:** Create or use a tutor with email format `username@gannon.edu`

**Steps:**
1. Log in with tutor account (e.g., `anjeh001@gannon.edu`)
2. Navigate to **Tutor Schedules** page
3. **Expected Behavior:**
   - ✅ See ONLY your own schedule
   - ✅ No toggle button visible (My Schedule | All Schedules)
   - ✅ Can click "Add Time Slot" button
   - ✅ Can edit existing slots (pencil icon)
   - ✅ Can delete existing slots (trash icon)
   - ✅ Page header shows "Current Schedules" (no view indicator needed)

**Test Editing:**
1. Click "Add Time Slot"
2. Fill in day, start time, end time
3. Save
4. **Expected:** Slot appears immediately in your schedule

**Test Permissions (via API):**
1. Open Browser DevTools → Network tab
2. Try to fetch all schedules:
   ```javascript
   fetch('/api/schedule?viewMode=all')
   ```
3. **Expected:** 403 Forbidden (or returns only your schedule)

### 3. Manual Test - Lead Tutor

**Test Account:** User with role `lead_tutor`, `manager`, or `admin`

**Steps:**
1. Log in with lead tutor account
2. Navigate to **Tutor Schedules** page
3. **Expected Behavior:**
   - ✅ Toggle button IS visible: **"My Schedule"** | **"All Schedules"**
   - ✅ Default view: "All Schedules" (button highlighted)
   - ✅ Can see all tutors in accordion view

**Test View Switching:**
1. Click **"My Schedule"** button
   - ✅ Button highlights
   - ✅ Page shows ONLY your schedule
   - ✅ Search bar may show "1 tutor" or "No tutors" if you have no profile
2. Click **"All Schedules"** button
   - ✅ Button highlights
   - ✅ Page shows all tutor schedules
   - ✅ Search/filter still works

**Test Edit Permissions:**
1. In "All Schedules" view
2. Expand any tutor's schedule
3. Click edit on any slot
4. **Expected:** Can edit ANY tutor's slot successfully

### 4. Test Username Matching Fallback

**Scenario:** User exists but `user_id` is NULL in tutors table

**Setup:**
```sql
-- Create a tutor without user_id
INSERT INTO tutors (tutor_name, username, role)
VALUES ('Test Tutor', 'testuser', 'tutor');

-- Create matching user
INSERT INTO users (email, role)
VALUES ('testuser@gannon.edu', 'tutor');
```

**Test:**
1. Log in as `testuser@gannon.edu`
2. Navigate to Tutor Schedules
3. **Expected:** API automatically links user to tutor via username match
4. **Verify:** Check database - `user_id` should now be populated

```sql
SELECT user_id, username FROM tutors WHERE username = 'testuser';
-- Should show user_id populated
```

### 5. Test Excel Grid View (Lead Tutors)

**Test Account:** Lead tutor or higher

**Steps:**
1. Navigate to **Tutor Schedules** page
2. Click **"Excel Grid View (Lead Tutors)"** tab
3. **Expected Behavior:**
   - ✅ Excel-style grid appears
   - ✅ Can edit slots by clicking cells
   - ✅ Shows ALL tutors (not affected by viewMode toggle)
   - ✅ This view is for lead tutors only

### 6. Test API Endpoints Directly

**Test 1: GET /api/schedule?viewMode=own**
```javascript
// As regular tutor
fetch('/api/schedule?viewMode=own')
  .then(r => r.json())
  .then(data => {
    console.log('Schedules:', data.schedules.length) // Should be 1 (or 0)
    console.log('View Mode:', data.viewMode)         // Should be 'own'
    console.log('Can View All:', data.canViewAll)    // Should be false
  })
```

**Test 2: GET /api/schedule?viewMode=all**
```javascript
// As regular tutor
fetch('/api/schedule?viewMode=all')
  .then(r => r.json())
  .then(data => {
    console.log(data) // Should return error or redirect to own schedule
  })

// As lead tutor
fetch('/api/schedule?viewMode=all')
  .then(r => r.json())
  .then(data => {
    console.log('Schedules:', data.schedules.length) // Should be all tutors
    console.log('Can View All:', data.canViewAll)    // Should be true
  })
```

**Test 3: POST /api/schedule/slot (Create Slot)**
```javascript
// Try to create slot for ANOTHER tutor
fetch('/api/schedule/slot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tutor_id: 'OTHER_TUTOR_ID',  // Not your tutor_id
    day_of_week: 1,
    start_time: '14:00:00',
    end_time: '15:00:00'
  })
})
.then(r => r.json())
.then(data => console.log(data))
// Expected: 403 Forbidden (regular tutor)
// Expected: Success (lead tutor)
```

**Test 4: PUT /api/schedule/slot/:id (Edit Slot)**
```javascript
// Try to edit ANOTHER tutor's slot
fetch('/api/schedule/slot/SLOT_ID', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    start_time: '16:00:00'
  })
})
.then(r => r.json())
.then(data => console.log(data))
// Expected: 403 if not your slot (regular tutor)
// Expected: Success (lead tutor)
```

### 7. Test Edge Cases

**Case 1: User with no tutor profile**
```sql
-- User exists but no matching tutor
SELECT * FROM users WHERE email = 'noprofile@gannon.edu';
```
- **Expected:** When user logs in and visits schedules page, they see "No tutor profile found" message

**Case 2: Multiple tutors with same username**
```sql
-- Should not happen (username should be unique), but check
SELECT username, COUNT(*)
FROM tutors
GROUP BY username
HAVING COUNT(*) > 1;
```
- **Expected:** No results (username is unique constraint)

**Case 3: Email format doesn't match**
```sql
-- User email: john.smith@example.com
-- Tutor username: jsmith
```
- **Expected:** Won't auto-link (no @ match). Requires manual `user_id` update.

### 8. Browser Console Testing

Open DevTools Console and run:

```javascript
// Check current user and role
fetch('/api/auth/get-role')
  .then(r => r.json())
  .then(console.log)

// Fetch schedules with viewMode
fetch('/api/schedule?viewMode=own')
  .then(r => r.json())
  .then(data => {
    console.log('📅 Your Schedules:', data.schedules)
    console.log('🔐 Permissions:', {
      viewMode: data.viewMode,
      canViewAll: data.canViewAll,
      totalTutors: data.totalTutors,
      totalSlots: data.totalSlots
    })
  })
```

## Common Issues & Solutions

### Issue 1: "No tutor profile found"
**Cause:** User's email prefix doesn't match any tutor's username
**Solution:**
```sql
-- Manually link user to tutor
UPDATE tutors
SET user_id = 'USER_UUID_HERE'
WHERE username = 'tutor_username';
```

### Issue 2: Toggle button not appearing for lead tutor
**Cause:** Role not properly set in database
**Solution:**
```sql
-- Check user role
SELECT email, role FROM users WHERE email = 'user@gannon.edu';

-- Update role if needed
UPDATE users
SET role = 'lead_tutor'
WHERE email = 'user@gannon.edu';
```

### Issue 3: Can't edit own schedule
**Cause:** Tutor not linked to user account
**Solution:**
```sql
-- Check linkage
SELECT u.email, t.username, t.user_id
FROM users u
LEFT JOIN tutors t ON t.user_id = u.user_id
WHERE u.email = 'tutor@gannon.edu';

-- Manually link if needed
UPDATE tutors
SET user_id = (SELECT user_id FROM users WHERE email = 'tutor@gannon.edu')
WHERE username = 'tutorname';
```

### Issue 4: Lead tutor sees 403 when viewing all schedules
**Cause:** Permission not granted in roles.ts
**Solution:** Check `lib/roles.ts` - ensure `lead_tutor` is in `LEAD_TUTOR_LEVEL_ROLES`

## Success Checklist

- [ ] Regular tutor can log in and see ONLY their schedule
- [ ] Regular tutor can add/edit/delete their own slots
- [ ] Regular tutor CANNOT see other tutors' schedules
- [ ] Regular tutor gets 403 when trying to edit other tutors' slots
- [ ] Lead tutor sees toggle button
- [ ] Lead tutor can switch between "My Schedule" and "All Schedules"
- [ ] Lead tutor can edit ANY slot in both views
- [ ] Username matching works (email prefix → tutor username)
- [ ] Database migrations applied successfully
- [ ] No duplicate user_id values in tutors table
- [ ] Foreign key constraint exists

## Performance Check

**Run this query to ensure index is working:**
```sql
EXPLAIN ANALYZE
SELECT * FROM tutors WHERE user_id = 'SOME_UUID';

-- Should show "Index Scan using idx_tutors_user_id"
```

## Rollback (If Needed)

If something goes wrong:

```sql
-- Remove user_id column (will lose all linkages)
ALTER TABLE tutors DROP COLUMN user_id;

-- Or just clear the linkages but keep the column
UPDATE tutors SET user_id = NULL;
```

**⚠️ Warning:** Rolling back will require re-running migrations and re-linking users.
