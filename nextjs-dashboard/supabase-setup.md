# Supabase Database Setup Guide

## Quick Setup

### Step 1: Create Tables

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste and click **Run**
5. All tables will be created with proper relationships

### Step 2: Verify Tables

After running the SQL, you should see these tables:

- ✅ `users` - User accounts
- ✅ `tutors` - Tutor records (linked to users)
- ✅ `courses` - Course catalog
- ✅ `appointments` - Appointment bookings
- ✅ `tutor_availability` - Tutor availability schedules
- ✅ `shifts` - Shift definitions (optional)
- ✅ `shift_assignments` - Shift assignments (optional)
- ✅ `audit_logs` - Audit trail (optional)

## Table Relationships

```
users (1) ──→ (1) tutors
tutors (1) ──→ (many) appointments
courses (1) ──→ (many) appointments
tutors (1) ──→ (many) tutor_availability
tutors (1) ──→ (many) shift_assignments
shifts (1) ──→ (many) shift_assignments
```

## Important Fields

### Appointments Table
- `appointment_id` - Primary key (can be custom string from WCOnline)
- `source` - Tracks where appointment came from ('manual', 'wconline')
- `status` - 'scheduled', 'confirmed', 'completed', 'cancelled'

### Users Table
- `user_id` - UUID primary key
- `email` - Unique identifier
- `role` - 'tutor', 'lead_tutor', 'manager', 'admin'

### Tutors Table
- `tutor_id` - UUID primary key
- `user_id` - Foreign key to users table
- Links user accounts to tutor records

## Row Level Security (RLS)

Currently set to allow all operations. **You should restrict this in production:**

1. Go to **Authentication** → **Policies** in Supabase
2. Create policies based on user roles
3. Restrict access based on your security requirements

## Next Steps

1. ✅ Run `supabase-schema.sql` in Supabase SQL Editor
2. ✅ Verify tables are created
3. ✅ Test WCOnline sync: `POST /api/sync/wconline`
4. ✅ Check data appears in Supabase
5. ⚠️ Configure RLS policies for production

## Troubleshooting

### Tables Already Exist
If you get "already exists" errors, you can:
- Drop existing tables first (be careful - deletes data!)
- Or modify the SQL to use `CREATE TABLE IF NOT EXISTS` (already included)

### Foreign Key Errors
Make sure to create tables in order:
1. users
2. tutors (depends on users)
3. courses
4. appointments (depends on tutors and courses)

The SQL script handles this automatically.

