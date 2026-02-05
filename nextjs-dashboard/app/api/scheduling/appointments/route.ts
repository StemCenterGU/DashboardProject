import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10")
    const page = parseInt(searchParams.get("page") || "1")
    const offset = (page - 1) * limit
    const status = searchParams.get("status")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const sortOrder = searchParams.get("sort") === "asc" ? true : false

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

    if (startDate) {
      query = query.gte("appointment_date", startDate)
      countQuery = countQuery.gte("appointment_date", startDate)
    }

    if (endDate) {
      query = query.lte("appointment_date", endDate)
      countQuery = countQuery.lte("appointment_date", endDate)
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
