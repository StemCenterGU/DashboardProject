import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"
import { parseScheduleFile } from "@/lib/scheduleParser"

/**
 * Upload and parse tutor schedule file (CSV/Excel)
 * POST /api/schedule/upload
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

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: "Invalid file type. Only CSV and Excel files are supported." },
        { status: 400 }
      )
    }

    // Parse the file
    const parseResult = await parseScheduleFile(file)

    if (!parseResult.success || parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: "File parsing failed",
          details: parseResult.errors,
          warnings: parseResult.warnings,
        },
        { status: 400 }
      )
    }

    if (parseResult.slots.length === 0) {
      return NextResponse.json(
        {
          error: "No availability slots found in file",
          warnings: parseResult.warnings,
        },
        { status: 400 }
      )
    }

    // Match tutors by username (from Excel file)
    const tutorIdMap: Record<string, string> = {} // username -> UUID
    const unmatchedUsernames: string[] = []
    const createdTutors: string[] = []

    for (const tutorUsername of parseResult.tutors) {
      // Check if tutor exists by username
      const { data: existingTutor } = await supabase
        .from("tutors")
        .select("tutor_id, tutor_name, username")
        .eq("username", tutorUsername)
        .single()

      if (existingTutor) {
        tutorIdMap[tutorUsername] = existingTutor.tutor_id
        console.log(`Matched username "${tutorUsername}" to tutor "${existingTutor.tutor_name}" (${existingTutor.tutor_id})`)
      } else {
        // Username not found - create new tutor
        console.warn(`Username not found in database: ${tutorUsername}, creating new tutor...`)

        // Use username as tutor_name for now (can be updated manually later)
        const tutorName = tutorUsername

        // Create new tutor
        const { data: newTutor, error: createError } = await supabase
          .from("tutors")
          .insert({
            tutor_name: tutorName,
            username: tutorUsername,
            role: 'tutor'
          })
          .select("tutor_id, tutor_name, username")
          .single()

        if (createError) {
          console.error(`Failed to create tutor for username ${tutorUsername}:`, createError)
          unmatchedUsernames.push(tutorUsername)
        } else if (newTutor) {
          tutorIdMap[tutorUsername] = newTutor.tutor_id
          createdTutors.push(tutorUsername)
          console.log(`Created new tutor "${newTutor.tutor_name}" for username "${tutorUsername}"`)
        }
      }
    }

    // Delete existing availability for these tutors (replace per tutor)
    const tutorUUIDs = Object.values(tutorIdMap)
    if (tutorUUIDs.length > 0) {
      const { error: deleteError } = await supabase
        .from("tutor_availability")
        .delete()
        .in("tutor_id", tutorUUIDs)

      if (deleteError) {
        console.error("Failed to delete existing availability:", deleteError)
      }
    }

    // Insert new availability slots
    const slotsToInsert = parseResult.slots
      .filter(slot => tutorIdMap[slot.tutorId]) // Only slots with valid tutors
      .map(slot => ({
        tutor_id: tutorIdMap[slot.tutorId],
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: true,
      }))

    if (slotsToInsert.length === 0) {
      return NextResponse.json(
        {
          error: "No valid slots to insert",
          tutorsFound: parseResult.tutors.length,
          warnings: parseResult.warnings,
        },
        { status: 400 }
      )
    }

    const { data: insertedSlots, error: insertError } = await supabase
      .from("tutor_availability")
      .insert(slotsToInsert)
      .select("availability_id")

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to insert availability slots", details: insertError.message },
        { status: 500 }
      )
    }

    // Add warnings for unmatched usernames and info about created tutors
    const allWarnings = [...parseResult.warnings]
    if (createdTutors.length > 0) {
      allWarnings.push(
        `${createdTutors.length} new tutor(s) created: ${createdTutors.join(', ')}`
      )
    }
    if (unmatchedUsernames.length > 0) {
      allWarnings.push(
        `${unmatchedUsernames.length} username(s) failed to create: ${unmatchedUsernames.join(', ')}`
      )
    }

    return NextResponse.json({
      success: true,
      tutorsMatched: Object.keys(tutorIdMap).length - createdTutors.length,
      tutorsCreated: createdTutors.length,
      tutorsNotMatched: unmatchedUsernames.length,
      slotsCreated: insertedSlots?.length || 0,
      tutors: parseResult.tutors,
      matchedTutors: Object.keys(tutorIdMap).filter(u => !createdTutors.includes(u)),
      createdTutors,
      unmatchedUsernames,
      warnings: allWarnings,
    })

  } catch (error: any) {
    console.error("Schedule upload error:", error)
    return NextResponse.json(
      { error: "An error occurred during file upload", details: error.message },
      { status: 500 }
    )
  }
}
