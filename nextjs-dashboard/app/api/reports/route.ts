import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'

// GET /api/reports - List all reports with optional filters
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointment_id')
    const staffId = searchParams.get('staff_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('client_reports')
      .select(`
        *,
        staff:tutors!staff_resource_id(tutor_id, tutor_name, username),
        course:courses(course_id, course_code, course_name, department),
        creator:users!created_by(user_id, email),
        updater:users!updated_by(user_id, email)
      `)
      .order('report_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId)
    }
    if (staffId) {
      query = query.eq('staff_resource_id', staffId)
    }
    if (startDate) {
      query = query.gte('report_date', startDate)
    }
    if (endDate) {
      query = query.lte('report_date', endDate)
    }

    const { data: reports, error } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reports })
  } catch (error: any) {
    console.error('GET reports error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Check permissions
    const userRole = user.role ?? ''
    if (!hasPermission(userRole, 'CREATE_CLIENT_REPORT')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.client_name || !body.report_date) {
      return NextResponse.json(
        { error: 'client_name and report_date are required' },
        { status: 400 }
      )
    }

    // Prepare report data
    const reportData = {
      appointment_id: body.appointment_id || null,
      client_name: body.client_name,
      report_date: body.report_date,
      location: body.location || null,
      staff_resource_id: body.staff_resource_id || null,
      staff_resource_name: body.staff_resource_name || null,
      actual_appointment_length: body.actual_appointment_length || null,
      missing_information: body.missing_information || [],
      department: body.department || null,
      course_id: body.course_id || null,
      instructor: body.instructor || null,
      email_automation_enabled: body.email_automation_enabled || false,
      advisor_email: body.advisor_email || null,
      broad_appointment_focus: body.broad_appointment_focus || [],
      resources_utilized: body.resources_utilized || [],
      wrc_detailed_focus: body.wrc_detailed_focus || [],
      wrc_student_categories: body.wrc_student_categories || [],
      gannon_101_credit: body.gannon_101_credit || null,
      shared_notes: body.shared_notes || null,
      confidential_notes: body.confidential_notes || null,
      email_recipients: body.email_recipients || { client: false, staff: false, resource: false },
      attachment_paths: body.attachment_paths || [],
      created_by: user.user_id,
      updated_by: user.user_id,
    }

    const { data: report, error } = await supabase
      .from('client_reports')
      .insert(reportData)
      .select(`
        *,
        staff:tutors!staff_resource_id(tutor_id, tutor_name, username),
        course:courses(course_id, course_code, course_name, department)
      `)
      .single()

    if (error) {
      console.error('Error creating report:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // TODO: Trigger email notifications based on email_recipients settings

    return NextResponse.json({ report }, { status: 201 })
  } catch (error: any) {
    console.error('POST reports error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
