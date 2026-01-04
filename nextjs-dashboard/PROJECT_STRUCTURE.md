# Project Structure

This document describes the organization of the STEM Center Dashboard project.

## 📁 Directory Structure

```
nextjs-dashboard/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── charts/
│   │   ├── calendar/
│   │   ├── scheduling/
│   │   ├── profile/
│   │   └── settings/
│   └── api/                      # API routes
│       ├── auth/
│       ├── analytics/
│       ├── scheduling/
│       ├── admin/
│       └── sync/
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── navbar.tsx
│   ├── schedule-grid.tsx
│   └── predictive-analytics.tsx
│
├── lib/                          # Utilities & services
│   ├── supabase.ts               # Browser Supabase client
│   ├── supabase-server.ts        # Server Supabase client
│   ├── analytics.ts               # Analytics engine
│   ├── wconline.ts               # WCOnline integration
│   ├── wconline-sync.ts          # WCOnline sync utilities
│   ├── auth.ts                   # Authentication utilities
│   ├── utils.ts                  # Utility functions
│   └── ml/                       # Machine learning utilities
│
├── types/                        # TypeScript definitions
│
├── public/                       # Static assets
│
├── data/                         # Data files
│   ├── wconline/                 # WCOnline data exports
│   └── tutor-availability-schedule.txt
│
├── scripts/                       # Utility scripts
│   ├── sync/                     # Synchronization scripts
│   │   └── sync-wconline.py      # Main WCOnline sync script
│   ├── data/                     # Data management scripts
│   │   ├── import-courses-from-appointments.py
│   │   ├── import-tutor-availability.py
│   │   ├── extract-tutor-availability.py
│   │   └── populate-available-slots.py
│   └── utils/                    # Utility scripts
│       └── set-admin-role.js
│
├── database/                     # Database files
│   ├── supabase-schema.sql       # Main database schema
│   ├── fix-rls-policies.sql      # RLS policy fixes
│   └── query-tutor-availability.sql
│
├── docs/                         # Documentation
│   ├── QUICK_START.md
│   ├── SUPABASE_AUTH_SETUP.md
│   ├── LOGIN_AND_ADMIN_GUIDE.md
│   ├── WCONLINE_DATA_MAPPING.md
│   ├── SET_ADMIN_ROLE.md
│   └── supabase-setup.md
│
├── notebooks/                    # Jupyter notebooks
│   └── api.ipynb                 # WCOnline API testing
│
├── .env.local                    # Environment variables (not in git)
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── README.md                     # Main project documentation
```

## 📂 Key Directories

### `app/`
Next.js 14+ App Router directory containing all pages and API routes.

- **`(auth)/`** - Authentication pages (login, register)
- **`(dashboard)/`** - Protected dashboard routes requiring authentication
- **`api/`** - API endpoints for backend functionality

### `components/`
React components organized by functionality.

- **`ui/`** - Reusable UI components from shadcn/ui
- Root level - Feature-specific components

### `lib/`
Core utilities and service integrations.

- **`supabase.ts`** - Browser-side Supabase client
- **`supabase-server.ts`** - Server-side Supabase client
- **`wconline.ts`** - WCOnline API integration
- **`analytics.ts`** - Analytics and data processing

### `scripts/`
Organized by purpose:

- **`sync/`** - Data synchronization scripts (WCOnline → Supabase)
- **`data/`** - Data import and management scripts
- **`utils/`** - Utility scripts (admin tools, etc.)

### `database/`
All SQL files for database setup and maintenance.

- **`supabase-schema.sql`** - Complete database schema
- Other SQL files for specific operations

### `docs/`
All project documentation files.

### `data/`
Data files used by scripts.

- **`tutor-availability-schedule.txt`** - Tutor schedule input file
- **`wconline/`** - WCOnline data exports (if any)

## 🔄 Workflow

### Typical Development Workflow

1. **Development**: Work in `app/`, `components/`, `lib/`
2. **Database Changes**: Add SQL files to `database/`
3. **Data Sync**: Run scripts from `scripts/sync/` or `scripts/data/`
4. **Documentation**: Update files in `docs/`

### Data Synchronization Workflow

1. **Sync WCOnline Data**: `python scripts/sync/sync-wconline.py <date>`
2. **Import Courses**: `python scripts/data/import-courses-from-appointments.py`
3. **Import Tutor Availability**: `python scripts/data/import-tutor-availability.py`
4. **Populate Slots**: `python scripts/data/populate-available-slots.py <start> <end>`

## 📝 File Naming Conventions

- **Components**: PascalCase (e.g., `ScheduleGrid.tsx`)
- **Utilities**: camelCase (e.g., `analytics.ts`)
- **Scripts**: kebab-case (e.g., `sync-wconline.py`)
- **Documentation**: UPPER_SNAKE_CASE (e.g., `QUICK_START.md`)

## 🔗 Related Documentation

- [Main README](./README.md) - Full project documentation
- [Scripts README](./scripts/README.md) - Script documentation
- [Quick Start Guide](./docs/QUICK_START.md) - Setup instructions

