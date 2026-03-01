import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, RateLimits } from '@/lib/rate-limit'
import { logger, productionLogger } from '@/lib/logger'

/**
 * Set user role (for initial admin setup).
 * If the user exists in Supabase Auth but not in the users table, creates the row then sets the role.
 *
 * POST /api/admin/set-role
 * Body: { email: string, role: 'admin' | 'manager' | 'lead_tutor' | 'tutor' | 'developer' }
 * Rate limited: 5 requests per minute
 */
export async function POST(request: NextRequest) {
  // Apply strict rate limiting
  const rateLimitResult = rateLimit(request, RateLimits.strict)
  if (!rateLimitResult.success) {
    return rateLimitResult.response!
  }

  try {
    const { email, role } = await request.json()
    const emailNorm = email?.toString().toLowerCase().trim()

    if (!emailNorm || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    const validRoles = ['admin', 'manager', 'lead_tutor', 'tutor', 'developer']
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

    // Find user by email in users table
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('user_id, email, full_name, role')
      .eq('email', emailNorm)
      .single()

    if (!findError && user) {
      // Update existing row
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ role })
        .eq('user_id', user.user_id)
        .select('user_id, email, full_name, role, active')
        .single()

      if (updateError) {
        logger.error('Role update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user role' },
          { status: 500 }
        )
      }

      // Audit log role change
      productionLogger.audit('role_change', user.user_id, {
        email: emailNorm,
        oldRole: user.role,
        newRole: role,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: `User role updated to ${role}`,
        user: updatedUser,
      })
    }

    // Not in users table: try to create from Supabase Auth (service role required)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'User not found in users table. Add them via registration first, or set SUPABASE_SERVICE_ROLE_KEY to create from Auth.' },
        { status: 404 }
      )
    }

    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: listData, error: authError } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (authError) {
      return NextResponse.json(
        { error: 'Could not look up Auth users.' },
        { status: 500 }
      )
    }
    const authUser = listData?.users?.find((u) => u.email?.toLowerCase() === emailNorm)
    if (!authUser) {
      return NextResponse.json(
        { error: 'User not found. They must sign up or be invited in Supabase Auth first.' },
        { status: 404 }
      )
    }

    const fullName = authUser.user_metadata?.full_name ?? authUser.email ?? ''

    const { data: inserted, error: insertError } = await serviceClient
      .from('users')
      .insert({
        user_id: authUser.id,
        email: emailNorm,
        full_name: fullName,
        role,
        active: true,
      })
      .select('user_id, email, full_name, role, active')
      .single()

    if (insertError) {
      logger.error('Insert users row error:', insertError)
      return NextResponse.json(
        { error: 'User not in users table and failed to create row. Check DB constraint (e.g. developer role) and try again.' },
        { status: 500 }
      )
    }

    // Audit log user creation with role
    productionLogger.audit('user_created_with_role', authUser.id, {
      email: emailNorm,
      role,
      createdFrom: 'auth',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `User added to users table and role set to ${role}`,
      user: inserted,
    })
  } catch (error: any) {
    console.error('Set role error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating role' },
      { status: 500 }
    )
  }
}

