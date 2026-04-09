/**
 * PUT /api/admin/users/[id]/role
 * Update a user's role (Admin only)
 *
 * Body: { role: string }
 *
 * Security:
 * - Only admins can change roles
 * - Admin cannot change their own role (safety check)
 * - Role must be valid
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminLevel } from '@/lib/auth'
import { createServerClient, createAdminClient } from '@/lib/supabase-server'
import { ALL_ROLES, isValidRole } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Require admin authentication
    const adminUser = await requireAdminLevel()

    // 2. Get admin client (bypasses RLS for admin operations)
    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Admin client not available' },
        { status: 500 }
      )
    }

    // 3. Parse request
    const { id: targetUserId } = await params
    const { role: newRole } = await request.json()

    // 4. Validate new role
    if (!newRole || !isValidRole(newRole)) {
      return NextResponse.json(
        {
          error: 'Invalid role',
          validRoles: ALL_ROLES,
        },
        { status: 400 }
      )
    }

    // 5. Safety check: Prevent admin from changing their own role
    if (targetUserId === adminUser.user_id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      )
    }

    // 6. Check if target user exists
    const { data: targetUser, error: fetchError } = await adminClient
      .from('users')
      .select('user_id, email, full_name, role')
      .eq('user_id', targetUserId)
      .single()

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 7. Update user's role using admin client
    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('user_id', targetUserId)
      .select('user_id, email, full_name, role, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Failed to update user role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update role', details: updateError.message },
        { status: 500 }
      )
    }

    // 8. Log the role change
    console.log(
      `[ADMIN] User ${adminUser.email} changed role of ${targetUser.email} from ${targetUser.role} to ${newRole}`
    )

    // 9. Return success with updated user
    return NextResponse.json({
      success: true,
      message: `Role updated from ${targetUser.role} to ${newRole}`,
      user: updatedUser,
    })

  } catch (error: any) {
    console.error('Error in PUT /api/admin/users/[id]/role:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error.message.includes('permissions')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
