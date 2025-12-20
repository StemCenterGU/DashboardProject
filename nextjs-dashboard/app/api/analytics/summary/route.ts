import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { SchedulingAnalytics } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured. Please set up Supabase environment variables.' },
        { status: 503 }
      )
    }
    const analytics = new SchedulingAnalytics(supabase)

    // Get query parameters for filters
    const searchParams = request.nextUrl.searchParams
    const filters: any = {}

    const tutorIds = searchParams.get('tutor_ids')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const courseIds = searchParams.get('course_ids')

    if (tutorIds) filters.tutor_ids = tutorIds.split(',')
    if (startDate) filters.start_date = startDate
    if (endDate) filters.end_date = endDate
    if (status) filters.status = status
    if (courseIds) filters.course_ids = courseIds.split(',')

    const summaryStats = await analytics.getSummaryStats(filters)

    return NextResponse.json(summaryStats)
  } catch (error: any) {
    console.error('Error getting summary stats:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}

