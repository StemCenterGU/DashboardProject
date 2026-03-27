import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { randomUUID } from "crypto"
import { requireAuth, getCurrentUser } from "@/lib/auth"
import { createAppointmentSchema, updateAppointmentSchema, validateBody, appointmentQuerySchema, parseSearchParams } from "@/lib/validation"
import { RecurrencePattern } from "@/types"

/**
 * Create a new appointment
 * POST /api/scheduling/appointments
 * Requires: Authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized - authentication required" },
      { status: 401 }
    )
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const body = await request.json()

    // Validate request body
    const validation = validateBody(body, createAppointmentSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const {
      tutor_id,
      tutor_name,
      student_name,
      student_email,
      course_id,
      course_name,
      course_code,
      appointment_date,
      start_time,
      end_time,
      status,
      is_online,
      is_walk_in,
      is_missed,
      is_placeholder,
      is_no_show,
      notify_client,
      notes,
      attachment_path,
      recurrence_pattern,
      recurrence_end_date,
    } = validation.data

    // Get current user for role-based validation
    const currentUser = await getCurrentUser()

    // Validate admin-only fields
    if (is_no_show && currentUser) {
      const isAdmin = ['admin', 'manager', 'lead_tutor'].includes(currentUser.role)
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Only admins, managers, and lead tutors can mark appointments as no-show" },
          { status: 403 }
        )
      }
    }

    // Prevent booking appointments in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const appointmentDate = new Date(appointment_date + "T00:00:00")

    if (appointmentDate < today) {
      return NextResponse.json(
        { error: "Cannot book appointments for past dates" },
        { status: 400 }
      )
    }

    // If booking for today, check if the time is in the past
    if (appointmentDate.getTime() === today.getTime()) {
      const now = new Date()
      const [startHours, startMinutes] = start_time.split(":").map(Number)
      const appointmentDateTime = new Date()
      appointmentDateTime.setHours(startHours, startMinutes || 0, 0, 0)

      if (appointmentDateTime < now) {
        return NextResponse.json(
          { error: "Cannot book appointments for past times" },
          { status: 400 }
        )
      }
    }

    // Generate appointments (single or recurring)
    const appointmentsToCreate: any[] = []
    const parent_appointment_id = `replica-${randomUUID()}`

    if (recurrence_pattern && recurrence_end_date) {
      // Parse recurrence pattern
      const pattern: RecurrencePattern = JSON.parse(recurrence_pattern)
      const startDate = new Date(appointment_date + "T00:00:00")
      const endDate = new Date(recurrence_end_date + "T00:00:00")

      if (pattern.frequency === "daily") {
        // Create daily appointments
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0]
          appointmentsToCreate.push({
            appointment_id: `replica-${randomUUID()}`,
            tutor_id,
            tutor_name: tutor_name || null,
            student_name,
            student_email: student_email || null,
            course_id: course_id || null,
            course_name: course_name || null,
            course_code: course_code || null,
            appointment_date: dateStr,
            start_time: start_time.length === 5 ? `${start_time}:00` : start_time,
            end_time: end_time.length === 5 ? `${end_time}:00` : end_time,
            status,
            source: "replica",
            is_online,
            is_walk_in,
            is_missed,
            is_placeholder,
            is_no_show,
            notify_client,
            notes: notes || null,
            attachment_path: dateStr === appointment_date ? (attachment_path || null) : null, // Only first appointment gets attachment
            is_repeating: true,
            recurrence_pattern,
            recurrence_end_date,
            parent_appointment_id,
          })
        }
      } else if (pattern.frequency === "weekly" && pattern.daysOfWeek) {
        // Create weekly appointments on selected days
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay()
          if (pattern.daysOfWeek.includes(dayOfWeek)) {
            const dateStr = d.toISOString().split("T")[0]
            appointmentsToCreate.push({
              appointment_id: `replica-${randomUUID()}`,
              tutor_id,
              tutor_name: tutor_name || null,
              student_name,
              student_email: student_email || null,
              course_id: course_id || null,
              course_name: course_name || null,
              course_code: course_code || null,
              appointment_date: dateStr,
              start_time: start_time.length === 5 ? `${start_time}:00` : start_time,
              end_time: end_time.length === 5 ? `${end_time}:00` : end_time,
              status,
              source: "replica",
              is_online,
              is_walk_in,
              is_missed,
              is_placeholder,
              is_no_show,
              notify_client,
              notes: notes || null,
              attachment_path: dateStr === appointment_date ? (attachment_path || null) : null, // Only first appointment gets attachment
              is_repeating: true,
              recurrence_pattern,
              recurrence_end_date,
              parent_appointment_id,
            })
          }
        }
      }
    } else {
      // Single appointment
      appointmentsToCreate.push({
        appointment_id: parent_appointment_id,
        tutor_id,
        tutor_name: tutor_name || null,
        student_name,
        student_email: student_email || null,
        course_id: course_id || null,
        course_name: course_name || null,
        course_code: course_code || null,
        appointment_date,
        start_time: start_time.length === 5 ? `${start_time}:00` : start_time,
        end_time: end_time.length === 5 ? `${end_time}:00` : end_time,
        status,
        source: "replica",
        is_online,
        is_walk_in,
        is_missed,
        is_placeholder,
        is_no_show,
        notify_client,
        notes: notes || null,
        attachment_path: attachment_path || null,
        is_repeating: false,
      })
    }

    // Insert all appointments
    const { data, error } = await supabase
      .from("appointments")
      .insert(appointmentsToCreate)
      .select("appointment_id")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send email notification if requested
    if (notify_client && student_email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/notifications/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: student_email,
            student_name,
            tutor_name: tutor_name || "Your Tutor",
            appointment_date,
            start_time,
            end_time,
            is_online,
          }),
        })
      } catch (emailError) {
        console.error("Email notification failed:", emailError)
        // Don't fail the appointment creation if email fails
      }
    }

    return NextResponse.json({
      appointment_id: parent_appointment_id,
      created: true,
      count: appointmentsToCreate.length,
      recurring: recurrence_pattern ? true : false,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Get appointments with filtering and pagination
 * GET /api/scheduling/appointments
 * Requires: Authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized - authentication required" },
      { status: 401 }
    )
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Validate query parameters
    const validation = parseSearchParams(request.nextUrl.searchParams, appointmentQuerySchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { limit = 10, page = 1, status, start_date, end_date, sort = 'desc' } = validation.data
    const offset = (page - 1) * limit
    const sortOrder = sort === "asc"

    // Build query for data
    let query = supabase
      .from("appointments")
      .select("appointment_id, tutor_id, tutor_name, student_name, course_name, appointment_date, start_time, end_time, status")
      .order("appointment_date", { ascending: sortOrder })
      .order("start_time", { ascending: sortOrder })
      .range(offset, offset + limit - 1)

    // Build count query with same filters
    let countQuery = supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })

    if (status) {
      query = query.eq("status", status)
      countQuery = countQuery.eq("status", status)
    }

    if (start_date) {
      query = query.gte("appointment_date", start_date)
      countQuery = countQuery.gte("appointment_date", start_date)
    }

    if (end_date) {
      query = query.lte("appointment_date", end_date)
      countQuery = countQuery.lte("appointment_date", end_date)
    }

    // Execute both queries
    const [dataResult, countResult] = await Promise.all([query, countQuery])

    if (dataResult.error) {
      return NextResponse.json({ error: dataResult.error.message }, { status: 500 })
    }

    const totalCount = countResult.count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      appointments: dataResult.data || [],
      count: dataResult.data?.length || 0,
      total: totalCount,
      page,
      limit,
      totalPages
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Update an existing appointment
 * PATCH /api/scheduling/appointments
 * Requires: Authentication
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth()
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized - authentication required" },
      { status: 401 }
    )
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const body = await request.json()

    const validation = validateBody(body, updateAppointmentSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { appointment_id, ...updateFields } = validation.data

    const updateData: Record<string, any> = {}

    if (updateFields.student_name !== undefined) {
      updateData.student_name = updateFields.student_name
    }
    if (updateFields.student_email !== undefined) {
      updateData.student_email = updateFields.student_email
    }
    if (updateFields.course_name !== undefined) {
      updateData.course_name = updateFields.course_name
    }
    if (updateFields.course_code !== undefined) {
      updateData.course_code = updateFields.course_code
    }
    if (updateFields.appointment_date !== undefined) {
      updateData.appointment_date = updateFields.appointment_date
    }
    if (updateFields.start_time !== undefined) {
      updateData.start_time = updateFields.start_time.length === 5 
        ? `${updateFields.start_time}:00` 
        : updateFields.start_time
    }
    if (updateFields.end_time !== undefined) {
      updateData.end_time = updateFields.end_time.length === 5 
        ? `${updateFields.end_time}:00` 
        : updateFields.end_time
    }
    if (updateFields.notes !== undefined) {
      updateData.notes = updateFields.notes
    }
    if (updateFields.is_online !== undefined) {
      updateData.is_online = updateFields.is_online
    }
    if (updateFields.status !== undefined) {
      updateData.status = updateFields.status
      if (updateFields.status === 'no_show' || updateFields.status === 'missed') {
        updateData.is_missed = true
      }
    }

    updateData.updated_at = new Date().toISOString()

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("appointment_id", appointment_id)
      .select("appointment_id, status")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      appointment_id: data.appointment_id, 
      status: data.status,
      updated: true 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
