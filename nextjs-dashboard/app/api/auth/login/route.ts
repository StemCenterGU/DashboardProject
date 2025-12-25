import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // If Supabase is not configured, return error
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.' },
        { status: 503 }
      )
    }

    // Use Supabase Auth for login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: password,
    })

    if (authError) {
      console.error('Login error:', authError)
      
      // Provide user-friendly error messages
      let errorMessage = 'Invalid email or password'
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password'
      } else if (authError.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before logging in'
      } else {
        errorMessage = authError.message || 'An error occurred during login'
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }

    if (!authData.session || !authData.user) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Update last_login in users table if record exists
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', authData.user.id)
    } catch (updateError) {
      // Log but don't fail login if timestamp update fails
      console.warn('Failed to update last_login:', updateError)
    }

    // Supabase Auth handles session management automatically via cookies
    // The session is already set by Supabase
    return NextResponse.json({
      success: true,
      user: authData.user,
      session: authData.session,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
