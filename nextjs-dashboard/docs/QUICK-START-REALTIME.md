# Quick Start: Enable Real-time Role Sync

## ✅ What's Already Done

- ✅ AuthContext updated with hybrid real-time + polling
- ✅ Real-time subscription listens for role changes on `users` table
- ✅ Polling fallback checks every 60 seconds
- ✅ Migration SQL file created
- ✅ Code is ready to use

## 🚀 Setup Steps (5 minutes)

### Step 1: Enable Realtime in Supabase (2 min)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Database** → **Replication** (in left sidebar)
4. Find the `users` table in the list
5. Toggle **ON** the switch next to `users`
6. Select these events:
   - ✅ INSERT
   - ✅ UPDATE
   - ✅ DELETE
7. Click **Save** (or it auto-saves)

### Step 2: Run Migration SQL (2 min)

**Option A: Using SQL Editor (Easiest)**

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Copy this SQL:

```sql
-- Enable realtime for the users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Create RLS policy to allow users to subscribe to their own role changes
CREATE POLICY IF NOT EXISTS "Users can subscribe to own role changes"
ON users
FOR SELECT
USING (user_id = auth.uid());
```

4. Click **Run** (or press Ctrl+Enter)
5. You should see: ✅ Success. No rows returned

**Option B: Using Supabase CLI**

```bash
cd nextjs-dashboard
supabase db push
```

### Step 3: Test It! (1 min)

1. **Login to your app** at http://localhost:3000
2. **Open browser console** (F12 → Console)
3. Look for these messages:
   ```
   Setting up real-time subscription for user: <your-user-id>
   Real-time subscription status: SUBSCRIBED
   ```

4. **Open Supabase Dashboard** → Table Editor → `users`
5. **Find your user** (by email) and change the `role` column
6. **Watch the console** - within 1-2 seconds you should see:
   ```
   Role changed in database (real-time): {...}
   Role updated via real-time: tutor → admin
   ```

7. **Check the UI** - it should update automatically! No page refresh needed.

## 📊 What You'll See

### In Browser Console

**On Page Load:**
```
Setting up real-time subscription for user: abc-123-def
Real-time subscription status: SUBSCRIBED
```

**When Role Changes:**
```
Role changed in database (real-time): { old: {...}, new: {...} }
Role updated via real-time: tutor → admin
```

**Polling Fallback (every 60s):**
```
Polling role update (fallback)...
```

### In the UI

When you change a user's role from `tutor` to `admin`:

**Before (tutor):**
- ❌ No "User Management" link in navbar
- ❌ Cannot access `/admin/users`

**After (admin) - Updates automatically:**
- ✅ "User Management" link appears in navbar
- ✅ Can access `/admin/users` page
- ✅ Full admin permissions

## 🔧 Troubleshooting

### "Real-time subscription status: SUBSCRIPTION_ERROR"

**Fix:** Enable Realtime in Supabase Dashboard (Step 1 above)

### "Role doesn't update instantly"

**Check:**
1. Realtime enabled? (Supabase Dashboard → Database → Replication)
2. Migration SQL ran successfully?
3. Browser console shows "SUBSCRIBED"?

**Fallback:** Even if real-time fails, polling will update within 60 seconds

### "Permission denied"

**Fix:** Run the migration SQL (Step 2 above) to create the RLS policy

## 🎯 Expected Behavior

| Method | Update Speed | Reliability |
|--------|--------------|-------------|
| Real-time | 1-2 seconds | 99% (WebSocket) |
| Polling | 60 seconds | 100% (HTTP) |
| Manual Refresh | Instant | 100% (on demand) |

**Combined (Hybrid):** Best of both worlds! ✨

## 📝 Testing Checklist

- [ ] Realtime enabled in Supabase Dashboard
- [ ] Migration SQL executed successfully
- [ ] Console shows "SUBSCRIBED" status
- [ ] Changed role in database
- [ ] Console shows "Role updated via real-time"
- [ ] UI updated without page refresh
- [ ] Polling fallback working (check logs every 60s)

## 🆘 Need Help?

See full guide: `docs/REALTIME-ROLE-SYNC-GUIDE.md`

---

**Time to complete:** ~5 minutes
**Difficulty:** Easy
**Last updated:** March 31, 2026
