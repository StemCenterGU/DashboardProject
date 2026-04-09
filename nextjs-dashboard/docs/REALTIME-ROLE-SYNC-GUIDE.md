# Real-time Role Synchronization Guide

## Overview

This guide explains how the hybrid real-time role synchronization system works and how to enable it in your Supabase project.

## How It Works

The system uses a **hybrid approach** combining two methods:

1. **Supabase Realtime** (Primary) - Instant updates when roles change in database
2. **Polling Fallback** (Secondary) - Checks every 60 seconds if real-time fails

This ensures role changes made directly in the database sync to the user's session automatically.

---

## Architecture

```
Admin changes role in Supabase Dashboard
          ↓
Database UPDATE on users table
          ↓
    ┌─────────────────────┐
    │ Realtime Broadcast  │ (Instant)
    └─────────────────────┘
          ↓
AuthContext receives postgres_changes event
          ↓
Role state updated in React (setRole)
          ↓
UI re-renders with new permissions
```

**Fallback Flow:**
```
If Realtime fails or is unavailable
          ↓
Polling checks every 60 seconds
          ↓
fetchRole() API call
          ↓
Role state updated
```

---

## Setup Instructions

### Step 1: Enable Realtime in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard

2. **Navigate to Database → Replication**
   - Click on "Database" in the left sidebar
   - Click on "Replication" tab

3. **Enable Realtime for `users` table**
   - Find the `users` table in the list
   - Click the toggle switch to enable Realtime
   - Select which events to broadcast:
     - ✅ INSERT
     - ✅ UPDATE (Required for role changes)
     - ✅ DELETE

4. **Save Changes**
   - Click "Save" or the toggle will auto-save

### Step 2: Run Database Migration

The migration file has been created at:
```
supabase/migrations/20260331_enable_realtime_for_users.sql
```

**Option A: Using Supabase CLI (Recommended)**

```bash
# Navigate to nextjs-dashboard directory
cd nextjs-dashboard

# Run the migration
supabase db push
```

**Option B: Manual SQL Execution**

1. Go to Supabase Dashboard → SQL Editor
2. Open the migration file: `supabase/migrations/20260331_enable_realtime_for_users.sql`
3. Copy the SQL content
4. Paste into SQL Editor
5. Click "Run"

### Step 3: Verify Row Level Security

The migration creates an RLS policy to allow users to subscribe to their own role changes:

```sql
CREATE POLICY "Users can subscribe to own role changes"
ON users
FOR SELECT
USING (user_id = auth.uid());
```

**Verify it's applied:**

1. Go to Supabase Dashboard → Authentication → Policies
2. Find the `users` table
3. Verify the policy exists: "Users can subscribe to own role changes"

---

## Testing the Implementation

### Test 1: Real-time Update (Instant)

1. **Login to your app** as a test user (e.g., role = `tutor`)

2. **Open browser console** (F12 → Console tab)
   - You should see: `Setting up real-time subscription for user: <user_id>`
   - You should see: `Real-time subscription status: SUBSCRIBED`

3. **Open Supabase Dashboard** in another tab
   - Go to Table Editor → `users` table
   - Find your logged-in user by email

4. **Change the role**
   - Click on the `role` field for your user
   - Change from `tutor` to `admin`
   - Save

5. **Watch the console in your app**
   - Within 1-2 seconds, you should see:
     ```
     Role changed in database (real-time): {old: {...}, new: {...}}
     Role updated via real-time: tutor → admin
     ```

6. **Verify UI updates**
   - Navbar should show "User Management" link (admin only)
   - User dropdown should reflect new permissions
   - No page refresh needed!

### Test 2: Polling Fallback (60 seconds)

If real-time fails, polling will pick up the change within 60 seconds.

1. **Disable real-time** (temporarily)
   - Go to Supabase Dashboard → Database → Replication
   - Disable realtime for `users` table

2. **Change a user's role** in the database

3. **Wait up to 60 seconds**
   - Console will show: `Polling role update (fallback)...`
   - Role should update within 60 seconds

4. **Re-enable real-time** after testing

### Test 3: Manual Refresh

The `refreshRole()` function can be called manually:

```tsx
import { useUser } from '@/contexts/AuthContext'

function MyComponent() {
  const { role, refreshRole } = useUser()

  const handleRefresh = async () => {
    await refreshRole()
    console.log('Role refreshed manually')
  }

  return (
    <button onClick={handleRefresh}>
      Refresh My Role
    </button>
  )
}
```

---

## Console Messages Guide

### Normal Operation

When everything is working, you'll see these logs:

```
✅ Setting up real-time subscription for user: abc-123-def
✅ Real-time subscription status: SUBSCRIBED
✅ Polling role update (fallback)... (every 60 seconds)
```

### When Role Changes

```
✅ Role changed in database (real-time): { old: {...}, new: {...} }
✅ Role updated via real-time: tutor → admin
```

### Troubleshooting Messages

**Real-time not working:**
```
⚠️ Real-time subscription status: SUBSCRIPTION_ERROR
```
**Solution:** Check Realtime is enabled in Supabase Dashboard

**User not found:**
```
❌ Failed to fetch role: 404
```
**Solution:** Ensure user exists in `users` table

