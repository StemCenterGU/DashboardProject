/**
 * Role-Based Access Control (RBAC) Constants
 * Single source of truth for all role definitions and permission hierarchies
 *
 * ROLE HIERARCHY (highest to lowest):
 * ADMIN → MANAGER → LEAD_TUTOR → TUTOR
 * DEVELOPER (special role with full access)
 */

// ============================================================================
// Individual Role Constants
// ============================================================================

export const ROLES = {
  TUTOR: 'tutor',
  LEAD_TUTOR: 'lead_tutor',
  MANAGER: 'manager',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
} as const

// TypeScript type for all valid roles
export type Role = typeof ROLES[keyof typeof ROLES]

// ============================================================================
// Role Hierarchies & Permission Groups
// ============================================================================

/**
 * TUTOR_LEVEL_ROLES - Can perform basic tutoring operations
 * - Create and manage their own appointments
 * - View their own schedules
 * - Upload appointment attachments
 * - View student information
 */
export const TUTOR_LEVEL_ROLES: Role[] = [
  ROLES.TUTOR,
  ROLES.LEAD_TUTOR,
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.DEVELOPER,
]

/**
 * LEAD_TUTOR_LEVEL_ROLES - Supervisor level access
 * - All TUTOR permissions
 * - View all tutors' schedules
 * - Manage tutor availability
 * - Generate reports
 * - Approve/modify other tutors' appointments
 */
export const LEAD_TUTOR_LEVEL_ROLES: Role[] = [
  ROLES.LEAD_TUTOR,
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.DEVELOPER,
]

/**
 * MANAGER_LEVEL_ROLES - Management access
 * - All LEAD_TUTOR permissions
 * - Manage all schedules
 * - Upload CSV schedules
 * - Bulk operations
 * - Advanced reporting
 * - User management
 */
export const MANAGER_LEVEL_ROLES: Role[] = [
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.DEVELOPER,
]

/**
 * ADMIN_LEVEL_ROLES - Full administrative access
 * - ALL permissions in the system
 * - All MANAGER permissions
 * - System configuration
 * - Role assignment
 * - Database operations
 * - Security settings
 * - User management
 * - Complete control over all features
 */
export const ADMIN_LEVEL_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.DEVELOPER,
]

/**
 * DEVELOPER_ROLES - Full system access (same as ADMIN + dev tools)
 * - All ADMIN permissions
 * - Development tools
 * - Database migrations
 * - Debug access
 */
export const DEVELOPER_ROLES: Role[] = [
  ROLES.DEVELOPER,
]

// ============================================================================
// All Valid Roles (for validation)
// ============================================================================

export const ALL_ROLES: Role[] = [
  ROLES.TUTOR,
  ROLES.LEAD_TUTOR,
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.DEVELOPER,
]

// ============================================================================
// Permission Check Helper Functions
// ============================================================================

/**
 * Check if a role has at least tutor-level permissions
 */
export function isTutorLevel(role: string | undefined | null): boolean {
  if (!role) return false
  return TUTOR_LEVEL_ROLES.includes(role as Role)
}

/**
 * Check if a role has at least lead tutor-level permissions
 */
export function isLeadTutorLevel(role: string | undefined | null): boolean {
  if (!role) return false
  return LEAD_TUTOR_LEVEL_ROLES.includes(role as Role)
}

/**
 * Check if a role has at least manager-level permissions
 */
export function isManagerLevel(role: string | undefined | null): boolean {
  if (!role) return false
  return MANAGER_LEVEL_ROLES.includes(role as Role)
}

/**
 * Check if a role has admin-level permissions
 * ADMIN has ALL permissions in the system
 */
export function isAdminLevel(role: string | undefined | null): boolean {
  if (!role) return false
  return ADMIN_LEVEL_ROLES.includes(role as Role)
}

/**
 * Check if a role is developer
 */
