import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Get tutors - simplified tutors table has tutor_id and tutor_name
    const { data: tutors, error: tutorsError } = await supabase
      .from('tutors')
      .select('tutor_id, tutor_name')
      .order('tutor_name')

    if (tutorsError) {
      throw tutorsError
    }

    // Map to expected format
    const tutorsList = tutors?.map(tutor => ({
      tutor_id: tutor.tutor_id,
      tutor_name: tutor.tutor_name || `Tutor ${tutor.tutor_id}`
    })) || []

    return NextResponse.json(tutorsList)
  } catch (error: any) {
    console.error('Error getting tutors:', error)
    return NextResponse.json([], { status: 500 })
  }
}

