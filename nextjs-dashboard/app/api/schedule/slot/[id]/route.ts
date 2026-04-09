import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth, getUserTutor, hasPermissionCheck } from "@/lib/auth"

/**
 * Update an availability slot
 * PUT /api/schedule/slot/[id]
 * Requires: Authentication + (own slot OR lead_tutor+ role)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    const { day_of_week, start_time, end_time } = body

    // Check permissions: user must own the slot OR have edit_all_schedules permission
    const canEditAll = hasPermissionCheck(user, 'EDIT_ALL_SCHEDULES')

    if (!canEditAll) {
      // Regular tutor - verify they own this slot
      const tutorInfo = await getUserTutor(user.user_id)

      if (!tutorInfo) {
        return NextResponse.json(
          { error: "No tutor profile found for this user" },
          { status: 403 }
        )
      }

      // Get the slot to check ownership
      const { data: slot, error: fetchError } = await supabase
        .from("tutor_availability")
        .select("tutor_id")
        .eq("availability_id", id)
        .single()

      if (fetchError || !slot) {
        return NextResponse.json({ error: "Slot not found" }, { status: 404 })
      }

      if (slot.tutor_id !== tutorInfo.tutor_id) {
        return NextResponse.json(
          { error: "Permission denied - you can only edit your own schedule" },
          { status: 403 }
        )
      }
    }

    // Build update object
    const updateData: any = { updated_at: new Date().toISOString() }

    if (day_of_week !== undefined) {
      if (day_of_week < 0 || day_of_week > 6) {
        return NextResponse.json(
          { error: "day_of_week must be between 0 (Sunday) and 6 (Saturday)" },
          { status: 400 }
        )
      }
      updateData.day_of_week = day_of_week
    }

    if (start_time !== undefined) {
      updateData.start_time = start_time
    }

    if (end_time !== undefined) {
      updateData.end_time = end_time
    }

    // Update slot
    const { data, error } = await supabase
      .from("tutor_availability")
      .update(updateData)
      .eq("availability_id", id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Slot not found" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      slot: data,
    })

  } catch (error: any) {
    console.error("Update slot error:", error)
    return NextResponse.json(
      { error: "An error occurred while updating the slot", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Delete an availability slot
 * DELETE /api/schedule/slot/[id]
 * Requires: Authentication + (own slot OR lead_tutor+ role)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Check permissions: user must own the slot OR have edit_all_schedules permission
    const canEditAll = hasPermissionCheck(user, 'EDIT_ALL_SCHEDULES')

    if (!canEditAll) {
      // Regular tutor - verify they own this slot
      const tutorInfo = await getUserTutor(user.user_id)

      if (!tutorInfo) {
        return NextResponse.json(
          { error: "No tutor profile found for this user" },
          { status: 403 }
        )
      }

      // Get the slot to check ownership
      const { data: slot, error: fetchError } = await supabase
        .from("tutor_availability")
        .select("tutor_id")
        .eq("availability_id", id)
        .single()

      if (fetchError || !slot) {
        return NextResponse.json({ error: "Slot not found" }, { status: 404 })
      }

      if (slot.tutor_id !== tutorInfo.tutor_id) {
        return NextResponse.json(
          { error: "Permission denied - you can only delete your own schedule" },
          { status: 403 }
        )
      }
    }

    // Delete slot
    const { error } = await supabase
      .from("tutor_availability")
      .delete()
      .eq("availability_id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Slot deleted successfully",
    })

  } catch (error: any) {
    console.error("Delete slot error:", error)
    return NextResponse.json(
      { error: "An error occurred while deleting the slot", details: error.message },
      { status: 500 }
    )
  }
}
