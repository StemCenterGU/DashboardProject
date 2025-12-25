# Login System & Admin Access Guide

## 🔐 Login System Overview

The application supports **two authentication methods**:

1. **Supabase Auth** (Primary) - If configured
2. **Custom Users Table** (Fallback) - Uses `users` table in Supabase

### Login Flow

1. User enters email and password
2. System tries Supabase Auth first
3. If Supabase Auth fails, falls back to custom `users` table
4. Password verification supports:
   - **pbkdf2_hmac** (SHA256, 100000 iterations) - with salt
   - **SHA256** - legacy (no salt)
   - **MD5** - legacy (32-char hash)

### Common Login Issues

#### Issue 1: "Invalid email or password"
**Causes:**
- Email doesn't exist in `users` table
- Password hash doesn't match
- User account is inactive (`active = false`)

**Solutions:**
- Verify email exists: Check `users` table in Supabase
- Reset password: Update `password_hash` in database
- Check account status: Ensure `active = true`

#### Issue 2: "Database not configured"
**Causes:**
- Missing `.env.local` file
- Missing Supabase environment variables

**Solutions:**
- Create `.env.local` with:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```

#### Issue 3: Session not persisting
**Causes:**
- Cookies not being set properly
- Browser blocking cookies
- Session token mismatch

**Solutions:**
- Check browser console for errors
- Verify cookies are being set (DevTools → Application → Cookies)
- Clear cookies and try again

#### Issue 4: Redirect loop
**Causes:**
- Middleware and layout both checking auth
- Session cookie not being read correctly

**Solutions:**
- Clear all cookies
- Restart Next.js dev server
- Check middleware configuration

---

## 👑 Admin Access

### What is Admin Access?

Admin users have **full access** to all features, including:
- ✅ View all users
- ✅ Manage user roles
- ✅ Access all dashboard features
- ✅ Full analytics access
- ✅ System administration

### User Roles

The system supports 4 roles (in order of permissions):

1. **`tutor`** (Default)
   - Basic access
   - View own appointments
   - Limited dashboard access

2. **`lead_tutor`**
   - Tutor privileges +
   - View all appointments
   - Read-only user management

3. **`manager`**
   - Lead tutor privileges +
   - Full user management
   - System configuration

4. **`admin`** (Highest)
   - All privileges
   - Full system access
   - Can manage all users and roles

### How to Set Admin Access

#### Method 1: Using Script (Recommended)

```bash
npm run set-admin your-email@example.com
```

Or directly:
```bash
node scripts/set-admin-role.js your-email@example.com
```

**Requirements:**
- Next.js dev server must be running
- User must exist in `users` table
- `.env.local` must be configured

#### Method 2: Direct SQL (Supabase SQL Editor)

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

**Verify:**
```sql
SELECT email, role, active 
FROM users 
WHERE email = 'your-email@example.com';
```

#### Method 3: Using API Endpoint

```bash
curl -X POST http://localhost:3001/api/admin/set-role \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","role":"admin"}'
```

**Note:** This endpoint doesn't require authentication (for initial setup only)

### Verify Admin Access

After setting admin role:

1. **Logout** and **login again** (to refresh session)
2. Check user info:
   ```bash
   curl http://localhost:3001/api/user-info
   ```
3. Should see: `"role": "admin"`

### Admin-Only Features

Currently, these features require admin/manager role:

- **`/api/admin/users`** - List all users (admin/manager only)
- **`/api/admin/set-role`** - Change user roles (no auth required - for setup)

---

## 🐛 Debugging Login Issues

### Step 1: Check User Exists

```sql
SELECT user_id, email, role, active, password_hash, salt
FROM users 
WHERE email = 'your-email@example.com';
```

### Step 2: Check Password Hash

The system supports multiple hash formats:
- **With salt**: `salt` field is not null/empty → uses pbkdf2_hmac
- **SHA256**: No salt, 64-char hex hash
- **MD5**: No salt, 32-char hex hash

### Step 3: Test Login API Directly

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

### Step 4: Check Browser Console

Open DevTools → Console and look for:
- Network errors
- Authentication errors
- Cookie issues

### Step 5: Check Server Logs

Look for errors in:
- Next.js terminal output
- Browser Network tab → Response

---

## 📝 Quick Reference

### Default Admin Email
Based on your setup, the default admin email is:
- `admin@university.edu` (from your setup)

### Check Current User Role
```bash
# After logging in, check cookies or:
curl http://localhost:3001/api/user-info
```

### Reset Password (SQL)
```sql
-- Generate SHA256 hash of password
-- Then update:
UPDATE users 
SET password_hash = 'generated_hash_here',
    salt = NULL
WHERE email = 'your-email@example.com';
```

### Activate User Account
```sql
UPDATE users 
SET active = true 
WHERE email = 'your-email@example.com';
```

---

## ✅ Troubleshooting Checklist

- [ ] User exists in `users` table
- [ ] User `active = true`
- [ ] Password hash is correct format
- [ ] `.env.local` is configured
- [ ] Next.js server is running
- [ ] Cookies are enabled in browser
- [ ] No CORS errors in console
- [ ] Session cookies are being set
- [ ] User role is set correctly

---

## 🔧 Common Fixes

### Fix: "User not found"
```sql
-- Check if user exists
SELECT * FROM users WHERE email = 'your-email@example.com';

-- If not, create user via registration or:
INSERT INTO users (email, password_hash, role, active)
VALUES ('your-email@example.com', 'hash_here', 'tutor', true);
```

### Fix: "Invalid password"
- Password hash might be wrong format
- Try resetting password via registration
- Or update hash directly in database

### Fix: "Account inactive"
```sql
UPDATE users SET active = true WHERE email = 'your-email@example.com';
```

### Fix: "Not admin" when accessing admin features
```bash
# Set admin role
npm run set-admin your-email@example.com

# Then logout and login again
```

---

## 📞 Need Help?

1. Check browser console for errors
2. Check Next.js terminal for server errors
3. Verify Supabase connection
4. Test API endpoints directly
5. Check database records

