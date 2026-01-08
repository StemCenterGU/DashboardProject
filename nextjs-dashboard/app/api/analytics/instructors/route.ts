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

    // Get unique course instructors from appointments table
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('course_instructor')
      .not('course_instructor', 'is', null)
      .neq('course_instructor', '')

    if (error) {
      throw error
    }

    // Extract unique instructors
    const uniqueInstructors = Array.from(
      new Set(appointments?.map(apt => apt.course_instructor).filter(Boolean))
    ).sort()

    // Map to label format
    const instructorOptions = uniqueInstructors.map(instructor => ({
      value: instructor,
      label: instructor
    }))

    return NextResponse.json(instructorOptions)
  } catch (error: any) {
    console.error('Error getting instructors:', error)
    return NextResponse.json([], { status: 500 })
  }
}

