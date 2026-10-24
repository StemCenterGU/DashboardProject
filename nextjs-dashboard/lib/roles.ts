/**
 * Role-Based Access Control (RBAC) Constants
 * Single source of truth for all role definitions and permission groups.
 * Import from here instead of hard-coding role strings anywhere else.
 *
 * ROLES (highest to lowest access):
 * ADMIN = PROJECT_MANAGER → STUDENT_MANAGER → TUTOR = STEM_PASS_TUTOR → STUDENT
 */

// ============================================================================
// Individual Role Constants
// ============================================================================

export const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  STUDENT_MANAGER: 'student_manager',
  TUTOR: 'tutor',
  STEM_PASS_TUTOR: 'stem_pass_tutor',
  STUDENT: 'student',
} as const

// TypeScript type for all valid roles
export type Role = typeof ROLES[keyof typeof ROLES]

/**
 * Role given to every new account. Admins promote staff from User Management.
 */
export const DEFAULT_ROLE: Role = ROLES.STUDENT

// ============================================================================
// Role Groups
// ============================================================================

/**
 * FULL_ACCESS_ROLES - Full administrative access (admin and project manager are equal)
 * - Every permission in the system
 * - User and role management
 * - System configuration, forms, sync, uploads
 * - View and edit every appointment
 */
export const FULL_ACCESS_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.PROJECT_MANAGER,
]

/**
 * OVERSIGHT_ROLES - Can view everything, edit only their own records
 * - View all tutors' appointments, schedules and reports (read-only)
 * - Analytics
 */
export const OVERSIGHT_ROLES: Role[] = [
  ROLES.STUDENT_MANAGER,
  ...FULL_ACCESS_ROLES,
]

/**
 * STAFF_ROLES - Tutoring staff (everyone except students)
 * - Manage their own appointments and schedule
 * - Create client reports
 */
export const STAFF_ROLES: Role[] = [
  ROLES.TUTOR,
  ROLES.STEM_PASS_TUTOR,
  ...OVERSIGHT_ROLES,
]

/**
 * TUTOR_ROLES - Roles whose "own appointments" are the ones where they are the tutor
 */
export const TUTOR_ROLES: Role[] = [
  ROLES.TUTOR,
  ROLES.STEM_PASS_TUTOR,
  ROLES.STUDENT_MANAGER,
]

// ============================================================================
// All Valid Roles (for validation)
// ============================================================================

export const ALL_ROLES: Role[] = [
  ...STAFF_ROLES,
  ROLES.STUDENT,
]

// ============================================================================
// Permission Check Helper Functions
// ============================================================================

/**
 * Check if a role has full access (admin or project manager)
 */
export function isFullAccess(role: string | undefined | null): boolean {
  if (!role) return false
  return FULL_ACCESS_ROLES.includes(role as Role)
}

/**
 * Check if a role can view all appointments/schedules (student manager and above)
 */
export function canViewAll(role: string | undefined | null): boolean {
  if (!role) return false
  return OVERSIGHT_ROLES.includes(role as Role)
}

/**
 * Check if a role is tutoring staff (anyone except a student)
 */
export function isStaff(role: string | undefined | null): boolean {
  if (!role) return false
  return STAFF_ROLES.includes(role as Role)
}

/**
 * Check if a role is a student
 */
export function isStudent(role: string | undefined | null): boolean {
  return role === ROLES.STUDENT
}

/**
 * Check if a role has specific permission level
 */
export function hasPermissionLevel(
  role: string | undefined | null,
  requiredRoles: Role[]
): boolean {
  if (!role) return false
  return requiredRoles.includes(role as Role)
}

/**
 * Validate if a role string is a valid role
 */
export function isValidRole(role: string): role is Role {
  return ALL_ROLES.includes(role as Role)
}

// ============================================================================
// Role Display Names (for UI)
// ============================================================================

export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [ROLES.ADMIN]: 'Administrator (Full Access)',
  [ROLES.PROJECT_MANAGER]: 'Project Manager (Full Access)',
  [ROLES.STUDENT_MANAGER]: 'Student Manager',
  [ROLES.TUTOR]: 'Tutor',
  [ROLES.STEM_PASS_TUTOR]: 'STEM PASS Tutor',
  [ROLES.STUDENT]: 'Student',
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: string | undefined | null): string {
  if (!role) return 'Unknown'
  return ROLE_DISPLAY_NAMES[role as Role] || role
}

// ============================================================================
// Feature Permissions (specific features by role)
// Note: FULL_ACCESS_ROLES have ALL of these permissions
// ============================================================================

