import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/admin/instructors - Retrieve all instructors
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

    const { data: instructors, error: instructorsError } = await supabase
      .from('instructors')
      .select('*')
      .order('name', { ascending: true })

    if (instructorsError) {
      console.error('Error fetching instructors:', instructorsError)
      return NextResponse.json({ error: instructorsError.message }, { status: 500 })
    }

    return NextResponse.json({ instructors: instructors || [] })
  } catch (error: any) {
    console.error('GET instructors error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