export function isDeveloper(role: string | undefined | null): boolean {
  if (!role) return false
  return DEVELOPER_ROLES.includes(role as Role)
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
  [ROLES.TUTOR]: 'Tutor',
  [ROLES.LEAD_TUTOR]: 'Lead Tutor',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.ADMIN]: 'Administrator (Full Access)',
  [ROLES.DEVELOPER]: 'Developer',
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
// Note: ADMIN has access to ALL of these permissions
// ============================================================================

export const PERMISSIONS = {
  // Appointment Management
  CREATE_OWN_APPOINTMENTS: TUTOR_LEVEL_ROLES,
  VIEW_OWN_APPOINTMENTS: TUTOR_LEVEL_ROLES,
  EDIT_OWN_APPOINTMENTS: TUTOR_LEVEL_ROLES,
  DELETE_OWN_APPOINTMENTS: TUTOR_LEVEL_ROLES,

  VIEW_ALL_APPOINTMENTS: LEAD_TUTOR_LEVEL_ROLES,
  EDIT_ALL_APPOINTMENTS: LEAD_TUTOR_LEVEL_ROLES,
  DELETE_ALL_APPOINTMENTS: MANAGER_LEVEL_ROLES,

  // Schedule Management
  VIEW_OWN_SCHEDULE: TUTOR_LEVEL_ROLES,
  EDIT_OWN_SCHEDULE: TUTOR_LEVEL_ROLES,
  VIEW_ALL_SCHEDULES: LEAD_TUTOR_LEVEL_ROLES,
  EDIT_ALL_SCHEDULES: MANAGER_LEVEL_ROLES,
  UPLOAD_CSV_SCHEDULES: MANAGER_LEVEL_ROLES,
  BULK_SCHEDULE_OPERATIONS: MANAGER_LEVEL_ROLES,

  // Schedule Change Requests (Approval Workflow)
  CREATE_SCHEDULE_DRAFT: TUTOR_LEVEL_ROLES,
  SUBMIT_SCHEDULE_CHANGES: TUTOR_LEVEL_ROLES,
  VIEW_SCHEDULE_REQUESTS: MANAGER_LEVEL_ROLES,
  APPROVE_SCHEDULE_REQUESTS: MANAGER_LEVEL_ROLES,
  REJECT_SCHEDULE_REQUESTS: MANAGER_LEVEL_ROLES,

  // User Management
  VIEW_USERS: LEAD_TUTOR_LEVEL_ROLES,
  EDIT_USERS: MANAGER_LEVEL_ROLES,
  DELETE_USERS: ADMIN_LEVEL_ROLES,
  ASSIGN_ROLES: ADMIN_LEVEL_ROLES,

  // Reporting
  VIEW_OWN_REPORTS: TUTOR_LEVEL_ROLES,
  VIEW_ALL_REPORTS: LEAD_TUTOR_LEVEL_ROLES,
  EXPORT_REPORTS: MANAGER_LEVEL_ROLES,

  // Client Report Forms
  CREATE_CLIENT_REPORT: TUTOR_LEVEL_ROLES,
  VIEW_CLIENT_REPORT: TUTOR_LEVEL_ROLES,
  EDIT_CLIENT_REPORT: TUTOR_LEVEL_ROLES,
  DELETE_CLIENT_REPORT: MANAGER_LEVEL_ROLES,
  MANAGE_REPORT_OPTIONS: MANAGER_LEVEL_ROLES,

  // System (ADMIN has full access to all of these)
  VIEW_SYSTEM_SETTINGS: ADMIN_LEVEL_ROLES,
  EDIT_SYSTEM_SETTINGS: ADMIN_LEVEL_ROLES,
  DATABASE_ACCESS: ADMIN_LEVEL_ROLES,
  DEBUG_TOOLS: DEVELOPER_ROLES,
} as const

/**
 * Check if a role has a specific permission
 * ADMIN automatically has ALL permissions
 */
export function hasPermission(
  role: string | undefined | null,
  permission: keyof typeof PERMISSIONS
): boolean {
  if (!role) return false

  // ADMIN and DEVELOPER have ALL permissions
  if (role === ROLES.ADMIN || role === ROLES.DEVELOPER) {
    return true
  }

  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles.includes(role as Role)
}
