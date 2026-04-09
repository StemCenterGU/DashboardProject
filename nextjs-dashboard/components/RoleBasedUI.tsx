/**
 * Example: Role-Based UI Components
 * Shows how to conditionally render UI elements based on user roles
 *
 * Usage in any component:
 * import { RoleCheck, AdminOnly, ManagerOnly } from '@/components/RoleBasedUI'
 *
 * <AdminOnly>
 *   <button>Delete All Users</button>
 * </AdminOnly>
 */

'use client'

import { ReactNode } from 'react'
import { useUser } from '@/contexts/AuthContext'
import {
  isTutorLevel,
  isLeadTutorLevel,
  isManagerLevel,
  isAdminLevel,
  isDeveloper,
  hasPermission,
  type Role,
} from '@/lib/roles'

// ============================================================================
// Generic Role Check Component
// ============================================================================

interface RoleCheckProps {
  children: ReactNode
  allowedRoles: Role[]
  fallback?: ReactNode
}

/**
 * Renders children only if user has one of the allowed roles
 *
 * @example
 * <RoleCheck allowedRoles={['admin', 'manager']}>
 *   <AdminPanel />
 * </RoleCheck>
 */
export function RoleCheck({ children, allowedRoles, fallback = null }: RoleCheckProps) {
  const { role, isLoading } = useUser()

  if (isLoading) {
    return <>{fallback}</>
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ============================================================================
// Permission-Based Check Component
// ============================================================================

interface PermissionCheckProps {
  children: ReactNode
  permission: Parameters<typeof hasPermission>[1]
  fallback?: ReactNode
}

/**
 * Renders children only if user has the specified permission
 * ADMIN automatically has ALL permissions
 *
 * @example
 * <PermissionCheck permission="EDIT_ALL_SCHEDULES">
 *   <button>Edit Schedule</button>
 * </PermissionCheck>
 */
export function PermissionCheck({ children, permission, fallback = null }: PermissionCheckProps) {
  const { role, isLoading } = useUser()

  if (isLoading) {
    return <>{fallback}</>
  }

  if (!hasPermission(role, permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ============================================================================
// Convenience Components for Common Role Checks
// ============================================================================

interface ConditionalRenderProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renders only for Tutor level and above
 * Allowed: tutor, lead_tutor, manager, admin, developer
 */
export function TutorOnly({ children, fallback = null }: ConditionalRenderProps) {
  const { role, isLoading } = useUser()

  if (isLoading) return <>{fallback}</>
  if (!isTutorLevel(role)) return <>{fallback}</>

  return <>{children}</>
}

/**
 * Renders only for Lead Tutor level and above
 * Allowed: lead_tutor, manager, admin, developer
 */
export function LeadTutorOnly({ children, fallback = null }: ConditionalRenderProps) {
  const { role, isLoading } = useUser()

  if (isLoading) return <>{fallback}</>
  if (!isLeadTutorLevel(role)) return <>{fallback}</>

  return <>{children}</>
}

/**
 * Renders only for Manager level and above
 * Allowed: manager, admin, developer
 */
export function ManagerOnly({ children, fallback = null }: ConditionalRenderProps) {
  const { role, isLoading } = useUser()

  if (isLoading) return <>{fallback}</>
  if (!isManagerLevel(role)) return <>{fallback}</>

  return <>{children}</>
}

/**
 * Renders only for Admin level
 * Allowed: admin, developer
 * Note: ADMIN has ALL permissions in the system
 */
export function AdminOnly({ children, fallback = null }: ConditionalRenderProps) {
  const { role, isLoading } = useUser()

  if (isLoading) return <>{fallback}</>
  if (!isAdminLevel(role)) return <>{fallback}</>

  return <>{children}</>
}

/**
 * Renders only for Developer role
 */
export function DeveloperOnly({ children, fallback = null }: ConditionalRenderProps) {
  const { role, isLoading } = useUser()

  if (isLoading) return <>{fallback}</>
  if (!isDeveloper(role)) return <>{fallback}</>

  return <>{children}</>
}

// ============================================================================
// Example Usage Component
// ============================================================================

/**
 * Example component showing how to use role-based rendering
 * You can copy this pattern to any component in your app
 */
export function ExampleRoleBasedComponent() {
  const { user, role, isLoading } = useUser()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please log in</div>
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Role-Based UI Example</h2>
      <p>Current role: <strong>{role}</strong></p>

      {/* Everyone sees this */}
      <div className="p-4 bg-gray-100 rounded">
        <p>This content is visible to all authenticated users</p>
      </div>

      {/* Tutor and above */}
      <TutorOnly>
        <div className="p-4 bg-blue-100 rounded">
          <p>✅ Tutor Level: You can create your own appointments</p>
        </div>
      </TutorOnly>

      {/* Lead Tutor and above */}
      <LeadTutorOnly>
        <div className="p-4 bg-green-100 rounded">
          <p>✅ Lead Tutor Level: You can view all schedules</p>
        </div>
      </LeadTutorOnly>

      {/* Manager and above */}
      <ManagerOnly>
        <div className="p-4 bg-yellow-100 rounded">
          <p>✅ Manager Level: You can upload CSV schedules</p>
        </div>
      </ManagerOnly>

      {/* Admin only */}
      <AdminOnly>
        <div className="p-4 bg-red-100 rounded">
          <p>✅ Admin Level: You have FULL ACCESS to everything</p>
        </div>
      </AdminOnly>

      {/* Permission-based check */}
      <PermissionCheck permission="EDIT_ALL_SCHEDULES">
        <div className="p-4 bg-purple-100 rounded">
          <p>✅ You have permission to edit all schedules</p>
        </div>
      </PermissionCheck>

      {/* Custom role check */}
      <RoleCheck allowedRoles={['admin', 'developer']}>
        <div className="p-4 bg-pink-100 rounded">
          <p>✅ Admin or Developer: System settings available</p>
        </div>
      </RoleCheck>
    </div>
  )
}
