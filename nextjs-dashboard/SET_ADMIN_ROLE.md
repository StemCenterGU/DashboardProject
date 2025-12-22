# Set Admin Role - Quick Guide

## 🎯 Method 1: Using Script (Easiest)

### Step 1: Make sure dev server is running
```bash
npm run dev
```

### Step 2: Run the script (in another terminal)
```bash
node scripts/set-admin-role.js your-email@example.com
```

Replace `your-email@example.com` with the email you used to register.

**Example:**
```bash
node scripts/set-admin-role.js admin@university.edu
```

---

## 🎯 Method 2: Using Supabase SQL Editor (Direct)

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project
2. Click **SQL Editor** in the left sidebar

### Step 2: Run this SQL
```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

**Example:**
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@university.edu';
```

### Step 3: Verify
```sql
SELECT email, full_name, role, active 
FROM users 
WHERE email = 'your-email@example.com';
```

---

## 🎯 Method 3: Using API Endpoint (Manual)

### Using curl:
```bash
curl -X POST http://localhost:3000/api/admin/set-role \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","role":"admin"}'
```

### Using Browser/Postman:
- **URL**: `POST http://localhost:3000/api/admin/set-role`
- **Body** (JSON):
```json
{
  "email": "your-email@example.com",
  "role": "admin"
}
```

---

## ✅ Verify Admin Role

After setting the role:

1. **Logout** (if you're logged in)
2. **Login again** with your email
3. You should now have admin access

---

## 🔐 Available Roles

- `admin` - Full access
- `manager` - Management access
- `lead_tutor` - Lead tutor access
- `tutor` - Basic tutor access (default)

---

## 🐛 Troubleshooting

**"User not found"**
→ Make sure you're using the exact email you registered with (case-insensitive)

**"Database not configured"**
→ Check `.env.local` has Supabase credentials

**"Cannot connect to localhost:3000"**
→ Make sure `npm run dev` is running

---

**Quickest method: Use Method 2 (SQL Editor) - it's instant! ⚡**

