import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth, getUserTutor, hasPermissionCheck } from "@/lib/auth"

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Get tutor availability schedules
 * GET /api/schedule
 * Query parameters:
 * - viewMode: 'own' | 'all' (default: based on role and permissions)
 * - role: filter by tutor role (e.g., 'lead_tutor')
 *
 * Requires: Authentication
 * - Regular tutors: Can only view their own schedule (viewMode=own)
 * - Lead tutors/managers: Can toggle between own and all schedules
 *
 * Returns schedules grouped by tutor and day
 */
export async function GET(request: NextRequest) {
  let user
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')
    const viewMode = searchParams.get('viewMode') as 'own' | 'all' | null

    // Determine if user can view all schedules
    const canViewAll = hasPermissionCheck(user, 'VIEW_ALL_SCHEDULES')

    // Determine which schedules to show
    let filterByTutorId: string | null = null

    if (viewMode === 'own' || (!viewMode && !canViewAll)) {
      // User wants to see their own schedule OR is a regular tutor (default behavior)
      const tutorInfo = await getUserTutor(user.user_id)

      if (!tutorInfo) {
        return NextResponse.json(
          {
            error: "No tutor profile found for this user",
            schedules: [],
            totalTutors: 0,
            totalSlots: 0,
            viewMode: 'own'
          },
          { status: 200 }
        )
      }

      filterByTutorId = tutorInfo.tutor_id
    } else if (viewMode === 'all') {
      // User explicitly requested all schedules
      if (!canViewAll) {
        return NextResponse.json(
          { error: "Permission denied - cannot view all schedules" },
          { status: 403 }
        )
      }
      // filterByTutorId remains null - show all tutors
    }
    // else: canViewAll is true and no viewMode specified - default to showing all

    // Get availability (filtered by tutor if needed)
    let availabilityQuery = supabase
      .from("tutor_availability")
      .select("*")
      .eq("is_available", true)

    // Apply tutor filter if viewing own schedule
    if (filterByTutorId) {
      availabilityQuery = availabilityQuery.eq("tutor_id", filterByTutorId)
    }

    const { data: availability, error: availError } = await availabilityQuery
      .order("tutor_id")
      .order("day_of_week")
      .order("start_time")

    if (availError) {
      console.error("Availability query error:", availError)
      return NextResponse.json({ error: availError.message }, { status: 500 })
    }

    // Get tutors (with optional filters)
    let tutorsQuery = supabase
      .from("tutors")
      .select("tutor_id, tutor_name, username, role")

    // Apply tutor filter if viewing own schedule
    if (filterByTutorId) {
      tutorsQuery = tutorsQuery.eq("tutor_id", filterByTutorId)
    }

    // Apply role filter if provided (for viewing all schedules)
    if (roleFilter && !filterByTutorId) {
      tutorsQuery = tutorsQuery.eq("role", roleFilter)
    }

    const { data: tutors, error: tutorsError } = await tutorsQuery

    if (tutorsError) {
      console.error("Tutors query error:", tutorsError)
      return NextResponse.json(
        { error: "Failed to fetch tutor information", details: tutorsError.message },
        { status: 500 }
      )
    }

    if (!tutors || tutors.length === 0) {
      console.warn("No tutors found in database")
      return NextResponse.json(
        { error: "No tutors found", schedules: [], totalTutors: 0, totalSlots: 0 },
        { status: 200 }
      )
    }

    // Create tutor lookup map (name and role)
    const tutorMap: Record<string, string> = {}
    const tutorRoleMap: Record<string, string> = {}
    for (const tutor of tutors) {
      tutorMap[tutor.tutor_id] = tutor.tutor_name
      tutorRoleMap[tutor.tutor_id] = tutor.role || 'tutor'
    }

    // Validate all tutor_ids in availability exist in tutors table
    const availabilityTutorIds = [...new Set((availability || []).map(a => a.tutor_id))]
    const missingTutors = availabilityTutorIds.filter(id => !tutorMap[id])

    if (missingTutors.length > 0) {
      console.warn(`Warning: ${missingTutors.length} availability records have no matching tutor:`, missingTutors)
    }

    // Group by tutor, then by day
    const grouped: Record<string, any> = {}

    for (const slot of availability || []) {
      const tutorId = slot.tutor_id

      // Skip availability for tutors not in our filtered list
      if (!tutorMap[tutorId]) {
        continue
      }

      const tutorName = tutorMap[tutorId]
      const dayName = DAY_NAMES[slot.day_of_week] || 'Unknown'

      if (!grouped[tutorId]) {
        grouped[tutorId] = {
          tutorId,
          tutorName,
          role: tutorRoleMap[tutorId] || 'tutor',
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
    let schedules = Object.values(grouped)

    // Special case: When viewing own schedule and tutor has 0 slots,
    // create empty schedule structure with all 7 days
    if (filterByTutorId && schedules.length === 0 && tutors && tutors.length > 0) {
      const tutor = tutors[0] // We filtered to specific tutor, so only one exists
      schedules = [{
        tutorId: tutor.tutor_id,
        tutorName: tutor.tutor_name,
        role: tutor.role || 'tutor',
        days: {
          Sunday: [],
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: []
        },
        totalSlots: 0,
        isEmpty: true // Flag to indicate this is an empty template
      }]
    }

    return NextResponse.json({
      schedules,
      totalTutors: schedules.length,
      totalSlots: availability?.length || 0,
      viewMode: filterByTutorId ? 'own' : 'all',
      canViewAll,
    })

  } catch (error: any) {
    console.error("Get schedules error:", error)
    return NextResponse.json(
      { error: "An error occurred while fetching schedules", details: error.message },
      { status: 500 }
    )
  }
}
