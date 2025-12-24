import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const tutorId = searchParams.get("tutor_id")
    const dayOfWeek = searchParams.get("day_of_week")

    let query = supabase
      .from("tutor_availability")
      .select("availability_id, tutor_id, day_of_week, start_time, end_time, is_available")
      .eq("is_available", true)
      .order("day_of_week")
      .order("start_time")

    if (tutorId) {
      query = query.eq("tutor_id", tutorId)
    }

    if (dayOfWeek) {
      query = query.eq("day_of_week", parseInt(dayOfWeek))
    }

    const { data: availability, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      availability: availability || [],
      count: availability?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

