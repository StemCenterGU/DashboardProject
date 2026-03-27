import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Get all tutor availability schedules
 * GET /api/schedule
 * Requires: Authentication
 *
 * Returns schedules grouped by tutor and day
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

    // Get all availability (without join for now)
    const { data: availability, error: availError } = await supabase
      .from("tutor_availability")
      .select("*")
      .eq("is_available", true)
      .order("tutor_id")
      .order("day_of_week")
      .order("start_time")

    if (availError) {
      console.error("Availability query error:", availError)
      return NextResponse.json({ error: availError.message }, { status: 500 })
    }

    // Get all tutors separately
    const { data: tutors, error: tutorsError } = await supabase
      .from("tutors")
      .select("tutor_id, tutor_name")

    if (tutorsError) {
      console.error("Tutors query error:", tutorsError)
    }

    // Create tutor lookup map
    const tutorMap: Record<string, string> = {}
    if (tutors) {
      for (const tutor of tutors) {
        tutorMap[tutor.tutor_id] = tutor.tutor_name
      }
    }

    // Group by tutor, then by day
    const grouped: Record<string, any> = {}

    for (const slot of availability || []) {
      const tutorId = slot.tutor_id
      const tutorName = tutorMap[tutorId] || tutorId
      const dayName = DAY_NAMES[slot.day_of_week] || 'Unknown'

      if (!grouped[tutorId]) {
        grouped[tutorId] = {
          tutorId,
          tutorName,
          days: {},
          totalSlots: 0,
        }
      }

      if (!grouped[tutorId].days[dayName]) {
        grouped[tutorId].days[dayName] = []
      }

      grouped[tutorId].days[dayName].push({
        id: slot.availability_id,
        dayOfWeek: slot.day_of_week,
        dayName,
        startTime: slot.start_time,
        endTime: slot.end_time,
        createdAt: slot.created_at,
        updatedAt: slot.updated_at,
      })

      grouped[tutorId].totalSlots++
    }

    // Convert to array
    const schedules = Object.values(grouped)

    return NextResponse.json({
      schedules,
      totalTutors: schedules.length,
      totalSlots: availability?.length || 0,
    })

  } catch (error: any) {
    console.error("Get schedules error:", error)
    return NextResponse.json(
      { error: "An error occurred while fetching schedules", details: error.message },
      { status: 500 }
    )
  }
}
