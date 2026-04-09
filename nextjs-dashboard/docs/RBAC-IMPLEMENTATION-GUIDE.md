# Role-Based Access Control (RBAC) Implementation Guide

## STEM Face Dashboard - Complete RBAC System

This guide documents the complete Role-Based Access Control (RBAC) system implemented in the STEM Face Dashboard. Use this as a reference for understanding and extending the permission system.

---

## Table of Contents

1. [Overview](#overview)
2. [Role Hierarchy](#role-hierarchy)
3. [Quick Start](#quick-start)
4. [File Structure](#file-structure)
5. [Frontend Usage](#frontend-usage)
6. [Backend Usage](#backend-usage)
7. [Adding New Roles](#adding-new-roles)
8. [Adding New Permissions](#adding-new-permissions)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The RBAC system provides:
- ✅ Centralized role management
- ✅ Type-safe role definitions
- ✅ Hierarchical permission system
- ✅ React hooks for UI conditional rendering
- ✅ API route protection helpers
- ✅ **ADMIN has FULL ACCESS to everything**

### Key Features

- **Single Source of Truth**: All roles defined in `lib/roles.ts`
- **TypeScript Support**: Full type safety for roles and permissions
- **React Context**: Global auth state via `useUser()` hook
- **API Protection**: Simple helpers like `requireAdminLevel()`
- **Flexible**: Easy to add new roles and permissions

---

## Role Hierarchy

### Role Levels (Highest to Lowest)

```
ADMIN → MANAGER → LEAD_TUTOR → TUTOR
DEVELOPER (special role with full access)
```

### Role Definitions

| Role | Level | Permissions |
|------|-------|-------------|
| **ADMIN** | 5 | **FULL ACCESS - ALL PERMISSIONS** |
| **DEVELOPER** | 5 | Same as ADMIN + dev tools |
| **MANAGER** | 4 | Schedule management, user management, reports |
| **LEAD_TUTOR** | 3 | View all schedules, manage tutors, reports |
| **TUTOR** | 2 | Manage own appointments and schedule |

### Permission Inheritance

Higher roles inherit ALL permissions from lower roles:
- **ADMIN** has ALL permissions (tutor + lead_tutor + manager + admin)
- **MANAGER** has manager + lead_tutor + tutor permissions
- **LEAD_TUTOR** has lead_tutor + tutor permissions
- **TUTOR** has only tutor permissions

---

## Quick Start

### 1. Check User Role in Component

```tsx
'use client'

import { useUser } from '@/contexts/AuthContext'
import { isAdminLevel, isManagerLevel } from '@/lib/roles'

export function MyComponent() {
  const { user, role, isLoading } = useUser()

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>

  return (
    <div>
      <p>Your role: {role}</p>

      {isAdminLevel(role) && (
        <button>Admin Only Button</button>
      )}

      {isManagerLevel(role) && (
        <button>Manager+ Button</button>
      )}
    </div>
  )
}
```

### 2. Conditional Rendering

```tsx
import { AdminOnly, ManagerOnly } from '@/components/RoleBasedUI'

export function Dashboard() {
  return (
    <div>
      {/* Everyone sees this */}
      <h1>Dashboard</h1>

      {/* Only managers and above */}
      <ManagerOnly>
        <button>Upload CSV</button>
      </ManagerOnly>

      {/* Only admins */}
      <AdminOnly>
        <button>System Settings (ADMIN FULL ACCESS)</button>
      </AdminOnly>
    </div>
  )
}
```

### 3. Protect API Route

```ts
import { requireAdminLevel } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    // Only ADMIN can delete
    const user = await requireAdminLevel()

    // Perform admin operation
    return NextResponse.json({ success: true })

  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```

---

## File Structure

```
nextjs-dashboard/
├── lib/
│   ├── roles.ts                    # ⭐ Role definitions and permissions
│   ├── auth.ts                     # Auth helpers (requireAuth, etc.)
│   └── supabase-server.ts          # Supabase client
│
├── contexts/
│   └── AuthContext.tsx             # ⭐ React Context for global auth state
│
├── components/
│   └── RoleBasedUI.tsx             # ⭐ Conditional render components
│
├── app/
│   ├── layout.tsx                  # Wrapped with <AuthProvider>
│   └── api/
│       ├── auth/
│       │   ├── get-role/route.ts   # Get user's role
│       │   └── init-user/route.ts  # Initialize user on first login
│       └── example-protected-route/
│           └── route.ts            # ⭐ Example protected API
│
└── docs/
    └── RBAC-IMPLEMENTATION-GUIDE.md  # This file
```

---

## Frontend Usage

### Using the useUser Hook

```tsx
import { useUser } from '@/contexts/AuthContext'

export function MyComponent() {
  const { user, role, isLoading, error, refreshRole } = useUser()

  // Check loading state
  if (isLoading) {
    return <div>Loading...</div>
  }

  // Check authentication
  if (!user) {
    return <div>Please log in</div>
  }

  // Check role
  if (role === 'admin') {
    return <AdminPanel />
  }

  return <UserPanel />
}
```

### Role Check Functions

```tsx
import {
  isTutorLevel,
  isLeadTutorLevel,
  isManagerLevel,
  isAdminLevel,
  isDeveloper,
} from '@/lib/roles'

// Check role level
if (isAdminLevel(role)) {
  // ADMIN has FULL ACCESS
}

if (isManagerLevel(role)) {
  // manager, admin, developer
}

if (isLeadTutorLevel(role)) {
  // lead_tutor, manager, admin, developer
}

if (isTutorLevel(role)) {
  // tutor, lead_tutor, manager, admin, developer
}
```

### Permission-Based Checks

```tsx
import { hasPermission } from '@/lib/roles'

// Check specific permission
if (hasPermission(role, 'EDIT_ALL_SCHEDULES')) {
  // User can edit all schedules
  // ADMIN automatically has ALL permissions
}

if (hasPermission(role, 'UPLOAD_CSV_SCHEDULES')) {
  // User can upload CSV schedules
}
```

### Conditional Render Components

```tsx
import {
  TutorOnly,
  LeadTutorOnly,
  ManagerOnly,
  AdminOnly,
  PermissionCheck,
  RoleCheck,
} from '@/components/RoleBasedUI'

export function Dashboard() {
  return (
    <div>
      {/* Tutor and above */}
      <TutorOnly>
        <button>My Appointments</button>
      </TutorOnly>

      {/* Lead Tutor and above */}
      <LeadTutorOnly>
        <button>View All Schedules</button>
      </LeadTutorOnly>

      {/* Manager and above */}
      <ManagerOnly>
        <button>Upload CSV</button>
      </ManagerOnly>

      {/* Admin only (FULL ACCESS) */}
      <AdminOnly>
        <button>System Settings</button>
        <button>Manage Users</button>
        <button>Database Access</button>
      </AdminOnly>

      {/* Permission-based */}
      <PermissionCheck permission="EDIT_ALL_SCHEDULES">
        <button>Edit Schedule</button>
      </PermissionCheck>

      {/* Custom role check */}
      <RoleCheck allowedRoles={['admin', 'manager']}>
        <button>Advanced Reports</button>
      </RoleCheck>

      {/* With fallback */}
      <AdminOnly fallback={<p>Admin access required</p>}>
        <button>Delete All</button>
      </AdminOnly>
    </div>
  )
}
```

---

## Backend Usage

### API Route Protection

#### 1. Basic Authentication

```ts
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Require any authenticated user
    const user = await requireAuth()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

#### 2. Role-Level Protection

```ts
import {
  requireTutorLevel,
  requireLeadTutorLevel,
  requireManagerLevel,
  requireAdminLevel,
} from '@/lib/auth'

// Tutor and above
export async function POST(request: NextRequest) {
  try {
    const user = await requireTutorLevel()
    // tutor, lead_tutor, manager, admin, developer can access
  } catch (error: any) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

// Manager and above
export async function PUT(request: NextRequest) {
  try {
    const user = await requireManagerLevel()
    // manager, admin, developer can access
  } catch (error: any) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

// Admin only (FULL ACCESS)
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdminLevel()
    // ONLY admin and developer can access
    // ADMIN has FULL ACCESS to everything
  } catch (error: any) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```

#### 3. Permission-Based Protection

```ts
import { requirePermission } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    // Require specific permission
    // ADMIN automatically has ALL permissions
    const user = await requirePermission('EDIT_ALL_SCHEDULES')

    // User has permission - proceed
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```

#### 4. Standard API Pattern (Recommended)

```ts
import { requireManagerLevel } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Step 1: Check authentication and permissions
    const user = await requireManagerLevel()

    // Step 2: Parse request data
    const body = await request.json()

    // Step 3: Validate input
    if (!body.schedule) {
      return NextResponse.json(
        { error: 'Missing schedule data' },
        { status: 400 }
      )
    }

    // Step 4: Perform operation
    const result = await performOperation(body)

    // Step 5: Return success
    return NextResponse.json({ success: true, data: result })

  } catch (error: any) {
    // Handle authentication errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle permission errors
    if (error.message.includes('permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Handle other errors
    console.error('Operation failed:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

---

## Adding New Roles

### Step 1: Update Database

If using the enum type in Supabase:

```sql
-- Add new role to enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'new_role';
```

### Step 2: Update `lib/roles.ts`

```ts
export const ROLES = {
  // ... existing roles
  NEW_ROLE: 'new_role',
} as const

// Add to appropriate hierarchy
export const SOME_LEVEL_ROLES: Role[] = [
  ROLES.NEW_ROLE,
  ROLES.ADMIN,
  ROLES.DEVELOPER,
]

// Add to all roles list
export const ALL_ROLES: Role[] = [
  // ... existing
  ROLES.NEW_ROLE,
]

// Add display name
export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  // ... existing
  [ROLES.NEW_ROLE]: 'New Role',
}
```

### Step 3: Add Helper Function (optional)

```ts
export function isNewRoleLevel(role: string | undefined | null): boolean {
  if (!role) return false
  return SOME_LEVEL_ROLES.includes(role as Role)
}
```

### Step 4: Add to `lib/auth.ts` (optional)

```ts
export async function requireNewRoleLevel(): Promise<User> {
  return requireRole(SOME_LEVEL_ROLES)
}
```

---

## Adding New Permissions

### Step 1: Define Permission in `lib/roles.ts`

```ts
export const PERMISSIONS = {
  // ... existing permissions

  // New permission
  NEW_FEATURE_ACCESS: MANAGER_LEVEL_ROLES,
  NEW_ADMIN_FEATURE: ADMIN_LEVEL_ROLES,
} as const
```

### Step 2: Use in Frontend

```tsx
import { hasPermission } from '@/lib/roles'

if (hasPermission(role, 'NEW_FEATURE_ACCESS')) {
  // Show feature
}
```

### Step 3: Use in Backend

```ts
import { requirePermission } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('NEW_FEATURE_ACCESS')
    // ADMIN automatically has this permission
  } catch (error: any) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```

---

## Testing

### Test Role Hierarchy

1. Create test users with different roles in Supabase
2. Log in as each role
3. Verify UI elements show/hide correctly
4. Test API endpoints with different roles

### Manual Testing Checklist

- [ ] TUTOR can see own appointments
- [ ] LEAD_TUTOR can see all schedules
- [ ] MANAGER can upload CSV schedules
- [ ] **ADMIN can access ALL features**
- [ ] Unauthorized users see 401
- [ ] Insufficient permissions see 403

### Example Test Scenarios

```tsx
// Test component rendering
describe('Dashboard', () => {
  it('shows admin button only to admins', () => {
    const { getByText } = render(<Dashboard />)

    // Mock admin role
    mockUseUser({ role: 'admin' })
    expect(getByText('Admin Settings')).toBeInTheDocument()

    // Mock tutor role
    mockUseUser({ role: 'tutor' })
    expect(queryByText('Admin Settings')).not.toBeInTheDocument()
  })
})
```

---

## Troubleshooting

### Issue: User role is null

**Cause**: User not initialized in database
**Solution**: Call `/api/auth/init-user` after login

```ts
// After successful login
await fetch('/api/auth/init-user')
```

### Issue: Role not updating after assignment

**Cause**: Cached role in AuthContext
**Solution**: Call `refreshRole()`

```tsx
const { refreshRole } = useUser()

// After role update
await updateUserRole(userId, newRole)
await refreshRole()
```

### Issue: API returns 403 but should work

**Cause**: Missing role in permission array or incorrect role name
**Solution**: Check `lib/roles.ts` for correct role constants

### Issue: ADMIN doesn't have access

**Cause**: Permission check not including ADMIN_LEVEL_ROLES
**Solution**: Ensure ADMIN is in the allowed roles array

```ts
// Correct
export const SOME_PERMISSION = MANAGER_LEVEL_ROLES // Includes ADMIN

// Incorrect
export const SOME_PERMISSION = [ROLES.MANAGER] // Missing ADMIN
```

**Note**: The `hasPermission()` function automatically gives ADMIN all permissions, so this is only an issue if using direct role array checks.

---

## Best Practices

### 1. Always Check Permissions on Backend

Never trust frontend checks alone. Always validate on the server:

```tsx
// Frontend (UX only)
{isAdminLevel(role) && <button onClick={deleteUser}>Delete</button>}
```

```ts
// Backend (Security)
export async function DELETE(request: NextRequest) {
  const user = await requireAdminLevel() // Required!
  // ... delete operation
}
```

### 2. Use Type-Safe Role Constants

```ts
// Good
import { ROLES } from '@/lib/roles'
if (role === ROLES.ADMIN) { }

// Bad
if (role === 'admin') { } // Typo-prone
```

### 3. Cache Role Checks with useMemo

```tsx
const isAdmin = useMemo(() => isAdminLevel(role), [role])
const isManager = useMemo(() => isManagerLevel(role), [role])
```

### 4. Return Proper HTTP Status Codes

- `401 Unauthorized`: No authentication
- `403 Forbidden`: Authenticated but insufficient permissions
- `500 Internal Server Error`: Server error

### 5. ADMIN Has Full Access

Always remember: **ADMIN role has ALL permissions**. The `hasPermission()` function automatically returns `true` for ADMIN.

---

## Summary

### Key Files

- `lib/roles.ts` - Role definitions and permissions
- `contexts/AuthContext.tsx` - Global auth state
- `components/RoleBasedUI.tsx` - UI components
- `lib/auth.ts` - Backend auth helpers

### Common Patterns

```tsx
// Frontend: Check role
const { role } = useUser()
if (isAdminLevel(role)) { /* ADMIN FULL ACCESS */ }

// Frontend: Conditional render
<AdminOnly><AdminPanel /></AdminOnly>

// Backend: Protect route
const user = await requireAdminLevel()
```

### Role Hierarchy Reminder

```
ADMIN (FULL ACCESS) → MANAGER → LEAD_TUTOR → TUTOR
```

**ADMIN has access to EVERYTHING in the system.**

---

## Support

For questions or issues with the RBAC system:
1. Check this documentation
2. Review example files in `app/api/example-protected-route/`
3. Review `components/RoleBasedUI.tsx` for frontend examples
4. Check the Troubleshooting section above

---

Last Updated: [Current Date]
Version: 1.0.0
