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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const dataset = searchParams.get('dataset') || 'appointments_per_tutor'
    const chartType = searchParams.get('chart_type') || 'bar'
    const mode = searchParams.get('mode') || 'single'

    // Build filters
    const filters: any = {}
    const tutorIds = searchParams.get('tutor_ids')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const courseIds = searchParams.get('course_ids')
    const duration = searchParams.get('duration')
    const dayType = searchParams.get('day_type')
    const shiftStartHour = searchParams.get('shift_start_hour')
    const shiftEndHour = searchParams.get('shift_end_hour')
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
    if (duration) filters.duration = parseFloat(duration)
    if (dayType) filters.day_type = dayType
    if (shiftStartHour) filters.shift_start_hour = parseInt(shiftStartHour)
    if (shiftEndHour) filters.shift_end_hour = parseInt(shiftEndHour)
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

    // Handle grid mode - return multiple datasets
    if (mode === 'grid') {
      const [
        appointmentsPerTutor,
        hoursPerTutor,
        dailyAppointments,
        appointmentsByStatus,
        coursePopularity,
        hourlyDistribution
      ] = await Promise.all([
        analytics.getChartData('appointments_per_tutor', filters),
        analytics.getChartData('hours_per_tutor', filters),
        analytics.getChartData('daily_appointments', filters),
        analytics.getChartData('appointments_by_status', filters),
        analytics.getChartData('course_popularity', filters),
        analytics.getChartData('hourly_appointments_dist', filters)
      ])

      return NextResponse.json({
        appointments_per_tutor: appointmentsPerTutor,
        hours_per_tutor: hoursPerTutor,
        daily_appointments: dailyAppointments,
        appointments_by_status: appointmentsByStatus,
        course_popularity: coursePopularity,
        hourly_appointments_dist: hourlyDistribution
      })
    }

    // Single chart mode
    const chartData = await analytics.getChartData(dataset, filters)
    const summaryStats = await analytics.getSummaryStats(filters)

    const titles: Record<string, string> = {
      appointments_per_tutor: 'Appointments per Tutor',
      hours_per_tutor: 'Scheduled Hours per Tutor',
      daily_appointments: 'Daily Appointments',
      daily_hours: 'Daily Scheduled Hours',
      appointments_by_status: 'Appointments by Status',
      appointments_by_course: 'Appointments by Course',
      appointments_per_day_of_week: 'Appointments per Day of Week',
      hourly_appointments_dist: 'Appointments by Hour',
      avg_appointment_duration: 'Average Appointment Duration',
      tutor_workload: 'Tutor Workload (Total Hours)',
      course_popularity: 'Course Popularity',
      monthly_appointments: 'Monthly Appointments',
      tutor_availability_hours: 'Tutor Available Hours',
      shift_coverage: 'Shift Coverage',
      appointment_trends: 'Appointment Trends',
      online_vs_inperson: 'Online vs In-Person Appointments',
      walk_in_analytics: 'Walk-In vs Scheduled Appointments',
      missed_noshow_analytics: 'Missed/No-Show Analytics',
      day_of_week_analytics: 'Appointments by Day of Week',
      monthly_trends: 'Monthly Appointment Trends',
      instructor_analytics: 'Appointments per Instructor'
    }

    return NextResponse.json({
      chart_data: chartData,
      chart_type: chartType,
      title: titles[dataset] || dataset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      dataset,
      summary: summaryStats
    })
  } catch (error: any) {
    console.error('Error processing chart data:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred processing chart data', chart_data: {} },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }
    const analytics = new SchedulingAnalytics(supabase)

    const body = await request.json()
    const { dataset = 'appointments_per_tutor', chart_type = 'bar', mode = 'single', ...rawFilters } = body
    
    // Process filters - convert string booleans to actual booleans
    const filters: any = { ...rawFilters }
    if (filters.is_online !== undefined && typeof filters.is_online === 'string') {
      filters.is_online = filters.is_online === 'true'
    }
    if (filters.is_walk_in !== undefined && typeof filters.is_walk_in === 'string') {
      filters.is_walk_in = filters.is_walk_in === 'true'
    }
    if (filters.is_repeating !== undefined && typeof filters.is_repeating === 'string') {
      filters.is_repeating = filters.is_repeating === 'true'
    }
    if (filters.day_of_week !== undefined && typeof filters.day_of_week === 'string') {
      const daysArray = filters.day_of_week.split(',').map((d: string) => parseInt(d))
      filters.day_of_week = daysArray.length === 1 ? daysArray[0] : daysArray
    }
    if (filters.course_instructor !== undefined && typeof filters.course_instructor === 'string') {
      const instructorArray = filters.course_instructor.split(',')
      filters.course_instructor = instructorArray.length === 1 ? instructorArray[0] : instructorArray
    }
    if (filters.min_duration !== undefined && typeof filters.min_duration === 'string') {
      filters.min_duration = parseFloat(filters.min_duration)
    }
    if (filters.max_duration !== undefined && typeof filters.max_duration === 'string') {
      filters.max_duration = parseFloat(filters.max_duration)
    }

    // Handle grid mode
    if (mode === 'grid') {
      const [
        appointmentsPerTutor,
        hoursPerTutor,
        dailyAppointments,
        appointmentsByStatus,
        coursePopularity,
        hourlyDistribution
      ] = await Promise.all([
        analytics.getChartData('appointments_per_tutor', filters),
        analytics.getChartData('hours_per_tutor', filters),
        analytics.getChartData('daily_appointments', filters),
        analytics.getChartData('appointments_by_status', filters),
        analytics.getChartData('course_popularity', filters),
        analytics.getChartData('hourly_appointments_dist', filters)
      ])

      return NextResponse.json({
        appointments_per_tutor: appointmentsPerTutor,
        hours_per_tutor: hoursPerTutor,
        daily_appointments: dailyAppointments,
        appointments_by_status: appointmentsByStatus,
        course_popularity: coursePopularity,
        hourly_appointments_dist: hourlyDistribution
      })
    }

    // Single chart mode
    const chartData = await analytics.getChartData(dataset, filters)
    const summaryStats = await analytics.getSummaryStats(filters)

    const titles: Record<string, string> = {
      appointments_per_tutor: 'Appointments per Tutor',
      hours_per_tutor: 'Scheduled Hours per Tutor',
      daily_appointments: 'Daily Appointments',
      appointments_by_status: 'Appointments by Status',
      course_popularity: 'Course Popularity',
      hourly_appointments_dist: 'Appointments by Hour'
    }

    return NextResponse.json({
      chart_data: chartData,
      chart_type: chart_type,
      title: titles[dataset] || dataset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      dataset,
      summary: summaryStats
    })
  } catch (error: any) {
    console.error('Error processing chart data:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred processing chart data', chart_data: {} },
      { status: 500 }
    )
  }
}

