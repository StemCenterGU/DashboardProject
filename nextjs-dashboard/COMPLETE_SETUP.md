# Complete Setup Guide

## 🚀 Quick Start (5 Steps)

### Step 1: Install Dependencies

```bash
cd nextjs-dashboard
npm install
```

Or run the setup script:
```bash
setup.bat
```

### Step 2: Set Up Environment Variables

Create `.env.local` file in `nextjs-dashboard` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tjhcndrxlstezfgiyxla.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**To get your key:**
- Check the parent `.env` file
- Or get it from Supabase Dashboard → Settings → API

### Step 3: Initialize shadcn/ui

```bash
npx shadcn-ui@latest init
```

**Answer prompts:**
- ✅ TypeScript? **Yes**
- ✅ Style? **Default**
- ✅ Base color? **Slate**
- ✅ CSS variables? **Yes**
- ✅ Import alias? **@/components** and **@/lib/utils**

### Step 4: Install shadcn/ui Components

Run the batch file:
```bash
INSTALL_SHADCN_COMPONENTS.bat
```

Or manually:
```bash
npx shadcn-ui@latest add button card input label alert dropdown-menu avatar
```

### Step 5: Start Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

You'll be redirected to `/login` page!

## ✅ What's Been Created

### Pages
- ✅ `/login` - Login page with shadcn/ui
- ✅ `/register` - Registration page
- ✅ `/dashboard` - Main dashboard with cards
- ✅ `/dashboard` layout with authentication check

### Components
- ✅ `Navbar` - Navigation bar with user menu
- ✅ Login/Register forms with validation
- ✅ Dashboard cards with icons

### Features
- ✅ Supabase authentication integration
- ✅ Protected routes (dashboard requires login)
- ✅ Responsive design with Tailwind
- ✅ Dark mode support (via shadcn/ui)

## 🎨 Test Login

Use these credentials (from your CSV):
- **Email**: `admin@university.edu`
- **Password**: `password`

## 📁 Project Structure

```
nextjs-dashboard/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx      ✅ Created
│   │   └── register/page.tsx   ✅ Created
│   ├── (dashboard)/
│   │   ├── layout.tsx          ✅ Created (with auth check)
│   │   └── dashboard/page.tsx   ✅ Created
│   ├── layout.tsx               ✅ Root layout
│   ├── page.tsx                 ✅ Redirects to /dashboard
│   └── globals.css              ✅ Tailwind + shadcn/ui styles
├── components/
│   ├── navbar.tsx               ✅ Created
│   └── ui/                      (shadcn/ui components)
├── lib/
│   ├── supabase.ts             ✅ Created (SSR support)
│   └── utils.ts                 ✅ Created
└── package.json                 ✅ All dependencies
```

## 🔄 Next Steps

1. **Test the login** - Make sure authentication works
2. **Add more pages** - Charts, scheduling, calendar
3. **Connect to Flask API** - For complex Python logic
4. **Add charts** - Using Recharts library
5. **Migrate more features** - One by one

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists
- Check variable names start with `NEXT_PUBLIC_`
- Restart dev server after adding env vars

### "Module not found" errors
- Run `npm install` again
- Make sure you're in `nextjs-dashboard` folder

### shadcn/ui components not found
- Run `INSTALL_SHADCN_COMPONENTS.bat`
- Or install manually: `npx shadcn-ui@latest add [component-name]`

## 🎉 You're Ready!

Your Next.js dashboard is set up and ready to use. Start the dev server and test it out!

