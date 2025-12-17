# Next.js Dashboard - Migration from Flask

This is the Next.js version of the STEM Face Dashboard, migrated from Flask.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase
- **Charts**: Recharts

## Getting Started

### 1. Install Dependencies

```bash
cd nextjs-dashboard
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install shadcn/ui Components

```bash
npx shadcn-ui@latest init
```

Then add components as needed:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
# ... etc
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nextjs-dashboard/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── lib/             # Utilities and helpers
│   ├── supabase.ts  # Supabase client
│   └── utils.ts     # Utility functions
└── public/          # Static assets
```

## Migration Status

- [x] Project setup
- [ ] Authentication
- [ ] Dashboard
- [ ] Charts
- [ ] Scheduling
- [ ] Admin panel

## Notes

- Flask backend can remain as API server for complex Python logic
- Gradually migrate features to Next.js API routes
- Use Supabase for authentication and database

