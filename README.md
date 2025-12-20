# 📋 Tutor Dashboard - Next.js Application

This is the Next.js version of the STEM Face Dashboard, fully migrated from Flask.

## 🚀 Quick Start

All application code is in the `nextjs-dashboard/` directory.

```bash
cd nextjs-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
stem-face-dashboard/
└── nextjs-dashboard/    ← All application code is here
    ├── app/             ← Next.js pages and API routes
    ├── components/      ← React components
    ├── lib/             ← Utilities and analytics
    └── public/          ← Static assets
```

## 📖 Documentation

See `nextjs-dashboard/README.md` for detailed documentation.

## 🔧 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase
- **Charts**: Recharts

## 🎯 Features

- ✅ User authentication
- ✅ Dashboard with analytics
- ✅ Interactive charts and visualizations
- ✅ Scheduling management
- ✅ Calendar view
- ✅ User profile management
- ✅ Admin panel

## 📝 Environment Setup

Create `nextjs-dashboard/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

Deploy to Vercel, Netlify, or any Node.js hosting platform.

```bash
cd nextjs-dashboard
npm run build
npm start
```
