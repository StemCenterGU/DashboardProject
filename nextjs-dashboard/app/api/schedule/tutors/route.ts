import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"

/**
 * Get list of all tutors with schedule counts
 * GET /api/schedule/tutors
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

    // Get all tutors with availability count
    const { data: tutors, error } = await supabase
      .from("tutors")
      .select(`
        tutor_id,
        tutor_name,
        tutor_availability (count)
      `)
      .order("tutor_name")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format response
    const formattedTutors = (tutors || []).map((tutor: any) => ({
      tutorId: tutor.tutor_id,
      tutorName: tutor.tutor_name,
      slotCount: tutor.tutor_availability?.[0]?.count || 0,
    }))

    return NextResponse.json({
      tutors: formattedTutors,
      total: formattedTutors.length,
    })

  } catch (error: any) {
    console.error("Get tutors error:", error)
    return NextResponse.json(
      { error: "An error occurred while fetching tutors", details: error.message },
      { status: 500 }
    )
  }
}
