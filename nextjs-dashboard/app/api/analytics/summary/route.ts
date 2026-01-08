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
    const isOnline = searchParams.get('is_online')
    const isWalkIn = searchParams.get('is_walk_in')
    const startTime = searchParams.get('start_time')
    const endTime = searchParams.get('end_time')
    const minDuration = searchParams.get('min_duration')
    const maxDuration = searchParams.get('max_duration')
    const dayOfWeek = searchParams.get('day_of_week')
    const courseInstructor = searchParams.get('course_instructor')
    const isRepeating = searchParams.get('is_repeating')

    if (tutorIds) filters.tutor_ids = tutorIds.split(',')
    if (startDate) filters.start_date = startDate
    if (endDate) filters.end_date = endDate
    if (status) {
      const statusArray = status.split(',')
      filters.status = statusArray.length === 1 ? statusArray[0] : statusArray
    }
    if (courseIds) filters.course_ids = courseIds.split(',')
    if (isOnline !== null && isOnline !== '') filters.is_online = isOnline === 'true'
    if (isWalkIn !== null && isWalkIn !== '') filters.is_walk_in = isWalkIn === 'true'
    if (startTime) filters.start_time = startTime
    if (endTime) filters.end_time = endTime
    if (minDuration) filters.min_duration = parseFloat(minDuration)
    if (maxDuration) filters.max_duration = parseFloat(maxDuration)
    if (dayOfWeek) {
      const daysArray = dayOfWeek.split(',').map(d => parseInt(d))
      filters.day_of_week = daysArray.length === 1 ? daysArray[0] : daysArray
    }
    if (courseInstructor) {
      const instructorArray = courseInstructor.split(',')
      filters.course_instructor = instructorArray.length === 1 ? instructorArray[0] : instructorArray
    }
    if (isRepeating !== null && isRepeating !== '') filters.is_repeating = isRepeating === 'true'

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

