# Next.js Dashboard - Fully Migrated from Flask

This is the Next.js version of the STEM Face Dashboard. **All Flask functionality has been migrated to Next.js.**

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase
- **Charts**: Recharts
- **Analytics**: Custom TypeScript implementation

## Getting Started

### 1. Install Dependencies

```bash
cd nextjs-dashboard
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the `nextjs-dashboard` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# WCOnline Integration (Optional)
WCONLINE_API_KEY=your_wconline_api_key
WCONLINE_BASE_URL=https://gannon.mywconline.com/api
WCONLINE_SCHEDULE_TITLE=STEM CENTER
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nextjs-dashboard/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages (login, register)
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── dashboard/     # Main dashboard
│   │   ├── charts/        # Analytics charts
│   │   ├── calendar/      # Calendar view
│   │   ├── scheduling/    # Scheduling management
│   │   ├── profile/       # User profile
│   │   └── settings/      # Settings
│   └── api/               # API routes
│       ├── auth/          # Authentication endpoints
│       ├── analytics/     # Analytics endpoints
│       ├── admin/         # Admin operations
│       ├── dashboard-data/ # Dashboard statistics
│       ├── profile/        # User profile operations
│       └── user-info/      # User information
├── components/            # React components
│   ├── ui/                # shadcn/ui component library
│   ├── navbar.tsx         # Main navigation
│   └── predictive-analytics.tsx # ML analytics
├── lib/                   # Utilities & services
│   ├── supabase.ts        # Browser Supabase client
│   ├── supabase-server.ts # Server Supabase client
│   ├── analytics.ts       # Analytics engine
│   ├── utils.ts           # Utility functions
│   └── ml/                # Machine learning utilities
├── types/                 # TypeScript type definitions
│   └── index.ts           # Shared types
└── public/                # Static assets
```

## Migration Status: ✅ COMPLETE

- [x] Project setup
- [x] Authentication (login/logout)
- [x] Dashboard with statistics
- [x] Analytics and charts
- [x] User profile management
- [x] Admin user management
- [x] All API endpoints migrated

## API Endpoints

All endpoints are now in Next.js:

- `/api/auth/login` - User authentication
- `/api/auth/logout` - User logout
- `/api/user-info` - Get current user
- `/api/dashboard-data` - Dashboard statistics
- `/api/analytics/*` - Analytics endpoints
- `/api/admin/users` - User management
- `/api/profile` - User profile

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Recommended Hosting

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Any Node.js hosting** (AWS, DigitalOcean, etc.)

## Project Structure Details

### `/app` - Next.js App Router
- `(auth)/` - Authentication pages (login, register)
- `(dashboard)/` - Protected dashboard pages
  - `dashboard/` - Main dashboard
  - `charts/` - Analytics charts
  - `calendar/` - Calendar view
  - `scheduling/` - Scheduling management
  - `profile/` - User profile
  - `settings/` - Settings
- `api/` - API routes
  - `auth/` - Authentication endpoints
  - `analytics/` - Analytics data endpoints
  - `admin/` - Admin operations
  - `dashboard-data/` - Dashboard statistics
  - `profile/` - User profile operations
  - `user-info/` - User information

### `/components` - React Components
- `ui/` - shadcn/ui component library
- `navbar.tsx` - Main navigation component
- `predictive-analytics.tsx` - ML analytics component

### `/lib` - Utilities & Services
- `supabase.ts` - Browser Supabase client
- `supabase-server.ts` - Server Supabase client
- `analytics.ts` - Analytics engine
- `utils.ts` - Utility functions
- `ml/` - Machine learning utilities

### `/public` - Static Assets
- Images, fonts, and other static files

## Troubleshooting

### Missing Environment Variables

If you see Supabase errors, make sure `.env.local` is configured correctly.

### API Routes Not Working

1. Check that `.env.local` exists and has correct values
2. Restart the dev server: `npm run dev`
3. Clear Next.js cache: `rm -rf .next` (or `rmdir /s /q .next` on Windows)

### Build Errors

1. Delete `.next` folder
2. Delete `node_modules` and run `npm install`
3. Run `npm run build` again

