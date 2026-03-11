import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { format, addDays, parseISO } from "date-fns"
import { requireAuth } from "@/lib/auth"

const HOUR_START = 14 // 2pm
const HOUR_END = 20 // 8pm (last slot is 8pm-9pm)

/**
 * Get weekly schedule with tutor availability and appointments
 * GET /api/scheduling/schedule-week
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

    const searchParams = request.nextUrl.searchParams
    const weekStartParam = searchParams.get("week_start")
    const meetingType = searchParams.get("meeting_type") ?? "all" // "all" | "online" | "face_to_face"
    const courseCode = searchParams.get("course_code") ?? "" // when set, only tutors who support this course (by code)
    const focusName = searchParams.get("focus_name") ?? "" // for non-code focuses (match courses.course_name)
    const instructor = searchParams.get("instructor") ?? "" // when set, filter by instructor (with "any instructors" fallback)
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

    const [tutorsRes, availabilityRes, appointmentsRes, coursesRes, tutorCoursesRes] = await Promise.all([
      supabase.from("tutors").select("tutor_id, tutor_name").order("tutor_name"),
      supabase.from("tutor_availability").select("tutor_id, day_of_week, start_time, end_time").eq("is_available", true),
      supabase
        .from("appointments")
        .select("appointment_id, tutor_id, tutor_name, appointment_date, start_time, end_time, status, is_online, is_walk_in, student_name, student_email, course_name, course_code, notes")
        .gte("appointment_date", startStr)
        .lte("appointment_date", endStr),
      supabase.from("courses").select("course_id, course_code, course_name").eq("active", true).order("course_name"),
      courseCode
        ? supabase
            .from("tutor_courses")
            // join through tutor_courses.course_id -> courses.course_id
            .select("tutor_id, courses!inner(course_code)")
            .in(
              "instructor",
              instructor
                ? instructor === "any instructors"
                  ? ["any instructors"]
                  : [instructor, "any instructors"]
                : ["any instructors", instructor].filter(Boolean) as string[]
            )
            .eq("courses.course_code", courseCode)
        : focusName
          ? supabase
              .from("tutor_courses")
              .select("tutor_id, courses!inner(course_name)")
              .in(
                "instructor",
                instructor
                  ? instructor === "any instructors"
                    ? ["any instructors"]
                    : [instructor, "any instructors"]
                  : ["any instructors", instructor].filter(Boolean) as string[]
              )
              .eq("courses.course_name", focusName)
        : Promise.resolve({ data: null, error: null }),
    ])

    if (tutorsRes.error) return NextResponse.json({ error: tutorsRes.error.message }, { status: 500 })
    if (availabilityRes.error) return NextResponse.json({ error: availabilityRes.error.message }, { status: 500 })
    if (appointmentsRes.error) return NextResponse.json({ error: appointmentsRes.error.message }, { status: 500 })

    // Base tutors list from DB (do not dedupe here; filtering relies on tutor_id)
    let tutors = tutorsRes.data || []
    let allowedTutorIds: Set<string> | null = null
    if ((courseCode || focusName) && !tutorCoursesRes.error && tutorCoursesRes.data?.length) {
      allowedTutorIds = new Set((tutorCoursesRes.data as { tutor_id: string }[]).map((r) => r.tutor_id))
      tutors = tutors.filter((t) => allowedTutorIds!.has(t.tutor_id))
    } else if ((courseCode || focusName) && !tutorCoursesRes.error && Array.isArray(tutorCoursesRes.data) && tutorCoursesRes.data.length === 0) {
      allowedTutorIds = new Set()
      tutors = []
    }
    const availability = availabilityRes.data || []
    const appointments = appointmentsRes.data || []
    const courses = coursesRes.data || []

    type SlotStatus = "available" | "booked"
    interface AppointmentDetail {
      appointment_id: string
      tutor_id: string
      tutor_name: string | null
      student_name: string
      student_email: string | null
      course_name: string | null
      course_code: string | null
      start_time: string
      end_time: string
      status: string
      is_online: boolean | null
      is_walk_in: boolean | null
      notes: string | null
    }
    const slotKey = (tutorId: string, dateStr: string, hour: number) =>
      `${tutorId}|${dateStr}|${hour}`

    const slotStatus: Record<string, SlotStatus> = {}
    const slotAppointments: Record<string, AppointmentDetail> = {}

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

          const matchesMeetingType = (apt: { is_online?: boolean | null }) => {
            if (meetingType === "all") return true
            if (meetingType === "online") return apt.is_online === true
            if (meetingType === "face_to_face") return apt.is_online !== true
            return true
          }
          const bookedAppointment = appointments.find(
            (apt) =>
              apt.tutor_id === tutor.tutor_id &&
              apt.appointment_date === dateStr &&
              String(apt.status) !== "cancelled" &&
              matchesMeetingType(apt) &&
              (() => {
                const aptStart = String(apt.start_time).slice(0, 8)
                const aptEnd = String(apt.end_time).slice(0, 8)
                return aptStart < slotEnd && aptEnd > slotStart
              })()
          )

          if (bookedAppointment) {
            slotStatus[key] = "booked"
            slotAppointments[key] = {
              appointment_id: bookedAppointment.appointment_id,
              tutor_id: bookedAppointment.tutor_id,
              tutor_name: bookedAppointment.tutor_name,
              student_name: bookedAppointment.student_name,
              student_email: bookedAppointment.student_email,
              course_name: bookedAppointment.course_name,
              course_code: bookedAppointment.course_code,
              start_time: bookedAppointment.start_time,
              end_time: bookedAppointment.end_time,
              status: bookedAppointment.status,
              is_online: bookedAppointment.is_online,
              is_walk_in: bookedAppointment.is_walk_in,
              notes: bookedAppointment.notes,
            }
          } else if (inAvailability) {
            slotStatus[key] = "available"
          }
        }
      }
    }

    const days = Array.from({ length: 6 }, (_, i) => {
      const d = addDays(weekStart, i)
      return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE, MMM d"), dayOfWeek: d.getDay() }
    })

    const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

    let finalSlotStatus = slotStatus
    let finalSlotAppointments = slotAppointments
    if (allowedTutorIds) {
      finalSlotStatus = {} as Record<string, SlotStatus>
      finalSlotAppointments = {} as Record<string, AppointmentDetail>
      for (const key of Object.keys(slotStatus)) {
        const tutorId = key.split("|")[0]
        if (allowedTutorIds.has(tutorId)) {
          finalSlotStatus[key] = slotStatus[key]
          if (slotAppointments[key]) {
            finalSlotAppointments[key] = slotAppointments[key]
          }
        }
      }
    }

    return NextResponse.json({
      week_start: startStr,
      week_end: endStr,
      week_label: `${format(weekStart, "MMMM d")} - ${format(weekEnd, "MMMM d, yyyy")}`,
      tutors,
      courses,
      days,
      hours,
      slotStatus: finalSlotStatus,
      slotAppointments: finalSlotAppointments,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
