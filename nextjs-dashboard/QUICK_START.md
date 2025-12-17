# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Navigate to Next.js Project

```bash
cd nextjs-dashboard
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Copy your Supabase credentials from the parent `.env` file and create `.env.local`:

```bash
# Create .env.local file
NEXT_PUBLIC_SUPABASE_URL=https://tjhcndrxlstezfgiyxla.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_key_here
```

### Step 4: Initialize shadcn/ui

```bash
npx shadcn-ui@latest init
```

**Answer the prompts:**
- TypeScript? **Yes**
- Style? **Default**
- Base color? **Slate**
- CSS variables? **Yes**
- Import alias? **@/components** and **@/lib/utils**

### Step 5: Add Essential Components

```bash
npx shadcn-ui@latest add button card input label form
```

### Step 6: Run Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

## ✅ You're Ready!

The Next.js project is set up with:
- ✅ Next.js 14+ (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ shadcn/ui configuration
- ✅ Supabase client setup

## Next Steps

1. Create login page with shadcn/ui components
2. Set up authentication
3. Build dashboard layout
4. Migrate features from Flask

## Need Help?

Check `SETUP_INSTRUCTIONS.md` for detailed steps.

