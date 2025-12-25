# Supabase Auth Setup Guide

## ✅ Migration Complete!

All custom authentication has been **completely removed** and replaced with **Supabase Auth**.

---

## 🚀 Quick Start

### 1. Enable Supabase Auth

In your **Supabase Dashboard**:
1. Go to **Authentication** → **Settings**
2. Enable **Email/Password** provider
3. (Optional) Configure email templates
4. (Optional) Enable email verification

### 2. Verify Environment Variables

Ensure `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Test Registration

1. Go to `/register`
2. Create a new account
3. Check Supabase Dashboard → Authentication → Users
4. Verify user appears in both `auth.users` and `users` table

### 4. Test Login

1. Go to `/login`
2. Login with registered credentials
3. Should redirect to dashboard
4. Session managed automatically by Supabase

---

## 📋 What Changed

### Removed:
- ❌ Custom password hashing (pbkdf2, SHA256, MD5)
- ❌ Custom session tokens
- ❌ Custom cookie management (`sessionToken`, `user` cookies)
- ❌ Custom password verification
- ❌ Fallback to custom users table

### Now Using:
- ✅ Supabase Auth for all authentication
- ✅ Automatic session management
- ✅ Built-in password security
- ✅ Email verification (if enabled)
- ✅ Password reset via Supabase

---

## 🔄 Migrating Existing Users

If you have existing users in the `users` table:

### Option 1: Manual Migration

1. **Create Supabase Auth accounts** for each user (via Dashboard or Admin API)
2. **Update user_id** in `users` table to match auth user ID:
   ```sql
   UPDATE users 
   SET user_id = 'auth-user-id-from-supabase'
   WHERE email = 'user@example.com';
   ```

### Option 2: User Re-registration

Users can register again with the same email. The system will:
1. Create Supabase Auth account
2. Link to existing `users` table record (if email matches)
3. Preserve their role

### Option 3: Use Migration Script

```bash
python scripts/migrate-users-to-supabase-auth.py
```

This will show you which users need Supabase Auth accounts.

---

## 🎯 How It Works

### Registration:
```
User submits form
    ↓
supabase.auth.signUp()
    ↓
Creates auth user in Supabase
    ↓
Creates/updates record in users table
    ↓
Email verification sent (if enabled)
```

### Login:
```
User submits credentials
    ↓
supabase.auth.signInWithPassword()
    ↓
Supabase validates credentials
    ↓
Session created automatically
    ↓
User redirected to dashboard
```

### Session:
- Managed entirely by Supabase
- Stored in secure HTTP-only cookies
- Automatic token refresh
- Persists across page reloads

---

## 🔧 Configuration

### Email Verification

**To enable:**
1. Supabase Dashboard → Authentication → Settings
2. Enable "Confirm email"
3. Configure email template

**To disable:**
1. Supabase Dashboard → Authentication → Settings
2. Disable "Confirm email"
3. Users can login immediately after registration

### Password Reset

Now handled by Supabase:
- Use `supabase.auth.resetPasswordForEmail(email)`
- Configure email template in Supabase Dashboard
- Users receive reset link via email

---

## ⚠️ Important Notes

1. **Existing Users**: Users in `users` table without Supabase Auth accounts **cannot login** until accounts are created.

2. **Email Verification**: If enabled, users must verify email before first login.

3. **Password Hashes**: Old `password_hash` and `salt` columns in `users` table are no longer used (but can be kept for reference).

4. **Session Tokens**: All custom session token logic removed. Supabase handles everything.

5. **Role Management**: Still uses `users.role` column, linked via `user_id` matching Supabase Auth user ID.

---

## 🧪 Testing Checklist

- [ ] Registration creates Supabase Auth user
- [ ] Registration creates `users` table record
- [ ] Login works with Supabase Auth
- [ ] Session persists after page reload
- [ ] Logout clears session
- [ ] Dashboard requires authentication
- [ ] Role management still works
- [ ] Admin access works

---

## 📞 Troubleshooting

### "User already registered"
- User exists in Supabase Auth
- They should login instead of registering

### "Email not confirmed"
- Email verification is enabled
- User needs to check email and verify
- Or disable email verification in Supabase Dashboard

### "Invalid login credentials"
- User doesn't exist in Supabase Auth
- Need to create Supabase Auth account
- Or user registered but email not verified

### Session not persisting
- Check Supabase configuration
- Verify environment variables
- Check browser console for errors

---

## ✅ Summary

**Before:** Custom authentication with password hashing, session tokens, and cookie management

**After:** Pure Supabase Auth with automatic session management

**Result:** More secure, less code to maintain, built-in features (password reset, email verification, etc.)

🎉 **Migration complete!**

