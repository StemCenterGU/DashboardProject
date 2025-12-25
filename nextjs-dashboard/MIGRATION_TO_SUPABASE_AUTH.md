# Migration to Supabase Auth - Complete

## ✅ What Was Changed

All custom authentication has been **completely removed** and replaced with **Supabase Auth**.

### Files Updated:

1. **`app/api/auth/register/route.ts`**
   - ✅ Removed custom password hashing (pbkdf2, SHA256, MD5)
   - ✅ Now uses `supabase.auth.signUp()` exclusively
   - ✅ Creates user record in `users` table for role management
   - ✅ Uses Supabase Auth user ID

2. **`app/api/auth/login/route.ts`**
   - ✅ Removed custom password verification
   - ✅ Removed custom session token creation
   - ✅ Removed custom cookie management
   - ✅ Now uses `supabase.auth.signInWithPassword()` exclusively
   - ✅ Supabase handles session automatically

3. **`app/api/auth/logout/route.ts`**
   - ✅ Removed custom cookie deletion
   - ✅ Now uses `supabase.auth.signOut()` exclusively

4. **`lib/auth.ts`**
   - ✅ Removed custom session cookie checks
   - ✅ Now uses Supabase Auth session only
   - ✅ Gets role from `users` table if available

5. **`middleware.ts`**
   - ✅ Removed custom session token checks
   - ✅ Now requires Supabase Auth session only

6. **`app/(auth)/login/page.tsx`**
   - ✅ Removed custom users table fallback
   - ✅ Uses Supabase Auth directly

7. **`app/(auth)/register/page.tsx`**
   - ✅ Removed custom users table registration
   - ✅ Uses Supabase Auth directly

8. **`components/navbar.tsx`**
   - ✅ Removed localStorage session management
   - ✅ Uses Supabase Auth session
   - ✅ Listens to auth state changes

9. **`app/api/user-info/route.ts`**
   - ✅ Removed custom cookie checks
   - ✅ Uses Supabase Auth session only

10. **`app/api/admin/users/route.ts`**
    - ✅ Updated to use Supabase Auth session
    - ✅ Gets role from `users` table

---

## 🔧 Setup Requirements

### 1. Enable Supabase Auth

In your Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Enable **Email/Password** authentication
3. Configure email templates (optional)
4. Set up email verification (optional but recommended)

### 2. Environment Variables

Ensure `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup

The `users` table is still used for:
- Role management (`role` column)
- User metadata
- Linking to `tutors` table

**Important:** The `users` table should have:
- `user_id` that matches Supabase Auth user ID
- `role` column for permissions
- `active` column (optional)

---

## 🔄 Migrating Existing Users

If you have existing users in the `users` table, you need to:

### Option 1: Manual Migration (Recommended)

1. **Create Supabase Auth accounts** for each user:
   ```sql
   -- You'll need to use Supabase Admin API or Dashboard
   -- to create auth users with their emails
   ```

2. **Link users table to auth users**:
   ```sql
   -- Update user_id to match Supabase Auth user ID
   UPDATE users 
   SET user_id = 'auth-user-id-here'
   WHERE email = 'user@example.com';
   ```

### Option 2: User Re-registration

Have users register again with Supabase Auth. Their roles can be restored from the old `users` table.

### Option 3: Migration Script

Create a script to:
1. Read existing users from `users` table
2. Create Supabase Auth accounts via Admin API
3. Update `user_id` in `users` table to match auth user ID

---

## 🎯 How It Works Now

### Registration Flow:
1. User submits registration form
2. `supabase.auth.signUp()` creates auth user
3. User record created in `users` table with auth user ID
4. Email verification sent (if enabled)
5. User can login after verification

### Login Flow:
1. User submits login form
2. `supabase.auth.signInWithPassword()` authenticates
3. Supabase creates session automatically
4. Session stored in cookies by Supabase
5. User redirected to dashboard

### Session Management:
- Supabase handles all session management
- Sessions stored in cookies automatically
- Automatic token refresh
- Session persists across page reloads

### Role Management:
- Roles stored in `users.role` column
- Linked to Supabase Auth user via `user_id`
- Can be updated via `/api/admin/set-role`

---

## ⚠️ Important Notes

1. **Email Verification**: 
   - If enabled in Supabase, users must verify email before login
   - Can be disabled in Supabase Dashboard → Authentication → Settings

2. **Password Reset**:
   - Now handled by Supabase Auth
   - Use `supabase.auth.resetPasswordForEmail()`
   - Configure email templates in Supabase Dashboard

3. **Existing Users**:
   - Users in `users` table without Supabase Auth accounts cannot login
   - Must create Supabase Auth accounts for them

4. **Custom Session Tokens**:
   - All custom session token logic removed
   - No more `sessionToken` or `user` cookies
   - Supabase manages all sessions

5. **Password Hashing**:
   - No longer using custom hashing
   - Supabase handles password security
   - Old password hashes in `users` table are no longer used

---

## 🧪 Testing

1. **Test Registration**:
   ```bash
   # Register a new user
   # Check Supabase Dashboard → Authentication → Users
   # Verify user appears in auth.users
   # Verify user record in users table
   ```

2. **Test Login**:
   ```bash
   # Login with registered user
   # Check browser cookies for Supabase session
   # Verify session persists
   ```

3. **Test Logout**:
   ```bash
   # Logout
   # Verify session cleared
   # Verify redirect to login
   ```

4. **Test Role Management**:
   ```bash
   # Set admin role
   npm run set-admin user@example.com
   # Verify role in users table
   # Login and verify admin access
   ```

---

## 🚀 Next Steps

1. **Enable Supabase Auth** in Dashboard
2. **Migrate existing users** (if any)
3. **Test registration and login**
4. **Configure email verification** (optional)
5. **Set up password reset** (optional)
6. **Remove old password hashes** from `users` table (optional cleanup)

---

## 📝 Summary

✅ **Custom authentication completely removed**
✅ **Supabase Auth is now the only authentication method**
✅ **All session management handled by Supabase**
✅ **Role management still uses `users` table**
✅ **Backward compatible with existing `users` table structure**

The system is now fully using Supabase Auth! 🎉