**Permission denied:**
```
❌ Failed to fetch role: 401
```
**Solution:** Check RLS policies on `users` table

---

## Code Reference

### AuthContext Implementation

The hybrid approach is implemented in `contexts/AuthContext.tsx`:

```tsx
// Real-time subscription (instant updates)
useEffect(() => {
  if (!user) return

  const channel = supabase
    .channel('user-role-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'users',
      filter: `user_id=eq.${user.id}`,
    }, (payload) => {
      if (payload.new.role !== role) {
        setRole(payload.new.role as Role)
      }
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [user, role])

// Polling fallback (60-second intervals)
useEffect(() => {
  if (!user) return

  const interval = setInterval(() => {
    fetchRole(user.id)
  }, 60000)

  return () => clearInterval(interval)
}, [user])
```

---

## Performance Considerations

### Real-time Connections

- Each logged-in user = 1 real-time connection
- Supabase Free tier: **200 concurrent connections**
- Pro tier: **500 concurrent connections**
- Enterprise: Unlimited

### Network Usage

**With Realtime:**
- Minimal bandwidth (only broadcasts changes)
- ~1-5 KB per role change event
- No polling overhead

**With Polling Only:**
- 1 API call every 60 seconds per user
- ~2-5 KB per request
- More server load

### Recommendations

- **< 100 users:** Real-time + polling is perfect
- **100-500 users:** Real-time + longer polling interval (120s)
- **500+ users:** Consider Supabase Pro or server-sent events

---

## Security

### RLS Policy Explanation

```sql
CREATE POLICY "Users can subscribe to own role changes"
ON users
FOR SELECT
USING (user_id = auth.uid());
```

This ensures:
- ✅ Users can only subscribe to **their own** role changes
- ❌ Users cannot see other users' role changes via realtime
- ✅ Admins can still change roles via admin client (bypasses RLS)

### Admin Role Changes

When an admin changes a user's role via the admin panel:

1. Admin calls `PUT /api/admin/users/[id]/role`
2. API uses `createAdminClient()` to bypass RLS
3. Database UPDATE is executed
4. Realtime broadcasts the change
5. Target user's AuthContext receives the update
6. User's session updates automatically

---

## Troubleshooting

### Issue: Realtime not connecting

**Symptoms:**
- Console shows: `Real-time subscription status: SUBSCRIPTION_ERROR`
- Role changes don't sync instantly

**Solutions:**
1. Check Realtime is enabled in Supabase Dashboard
2. Verify RLS policies allow SELECT on `users` table
3. Check browser console for WebSocket errors
4. Ensure Supabase URL and keys are correct in `.env.local`

### Issue: Role doesn't update

**Symptoms:**
- Role changes in database but UI doesn't update
- No console messages

**Solutions:**
1. Verify user is logged in
2. Check user's `user_id` matches in database
3. Hard refresh the page (Ctrl+F5)
4. Check `/api/auth/get-role` endpoint is working
5. Verify RLS policies allow user to read their own row

### Issue: Multiple updates firing

**Symptoms:**
- Console shows duplicate "Role updated" messages
- Role updates multiple times

**Cause:** Multiple AuthContext instances

**Solution:**
- Ensure `<AuthProvider>` only wraps the app once in `app/layout.tsx`
- Don't nest multiple `<AuthProvider>` components

---

## Advanced: Customizing Update Behavior

### Add Visual Notification

Show a toast when role changes:

```tsx
import { toast } from 'sonner' // or your toast library

// In AuthContext.tsx realtime subscription:
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'users',
  filter: `user_id=eq.${user.id}`,
}, (payload) => {
  if (payload.new.role !== role) {
    const newRole = payload.new.role as Role
    setRole(newRole)

    // Show toast notification
    toast.success(`Your role has been updated to: ${ROLE_DISPLAY_NAMES[newRole]}`, {
      description: 'Your permissions have been updated.',
    })
  }
})
```

### Force Page Reload on Role Change

If you want to reload the page when role changes:

```tsx
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'users',
  filter: `user_id=eq.${user.id}`,
}, (payload) => {
  if (payload.new.role !== role) {
    setRole(payload.new.role as Role)

    // Optional: Reload page to reset all state
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
})
```

### Adjust Polling Interval

Change the fallback polling frequency:

```tsx
// Faster polling (30 seconds)
const interval = setInterval(() => {
  fetchRole(user.id)
}, 30000) // 30 seconds

// Slower polling (2 minutes)
const interval = setInterval(() => {
  fetchRole(user.id)
}, 120000) // 120 seconds
```

---

## Summary

| Feature | Status | Update Speed |
|---------|--------|--------------|
| Real-time Sync | ✅ Enabled | Instant (1-2s) |
| Polling Fallback | ✅ Enabled | 60 seconds |
| Manual Refresh | ✅ Available | On demand |
| RLS Security | ✅ Configured | Users see only own changes |

**Next Steps:**

1. ✅ Enable Realtime in Supabase Dashboard
2. ✅ Run the migration SQL
3. ✅ Test with a user account
4. ✅ Monitor console logs
5. ✅ Verify instant role updates work

---

**Last Updated:** March 31, 2026
**Version:** 1.0.0
