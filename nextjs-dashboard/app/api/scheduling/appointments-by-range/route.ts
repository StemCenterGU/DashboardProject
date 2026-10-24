import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth, type User } from "@/lib/auth"
import { getAppointmentAccess, ownAppointmentsFilter } from "@/lib/appointment-access"

/**
 * Get appointments within a date range
 * GET /api/scheduling/appointments-by-range
 * Requires: Authentication
 * Returns only the user's own appointments unless they can view all.
 */
export async function GET(request: NextRequest) {
  let user: User
  try {
    // Require authentication
    user = await requireAuth()
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

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "start_date and end_date are required" }, { status: 400 })
    }

    let query = supabase
      .from("appointments")
      .select("appointment_id, appointment_date, start_time, end_time, student_name, tutor_name, course_name, status, is_online, is_walk_in, is_missed")
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true })

    const ownFilter = ownAppointmentsFilter(await getAppointmentAccess(user))
    if (ownFilter) {
      query = query.or(ownFilter)
    }

    const { data: appointments, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      appointments: appointments || [],
      count: appointments?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

