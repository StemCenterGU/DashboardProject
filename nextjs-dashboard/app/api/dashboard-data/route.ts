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

    // Get query parameters for filters
    const searchParams = request.nextUrl.searchParams
    const filters: any = {}

    // Apply role-based filtering if needed (can be extended)
    const tutorIds = searchParams.get('tutor_ids')
    if (tutorIds) {
      filters.tutor_ids = tutorIds.split(',')
    }

    // Get summary statistics
    const summary = await analytics.getSummaryStats(filters)
    
    // Ensure all required fields exist
    const summaryWithDefaults = {
      total_appointments: summary.total_appointments || 0,
      total_hours: summary.total_hours || 0,
      unique_tutors: summary.unique_tutors || 0,
      unique_courses: summary.unique_courses || 0,
      average_duration: summary.average_duration || 0,
      pending_confirmations: summary.pending_confirmations || 0,
      cancelled_count: summary.cancelled_count || 0,
      active_tutors: summary.unique_tutors || 0,
      ...summary
    }

    // Get recent appointments for logs view
    const logsForCollapsibleView: any[] = []
    try {
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('appointment_id, appointment_date, tutor_id, tutor_name, student_name, start_time, end_time, status, course_id, course_name')
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(50)

      if (!aptError && appointments) {
        for (const apt of appointments) {
          logsForCollapsibleView.push({
            date: apt.appointment_date,
            tutor_id: apt.tutor_id,
            tutor_name: apt.tutor_name || 'Unknown Tutor',
            student_name: apt.student_name || '',
            start_time: apt.start_time,
            end_time: apt.end_time,
            status: apt.status || 'scheduled',
            course_id: apt.course_id,
            course_name: apt.course_name || 'No course'
          })
        }
      }
    } catch (error) {
      console.error('Error generating logs view:', error)
    }

    // Generate alerts
    const alerts: any[] = []
    try {
      if (summary.pending_confirmations > 10) {
        alerts.push({
          type: 'warning',
          title: 'High Pending Confirmations',
          message: `${summary.pending_confirmations} appointments are pending confirmation`
        })
      }

      const total = summary.total_appointments || 0
      const cancelled = summary.cancelled_count || 0
      if (total > 0 && (cancelled / total) > 0.2) {
        alerts.push({
          type: 'danger',
          title: 'High Cancellation Rate',
          message: `${((cancelled / total) * 100).toFixed(1)}% of appointments have been cancelled`
        })
      }

      if (summary.unique_tutors < 3) {
        alerts.push({
          type: 'info',
          title: 'Low Tutor Activity',
          message: `Only ${summary.unique_tutors} active tutors this period`
        })
      }
    } catch (error) {
      console.error('Error generating alerts:', error)
    }

    return NextResponse.json({
      logs_for_collapsible_view: logsForCollapsibleView,
      summary: summaryWithDefaults,
      alerts: alerts
    })
  } catch (error: any) {
    console.error('Error getting dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
}

