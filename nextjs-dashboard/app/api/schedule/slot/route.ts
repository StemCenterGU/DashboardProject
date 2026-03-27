import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"

/**
 * Create a new availability slot
 * POST /api/schedule/slot
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
    const { tutor_id, day_of_week, start_time, end_time } = body

    // Validation
    if (!tutor_id || day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields: tutor_id, day_of_week, start_time, end_time" },
        { status: 400 }
      )
    }

    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: "day_of_week must be between 0 (Sunday) and 6 (Saturday)" },
        { status: 400 }
      )
    }

    // Check if tutor exists
    const { data: tutor } = await supabase
      .from("tutors")
      .select("tutor_id")
      .eq("tutor_id", tutor_id)
      .single()

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 })
    }

    // Insert slot
    const { data, error } = await supabase
      .from("tutor_availability")
      .insert({
        tutor_id,
        day_of_week,
        start_time,
        end_time,
        is_available: true,
      })
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "This time slot already exists for this tutor" },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      slot: data,
    })

  } catch (error: any) {
    console.error("Create slot error:", error)
    return NextResponse.json(
      { error: "An error occurred while creating the slot", details: error.message },
      { status: 500 }
    )
  }
}
