import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/admin/programs?type=primary|additional
// Fetch programs for Primary or Additional Major dropdowns
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'primary' // 'primary' or 'additional'

    // Choose the appropriate view based on type
    // Primary uses programs_display (from programs table)
    // Additional uses additional_programs_display (from additional_programs table)
    const viewName = type === 'additional' ? 'additional_programs_display' : 'programs_display'

    // Fetch programs from the appropriate view
    const { data: programs, error } = await supabase
      .from(viewName)
      .select('*')
      .order('display_order')
      .order('display_name')

    if (error) {
      console.error(`Error fetching ${type} programs:`, error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    // Convert to comma-separated list for form compatibility
    const programsList = programs?.map((p: { display_name: string }) => p.display_name).join(',') || ''

    return NextResponse.json({
      programs: programs || [],
      programsList, // Comma-separated string
      count: programs?.length || 0,
      type // Return which type was fetched
    })
  } catch (error) {
    console.error('Error in programs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
