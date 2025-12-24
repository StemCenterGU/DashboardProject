import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    // Parse date string as YYYY-MM-DD to avoid timezone issues
    const [year, month, day] = date.split("-").map(Number)
    const dateObj = new Date(year, month - 1, day)
    const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Fetch available slots for the specific date (from available_slots table)
    // These are the white/light grey boxes in the grid (excludes booked appointments)
    const { data: availableSlots, error: availableSlotsError } = await supabase
      .from("available_slots")
      .select("tutor_id, start_time, end_time")
      .eq("slot_date", date)
      .eq("is_booked", false)

    if (availableSlotsError) {
      return NextResponse.json({ error: availableSlotsError.message }, { status: 500 })
    }

    // Fetch appointments for the selected date first
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("tutor_id, tutor_name, start_time, end_time, student_name, course_name, status, is_online, is_walk_in, is_missed")
      .eq("appointment_date", date)
      .order("start_time")

    if (appointmentsError) {
      return NextResponse.json({ error: appointmentsError.message }, { status: 500 })
    }

    // Get unique tutor IDs from both available slots and appointments
    const availableTutorIds = new Set((availableSlots || []).map(slot => slot.tutor_id))
    const appointmentTutorIds = new Set((appointments || []).map(apt => apt.tutor_id))
    const allTutorIds = new Set([...availableTutorIds, ...appointmentTutorIds])

    // Fetch tutors who have either available slots or appointments for this day
    const { data: tutors, error: tutorsError } = await supabase
      .from("tutors")
      .select("tutor_id, tutor_name")
      .in("tutor_id", Array.from(allTutorIds))
      .order("tutor_name")

    if (tutorsError) {
      return NextResponse.json({ error: tutorsError.message }, { status: 500 })
    }

    return NextResponse.json({
      date,
      tutors: tutors || [],
      appointments: appointments || [],
      availability: availableSlots || [], // Available slots (white boxes - excludes booked appointments)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

