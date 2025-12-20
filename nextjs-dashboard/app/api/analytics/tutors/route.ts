import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Get tutors
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('tutor_id, user_id')
      .eq('is_available', true)

    if (tutorsError) {
      throw tutorsError
    }

    // Get user names
    const userIds = tutors?.map(t => t.user_id) || []
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, full_name')
      .in('user_id', userIds)

    if (usersError) {
      throw usersError
    }

    const userMap = new Map(users?.map(u => [u.user_id, u.full_name]) || [])

    // Combine tutor and user data
    const tutorsList = tutors?.map(tutor => ({
      tutor_id: tutor.tutor_id,
      tutor_name: userMap.get(tutor.user_id) || `Tutor ${tutor.tutor_id}`
    })) || []

    return NextResponse.json(tutorsList)
  } catch (error: any) {
    console.error('Error getting tutors:', error)
    return NextResponse.json([], { status: 500 })
  }
}

