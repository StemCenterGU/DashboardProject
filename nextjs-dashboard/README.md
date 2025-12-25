# STEM Center Dashboard

A comprehensive Next.js dashboard for managing tutoring appointments, analytics, and scheduling for the STEM Center at Gannon University.

## 🚀 Features

- **📊 Real-time Dashboard** - Live statistics for appointments, tutoring hours, and tutor activity
- **📅 Schedule Management** - Interactive schedule grid with color-coded appointments
- **📈 Analytics & Charts** - Data visualization with predictive analytics using TensorFlow.js
- **🔄 WCOnline Integration** - Automated sync with WCOnline appointment system
- **👥 User Management** - Role-based access control (admin, manager, lead_tutor, tutor)
- **📱 Responsive Design** - Works on desktop, tablet, and mobile devices
- **🎨 Modern UI** - Built with shadcn/ui and Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **ML/Analytics**: TensorFlow.js
- **Data Integration**: WCOnline API

---

## 📋 System Requirements

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (version 18.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` (should show v18.x.x or higher)
   - npm comes bundled with Node.js

2. **Python** (version 3.7 or higher)
   - Download from: https://www.python.org/downloads/
   - Verify installation: `python --version` (should show 3.7.x or higher)
   - Required for WCOnline sync scripts

3. **Git**
   - Download from: https://git-scm.com/downloads
   - Verify installation: `git --version`

### Required Accounts

1. **Supabase Account** (Free tier works)
   - Sign up at: https://supabase.com/
   - Create a new project

2. **WCOnline Account** (Optional - only if using WCOnline integration)
   - Your WCOnline API credentials

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/StemCenterGU/DashboardProject.git

# Navigate to the project directory
cd DashboardProject/stem-face-dashboard/nextjs-dashboard
```

### Step 2: Install Node.js Dependencies

```bash
# Install all npm packages
npm install
```

This will install all required dependencies including:
- Next.js and React
- Supabase clients
- UI components (shadcn/ui)
- Chart libraries (Recharts)
- And more...

**Expected time**: 2-5 minutes depending on your internet speed

### Step 3: Install Python Dependencies (for sync scripts)

```bash
# Install Python packages for WCOnline sync scripts
pip install requests python-dotenv pandas
```

Or if you prefer using a virtual environment:

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install requests python-dotenv pandas
```

### Step 4: Set Up Supabase Project

1. **Create a Supabase Project**:
   - Go to https://app.supabase.com/
   - Click "New Project"
   - Fill in project details
   - Wait for project to be created (2-3 minutes)

2. **Get Your Supabase Credentials**:
   - Go to Project Settings → API
   - Copy the following:
     - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
     - **anon/public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
     - **service_role key** (SUPABASE_SERVICE_ROLE_KEY) - Keep this secret!

3. **Set Up Database Schema**:
   - Go to SQL Editor in Supabase Dashboard
   - Open `supabase-schema.sql` from the project
   - Copy and paste the entire SQL script
   - Click "Run" to execute
   - Verify tables are created (should see: users, tutors, appointments, courses, etc.)

4. **Enable Supabase Auth**:
   - Go to Authentication → Settings
   - Enable **Email/Password** provider
   - (Optional) Configure email templates
   - (Optional) Enable/disable email verification

### Step 5: Create Environment Variables File

Create a `.env.local` file in the `nextjs-dashboard` directory:

```bash
# On Windows (PowerShell)
New-Item -Path .env.local -ItemType File

# On Mac/Linux
touch .env.local
```

Then add the following content to `.env.local`:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# WCOnline Integration (OPTIONAL - only if using WCOnline sync)
WCONLINE_API_KEY=your_wconline_api_key
WCONLINE_BASE_URL=https://gannon.mywconline.com/api
WCONLINE_SCHEDULE_TITLE=STEM CENTER

# Application URL (OPTIONAL - defaults to localhost:3001)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Important**: 
- Replace `your_supabase_project_url`, `your_supabase_anon_key`, and `your_supabase_service_role_key` with your actual Supabase credentials
- Never commit `.env.local` to git (it's already in `.gitignore`)

### Step 6: Start the Development Server

```bash
# Start Next.js development server
npm run dev
```

The server will start on `http://localhost:3001` (or port 3000 if 3001 is unavailable).

You should see:
```
✓ Ready in X seconds
○ Local:        http://localhost:3001
```

### Step 7: Create Your First Admin Account

1. **Register Your Account**:
   - Open http://localhost:3001/register
   - Fill in:
     - Full Name: Your name
     - Email: your-email@example.com
     - Password: (at least 8 characters)
   - Click "Create Account"
   - If email verification is enabled, check your email and verify

2. **Set Admin Role**:
   After registering, set yourself as admin:

   ```bash
   # Using npm script
   npm run set-admin your-email@example.com
   ```

   Or manually via SQL in Supabase Dashboard:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

3. **Login**:
   - Go to http://localhost:3001/login
   - Enter your email and password
   - You should be redirected to the dashboard

### Step 8: Verify Installation

Check that everything is working:

- ✅ Can access http://localhost:3001
- ✅ Can register a new account
- ✅ Can login successfully
- ✅ Can access dashboard
- ✅ Can see your user info in navbar

---

## 🎯 Quick Start Summary

For experienced developers, here's the condensed version:

```bash
# 1. Clone and navigate
git clone https://github.com/StemCenterGU/DashboardProject.git
cd DashboardProject/stem-face-dashboard/nextjs-dashboard

# 2. Install dependencies
npm install
pip install requests python-dotenv pandas

# 3. Set up Supabase
# - Create project at https://app.supabase.com
# - Run supabase-schema.sql in SQL Editor
# - Enable Email/Password auth

# 4. Create .env.local with Supabase credentials

# 5. Start server
npm run dev

# 6. Register and set admin
# - Register at http://localhost:3001/register
# - npm run set-admin your-email@example.com
# - Login at http://localhost:3001/login
```

---

## 📝 Environment Variables Reference

### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret!) | Supabase Dashboard → Settings → API → service_role key |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WCONLINE_API_KEY` | WCOnline API key for appointment sync | - |
| `WCONLINE_BASE_URL` | WCOnline API base URL | `https://gannon.mywconline.com/api` |
| `WCONLINE_SCHEDULE_TITLE` | Schedule title filter | `STEM CENTER` |
| `NEXT_PUBLIC_APP_URL` | Application URL for redirects | `http://localhost:3001` |

---

## 🗄️ Database Setup Details

### Running the Schema

1. **Via Supabase Dashboard** (Recommended for beginners):
   - Go to Supabase Dashboard → SQL Editor
   - Click "New Query"
   - Open `supabase-schema.sql` from the project
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - Verify success message

2. **Verify Tables Created**:
   ```sql
   -- Run this in Supabase SQL Editor to see all tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

   You should see:
   - users
   - tutors
   - courses
   - appointments
   - tutor_availability
   - available_slots

### Database Tables Overview

- **users**: User accounts (linked to Supabase Auth)
- **tutors**: Tutor profiles (tutor_id, tutor_name)
- **courses**: Course catalog
- **appointments**: Tutoring appointments
- **tutor_availability**: Recurring weekly tutor schedules
- **available_slots**: Available time slots (excludes booked appointments)

---

## 🔐 Authentication Setup

### Enable Supabase Auth

1. Go to Supabase Dashboard → Authentication → Settings
2. Under "Auth Providers", enable **Email**
3. Configure email settings:
   - **Enable email confirmations**: Optional (disable for easier testing)
   - **Email template**: Customize if needed
4. Save changes

### First User Setup

1. Register at `/register`
2. Set admin role:
   ```bash
   npm run set-admin your-email@example.com
   ```
3. Logout and login again to refresh session
4. You now have admin access!

---

## 📁 Project Structure

```
nextjs-dashboard/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/                # Login page
│   │   └── register/             # Registration page
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/            # Main dashboard
│   │   ├── charts/               # Analytics & charts
│   │   ├── calendar/             # Calendar view
│   │   ├── scheduling/           # Schedule management
│   │   ├── profile/              # User profile
│   │   └── settings/             # Settings
│   └── api/                      # API routes
│       ├── auth/                 # Authentication endpoints
│       ├── analytics/            # Analytics data
│       ├── scheduling/           # Schedule grid data
│       ├── admin/                # Admin operations
│       └── sync/                 # WCOnline sync endpoints
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── navbar.tsx                # Navigation bar
│   ├── schedule-grid.tsx         # Schedule grid component
│   └── predictive-analytics.tsx  # ML analytics
├── lib/                          # Utilities & services
│   ├── supabase.ts               # Browser Supabase client
│   ├── supabase-server.ts        # Server Supabase client
│   ├── analytics.ts              # Analytics engine
│   ├── wconline.ts               # WCOnline integration
│   └── utils.ts                  # Utility functions
├── scripts/                      # Python scripts
│   ├── sync-wconline.py          # WCOnline sync script
│   └── debug-online-field.py     # Debugging tools
├── types/                        # TypeScript definitions
└── public/                       # Static assets
```

## 🔄 WCOnline Integration (Optional)

### Setup WCOnline Sync

1. **Get WCOnline API Credentials**:
   - Contact your WCOnline administrator
   - Get API key and base URL
   - Add to `.env.local`:
     ```env
     WCONLINE_API_KEY=your_api_key
     WCONLINE_BASE_URL=https://gannon.mywconline.com/api
     WCONLINE_SCHEDULE_TITLE=STEM CENTER
     ```

2. **Add IP Address to WCOnline**:
   - Get your public IP address
   - Add it to WCOnline's allowed IPs list
   - This allows API access from your location

### Syncing Appointments from WCOnline

```bash
# Sync a specific date
python scripts/sync-wconline.py 2025-01-15

# Sync a date range
python scripts/sync-wconline.py 2025-01-01 2025-01-14
```

### What Gets Synced

- ✅ Tutor appointments (from CUSTOM type)
- ✅ Student names
- ✅ Course information
- ✅ Appointment times
- ✅ Online/In-person status
- ✅ Walk-in appointments
- ✅ Missed/No-show status
- ❌ Non-tutor resources (automatically skipped)

### Populating Available Slots

After syncing appointments, populate available slots:

```bash
# Generate available slots from tutor_availability (excludes booked appointments)
python scripts/populate-available-slots.py 2025-01-01 2025-12-07
```

### Importing Courses

Extract unique courses from appointments:

```bash
# Import all unique course names from appointments table
python scripts/import-courses-from-appointments.py
```

## 🎨 Schedule Grid Features

The schedule grid displays appointments with color coding:

- **🔵 Blue** - Online appointments
- **🟠 Orange** - In-person appointments
- **⬜ Gray** - Available time slots
- **⬛ Dark Gray** - Unavailable time slots

## 📊 Database Schema

### Core Tables

- **users** - User accounts (students, tutors, admins)
- **tutors** - Tutor profiles (tutor_id, tutor_name)
- **appointments** - Tutoring appointments
- **available_slots** - Tutor availability

### Key Fields in Appointments Table

- `appointment_id` - Unique identifier
- `tutor_id` - Reference to tutor
- `tutor_name` - Tutor's name
- `student_name` - Student's name
- `appointment_date` - Date of appointment
- `start_time` / `end_time` - Time range
- `duration` - Duration in hours
- `status` - scheduled, completed, missed, no_show
- `is_online` - Boolean (true for online appointments)
- `is_walk_in` - Boolean (walk-in appointments)
- `course_name` - Course subject
- `course_instructor` - Course instructor
- `source` - Data source (wconline, manual)

## 🔐 Authentication

The dashboard uses **Supabase Auth** exclusively for authentication.

### User Roles

- **admin** - Full system access, user management, all features
- **manager** - User management, system configuration
- **lead_tutor** - View all appointments, read-only user management
- **tutor** - Basic access, view own appointments (default role)

### How Authentication Works

1. **Registration**: Creates Supabase Auth account + users table record
2. **Login**: Uses Supabase Auth session management
3. **Session**: Automatically managed by Supabase (secure HTTP-only cookies)
4. **Roles**: Stored in `users.role` column, linked via `user_id`

### Protected Routes

All `/dashboard/*` routes require authentication. Unauthenticated users are automatically redirected to `/login`.

### Setting User Roles

```bash
# Set admin role
npm run set-admin user@example.com

# Or via SQL
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

## 📦 Available Scripts

### NPM Scripts

```bash
# Development
npm run dev          # Start dev server (default: localhost:3001)

# Production
npm run build        # Build for production
npm start            # Start production server

# User Management
npm run set-admin <email>    # Set admin role for a user

# Code Quality
npm run lint         # Run ESLint
```

### Python Scripts

```bash
# WCOnline Sync
python scripts/sync-wconline.py <start_date> <end_date>
python scripts/sync-wconline.py 2025-01-15              # Single date
python scripts/sync-wconline.py 2025-01-01 2025-01-14   # Date range

# Data Management
python scripts/populate-available-slots.py <start_date> <end_date>
python scripts/import-courses-from-appointments.py
python scripts/extract-tutor-availability.py
python scripts/import-tutor-availability.py

# Migration (if needed)
python scripts/migrate-users-to-supabase-auth.py
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables in Vercel project settings
4. Deploy!

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 🐛 Troubleshooting

### "Database not configured" Error

**Problem**: Missing or incorrect Supabase credentials

**Solution**:
1. Verify `.env.local` exists in `nextjs-dashboard` directory
2. Check all three Supabase variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Restart dev server after adding env vars

### "User already registered" Error

**Problem**: Email already exists in Supabase Auth

**Solution**:
- User should login instead of registering
- Or use a different email

### "Email not confirmed" Error

**Problem**: Email verification is enabled but email not verified

**Solution**:
1. Check email inbox for verification link
2. Click link to verify
3. Or disable email verification in Supabase Dashboard → Authentication → Settings

### Can't Login After Registration

**Problem**: Email verification required or account not created

**Solution**:
1. Check Supabase Dashboard → Authentication → Users
2. Verify user exists
3. Check if email is confirmed
4. Try resetting password if needed

### Environment Variables Not Loading

**Solution**:
```bash
# Clear Next.js cache and restart
# Windows
rmdir /s /q .next
npm run dev

# Mac/Linux
rm -rf .next
npm run dev
```

### Supabase Connection Errors

**Solution**:
1. Verify Supabase project is active (not paused)
2. Check credentials are correct in `.env.local`
3. Test connection in Supabase Dashboard
4. Check RLS policies if data access fails

### Port Already in Use

**Problem**: Port 3001 (or 3000) is already in use

**Solution**:
```bash
# Use a different port
PORT=3002 npm run dev
```

### Python Script Errors

**Problem**: Missing Python packages or wrong Python version

**Solution**:
```bash
# Verify Python version (need 3.7+)
python --version

# Install required packages
pip install requests python-dotenv pandas

# Or use virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
pip install requests python-dotenv pandas
```

### Build Errors

**Solution**:
```bash
# Clean install
rm -rf node_modules .next package-lock.json
npm install
npm run build
```

### Module Not Found Errors

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📚 Additional Documentation

- [Quick Start Guide](./QUICK_START.md) - Fast setup for fresh installations
- [Supabase Auth Setup](./SUPABASE_AUTH_SETUP.md) - Detailed authentication configuration
- [Login & Admin Guide](./LOGIN_AND_ADMIN_GUIDE.md) - Authentication troubleshooting
- [WCOnline Integration](./WCONLINE_DATA_MAPPING.md) - WCOnline data mapping details
- [Set Admin Role](./SET_ADMIN_ROLE.md) - Admin role management

---

## ✅ Installation Checklist

Use this checklist to ensure everything is set up correctly:

### Prerequisites
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Python 3.7+ installed (`python --version`)
- [ ] Git installed (`git --version`)

### Repository Setup
- [ ] Repository cloned
- [ ] Navigated to `nextjs-dashboard` directory
- [ ] npm dependencies installed (`npm install`)
- [ ] Python dependencies installed (`pip install requests python-dotenv pandas`)

### Supabase Setup
- [ ] Supabase account created
- [ ] Supabase project created
- [ ] Database schema executed (`supabase-schema.sql`)
- [ ] Email/Password auth enabled
- [ ] Supabase credentials obtained

### Environment Configuration
- [ ] `.env.local` file created
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] (Optional) WCOnline variables set

### Application Setup
- [ ] Development server starts (`npm run dev`)
- [ ] Can access http://localhost:3001
- [ ] Registration page works
- [ ] First admin account created
- [ ] Admin role set
- [ ] Can login successfully
- [ ] Dashboard accessible

### Verification
- [ ] All tables exist in Supabase
- [ ] User appears in Supabase Auth
- [ ] User record in `users` table
- [ ] Admin role assigned
- [ ] Can access all dashboard features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is for internal use at Gannon University STEM Center.

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Contact the STEM Center IT team
- Check existing documentation files

---

**Built with ❤️ by the STEM Center at Gannon University**
