import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Get current user from Supabase Auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user role from users table
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    const currentUserRole = userData?.role || session.user.user_metadata?.role || 'tutor'

    // Check if user has permission (admin/manager)
    if (!['admin', 'manager'].includes(currentUserRole)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get users from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, email, full_name, role, active, created_at, last_login')
      .order('created_at', { ascending: false })

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

    return NextResponse.json(safeUsers)
  } catch (error: any) {
    console.error('Error getting users:', error)
    return NextResponse.json(
      { error: 'Failed to load users' },
      { status: 500 }
    )
  }
}

