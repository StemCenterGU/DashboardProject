import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Get user from Supabase Auth session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get role from users table if available, otherwise use metadata
    let role = session.user.user_metadata?.role || 'tutor'
    
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', session.user.id)
        .single()
      
      if (userData?.role) {
        role = userData.role
      }
    } catch (error) {
      // Users table lookup failed, use metadata role
    }

    return NextResponse.json({
      user_id: session.user.id,
      email: session.user.email,
      full_name: session.user.user_metadata?.full_name || '',
      role: role,
      tutor_id: session.user.user_metadata?.tutor_id
    })
  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    )
  }
}

