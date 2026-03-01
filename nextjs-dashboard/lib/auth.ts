/**
 * Authentication utilities
 * Uses Supabase Auth exclusively
 */

import { createServerClient } from './supabase-server'
import { ensureUserRow } from './ensure-user'

export interface User {
  user_id: string
  email: string
  full_name?: string
  role?: string
  tutor_id?: string
}

/**
 * Get current authenticated user from Supabase Auth.
 * If the user has no row in the users table, one is created on first load (sync on login).
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return null
    }

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return null
    }

    let role = session.user.user_metadata?.role || 'tutor'

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (userData?.role) {
      role = userData.role
    } else {
      // No row in users table: ensure one exists (e.g. old Auth user or after table clear)
      const ensured = await ensureUserRow(supabase, session.user)
      if (ensured?.role) {
        role = ensured.role
      }
    }

    return {
      user_id: session.user.id,
      email: session.user.email || '',
      full_name: session.user.user_metadata?.full_name || session.user.email || '',
      role,
      tutor_id: session.user.user_metadata?.tutor_id,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Check if user has one of the required roles
 */
export function hasRole(user: User, roles: string[]): boolean {
  if (!user.role) return false
  return roles.includes(user.role)
}

/**
 * Require user to have one of the specified roles
 */
export async function requireRole(roles: string[]): Promise<User> {
  const user = await requireAuth()
  if (!hasRole(user, roles)) {
    throw new Error('Insufficient permissions')
  }
  return user
}

/**
 * Require admin or manager role
 */
export async function requireAdmin(): Promise<User> {
  return requireRole(['admin', 'manager'])
}

/**
 * Require developer role
 */
export async function requireDeveloper(): Promise<User> {
  return requireRole(['developer'])
}

