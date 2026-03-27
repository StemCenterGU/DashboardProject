import { NextRequest, NextResponse } from "next/server"
import { createServerClient, createAdminClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"

/**
 * Re-process existing schedules to break down slots into 1-hour chunks
 * POST /api/schedule/reprocess
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

    // Use admin client for deletions/insertions to bypass RLS
    const adminClient = createAdminClient()
    if (!adminClient) {
      return NextResponse.json({
        error: "Admin client not available - check SUPABASE_SERVICE_ROLE_KEY environment variable"
      }, { status: 500 })
    }

    // Get all availability slots
    const { data: allSlots, error: fetchError } = await supabase
      .from("tutor_availability")
      .select("*")
      .eq("is_available", true)

    if (fetchError) {
      console.error("Failed to fetch slots:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!allSlots || allSlots.length === 0) {
      return NextResponse.json({
        message: "No slots to process",
        processed: 0,
      })
    }

    // Process each slot one by one
    let processedCount = 0
    let newSlotsCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const slot of allSlots) {
      const duration = getMinutesDifference(slot.start_time, slot.end_time)

      // Only process slots LONGER than 60 minutes (not equal to 60)
      if (duration > 60) {
        console.log(`Processing slot ${slot.availability_id}: ${slot.start_time} - ${slot.end_time} (${duration} min)`)

        // Break into 1-hour chunks
        const chunks = breakIntoHourlyChunks(
          slot.start_time,
          slot.end_time,
          slot.tutor_id,
          slot.day_of_week
        )

        // Validate chunks - ensure they're all 60 minutes or less
        const validChunks = chunks.filter(chunk => {
          const chunkDuration = getMinutesDifference(chunk.start_time, chunk.end_time)
          return chunkDuration <= 60 && chunkDuration > 0
        })

        if (validChunks.length === 0) {
          console.error(`No valid chunks generated for slot ${slot.availability_id}`)
          errors.push(`No valid chunks for slot ${slot.availability_id}`)
          continue
        }

        // Delete the original slot using admin client (bypasses RLS)
        const { error: deleteError } = await adminClient
          .from("tutor_availability")
          .delete()
          .eq("availability_id", slot.availability_id)

        if (deleteError) {
          console.error(`Failed to delete slot ${slot.availability_id}:`, deleteError)
          errors.push(`Failed to delete slot ${slot.availability_id}`)
          continue
        }

        // Check if any of these chunks already exist (safety check)
        const newChunks: any[] = []
        for (const chunk of validChunks) {
          const { data: existing } = await supabase
            .from("tutor_availability")
            .select("availability_id")
            .eq("tutor_id", chunk.tutor_id)
            .eq("day_of_week", chunk.day_of_week)
            .eq("start_time", chunk.start_time)
            .eq("end_time", chunk.end_time)
            .eq("is_available", true)
            .limit(1)

          if (!existing || existing.length === 0) {
            newChunks.push(chunk)
          } else {
            console.log(`Chunk already exists, skipping: ${chunk.start_time} - ${chunk.end_time}`)
          }
        }

        if (newChunks.length === 0) {
          console.log(`All chunks for slot ${slot.availability_id} already exist, skipping`)
          processedCount++
          continue
        }

        // Insert new 1-hour chunks using admin client (bypasses RLS)
        const { error: insertError } = await adminClient
          .from("tutor_availability")
          .insert(newChunks)

        if (insertError) {
          console.error(`Failed to insert chunks for slot ${slot.availability_id}:`, insertError)
          errors.push(`Failed to insert chunks for slot ${slot.availability_id}`)
          continue
        }

        processedCount++
        newSlotsCount += newChunks.length
        console.log(`Successfully processed slot ${slot.availability_id} into ${newChunks.length} new chunks (${validChunks.length - newChunks.length} already existed)`)
      } else {
        skippedCount++
      }
    }

    // If no slots needed processing
    if (processedCount === 0 && errors.length === 0) {
      return NextResponse.json({
        message: "All slots are already 1 hour or less",
        processed: 0,
        totalSlots: allSlots.length,
      })
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Some slots failed to process",
        slotsProcessed: processedCount,
        newSlotsCreated: newSlotsCount,
        errors,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Schedules re-processed successfully",
      slotsProcessed: processedCount,
      newSlotsCreated: newSlotsCount,
      slotsSkipped: skippedCount,
      totalSlots: allSlots.length,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error: any) {
    console.error("Re-process error:", error)
    return NextResponse.json(
      { error: "An error occurred while re-processing schedules", details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Calculate minute difference between two time strings (HH:MM:SS)
 */
function getMinutesDifference(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)

  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  return endTotalMinutes - startTotalMinutes
}

/**
 * Break a time range into 1-hour chunks
 */
function breakIntoHourlyChunks(
  startTime: string,
  endTime: string,
  tutorId: string,
  dayOfWeek: number
): any[] {
  const chunks: any[] = []
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)

  let currentHour = startHours
  let currentMinute = startMinutes

  while (true) {
    const nextHour = currentHour + 1
    const nextMinute = currentMinute

    const chunkStartTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`
    const chunkEndTime = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}:00`

    // Check if this end time exceeds the original end time
    const endTimeMinutes = nextHour * 60 + nextMinute
    const originalEndMinutes = endHours * 60 + endMinutes

    if (endTimeMinutes > originalEndMinutes) {
      // Create a final chunk that might be less than 1 hour
      const finalEndTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`
      const duration = getMinutesDifference(chunkStartTime, finalEndTime)

      // Only add if there's actual time remaining
      if (duration > 0) {
        chunks.push({
          tutor_id: tutorId,
          day_of_week: dayOfWeek,
          start_time: chunkStartTime,
          end_time: finalEndTime,
          is_available: true,
        })
      }
      break
    }

    // Add 1-hour chunk
    chunks.push({
      tutor_id: tutorId,
      day_of_week: dayOfWeek,
      start_time: chunkStartTime,
      end_time: chunkEndTime,
      is_available: true,
    })

    currentHour = nextHour
    currentMinute = nextMinute

    // Check if we've reached the end
    if (currentHour * 60 + currentMinute >= originalEndMinutes) {
      break
    }
  }

  return chunks
}
