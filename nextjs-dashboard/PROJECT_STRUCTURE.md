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
│   ├── shared/                   # Reusable shared components
│   │   ├── pagination.tsx        # Pagination controls
│   │   ├── loading-spinner.tsx   # Loading indicator
│   │   ├── empty-state.tsx       # Empty state display
│   │   └── index.ts
│   ├── scheduling/               # Scheduling-specific components
│   │   ├── appointment-card.tsx  # Appointment display card
│   │   ├── today-appointments.tsx
│   │   ├── upcoming-appointments.tsx
│   │   └── index.ts
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── stats-card.tsx        # Statistics display card
│   │   └── index.ts
│   ├── navbar.tsx
│   ├── schedule-grid.tsx
│   └── predictive-analytics.tsx
│
├── lib/                          # Utilities & services
│   ├── analytics/                # Analytics module (organized)
│   │   ├── index.ts              # Re-exports
│   │   ├── types.ts              # Analytics types
│   │   └── scheduling.ts         # SchedulingAnalytics class
│   ├── supabase/                 # Supabase clients (organized)
│   │   ├── index.ts              # Re-exports
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── analytics.ts              # Legacy re-export (backward compatible)
│   ├── supabase.ts               # Browser Supabase client
│   ├── supabase-server.ts        # Server Supabase client
│   ├── wconline.ts               # WCOnline integration
│   ├── wconline-sync.ts          # WCOnline sync utilities
│   ├── auth.ts                   # Authentication utilities
│   ├── utils.ts                  # Utility functions
│   └── ml/                       # Machine learning utilities
│
├── types/                        # TypeScript definitions
│   └── index.ts                  # Comprehensive type definitions
│
├── public/                       # Static assets
│
├── data/                         # Data files
│   ├── wconline/                 # WCOnline data exports
│   └── tutor-availability-schedule.txt
│
├── scripts/                       # Utility scripts (organized)
│   ├── sync/                     # Core synchronization scripts
│   │   ├── sync-wconline.py      # Main WCOnline sync script
│   │   ├── sync-avail-slots.py   # Available slots sync
│   │   └── README-AVAIL-SYNC.md
│   ├── data/                     # Data management scripts
│   │   ├── import-courses-from-appointments.py
│   │   ├── import-tutor-availability.py
│   │   ├── extract-tutor-availability.py
│   │   └── populate-available-slots.py
│   ├── maintenance/              # Database maintenance scripts
│   │   ├── merge_duplicates.py
│   │   ├── cleanup_availability_duplicates.py
│   │   ├── check_availability_duplicates.py
│   │   ├── fix_avish.py
│   │   └── smart_update_availability.py
│   ├── archive/                  # Archived scripts
│   │   ├── debug/                # Debug/troubleshooting scripts
│   │   └── tests/                # Test/verification scripts
│   ├── utils/                    # Utility scripts
│   │   └── set-admin-role.js
│   └── README.md                 # Scripts documentation
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
- **`shared/`** - Shared reusable components (Pagination, LoadingSpinner, EmptyState)
- **`scheduling/`** - Scheduling-specific components (AppointmentCard, TodayAppointments)
- **`dashboard/`** - Dashboard-specific components (StatsCard)
- Root level - Feature-specific components

### `lib/`
Core utilities and service integrations.

- **`analytics/`** - Analytics module with organized files
  - `scheduling.ts` - Main SchedulingAnalytics class
  - `types.ts` - Type definitions
  - `index.ts` - Re-exports
- **`supabase/`** - Supabase clients
  - `client.ts` - Browser-side client
  - `server.ts` - Server-side client
- **`wconline.ts`** - WCOnline API integration
- **`wconline-sync.ts`** - WCOnline sync utilities

### `scripts/`
Organized by purpose:

- **`sync/`** - Core data synchronization scripts (WCOnline → Supabase)
- **`data/`** - Data import and management scripts
- **`maintenance/`** - Database cleanup and maintenance scripts
- **`archive/`** - Archived debug and test scripts
- **`utils/`** - Utility scripts (admin tools, etc.)

### `types/`
Comprehensive TypeScript definitions organized by domain:

- User types (User, UserRole, AuthSession)
- Tutor types (Tutor, TutorAvailability)
- Appointment types (Appointment, AppointmentStatus, AvailableSlot)
- Course types (Course)
- Dashboard types (DashboardSummary, DashboardAlert, RecentActivity)
- Analytics types (ChartData, AnalyticsFilters, ChartDataset)
- API types (ApiResponse, PaginatedResponse, ApiError)
- Sync types (WCOnlineAppointment, SyncResult, SyncStatus)
- UI types (TabItem, SortOption, FilterOption)

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

1. **Sync WCOnline Data**: `python scripts/sync/sync-wconline.py <start_date> <end_date>`
2. **Import Courses**: `python scripts/data/import-courses-from-appointments.py`
3. **Import Tutor Availability**: `python scripts/data/import-tutor-availability.py`
4. **Populate Slots**: `python scripts/data/populate-available-slots.py <start> <end>`

### Maintenance Workflow

1. **Check Duplicates**: `python scripts/maintenance/check_availability_duplicates.py`
2. **Cleanup Duplicates**: `python scripts/maintenance/cleanup_availability_duplicates.py`
3. **Merge Tutors**: `python scripts/maintenance/merge_duplicates.py`

## 📦 Component Usage

### Shared Components
```typescript
import { Pagination, LoadingSpinner, EmptyState } from '@/components/shared'
```

### Scheduling Components
```typescript
import { AppointmentCard, TodayAppointments, UpcomingAppointments } from '@/components/scheduling'
```

### Dashboard Components
```typescript
import { StatsCard } from '@/components/dashboard'
```

### Types
```typescript
import { Appointment, User, ChartData, ApiResponse } from '@/types'
```

## 📝 File Naming Conventions

- **Components**: PascalCase (e.g., `ScheduleGrid.tsx`)
- **Component Files**: kebab-case (e.g., `stats-card.tsx`)
- **Utilities**: camelCase (e.g., `analytics.ts`)
- **Scripts**: kebab-case (e.g., `sync-wconline.py`)
- **Documentation**: UPPER_SNAKE_CASE (e.g., `QUICK_START.md`)

## 🔗 Related Documentation

- [Main README](./README.md) - Full project documentation
- [Scripts README](./scripts/README.md) - Script documentation
- [Quick Start Guide](./docs/QUICK_START.md) - Setup instructions
