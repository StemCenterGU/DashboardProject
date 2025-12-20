import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')?.value
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Get current user
    let currentUser: any = null
    if (userCookie) {
      try {
        currentUser = JSON.parse(userCookie)
      } catch (error) {
        // Invalid cookie
      }
    }

    // Check if user has permission (admin/manager)
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
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
      read_only: currentUser.role === 'lead_tutor' // Lead tutors see read-only
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

