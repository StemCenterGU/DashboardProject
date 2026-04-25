# Performance Optimization Guide

This guide documents all performance optimizations implemented in the application.

## 📋 Table of Contents

1. [Email Queue System](#email-queue-system)
2. [Optimistic UI Updates](#optimistic-ui-updates)
3. [Caching Strategies](#caching-strategies)
4. [Database Query Optimization](#database-query-optimization)
5. [Loading States](#loading-states)

---

## 🔧 Email Queue System

### Problem
Email sending was blocking API responses, causing slow button interactions and freezing UI.

### Solution
Implemented asynchronous email queue system (`lib/email-queue.ts`) that:
- Returns immediately without waiting for email to send
- Processes emails in background every 5 seconds
- Retries failed emails up to 3 times
- Logs all email operations

### Usage

```typescript
import { sendEmailAsync } from '@/lib/email-queue'

// Instead of this (blocks response):
await sendEmail({ to: 'user@example.com', subject: 'Test' })

// Use this (returns immediately):
sendEmailAsync({ to: 'user@example.com', subject: 'Test' })
```

### Integration Points
- Schedule change notifications
- Appointment confirmations
- Client report emails
- Registration welcome emails

### Future Improvements
Replace with production-ready queue:
- **Inngest** - Serverless background jobs
- **Upstash QStash** - HTTP-based task queue
- **Supabase Edge Functions** - Database webhooks
- **Redis Queue** - Traditional queue system

---

## ⚡ Optimistic UI Updates

### Problem
Users had to wait for API responses before seeing UI changes, making the app feel sluggish.

### Solution
Created `useOptimisticUpdate` hook that:
- Updates UI instantly
- Executes API call in background
- Automatically rolls back on error
- Shows toast notifications

### Usage

```typescript
import { useOptimisticMutation } from '@/hooks/useOptimisticUpdate'

function ScheduleEditor() {
  const [schedule, setSchedule] = useState(currentSchedule)
  const { mutate, isPending } = useOptimisticMutation()

  const handleSave = async (newSchedule) => {
    await mutate(newSchedule, {
      // Update UI immediately
      optimisticUpdate: (vars) => setSchedule(vars),

      // API call in background
      mutationFn: async (vars) => {
        const response = await fetch('/api/schedule', {
          method: 'PUT',
          body: JSON.stringify(vars)
        })
        return response.json()
      },

      // Rollback on error
      rollback: () => setSchedule(currentSchedule),

      // Callbacks
      onSuccess: (data) => console.log('Saved!', data),
      onError: (error) => console.error('Failed', error)
    })
  }

  return (
    <button onClick={() => handleSave(newSchedule)} disabled={isPending}>
      {isPending ? 'Saving...' : 'Save'}
    </button>
  )
}
```

### Best Practices
- Always provide rollback mechanism
- Show loading state even with optimistic UI
- Use for: status changes, toggles, simple updates
- Avoid for: complex forms, file uploads

---

## 🚀 Caching Strategies

### Problem
Repeatedly fetching the same data from database caused unnecessary load and slow page loads.

### Solution
Implemented multi-level caching (`lib/cache-utils.ts`):
1. **Memory Cache** - Fastest, for configuration data
2. **Next.js Cache** - Server-side, with revalidation
3. **Parallel Fetching** - Avoid request waterfalls

### Cache Durations

```typescript
CACHE_DURATION = {
  STATIC: 24 hours,  // Courses, schedules list
  MEDIUM: 5 minutes, // Tutors, availability
  SHORT: 1 minute,   // Appointments, notifications
  NONE: 0,           // Real-time data
}
```

### Usage Examples

#### 1. Next.js Server Component Caching

```typescript
import { createCachedQuery, CACHE_TAGS, CACHE_DURATION } from '@/lib/cache-utils'

const getCachedCourses = createCachedQuery(
  async () => {
    const supabase = await createServerClient()
    return supabase.from('courses').select('*')
  },
  ['courses-list'],
  {
    revalidate: CACHE_DURATION.STATIC,
    tags: [CACHE_TAGS.COURSES]
  }
)
```

#### 2. Memory Cache for API Routes

```typescript
import { memoryCache } from '@/lib/cache-utils'

export async function GET() {
  const cached = memoryCache.get('tutors-list')
  if (cached) return NextResponse.json(cached)

  const data = await fetchTutors()
  memoryCache.set('tutors-list', data, 300) // 5 minutes

  return NextResponse.json(data)
}
```

#### 3. Parallel Data Fetching

```typescript
import { fetchInParallel } from '@/lib/cache-utils'

// ❌ BAD: Sequential (slow)
const tutors = await getTutors()
const courses = await getCourses()
const schedules = await getSchedules()

// ✅ GOOD: Parallel (fast)
const [tutors, courses, schedules] = await fetchInParallel([
  () => getTutors(),
  () => getCourses(),
  () => getSchedules()
])
```

### Cache Invalidation

```typescript
import { revalidateTag } from 'next/cache'

// After updating data, invalidate cache
await updateCourse(courseId, newData)
revalidateTag(CACHE_TAGS.COURSES)
```

---

## 🗃️ Database Query Optimization

### Problem
Slow queries, N+1 problems, and missing indexes causing performance bottlenecks.

### Solution

#### 1. Added Performance Indexes
Migration: `20260424000006_add_performance_indexes.sql`

Key indexes added:
- `idx_appointments_date_range` - Date range queries
- `idx_appointments_scheduling` - Active appointment lookups
- `idx_tutor_availability_active` - Available tutor slots
- `idx_schedule_requests_pending` - Admin dashboard
- `idx_notifications_unread` - Notification badge

#### 2. Query Pattern Guidelines
See `lib/optimized-queries.ts` for examples:

**✅ DO:**
- Select only needed columns
- Use joins instead of multiple queries
- Fetch data in parallel when independent
- Paginate large datasets
- Use conditional query building

**❌ DON'T:**
- Use `SELECT *` unless necessary
- Make N+1 queries in loops
- Fetch all data without pagination
- Execute sequential queries that could be parallel

#### 3. Example Optimizations

**Before (N+1 Problem):**
```typescript
const appointments = await supabase.from('appointments').select('*')
for (const apt of appointments.data) {
  const tutor = await supabase.from('tutors').select('*').eq('id', apt.tutor_id)
}
```

**After (Single Query):**
```typescript
const { data } = await supabase
  .from('appointments')
  .select(`
    *,
    tutor:tutors(tutor_id, tutor_name)
  `)
```

---

## 🎯 Loading States

### Problem
Users didn't know if actions were processing, causing multiple clicks and confusion.

### Solution
Implemented immediate visual feedback for all interactive elements.

### Button Loading Pattern

```typescript
function ActionButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await performAction()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Submit'
      )}
    </Button>
  )
}
```

### Skeleton Loaders

```typescript
function DataTable() {
  const [loading, setLoading] = useState(true)

  if (loading) {
    return <SkeletonTable rows={5} />
  }

  return <Table data={data} />
}
```

---

## 📊 Performance Metrics

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Email action response | 3-5s | <100ms | 97% faster |
| Schedule grid load | 2-3s | <500ms | 80% faster |
| Notification badge | 500ms | <50ms | 90% faster |
| Report list load | 1-2s | <300ms | 85% faster |

---

## 🔍 Monitoring & Debugging

### Email Queue Status

```typescript
import { emailQueue } from '@/lib/email-queue'

console.log(emailQueue.getStatus())
// { queueLength: 3, processing: true, oldestJob: Date }
```

### Cache Debugging

```typescript
import { memoryCache } from '@/lib/cache-utils'

// Check if cached
console.log(memoryCache.has('key'))

// Clear cache
memoryCache.clear()
```

### Database Query Logging

Add to API routes:
```typescript
console.time('query')
const data = await supabase.from('table').select('*')
console.timeEnd('query')
```

---

## 🚀 Production Deployment Checklist

- [ ] Replace email queue with production service (Inngest/Upstash)
- [ ] Apply database index migration
- [ ] Configure Next.js caching in `next.config.js`
- [ ] Set up monitoring for slow queries
- [ ] Enable query logging in Supabase
- [ ] Configure CDN for static assets
- [ ] Enable database connection pooling
- [ ] Set up performance monitoring (Vercel Analytics)

---

## 📚 Additional Resources

- [Next.js Caching Documentation](https://nextjs.org/docs/app/building-your-application/caching)
- [Supabase Performance Tips](https://supabase.com/docs/guides/platform/performance)
- [React Optimistic Updates](https://react.dev/reference/react/useOptimistic)
- [Database Indexing Best Practices](https://wiki.postgresql.org/wiki/Index_Maintenance)
