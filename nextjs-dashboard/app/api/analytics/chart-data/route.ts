import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { SchedulingAnalytics } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
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

    if (tutorIds) filters.tutor_ids = tutorIds.split(',')
    if (startDate) filters.start_date = startDate
    if (endDate) filters.end_date = endDate
    if (status) filters.status = status
    if (courseIds) filters.course_ids = courseIds.split(',')
    if (duration) filters.duration = parseFloat(duration)
    if (dayType) filters.day_type = dayType
    if (shiftStartHour) filters.shift_start_hour = parseInt(shiftStartHour)
    if (shiftEndHour) filters.shift_end_hour = parseInt(shiftEndHour)

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
      appointment_trends: 'Appointment Trends'
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
    const analytics = new SchedulingAnalytics(supabase)

    const body = await request.json()
    const { dataset = 'appointments_per_tutor', chart_type = 'bar', mode = 'single', ...filters } = body

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

