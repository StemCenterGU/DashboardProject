import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

/**
 * Set user role (for initial admin setup)
 * 
 * POST /api/admin/set-role
 * Body: { email: string, role: 'admin' | 'manager' | 'lead_tutor' | 'tutor' }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    const validRoles = ['admin', 'manager', 'lead_tutor', 'tutor']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('user_id, email, full_name, role')
      .eq('email', email.toLowerCase())
      .single()

    if (findError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('user_id', user.user_id)
      .select('user_id, email, full_name, role, active')
      .single()

    if (updateError) {
      console.error('Role update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('Set role error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating role' },
      { status: 500 }
    )
  }
}

