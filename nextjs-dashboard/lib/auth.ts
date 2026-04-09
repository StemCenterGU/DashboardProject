/**
 * Authentication utilities
 * Uses Supabase Auth exclusively
 * Enhanced with RBAC (Role-Based Access Control)
 */

import { createServerClient } from './supabase-server'
import { ensureUserRow } from './ensure-user'
import {
  ADMIN_LEVEL_ROLES,
  MANAGER_LEVEL_ROLES,
  LEAD_TUTOR_LEVEL_ROLES,
  TUTOR_LEVEL_ROLES,
  hasPermission,
  type Role,
} from './roles'

export interface User {
  user_id: string
  email: string
  full_name?: string
  role?: string
  tutor_id?: string
}

export interface TutorInfo {
  tutor_id: string
  tutor_name: string
  username: string
  student_id?: string
  role?: string
  user_id?: string
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

// ============================================================================
// Enhanced RBAC Functions (using role constants)
// ============================================================================

/**
 * Require tutor-level permissions or higher
 * Allowed: tutor, lead_tutor, manager, admin, developer
 */
export async function requireTutorLevel(): Promise<User> {
  return requireRole(TUTOR_LEVEL_ROLES)
}

/**
 * Require lead tutor-level permissions or higher
 * Allowed: lead_tutor, manager, admin, developer
 */
export async function requireLeadTutorLevel(): Promise<User> {
  return requireRole(LEAD_TUTOR_LEVEL_ROLES)
}

/**
 * Require manager-level permissions or higher
 * Allowed: manager, admin, developer
 */
export async function requireManagerLevel(): Promise<User> {
  return requireRole(MANAGER_LEVEL_ROLES)
}

/**
 * Require admin-level permissions
 * Allowed: admin, developer
 * Note: ADMIN has ALL permissions in the system
 */
export async function requireAdminLevel(): Promise<User> {
  return requireRole(ADMIN_LEVEL_ROLES)
}

/**
 * Check if user has a specific permission
 * Uses the PERMISSIONS object from roles.ts
 * ADMIN automatically has ALL permissions
 *
 * @example
 * const user = await getCurrentUser()
 * if (user && hasPermissionCheck(user, 'EDIT_ALL_SCHEDULES')) {
 *   // Allow edit
 * }
 */
export function hasPermissionCheck(
  user: User,
  permission: Parameters<typeof hasPermission>[1]
): boolean {
  return hasPermission(user.role, permission)
}

/**
 * Require user to have a specific permission
 * Throws error if user doesn't have the permission
 */
export async function requirePermission(
  permission: Parameters<typeof hasPermission>[1]
): Promise<User> {
  const user = await requireAuth()
  if (!hasPermissionCheck(user, permission)) {
    throw new Error(`Permission denied: ${permission} required`)
  }
  return user
}

/**
 * Get tutor information for a given user
 * Uses dual strategy:
 * 1. Primary: Find by user_id
 * 2. Fallback: Extract username from email and match tutors.username
 *
 * @example
 * const user = await getCurrentUser()
 * const tutorInfo = await getUserTutor(user.user_id)
 */
export async function getUserTutor(userId: string): Promise<TutorInfo | null> {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return null
    }

    // Strategy 1: Find by user_id (primary method after migration)
    const { data: tutorByUserId, error: error1 } = await supabase
      .from('tutors')
      .select('tutor_id, tutor_name, username, student_id, role, user_id')
      .eq('user_id', userId)
      .single()

    if (!error1 && tutorByUserId) {
      return tutorByUserId
    }

    // Strategy 2: Fallback - get user's email and extract username
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.email) {
      return null
    }

    // Extract username from email (e.g., anjeh001@gannon.edu -> anjeh001)
    const username = user.email.split('@')[0].toLowerCase()

    const { data: tutorByUsername, error: error2 } = await supabase
      .from('tutors')
      .select('tutor_id, tutor_name, username, student_id, role, user_id')
      .eq('username', username)
      .single()

    if (!error2 && tutorByUsername) {
      // Update the tutor record to link user_id for future lookups
      await supabase
        .from('tutors')
        .update({ user_id: userId })
        .eq('tutor_id', tutorByUsername.tutor_id)

      return tutorByUsername
    }

    return null
  } catch (error) {
    console.error('Error getting user tutor:', error)
    return null
  }
}

