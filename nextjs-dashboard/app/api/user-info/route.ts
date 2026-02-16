import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { ensureUserRow } from '@/lib/ensure-user'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let role = user.user_metadata?.role || 'tutor'

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userData?.role) {
      role = userData.role
    } else {
      const ensured = await ensureUserRow(supabase, user)
      if (ensured?.role) role = ensured.role
    }

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      role,
      tutor_id: user.user_metadata?.tutor_id,
    })
  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    )
  }
}

