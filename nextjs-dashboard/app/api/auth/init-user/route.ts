/**
 * GET /api/auth/init-user
 * Initializes a user record in the database on first login
 * Creates a row in the users table if it doesn't exist
 *
 * This should be called after user logs in for the first time
 * or when accessing the app after authentication
 *
 * Returns:
 * - { user: User } if successful
 * - 401 if not authenticated
 * - 500 if server error
 */

import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { ROLES } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get authenticated user from Supabase
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      )
    }

    // Check if user already exists in database
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // User already exists - return their data
    if (existingUser && !fetchError) {
      return NextResponse.json({
        user: existingUser,
        message: 'User already initialized',
      })
    }

    // User doesn't exist - create new record
    // Extract name from email or metadata
    const email = user.email || ''
    const fullName = user.user_metadata?.full_name ||
                     user.user_metadata?.name ||
                     email.split('@')[0]

    // Create user with default 'tutor' role
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        user_id: user.id,
        email: email,
        full_name: fullName,
        role: ROLES.TUTOR, // Default role for new users
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create user:', createError)
      return NextResponse.json(
        { error: 'Failed to initialize user', details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: newUser,
      message: 'User initialized successfully',
      isNewUser: true,
    })
  } catch (error: any) {
    console.error('Unexpected error in init-user:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
