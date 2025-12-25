import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName } = body

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.' },
        { status: 503 }
      )
    }

    // Use Supabase Auth for registration
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to connect to database' },
        { status: 503 }
      )
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: 'tutor', // Default role
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard`,
      },
    })

    if (authError) {
      console.error('Supabase Auth registration error:', authError)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to create account'
      if (authError.message.includes('already registered')) {
        errorMessage = 'User with this email already exists'
      } else if (authError.message.includes('Password')) {
        errorMessage = authError.message
      } else {
        errorMessage = authError.message || 'An error occurred during registration'
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create corresponding record in users table for role management
    // Use service role key to bypass RLS if needed
    const serviceClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : null

    if (serviceClient) {
      try {
        // Check if user record already exists
        const { data: existingUser } = await serviceClient
          .from('users')
          .select('user_id')
          .eq('email', email.toLowerCase().trim())
          .single()

        if (!existingUser) {
          // Create user record in users table with Supabase Auth user ID
          const { error: insertError } = await serviceClient
            .from('users')
            .insert({
              user_id: authData.user.id, // Use Supabase Auth user ID
              email: email.toLowerCase().trim(),
              full_name: fullName,
              role: 'tutor', // Default role
              active: true,
            })

          if (insertError) {
            console.warn('Failed to create users table record:', insertError)
            // Don't fail registration - auth user is already created
          }
        } else {
          // User exists in users table but not in auth - update user_id to match
          await serviceClient
            .from('users')
            .update({ user_id: authData.user.id })
            .eq('email', email.toLowerCase().trim())
        }
      } catch (userTableError) {
        // Log but don't fail registration if users table insert fails
        // The Supabase Auth user is already created
        console.warn('Failed to create/update users table record:', userTableError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        user_metadata: authData.user.user_metadata,
      },
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}

