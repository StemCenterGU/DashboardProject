/**
 * GET /api/auth/get-role
 * Fetches the current user's role from the database
 *
 * Returns:
 * - { role: string } if user is authenticated and has a role
 * - { role: null } if user exists but has no role
 * - 401 if user is not authenticated
 * - 500 if server error
 */

import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    // Fetch user's role from database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (dbError) {
      // User might not have a row in users table yet
      if (dbError.code === 'PGRST116') {
        console.log('User not found in database:', user.id)
        return NextResponse.json({ role: null })
      }

      console.error('Database error fetching role:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch user role', details: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      role: userData?.role || null,
    })
  } catch (error: any) {
    console.error('Unexpected error in get-role:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
