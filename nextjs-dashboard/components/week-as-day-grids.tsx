"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"

/** Same as ScheduleGrid: "Feb. 16: Monday" */
function formatDateHeader(dateString: string): string {
  try {
    const date = parseISO(dateString)
    const dayName = format(date, "EEEE")
    const monthDay = format(date, "MMM. d")
    return `${monthDay}: ${dayName}`
  } catch {
    return dateString
  }
}

/** Same as ScheduleGrid: "8:00 am", "12:00 pm" */
function formatTimeLabel(hour: number): string {
  const period = hour >= 12 ? "pm" : "am"
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:00 ${period}`
}

interface Tutor {
  tutor_id: string
  tutor_name: string
}

interface Day {
  date: string
  label: string
  dayOfWeek: number
}

export interface AppointmentDetail {
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

interface WeekData {
  week_start: string
  week_end: string
  week_label: string
  tutors: Tutor[]
  days: Day[]
  hours: number[]
  slotStatus: Record<string, "available" | "booked">
  slotAppointments: Record<string, AppointmentDetail>
}

interface WeekAsDayGridsProps {
  weekStart: string
  staffFilter?: string
  courseFilter?: string
  meetingTypeFilter?: string
  apiPath?: string
  onSlotClick?: (tutorId: string, tutorName: string, date: string, hour: number) => void
  onBookedSlotClick?: (appointment: AppointmentDetail, tutorName: string, date: string, hour: number) => void
}

const slotKey = (tutorId: string, dateStr: string, hour: number) =>
  `${tutorId}|${dateStr}|${hour}`

export function WeekAsDayGrids({
  weekStart,
  staffFilter = "all",
  courseFilter = "all",
  meetingTypeFilter = "all",
  apiPath = "/api/scheduling/schedule-week",
  onSlotClick,
  onBookedSlotClick,
}: WeekAsDayGridsProps) {
  const [data, setData] = useState<WeekData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ week_start: weekStart })
    if (meetingTypeFilter && meetingTypeFilter !== "all") {
      params.set("meeting_type", meetingTypeFilter)
    }
    if (courseFilter && courseFilter !== "all") {
      let raw = courseFilter
      let instructor = ""
      const instrMarker = "|instr:"
      const instrIdx = raw.indexOf(instrMarker)
      if (instrIdx >= 0) {
        instructor = raw.slice(instrIdx + instrMarker.length)
        raw = raw.slice(0, instrIdx)
      }

      if (raw.startsWith("name:")) {
        params.set("focus_name", raw.slice("name:".length))
      } else {
        // raw is a course_code (e.g. "BCOR105")
        params.set("course_code", raw)
      }

      if (instructor) {
        params.set("instructor", instructor)
      }
    }
    fetch(`${apiPath}?${params.toString()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`)
        }
        return res.json()
      })
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch((error) => {
        console.error("Error fetching week schedule:", error)
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiPath, weekStart, meetingTypeFilter, courseFilter])

  const tutors = data?.tutors ?? []
  const days = data?.days ?? []
  const hours = data?.hours ?? []
  const slotStatus = data?.slotStatus ?? {}
  const slotAppointments = data?.slotAppointments ?? {}

  // Does this tutor have any slot (available or booked) on this day?
  const hasAnySlotForDay = (tutorId: string, dateStr: string) =>
    hours.some((hour) => {
      const key = slotKey(tutorId, dateStr, hour)
      return slotStatus[key] !== undefined
    })

  const filteredTutors =
    staffFilter === "all" ? tutors : tutors.filter((t) => t.tutor_id === staffFilter)

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading schedule...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-red-500">Failed to load schedule.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {days.map((day) => {
        const tutorsForDay = filteredTutors.filter((tutor) =>
          hasAnySlotForDay(tutor.tutor_id, day.date)
        )
        return (
        <Card key={day.date}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-blue-700 text-white p-3 text-left font-semibold sticky left-0 z-10 shadow-md min-w-[140px]">
                      {formatDateHeader(day.date)}
                    </th>
                    {hours.map((hour) => (
                      <th
                        key={hour}
                        className="border border-gray-300 bg-blue-700 text-white p-3 text-center font-semibold min-w-[100px]"
                      >
                        {formatTimeLabel(hour)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tutorsForDay.map((tutor) => (
                    <tr key={tutor.tutor_id}>
                      <td className="border border-gray-300 bg-gray-50 p-3 font-medium sticky left-0 z-10 shadow-md">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-sm">✎</span>
                          <span>{tutor.tutor_name}</span>
                        </div>
                      </td>
                      {hours.map((hour) => {
                        const key = slotKey(tutor.tutor_id, day.date, hour)
                        const status = slotStatus[key]
                        let isAvailable = status === "available"
                        const isBooked = status === "booked"

                        // Check if this slot is in the past
                        const now = new Date()
                        const slotDate = new Date(day.date + "T00:00:00")
                        slotDate.setHours(hour, 0, 0, 0)
                        const isPast = slotDate < now

                        // Disable past slots
                        if (isPast && isAvailable) {
                          isAvailable = false
                        }

                        let cellClass =
                          "border border-gray-300 p-2 min-h-[50px] transition-colors "
                        if (isBooked) {
                          cellClass += "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                        } else if (isAvailable) {
                          cellClass += "bg-white hover:bg-gray-100 cursor-pointer"
                        } else {
                          cellClass += "bg-gray-600 hover:bg-gray-700 cursor-not-allowed"
                        }

                        let title = isAvailable
                          ? `Available - ${formatTimeLabel(hour)}`
                          : isBooked
                            ? `Booked - ${slotAppointments[key]?.student_name ?? "Click for details"}`
                            : "Not available"

                        // Update title for past slots
                        if (isPast && status === "available") {
                          title = "Past time slot - unavailable"
                        }

                        const handleClick = () => {
                          if (isAvailable && !isPast && onSlotClick) {
                            onSlotClick(tutor.tutor_id, tutor.tutor_name, day.date, hour)
                          } else if (isBooked && onBookedSlotClick) {
                            const appointment = slotAppointments[key]
                            if (appointment) {
                              onBookedSlotClick(appointment, tutor.tutor_name, day.date, hour)
                            }
                          }
                        }

                        return (
                          <td
                            key={hour}
                            className={cellClass}
                            title={title}
                            onClick={handleClick}
                          />
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )})}
      {filteredTutors.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tutors to display.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
