import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { format, addDays, parseISO } from "date-fns"

const HOUR_START = 14 // 2pm
const HOUR_END = 20 // 8pm (last slot is 8pm-9pm)

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const weekStartParam = searchParams.get("week_start")
    let weekStart: Date
    if (weekStartParam) {
      weekStart = parseISO(weekStartParam)
      if (isNaN(weekStart.getTime())) {
        return NextResponse.json({ error: "Invalid week_start" }, { status: 400 })
      }
    } else {
      weekStart = new Date()
      weekStart.setHours(0, 0, 0, 0)
      const day = weekStart.getDay()
      weekStart.setDate(weekStart.getDate() - day)
    }
    // STEM Center closed Saturday; show Sun–Fri only
    const weekEnd = addDays(weekStart, 5) // Friday
    const startStr = format(weekStart, "yyyy-MM-dd")
    const endStr = format(weekEnd, "yyyy-MM-dd")

    const [tutorsRes, availabilityRes, appointmentsRes, coursesRes] = await Promise.all([
      supabase.from("tutors").select("tutor_id, tutor_name").order("tutor_name"),
      supabase.from("tutor_availability").select("tutor_id, day_of_week, start_time, end_time").eq("is_available", true),
      supabase
        .from("appointments")
        .select("tutor_id, appointment_date, start_time, end_time, status")
        .gte("appointment_date", startStr)
        .lte("appointment_date", endStr),
      supabase.from("courses").select("course_id, course_code, course_name").eq("active", true).order("course_name"),
    ])

    if (tutorsRes.error) return NextResponse.json({ error: tutorsRes.error.message }, { status: 500 })
    if (availabilityRes.error) return NextResponse.json({ error: availabilityRes.error.message }, { status: 500 })
    if (appointmentsRes.error) return NextResponse.json({ error: appointmentsRes.error.message }, { status: 500 })

    const tutors = tutorsRes.data || []
    const availability = availabilityRes.data || []
    const appointments = appointmentsRes.data || []
    const courses = coursesRes.data || []

    type SlotStatus = "available" | "booked"
    const slotKey = (tutorId: string, dateStr: string, hour: number) =>
      `${tutorId}|${dateStr}|${hour}`

    const slotStatus: Record<string, SlotStatus> = {}

    for (const tutor of tutors) {
      for (let d = 0; d < 6; d++) {
        const date = addDays(weekStart, d)
        const dateStr = format(date, "yyyy-MM-dd")
        const dayOfWeek = date.getDay()

        const tutorAvail = availability.filter(
          (a) => a.tutor_id === tutor.tutor_id && a.day_of_week === dayOfWeek
        )

        for (let hour = HOUR_START; hour <= HOUR_END; hour++) {
          const key = slotKey(tutor.tutor_id, dateStr, hour)
          const slotStart = `${hour.toString().padStart(2, "0")}:00:00`
          const slotEnd = `${(hour + 1).toString().padStart(2, "0")}:00:00`

          const inAvailability = tutorAvail.some((a) => {
            const aStart = String(a.start_time).slice(0, 8)
            const aEnd = String(a.end_time).slice(0, 8)
            return aStart <= slotStart && aEnd >= slotEnd
          })

          const booked = appointments.some(
            (apt) =>
              apt.tutor_id === tutor.tutor_id &&
              apt.appointment_date === dateStr &&
              String(apt.status) !== "cancelled" &&
              (() => {
                const aptStart = String(apt.start_time).slice(0, 8)
                const aptEnd = String(apt.end_time).slice(0, 8)
                return aptStart < slotEnd && aptEnd > slotStart
              })()
          )

          if (booked) slotStatus[key] = "booked"
          else if (inAvailability) slotStatus[key] = "available"
        }
      }
    }

    const days = Array.from({ length: 6 }, (_, i) => {
      const d = addDays(weekStart, i)
      return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE, MMM d"), dayOfWeek: d.getDay() }
    })

    const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

    return NextResponse.json({
      week_start: startStr,
      week_end: endStr,
      week_label: `${format(weekStart, "MMMM d")} - ${format(weekEnd, "MMMM d, yyyy")}`,
      tutors,
      courses,
      days,
      hours,
      slotStatus,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
