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

    // Get user from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data from users table
    const { data: userData } = await supabase
      .from('users')
      .select('user_id, email, full_name, role, active')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      full_name: userData?.full_name || user.user_metadata?.full_name || '',
      role: userData?.role || user.user_metadata?.role || 'tutor',
      active: userData?.active ?? true,
    })
  } catch (error) {
    console.error('Error getting profile:', error)
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Get user from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    let updated = false

    // Update full_name
    if (data.full_name && data.full_name.trim()) {
      const newName = data.full_name.trim()
      
      try {
        // Update in users table
        await supabase
          .from('users')
          .update({ full_name: newName })
          .eq('user_id', user.id)

        // Update in Supabase Auth metadata
        await supabase.auth.updateUser({
          data: { full_name: newName }
        })

        updated = true
      } catch (error) {
        console.error('Failed to update name:', error)
        return NextResponse.json(
          { error: 'Failed to update name' },
          { status: 500 }
        )
      }
    }

    // Update password
    if (data.password && data.password.length >= 8) {
      try {
        await supabase.auth.updateUser({
          password: data.password
        })
        updated = true
      } catch (error) {
        console.error('Failed to update password:', error)
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        )
      }
    } else if (data.password && data.password.length > 0) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (updated) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'No changes' })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

