import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { SchedulingAnalytics } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }
    const analytics = new SchedulingAnalytics(supabase)

    const searchParams = request.nextUrl.searchParams
    const compareType = searchParams.get('type') || 'time_period'

    if (compareType === 'time_period') {
      // Compare two time periods
      const period1Start = searchParams.get('period1_start')
      const period1End = searchParams.get('period1_end')
      const period2Start = searchParams.get('period2_start')
      const period2End = searchParams.get('period2_end')

      if (!period1Start || !period1End || !period2Start || !period2End) {
        return NextResponse.json(
          { error: 'Missing date parameters for comparison' },
          { status: 400 }
        )
      }

      // Get data for period 1
      const period1Filters: any = {
        start_date: period1Start,
        end_date: period1End
      }
      const period1Stats = await analytics.getSummaryStats(period1Filters)
      const period1Daily = await analytics.getDailyAppointments(period1Filters)

      // Get data for period 2
      const period2Filters: any = {
        start_date: period2Start,
        end_date: period2End
      }
      const period2Stats = await analytics.getSummaryStats(period2Filters)
      const period2Daily = await analytics.getDailyAppointments(period2Filters)

      // Calculate differences
      const appointmentDiff = period2Stats.total_appointments - period1Stats.total_appointments
      const hoursDiff = period2Stats.total_hours - period1Stats.total_hours
      const appointmentChange = period1Stats.total_appointments > 0 
        ? ((appointmentDiff / period1Stats.total_appointments) * 100) 
        : 0
      const hoursChange = period1Stats.total_hours > 0 
        ? ((hoursDiff / period1Stats.total_hours) * 100) 
        : 0

      return NextResponse.json({
        type: 'time_period',
        period1: {
          start: period1Start,
          end: period1End,
          stats: period1Stats,
          daily_data: period1Daily
        },
        period2: {
          start: period2Start,
          end: period2End,
          stats: period2Stats,
          daily_data: period2Daily
        },
        comparison: {
          appointment_difference: appointmentDiff,
          appointment_change_percentage: Math.round(appointmentChange * 10) / 10,
          hours_difference: Math.round(hoursDiff * 10) / 10,
          hours_change_percentage: Math.round(hoursChange * 10) / 10,
          tutors_difference: period2Stats.unique_tutors - period1Stats.unique_tutors,
          avg_duration_difference: Math.round((period2Stats.average_duration - period1Stats.average_duration) * 10) / 10
        }
      })
    }

    if (compareType === 'tutors') {
      const tutorIds = searchParams.get('tutor_ids')?.split(',') || []
      
      if (tutorIds.length < 2) {
        return NextResponse.json(
          { error: 'At least 2 tutors required for comparison' },
          { status: 400 }
        )
      }

      const filters: any = {}
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')
      if (startDate) filters.start_date = startDate
      if (endDate) filters.end_date = endDate

      const tutorComparisons = await Promise.all(
        tutorIds.map(async (tutorId) => {
          const tutorFilters = { ...filters, tutor_ids: [tutorId] }
          const stats = await analytics.getSummaryStats(tutorFilters)
          const appointments = await analytics.getAppointments(tutorFilters)
          
          const { data: tutor } = await supabase
            .from('tutors')
            .select('tutor_id, tutor_name')
            .eq('tutor_id', tutorId)
            .single()

          return {
            tutor_id: tutorId,
            tutor_name: tutor?.tutor_name || `Tutor ${tutorId}`,
            stats,
            appointment_count: appointments.length
          }
        })
      )

      return NextResponse.json({
        type: 'tutors',
        comparisons: tutorComparisons
      })
    }

    if (compareType === 'courses') {
      const courseIds = searchParams.get('course_ids')?.split(',') || []
      
      if (courseIds.length < 2) {
        return NextResponse.json(
          { error: 'At least 2 courses required for comparison' },
          { status: 400 }
        )
      }

      const filters: any = {}
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')
      if (startDate) filters.start_date = startDate
      if (endDate) filters.end_date = endDate

      const courseComparisons = await Promise.all(
        courseIds.map(async (courseId) => {
          const courseFilters = { ...filters, course_ids: [courseId] }
          const stats = await analytics.getSummaryStats(courseFilters)
          const appointments = await analytics.getAppointments(courseFilters)
          
          const { data: course } = await supabase
            .from('courses')
            .select('course_id, course_name, course_code')
            .eq('course_id', courseId)
            .single()

          return {
            course_id: courseId,
            course_name: course?.course_name || `Course ${courseId}`,
            course_code: course?.course_code || '',
            stats,
            appointment_count: appointments.length
          }
        })
      )

      return NextResponse.json({
        type: 'courses',
        comparisons: courseComparisons
      })
    }

    return NextResponse.json(
      { error: 'Invalid comparison type' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in comparison:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}

