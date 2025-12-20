import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Sign out from Supabase if configured
    if (supabase) {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        // Ignore Supabase errors
      }
    }

    // Clear cookies
    const cookieStore = await cookies()
    const response = NextResponse.json({ success: true })

    // Clear session cookies
    response.cookies.delete('sessionToken')
    response.cookies.delete('user')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
