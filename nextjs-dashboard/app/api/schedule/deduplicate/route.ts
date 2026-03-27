import { NextRequest, NextResponse } from "next/server"
import { createServerClient, createAdminClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"

/**
 * Remove duplicate availability slots
 * POST /api/schedule/deduplicate
 * Requires: Authentication
 *
 * Identifies and removes duplicate slots (same tutor, day, start time, end time)
 * Keeps only one instance of each unique slot
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

    // Get all availability slots
    const { data: allSlots, error: fetchError } = await supabase
      .from("tutor_availability")
      .select("*")
      .eq("is_available", true)
      .order("tutor_id")
      .order("day_of_week")
      .order("start_time")

    if (fetchError) {
      console.error("Failed to fetch slots:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!allSlots || allSlots.length === 0) {
      return NextResponse.json({
        message: "No slots found",
        duplicatesRemoved: 0,
      })
    }

    // Track unique slots and duplicates
    const uniqueSlots = new Map<string, string>() // key -> availability_id to keep
    const duplicateIds: string[] = []

    for (const slot of allSlots) {
      // Create unique key: tutor_id + day + start + end
      const key = `${slot.tutor_id}|${slot.day_of_week}|${slot.start_time}|${slot.end_time}`

      if (uniqueSlots.has(key)) {
        // This is a duplicate, mark for deletion
        duplicateIds.push(slot.availability_id)
      } else {
        // First occurrence, keep it
        uniqueSlots.set(key, slot.availability_id)
      }
    }

    // If no duplicates found
    if (duplicateIds.length === 0) {
      return NextResponse.json({
        message: "No duplicates found",
        duplicatesRemoved: 0,
        totalSlots: allSlots.length,
      })
    }

    console.log(`Found ${duplicateIds.length} duplicate slots to remove`)
    console.log(`First 5 IDs to delete:`, duplicateIds.slice(0, 5))

    // Use admin client to bypass RLS policies for deletions
    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json({
        error: "Admin client not available - check SUPABASE_SERVICE_ROLE_KEY environment variable",
        duplicatesFound: duplicateIds.length
      }, { status: 500 })
    }

    // Delete duplicates one by one for reliability
    let deletedCount = 0
    const errors: string[] = []

    for (let i = 0; i < duplicateIds.length; i++) {
      const id = duplicateIds[i]

      if (i % 50 === 0) {
        console.log(`Progress: ${i}/${duplicateIds.length} processed`)
      }

      // Try to delete using admin client (bypasses RLS)
      const { data, error: deleteError } = await adminClient
        .from("tutor_availability")
        .delete()
        .eq("availability_id", id)
        .select()

      if (deleteError) {
        console.error(`Failed to delete slot ${id}:`, deleteError.message, deleteError)
        errors.push(`Failed to delete slot ${id}: ${deleteError.message}`)
      } else if (data && data.length > 0) {
        deletedCount++
        if (i < 3) {
          console.log(`Successfully deleted slot ${id}`)
        }
      } else {
        console.warn(`Delete returned no data for slot ${id}`)
        errors.push(`Slot ${id} delete returned no data`)
      }
    }

    console.log(`Deletion complete: ${deletedCount} deleted, ${errors.length} errors`)

    const responseData = {
      success: deletedCount > 0,
      message: deletedCount > 0
        ? `Removed ${deletedCount} duplicate slots`
        : "No duplicates were removed",
      duplicatesRemoved: deletedCount,
      duplicatesFound: duplicateIds.length,
      totalSlots: allSlots.length,
      uniqueSlots: uniqueSlots.size,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Only show first 10 errors
      errorCount: errors.length,
    }

    console.log("Response:", responseData)

    if (errors.length > 0 && deletedCount === 0) {
      return NextResponse.json(responseData, { status: 500 })
    }

    return NextResponse.json(responseData)

  } catch (error: any) {
    console.error("Deduplication error:", error)
    return NextResponse.json(
      { error: "An error occurred while removing duplicates", details: error.message },
      { status: 500 }
    )
  }
}
