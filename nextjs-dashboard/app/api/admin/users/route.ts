import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/auth'
import { logger } from '@/lib/logger'

/**
 * Get all users with pagination
 * GET /api/admin/users?page=1&limit=50
 * Requires: admin or manager role
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin/manager authentication
    const currentUser = await requireAdmin()
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized - admin or manager role required' },
      { status: 401 }
    )
  }

  try {
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Get current user to check their role
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role from users table
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const currentUserRole = userData?.role || user.user_metadata?.role || 'tutor'

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const offset = (page - 1) * limit

    // Get total count
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw countError
    }

    // Get users from Supabase with pagination
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, email, full_name, role, active, created_at, last_login')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Remove sensitive data and format
    const safeUsers = (users || []).map((user: any) => ({
      ...user,
      created_at: user.created_at ? new Date(user.created_at).toISOString() : '',
      last_login: user.last_login ? new Date(user.last_login).toISOString() : '',
      read_only: currentUserRole === 'lead_tutor' // Lead tutors see read-only
    }))

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      users: safeUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      }
    })
  } catch (error: any) {
    logger.error('Error getting users:', error)
    return NextResponse.json(
      { error: 'Failed to load users' },
      { status: 500 }
    )
  }
}

