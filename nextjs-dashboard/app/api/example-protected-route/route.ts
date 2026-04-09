/**
 * EXAMPLE: Protected API Route with Role-Based Access Control
 *
 * This demonstrates how to protect API routes with authentication and role checks
 * Copy this pattern to any API route that needs permission control
 *
 * Endpoint: POST /api/example-protected-route
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  requireAdminLevel,
  requireManagerLevel,
  requireLeadTutorLevel,
  requireTutorLevel,
  requirePermission,
} from '@/lib/auth'

// ============================================================================
// Example 1: Basic Authentication (any logged-in user)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Require user to be authenticated
    const user = await requireAuth()

    // User is authenticated - proceed with operation
    return NextResponse.json({
      message: 'Success! You are authenticated',
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error: any) {
    // User is not authenticated
    return NextResponse.json(
      { error: 'Authentication required', details: error.message },
      { status: 401 }
    )
  }
}

// ============================================================================
// Example 2: Require Specific Role Level
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Require manager-level permissions or higher
    // Allowed: manager, admin, developer
    const user = await requireManagerLevel()

    const body = await request.json()

    // User has manager permissions - proceed with operation
    return NextResponse.json({
      message: 'Manager operation successful',
      data: body,
      user: user.email,
    })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // User is authenticated but doesn't have permission
    return NextResponse.json(
      { error: 'Forbidden - Manager level required', details: error.message },
      { status: 403 }
    )
  }
}

// ============================================================================
// Example 3: Require Specific Permission
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    // Require specific permission
    // ADMIN automatically has ALL permissions
    const user = await requirePermission('EDIT_ALL_SCHEDULES')

    const body = await request.json()

    // User has the specific permission - proceed
    return NextResponse.json({
      message: 'Schedule edit successful',
      data: body,
      user: user.email,
    })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Forbidden - Permission denied', details: error.message },
      { status: 403 }
    )
  }
}

// ============================================================================
// Example 4: Admin-Only Operation
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    // Only admin and developer can access
    // ADMIN has FULL ACCESS to everything
    const user = await requireAdminLevel()

    // Perform admin operation
    return NextResponse.json({
      message: 'Admin operation successful',
      note: 'ADMIN has full access to all system features',
      user: user.email,
    })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Forbidden - Admin access required', details: error.message },
      { status: 403 }
    )
  }
}

// ============================================================================
// Standard API Route Pattern (recommended)
// ============================================================================

/**
 * Standard pattern for protecting API routes:
 *
 * 1. Try to get authenticated user with appropriate permission level
 * 2. If authentication fails, return 401 Unauthorized
 * 3. If permission check fails, return 403 Forbidden
 * 4. If successful, proceed with operation
 * 5. Handle any operation errors with 500 Internal Server Error
 *
 * Example:
 *
 * export async function POST(request: NextRequest) {
 *   try {
 *     // Step 1: Check authentication and permissions
 *     const user = await requireManagerLevel()
 *
 *     // Step 2: Parse request data
 *     const body = await request.json()
 *
 *     // Step 3: Perform your operation
 *     const result = await performOperation(body)
 *
 *     // Step 4: Return success response
 *     return NextResponse.json({ success: true, data: result })
 *
 *   } catch (error: any) {
 *     // Step 5: Handle errors appropriately
 *     if (error.message === 'Authentication required') {
 *       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *     }
 *     if (error.message.includes('permissions')) {
 *       return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 *     }
 *     return NextResponse.json({ error: 'Server error' }, { status: 500 })
 *   }
 * }
 */
