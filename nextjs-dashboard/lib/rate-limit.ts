/**
 * Rate limiting utility
 * Uses in-memory cache for development
 * For production, consider upgrading to Redis/Upstash for distributed rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  limit: number

  /**
   * Time window in milliseconds
   */
  windowMs: number

  /**
   * Optional message to return when rate limit is exceeded
   */
  message?: string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (will reset on server restart)
// For production with multiple instances, use Redis/Upstash
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 60 seconds
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, 60000)
}

/**
 * Get client identifier from request
 * Uses IP address or user ID if authenticated
 */
function getClientIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`
  }

  if (realIp) {
    return `ip:${realIp}`
  }

  // Fallback to a generic identifier
  return 'unknown'
}

/**
 * Rate limit middleware
 * Returns true if request should be allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // No entry or expired - create new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    })
    return {
      success: true,
      remaining: config.limit - 1,
      resetTime,
    }
  }

  // Entry exists and not expired
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(identifier, entry)

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate limit helper for API routes
 * Usage in API route:
 *
 * const rateLimitResult = rateLimit(request, { limit: 10, windowMs: 60000 })
 * if (!rateLimitResult.success) {
 *   return rateLimitResult.response
 * }
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): {
  success: boolean
  remaining?: number
  response?: NextResponse
} {
  const identifier = getClientIdentifier(request, userId)
  const result = checkRateLimit(identifier, config)

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)

    return {
      success: false,
      response: NextResponse.json(
        {
          error: config.message || 'Too many requests',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      ),
    }
  }

  return {
    success: true,
    remaining: result.remaining,
  }
}

/**
 * Preset rate limit configurations
 */
export const RateLimits = {
  /**
   * Strict limit for sensitive operations (login, register)
   * 5 requests per minute
   */
  strict: {
    limit: 5,
    windowMs: 60 * 1000,
    message: 'Too many attempts, please try again later',
  },

  /**
   * Standard limit for most API endpoints
   * 60 requests per minute
   */
  standard: {
    limit: 60,
    windowMs: 60 * 1000,
    message: 'Too many requests, please slow down',
  },

  /**
   * Generous limit for read-only operations
   * 120 requests per minute
   */
  generous: {
    limit: 120,
    windowMs: 60 * 1000,
    message: 'Too many requests, please slow down',
  },

  /**
   * Very strict limit for expensive operations (exports, sync)
   * 2 requests per minute
   */
  veryStrict: {
    limit: 2,
    windowMs: 60 * 1000,
    message: 'This operation is rate limited. Please wait before trying again.',
  },
}

/**
 * Clear rate limit for a specific identifier (useful for testing)
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Get current rate limit status for an identifier
 */
export function getRateLimitStatus(identifier: string): RateLimitEntry | null {
  return rateLimitStore.get(identifier) || null
}
