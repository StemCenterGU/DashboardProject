import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')?.value
    const supabase = await createServerClient()

    if (!userCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userCookie)
    return NextResponse.json(user)
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
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user')?.value
    const supabase = await createServerClient()

    if (!userCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentUser = JSON.parse(userCookie)
    const data = await request.json()
    let updated = false

    // Update full_name
    if (data.full_name && data.full_name.trim() !== currentUser.full_name) {
      const newName = data.full_name.trim()
      
      if (supabase) {
        try {
          // Update in Supabase users table
          await supabase
            .table('users')
            .update({ full_name: newName })
            .eq('email', currentUser.email)
            .execute()

          // Update in Supabase Auth metadata
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
              await supabase.auth.updateUser({
                data: { full_name: newName }
              })
            }
          } catch (error) {
            console.warn('Failed to update Supabase Auth metadata:', error)
          }
        } catch (error) {
          console.error('Failed to update name in Supabase:', error)
        }
      }

      // Update cookie
      const updatedUser = { ...currentUser, full_name: newName }
      const response = NextResponse.json({ success: true, user: updatedUser })
      response.cookies.set('user', JSON.stringify(updatedUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      })
      updated = true
    }

    // Update password
    if (data.password && data.password.length > 0) {
      if (supabase) {
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
      }
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

