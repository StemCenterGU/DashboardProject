# Setup Instructions for Next.js Dashboard

## Step 1: Install Dependencies

Open terminal in the `nextjs-dashboard` folder and run:

```bash
npm install
```

This will install:
- Next.js 14+
- React 18
- TypeScript
- Tailwind CSS
- Supabase client
- shadcn/ui dependencies

## Step 2: Install Tailwind CSS Plugin

```bash
npm install -D tailwindcss-animate
```

## Step 3: Initialize shadcn/ui

```bash
npx shadcn-ui@latest init
```

When prompted:
- Would you like to use TypeScript? **Yes**
- Which style would you like to use? **Default**
- Which color would you like to use as base color? **Slate**
- Where is your global CSS file? **app/globals.css**
- Would you like to use CSS variables for colors? **Yes**
- Are you using a custom tailwind prefix? **No**
- Where is your tailwind.config.js located? **tailwind.config.ts**
- Configure the import alias for components? **@/components**
- Configure the import alias for utils? **@/lib/utils**

## Step 4: Add shadcn/ui Components

Add commonly used components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add calendar
```

## Step 5: Set Up Environment Variables

Create `.env.local` file in `nextjs-dashboard` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tjhcndrxlstezfgiyxla.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: Get your Supabase key from your `.env` file in the parent directory.

## Step 6: Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Next Steps

1. Create authentication pages (login, register)
2. Set up protected routes
3. Migrate dashboard components
4. Add charts with Recharts
5. Migrate scheduling system

## Troubleshooting

### If shadcn/ui init fails:
- Make sure you're in the `nextjs-dashboard` directory
- Check that `components.json` exists
- Verify `tailwind.config.ts` is properly configured

### If Supabase connection fails:
- Check `.env.local` file exists
- Verify environment variable names start with `NEXT_PUBLIC_`
- Restart the dev server after adding env variables