export const PERMISSIONS = {
  // Appointment Management ("own" = you are the tutor, or the student who booked)
  CREATE_OWN_APPOINTMENTS: ALL_ROLES,
  VIEW_OWN_APPOINTMENTS: ALL_ROLES,
  EDIT_OWN_APPOINTMENTS: ALL_ROLES,
  DELETE_OWN_APPOINTMENTS: STAFF_ROLES,
  MARK_NO_SHOW: STAFF_ROLES,

  VIEW_ALL_APPOINTMENTS: OVERSIGHT_ROLES,
  EDIT_ALL_APPOINTMENTS: FULL_ACCESS_ROLES,
  DELETE_ALL_APPOINTMENTS: FULL_ACCESS_ROLES,

  // Schedule Management
  VIEW_OWN_SCHEDULE: STAFF_ROLES,
  EDIT_OWN_SCHEDULE: STAFF_ROLES,
  VIEW_ALL_SCHEDULES: OVERSIGHT_ROLES,
  EDIT_ALL_SCHEDULES: FULL_ACCESS_ROLES,
  UPLOAD_CSV_SCHEDULES: FULL_ACCESS_ROLES,
  BULK_SCHEDULE_OPERATIONS: FULL_ACCESS_ROLES,

  // Schedule Change Requests (Approval Workflow)
  CREATE_SCHEDULE_DRAFT: STAFF_ROLES,
  SUBMIT_SCHEDULE_CHANGES: STAFF_ROLES,
  VIEW_SCHEDULE_REQUESTS: FULL_ACCESS_ROLES,
  APPROVE_SCHEDULE_REQUESTS: FULL_ACCESS_ROLES,
  REJECT_SCHEDULE_REQUESTS: FULL_ACCESS_ROLES,

  // User Management
  VIEW_USERS: FULL_ACCESS_ROLES,
  EDIT_USERS: FULL_ACCESS_ROLES,
  DELETE_USERS: FULL_ACCESS_ROLES,
  ASSIGN_ROLES: FULL_ACCESS_ROLES,

  // Reporting & Analytics
  VIEW_OWN_REPORTS: STAFF_ROLES,
  VIEW_ALL_REPORTS: OVERSIGHT_ROLES,
  EXPORT_REPORTS: OVERSIGHT_ROLES,
  VIEW_ANALYTICS: OVERSIGHT_ROLES,

  // Client Report Forms
  CREATE_CLIENT_REPORT: STAFF_ROLES,
  VIEW_CLIENT_REPORT: STAFF_ROLES,
  EDIT_CLIENT_REPORT: STAFF_ROLES,
  DELETE_CLIENT_REPORT: FULL_ACCESS_ROLES,
  MANAGE_REPORT_OPTIONS: FULL_ACCESS_ROLES,

  // System
  VIEW_SYSTEM_SETTINGS: FULL_ACCESS_ROLES,
  EDIT_SYSTEM_SETTINGS: FULL_ACCESS_ROLES,
  DATABASE_ACCESS: FULL_ACCESS_ROLES,
  DEBUG_TOOLS: FULL_ACCESS_ROLES,
} as const

export type Permission = keyof typeof PERMISSIONS

/**
 * Check if a role has a specific permission
 * FULL_ACCESS_ROLES automatically have ALL permissions
 */
export function hasPermission(
  role: string | undefined | null,
  permission: Permission
): boolean {
  if (!role) return false

  if (isFullAccess(role)) {
    return true
  }

  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles.includes(role as Role)
}

// ============================================================================
// Page Access (enforced in proxy.ts)
// ============================================================================

/**
 * Which roles may open each page. Longest matching prefix wins.
 * Pages not listed are open to every signed-in role.
 */
export const PAGE_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: '/admin', roles: FULL_ACCESS_ROLES },
  { prefix: '/users', roles: FULL_ACCESS_ROLES },
  { prefix: '/replica', roles: FULL_ACCESS_ROLES },
  { prefix: '/dashboard', roles: OVERSIGHT_ROLES },
  { prefix: '/charts', roles: OVERSIGHT_ROLES },
  { prefix: '/tutor-schedules', roles: STAFF_ROLES },
  { prefix: '/reports', roles: STAFF_ROLES },
  { prefix: '/clients', roles: STAFF_ROLES },
  { prefix: '/scheduling/repeat', roles: STAFF_ROLES },
  { prefix: '/scheduling/reports', roles: STAFF_ROLES },
  { prefix: '/scheduling', roles: ALL_ROLES },
  { prefix: '/calendar', roles: ALL_ROLES },
  { prefix: '/profile', roles: ALL_ROLES },
  { prefix: '/settings', roles: ALL_ROLES },
]

/**
 * Check whether a role may open a page path
 */
export function canAccessPage(role: string | undefined | null, pathname: string): boolean {
  const rule = PAGE_ACCESS
    .filter((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]
  if (!rule) return true
  return hasPermissionLevel(role, rule.roles)
}

/**
 * Landing page for a role after login
 */
export function getHomePath(role: string | undefined | null): string {
  return canViewAll(role) ? '/dashboard' : '/scheduling'
}
