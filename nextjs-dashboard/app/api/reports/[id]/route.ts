import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'

// GET /api/reports/[id] - Get a single report by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const { data: report, error } = await supabase
      .from('client_reports')
      .select(`
        *,
        staff:tutors!staff_resource_id(tutor_id, tutor_name, username),
        course:courses(course_id, course_code, course_name, department),
        creator:users!created_by(user_id, email),
        updater:users!updated_by(user_id, email)
      `)
      .eq('report_id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      console.error('Error fetching report:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('GET report error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/reports/[id] - Update a report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (!hasPermission(userRole, 'EDIT_CLIENT_REPORT')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Prepare update data (exclude audit fields)
    const updateData: any = {
      updated_by: user.user_id,
    }

    // Only update fields that are provided
    const allowedFields = [
      'appointment_id',
      'client_name',
      'report_date',
      'location',
      'staff_resource_id',
      'staff_resource_name',
      'actual_appointment_length',
      'missing_information',
      'department',
      'course_id',
      'instructor',
      'email_automation_enabled',
      'advisor_email',
      'broad_appointment_focus',
      'resources_utilized',
      'wrc_detailed_focus',
      'wrc_student_categories',
      'gannon_101_credit',
      'shared_notes',
      'confidential_notes',
      'email_recipients',
      'attachment_paths',
    ]

    allowedFields.forEach((field) => {
      if (field in body) {
        updateData[field] = body[field]
      }
    })

    const { data: report, error } = await supabase
      .from('client_reports')
      .update(updateData)
      .eq('report_id', id)
      .select(`
        *,
        staff:tutors!staff_resource_id(tutor_id, tutor_name, username),
        course:courses(course_id, course_code, course_name, department)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      console.error('Error updating report:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('PUT report error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (!hasPermission(userRole, 'DELETE_CLIENT_REPORT')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('client_reports')
      .delete()
      .eq('report_id', id)

    if (error) {
      console.error('Error deleting report:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error: any) {
    console.error('DELETE report error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
