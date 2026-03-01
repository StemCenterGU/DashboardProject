import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { randomUUID } from "crypto"
import { requireAuth } from "@/lib/auth"
import { createAppointmentSchema, validateBody, appointmentQuerySchema, parseSearchParams } from "@/lib/validation"

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
      notes,
    } = validation.data

    const appointment_id = `replica-${randomUUID()}`
    const row = {
      appointment_id,
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
      status, // Already validated by schema
      source: "replica",
      is_online,
      is_walk_in,
      is_missed,
      notes: notes || null,
    }

    const { data, error } = await supabase.from("appointments").insert(row).select("appointment_id").single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ appointment_id: data?.appointment_id ?? appointment_id, created: true })
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
