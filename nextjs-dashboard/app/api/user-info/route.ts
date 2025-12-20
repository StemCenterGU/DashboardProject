import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sessionToken')?.value
    const userCookie = cookieStore.get('user')?.value

    // Try Supabase Auth first
    const supabase = await createServerClient()
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          return NextResponse.json({
            user_id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || '',
            role: session.user.user_metadata?.role || 'tutor',
            tutor_id: session.user.user_metadata?.tutor_id
          })
        }
      } catch (error) {
        // Supabase check failed, continue to cookie check
      }
    }

    // Check custom session
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie)
        return NextResponse.json({
          user_id: user.user_id || user.id,
          email: user.email,
          full_name: user.full_name || user.user_metadata?.full_name || '',
          role: user.role || user.user_metadata?.role || 'tutor',
          tutor_id: user.tutor_id || user.user_metadata?.tutor_id
        })
      } catch (error) {
        // Invalid cookie
      }
    }

    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    )
  }
}

