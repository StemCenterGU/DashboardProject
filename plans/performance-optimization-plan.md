# Performance & UX Optimization Plan

## Overview
This plan outlines strategies to resolve performance bottlenecks and improve the perceived speed of the application. The current issues reported include slow initial load times, sluggish button interactions, and significant delays when performing actions that trigger emails (like updating tutor schedules).

## Phase 1: Decoupling Email & Third-Party Services

### The Problem
Currently, actions like updating a tutor's schedule send an email synchronously. This means the API route waits for the SMTP server/email provider to accept the message before sending a response back to the client. This blocks the UI and causes noticeable freezing.

### Solutions
**1.1 Background Email Sending**
Instead of `await sendEmail(...)` in the main API flow:
*   **Vercel/Next.js Environment:** If deployed on Vercel, use `waitUntil()` (if using Next.js functions) to allow the API to respond immediately while the email continues sending in the background.
*   **Supabase Edge Functions / Webhooks:** Move email logic to a Supabase Database Webhook or Edge Function. When the database is updated (e.g., a schedule record changes), Supabase automatically triggers the Edge Function to send the email asynchronously. The frontend API only handles the database update, returning instantly.
*   **Message Queue (Alternative):** Implement a simple queue (e.g., using Inngest or Upstash/Redis) where the API just publishes an "email_needed" event and returns immediately.

## Phase 2: Implementing Optimistic UI Updates

### The Problem
When a user clicks a button (e.g., "Save Schedule" or "Mark as No Show"), the UI waits for the API response before reflecting the change. If the network or server is slow, the application feels unresponsive.

### Solutions
**2.1 Optimistic React State**
*   Use React's `useOptimistic` hook (or React Query's `onMutate` if using React Query) for all interactive buttons.
*   **Flow:** 
    1. User clicks "Save".
    2. UI updates *instantly* to show the new state (e.g., the schedule block turns green).
    3. The network request fires in the background.
    4. If the request fails, the UI rolls back to the previous state and shows a toast error.

**2.2 Loading States & Feedback**
*   Where optimistic UI isn't appropriate, ensure buttons immediately disable and show a spinner (e.g., `<Button disabled><Spinner /> Saving...</Button>`) upon click to acknowledge the user's action instantly.

## Phase 3: Next.js Data Fetching & Caching Optimization

### The Problem
"Taking a lot of time loading things" suggests we might be over-fetching data, missing out on caching, or suffering from waterfall requests.

### Solutions
**3.1 Leverage React Server Components (RSC)**
*   Ensure data fetching for pages happens on the server in Server Components, passing only the necessary data down to Client Components. This reduces the JavaScript bundle size and shifts the heavy lifting to the server.

**3.2 Implement Proper Caching Strategies**
*   Use Next.js `revalidate` tags or Time-Based Revalidation for data that doesn't change every second (like the list of available courses or static options).
*   For highly dynamic data (like today's schedule), ensure queries are lean.

**3.3 Eliminate Request Waterfalls**
*   If a page needs data from three different tables, ensure they are fetched concurrently using `Promise.all([fetchA(), fetchB(), fetchC()])` rather than awaiting them one by one.

## Phase 4: Database & API Query Optimization

### The Problem
Slow queries can throttle both load times and interaction speeds.

### Solutions
**4.1 Review Supabase Queries**
*   Audit large queries (especially for the scheduling calendar or reports). Ensure we are only `select()`ing the specific columns needed, not `select('*')`.
*   Check for N+1 query issues (fetching a list of appointments, and then making a separate query for each appointment to get the student's details). Supabase allows joining tables in a single query (e.g., `select('*, students(name)')`).

**4.2 Database Indexes**
*   Add indexes to foreign keys and columns frequently used in `WHERE` clauses (e.g., `appointment_date`, `tutor_id`, `student_id`).

## Implementation Order

**Sprint 1: The "Quick Wins" (Highest ROI)**
1.  **Audit Email Logic:** Move email sending out of the critical path in the API routes using Webhooks or `waitUntil`. This will fix the "changing schedule takes time" issue immediately.
2.  **Add Loading States:** Ensure every actionable button in the app provides instant visual feedback when clicked.

**Sprint 2: Optimistic UI & Data Fetching**
1.  Implement Optimistic UI for schedule changes and status updates.
2.  Review major pages (like the Dashboard and Scheduling grids) to implement `Promise.all` for parallel data fetching.

**Sprint 3: Deep Optimization**
1.  Audit Supabase queries for inefficiencies and missing joins.
2.  Add necessary indexes to the database schema.
