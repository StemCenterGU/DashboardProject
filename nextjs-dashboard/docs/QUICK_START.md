# Quick Start Guide - Fresh Setup

Since you have no existing users, you can start fresh with Supabase Auth! 🎉

## 🚀 Step-by-Step Setup

### 1. Enable Supabase Auth

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings**
3. Enable **Email/Password** provider
4. (Optional) Configure email templates
5. (Optional) Enable/disable email verification:
   - **Enable**: Users must verify email before login (more secure)
   - **Disable**: Users can login immediately after registration (easier for testing)

### 2. Verify Environment Variables

Check your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Start the Application

```bash
cd nextjs-dashboard
npm run dev
```

### 4. Create Your First Admin Account

#### Option A: Register via UI (Recommended)

1. Go to `http://localhost:3001/register`
2. Fill in:
   - Full Name: Your name
   - Email: your-email@example.com
   - Password: (at least 8 characters)
3. Click "Create Account"
4. If email verification is enabled, check your email and verify
5. Login at `http://localhost:3001/login`

#### Option B: Register via Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email and password
4. User will be created in Supabase Auth

### 5. Set Admin Role

After registering, set your account as admin:

```bash
npm run set-admin your-email@example.com
```

Or via SQL in Supabase Dashboard:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 6. Verify Everything Works

- ✅ Login at `/login`
- ✅ Access dashboard at `/dashboard`
- ✅ Check user info at `/api/user-info`
- ✅ Verify admin access (if applicable)

---

## 🎯 What Happens When You Register

1. **Supabase Auth** creates the user account
2. **Users table** gets a record with:
   - `user_id` = Supabase Auth user ID
   - `email` = Your email
   - `full_name` = Your name
   - `role` = 'tutor' (default)
   - `active` = true

3. **Email verification** sent (if enabled)

4. **You can login** immediately (or after email verification)

---

## 🔐 First Login

1. Go to `/login`
2. Enter your email and password
3. If email verification is enabled and you haven't verified:
   - You'll see "Email not confirmed" error
   - Check your email for verification link
   - Or disable email verification in Supabase Dashboard

4. After login, you'll be redirected to `/dashboard`

---

## 👑 Setting Admin Role

After your first login:

```bash
# Method 1: Using script
npm run set-admin your-email@example.com

# Method 2: Direct SQL
# In Supabase Dashboard → SQL Editor:
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

Then **logout and login again** to refresh your session.

---

## ✅ You're All Set!

Your authentication system is now:
- ✅ Using Supabase Auth exclusively
- ✅ Secure and production-ready
- ✅ Ready for new users
- ✅ No migration needed

Start registering users and they'll automatically use Supabase Auth! 🎉

---

## 🐛 Troubleshooting

### "Database not configured"
- Check `.env.local` has all Supabase credentials
- Restart Next.js dev server after adding env vars

### "User already registered"
- User exists in Supabase Auth
- Try logging in instead

### "Email not confirmed"
- Check email for verification link
- Or disable email verification in Supabase Dashboard

### Can't login after registration
- Check if email verification is required
- Verify email or disable verification
- Check Supabase Dashboard → Authentication → Users

---

## 📝 Next Steps

1. ✅ Enable Supabase Auth
2. ✅ Register your first account
3. ✅ Set admin role
4. ✅ Start using the dashboard!

Everything is ready to go! 🚀

