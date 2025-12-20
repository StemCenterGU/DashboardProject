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

    const { data: courses, error } = await supabase
      .from('courses')
      .select('course_id, course_code, course_name')
      .eq('active', true)

    if (error) {
      throw error
    }

    const coursesList = courses?.map(course => ({
      course_id: course.course_id,
      course_code: course.course_code || '',
      course_name: course.course_name || `Course ${course.course_id}`
    })) || []

    return NextResponse.json(coursesList)
  } catch (error: any) {
    console.error('Error getting courses:', error)
    return NextResponse.json([], { status: 500 })
  }
}

