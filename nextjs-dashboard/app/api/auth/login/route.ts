import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

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

    // Try Supabase Auth first
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!authError && authData.session) {
        return NextResponse.json({
          success: true,
          user: authData.user,
          session: authData.session,
        })
      }
    } catch (authErr) {
      // Supabase Auth failed, try custom users table
    }

    // Try custom users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (userData.active === false) {
      return NextResponse.json(
        { error: 'User account is inactive' },
        { status: 403 }
      )
    }

    // Verify password - match Flask logic
    const passwordHash = userData.password_hash?.toString().trim()
    const salt = userData.salt?.toString().trim()

    let passwordValid = false

    if (salt && salt.length > 0) {
      // Salt-based password verification (pbkdf2_hmac with SHA256, 100000 iterations)
      try {
        const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
        passwordValid = computedHash === passwordHash
      } catch (err) {
        console.error('Password verification error:', err)
        passwordValid = false
      }
    } else {
      // Legacy password verification - try SHA256 first (most common in your CSV)
      const sha256Hash = crypto.createHash('sha256').update(password).digest('hex')
      passwordValid = sha256Hash === passwordHash
      
      // If SHA256 doesn't match and hash is 32 chars, try MD5
      if (!passwordValid && passwordHash && passwordHash.length === 32) {
        const md5Hash = crypto.createHash('md5').update(password).digest('hex')
        passwordValid = md5Hash === passwordHash
      }
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create a session token (simple approach - you may want to use JWT)
    const sessionToken = crypto.randomBytes(32).toString('hex')

    // Return user data (without password hash)
    const { password_hash, salt: _, ...safeUserData } = userData

    // Set cookies for session
    const cookieStore = await cookies()
    const response = NextResponse.json({
      success: true,
      user: safeUserData,
      sessionToken,
    })

    // Set session cookies
    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    response.cookies.set('user', JSON.stringify(safeUserData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
