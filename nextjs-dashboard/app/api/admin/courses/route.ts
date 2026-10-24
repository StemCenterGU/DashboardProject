import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/admin/courses - Retrieve all courses
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('code', { ascending: true })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ error: coursesError.message }, { status: 500 })
    }

    return NextResponse.json({ courses: courses || [] })
  } catch (error: any) {
    console.error('GET courses error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
