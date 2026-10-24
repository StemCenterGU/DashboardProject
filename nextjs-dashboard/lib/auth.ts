/**
 * Authentication utilities
 * Uses Supabase Auth exclusively
 * Enhanced with RBAC (Role-Based Access Control)
 */

import { createServerClient, createAdminClient } from './supabase-server'
import { ensureUserRow } from './ensure-user'
import {
  FULL_ACCESS_ROLES,
  OVERSIGHT_ROLES,
  STAFF_ROLES,
  TUTOR_ROLES,
  DEFAULT_ROLE,
  hasPermission,
  isValidRole,
  type Permission,
  type Role,
} from './roles'

export interface User {
  user_id: string
  email: string
  full_name?: string
  role?: Role
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
 * The session is verified with Supabase (getUser), and the role always comes
 * from the users table — never from user_metadata, which users can edit.
 * If the user has no row in the users table, one is created with the default role.
 * Deactivated users (users.active = false) are treated as signed out.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return null
    }

    const { data: { user: authUser }, error } = await supabase.auth.getUser()

    if (error || !authUser) {
      return null
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, active, full_name')
      .eq('user_id', authUser.id)
      .single()

    const row = userData ?? await ensureUserRow(supabase, authUser)
    if (!row || row.active === false) {
      return null
    }

    return {
      user_id: authUser.id,
      email: authUser.email || '',
      full_name: row.full_name || authUser.user_metadata?.full_name || authUser.email || '',
      // Unknown/legacy role values get the least-privileged role
      role: isValidRole(row.role) ? row.role : DEFAULT_ROLE,
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

// ============================================================================
// Role Group Guards (using role constants)
// ============================================================================

/**
 * Require full access
 * Allowed: admin, project_manager
 */
export async function requireFullAccess(): Promise<User> {
  return requireRole(FULL_ACCESS_ROLES)
}

/**
 * Require view-all access
 * Allowed: student_manager, admin, project_manager
 */
export async function requireOversight(): Promise<User> {
  return requireRole(OVERSIGHT_ROLES)
}

/**
 * Require tutoring staff (anyone except students)
 * Allowed: tutor, stem_pass_tutor, student_manager, admin, project_manager
 */
export async function requireStaff(): Promise<User> {
  return requireRole(STAFF_ROLES)
}

/**
 * Check if user has a specific permission
 * Uses the PERMISSIONS object from roles.ts
 * Full-access roles automatically have ALL permissions
 *
 * @example
 * const user = await getCurrentUser()
 * if (user && hasPermissionCheck(user, 'EDIT_ALL_SCHEDULES')) {
 *   // Allow edit
 * }
 */
export function hasPermissionCheck(user: User, permission: Permission): boolean {
  return hasPermission(user.role, permission)
}

/**
 * Require user to have a specific permission
 * Throws error if user doesn't have the permission
 */
export async function requirePermission(permission: Permission): Promise<User> {
  const user = await requireAuth()
  if (!hasPermissionCheck(user, permission)) {
    throw new Error(`Permission denied: ${permission} required`)
  }
  return user
}

/**
 * Get the tutor_ids linked to a user (via tutors.user_id).
 * These are the appointments a tutor-type role "owns".
 */
export async function getUserTutorIds(user: User): Promise<string[]> {
  if (!user.role || !TUTOR_ROLES.includes(user.role)) {
    return []
  }
  const admin = createAdminClient()
  if (!admin) {
    return []
  }
  const { data } = await admin
    .from('tutors')
    .select('tutor_id')
    .eq('user_id', user.user_id)
  return (data ?? []).map((t: { tutor_id: string }) => t.tutor_id)
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

    // Only university accounts can be auto-linked; otherwise anyone could sign up as
    // anjeh001@gmail.com and be linked to the Gannon tutor anjeh001
    if (!user.email.toLowerCase().endsWith('@gannon.edu')) {
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
      // Update the tutor record to link user_id for future lookups.
      // Admin client: RLS only lets full-access roles write to tutors.
      await (createAdminClient() ?? supabase)
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


/**
 * HTTP status for an error thrown by requireAuth / requireRole / requirePermission:
 * 401 when not signed in, 403 when signed in without the needed role
 */
export function authErrorStatus(error: unknown): 401 | 403 {
  return error instanceof Error && error.message === 'Authentication required' ? 401 : 403
}
