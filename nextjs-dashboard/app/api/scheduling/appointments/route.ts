import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let query = supabase
      .from("appointments")
      .select("appointment_id, tutor_id, tutor_name, student_name, student_email, course_name, appointment_date, start_time, end_time, status, is_online, is_walk_in, is_missed")
      .order("appointment_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq("status", status)
    }

    if (startDate) {
      query = query.gte("appointment_date", startDate)
    }

    if (endDate) {
      query = query.lte("appointment_date", endDate)
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

