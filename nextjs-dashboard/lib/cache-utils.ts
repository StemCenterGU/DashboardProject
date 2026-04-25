/**
 * Caching Utilities for Next.js
 * Implements proper caching strategies to reduce database load
 */

import { unstable_cache } from 'next/cache'

/**
 * Cache tags for revalidation
 */
export const CACHE_TAGS = {
  SCHEDULES: 'schedules',
  APPOINTMENTS: 'appointments',
  TUTORS: 'tutors',
  COURSES: 'courses',
  REPORTS: 'reports',
  REPORT_OPTIONS: 'report-options',
  FORM_QUESTIONS: 'form-questions',
  REGISTRATION_QUESTIONS: 'registration-questions',
  USERS: 'users',
} as const

/**
 * Cache durations (in seconds)
 */
export const CACHE_DURATION = {
  STATIC: 60 * 60 * 24, // 24 hours - for rarely changing data
  MEDIUM: 60 * 5, // 5 minutes - for semi-static data
  SHORT: 60, // 1 minute - for frequently changing data
  NONE: 0, // No caching
} as const

/**
 * Create a cached function with automatic revalidation
 *
 * @example
 * const getCachedCourses = createCachedQuery(
 *   async () => {
 *     return await supabase.from('courses').select('*')
 *   },
 *   ['courses-list'],
 *   { revalidate: CACHE_DURATION.STATIC, tags: [CACHE_TAGS.COURSES] }
 * )
 */
export function createCachedQuery<T>(
  queryFn: () => Promise<T>,
  keyParts: string[],
  options?: {
    revalidate?: number
    tags?: string[]
  }
) {
  return unstable_cache(queryFn, keyParts, {
    revalidate: options?.revalidate,
    tags: options?.tags,
  })
}

/**
 * Parallel query helper
 * Executes multiple queries concurrently to avoid waterfalls
 *
 * @example
 * const [tutors, courses, schedules] = await fetchInParallel([
 *   () => getTutors(),
 *   () => getCourses(),
 *   () => getSchedules()
 * ])
 */
export async function fetchInParallel<T extends any[]>(
  queries: Array<() => Promise<any>>
): Promise<T> {
  return Promise.all(queries.map(query => query())) as Promise<T>
}

/**
 * In-memory cache for frequently accessed data
 * Use for data that changes rarely (like configuration)
 */
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>()

  set(key: string, data: any, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    })
  }

  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

export const memoryCache = new MemoryCache()

/**
 * Cached fetch wrapper
 * Combines memory cache with fetch for API calls
 */
export async function cachedFetch<T = any>(
  url: string,
  options?: RequestInit & { cacheTTL?: number }
): Promise<T> {
  const cacheKey = `fetch:${url}`
  const ttl = options?.cacheTTL || CACHE_DURATION.SHORT

  // Check memory cache first
  const cached = memoryCache.get<T>(cacheKey)
  if (cached) {
    return cached
  }

  // Fetch from API
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  // Store in memory cache
  memoryCache.set(cacheKey, data, ttl)

  return data
}

/**
 * Preload data in parallel for server components
 *
 * @example
 * // In a server component
 * preloadData({
 *   tutors: () => getTutors(),
 *   courses: () => getCourses(),
 *   schedules: () => getSchedules()
 * })
 */
export function preloadData(queries: Record<string, () => Promise<any>>) {
  // Start all queries in parallel
  const promises = Object.values(queries).map(query => query())

  // Don't await - just trigger the requests
  // The results will be cached for when they're actually needed
  Promise.all(promises).catch(error => {
    console.error('Preload error:', error)
  })
}
