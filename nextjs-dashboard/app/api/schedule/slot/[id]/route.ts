import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"

/**
 * Update an availability slot
 * PUT /api/schedule/slot/[id]
 * Requires: Authentication
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    const { day_of_week, start_time, end_time } = body

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
 * Requires: Authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

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
