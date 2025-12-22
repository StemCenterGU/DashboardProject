import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName } = body

    console.log('📝 Registration attempt:', { email, hasPassword: !!password, hasFullName: !!fullName })

    if (!email || !password || !fullName) {
      console.error('❌ Missing required fields:', { email: !!email, password: !!password, fullName: !!fullName })
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

    // Use service role key for admin operations (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
      console.error('Missing Supabase credentials:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        hasAnonKey: !!supabaseAnonKey,
      })
      return NextResponse.json(
        { error: 'Database not configured. Please check your environment variables.' },
        { status: 503 }
      )
    }

    // Prefer service role key for inserts (bypasses RLS)
    const supabase = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        })
      : await createServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to connect to database' },
        { status: 503 }
      )
    }

    // Check if user already exists
    console.log('🔍 Checking if user exists...')
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email.toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (user doesn't exist) - this is OK
      console.error('❌ Error checking existing user:', checkError)
    }

    if (existingUser) {
      console.log('⚠️ User already exists:', existingUser.user_id)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    console.log('✅ User does not exist, proceeding with registration...')

    // Generate salt for password hashing
    console.log('🔐 Hashing password...')
    const salt = crypto.randomBytes(32).toString('hex')
    
    // Hash password using pbkdf2 (same method as login verification)
    const passwordHash = crypto.pbkdf2Sync(
      password,
      salt,
      100000, // iterations
      64,     // key length
      'sha256'
    ).toString('hex')

    console.log('💾 Inserting user into database...')
    // Create user in custom users table
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        full_name: fullName,
        password_hash: passwordHash,
        salt: salt,
        role: 'tutor', // Default role for new registrations
        active: true,
      })
      .select('user_id, email, full_name, role, active, created_at')
      .single()

    console.log('📊 Insert result:', { 
      hasUser: !!newUser, 
      hasError: !!insertError,
      errorCode: insertError?.code,
      errorMessage: insertError?.message 
    })

    if (insertError) {
      console.error('Registration insert error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      })
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to create user account'
      if (insertError.code === '23505') {
        errorMessage = 'User with this email already exists'
      } else if (insertError.code === '42501') {
        errorMessage = 'Permission denied. Please check database permissions.'
      } else if (insertError.message) {
        errorMessage = `Database error: ${insertError.message}`
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? insertError.message : undefined,
        },
        { status: 500 }
      )
    }

    if (!newUser) {
      console.error('❌ Registration failed: No user returned from insert')
      return NextResponse.json(
        { error: 'Failed to create user account. No data returned.' },
        { status: 500 }
      )
    }

    console.log('✅ User created successfully:', {
      user_id: newUser.user_id,
      email: newUser.email,
      role: newUser.role
    })

    // Also try Supabase Auth (optional - for future use)
    try {
      await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      console.log('✅ Supabase Auth signup also successful')
    } catch (authErr) {
      // Supabase Auth signup failed, but custom user was created
      // This is okay - we're using custom users table
      console.log('ℹ️ Supabase Auth signup skipped (using custom users table)')
    }

    console.log('🎉 Registration complete, returning success response')
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
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

