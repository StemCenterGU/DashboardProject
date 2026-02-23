"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { format, addWeeks, subWeeks, startOfWeek, parseISO } from "date-fns"
import Link from "next/link"

/** Same as old ScheduleGrid: "Aug. 24: Monday" */
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

/** Same as old ScheduleGrid: "1:00 pm", "12:00 pm" */
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

interface WeekData {
  week_start: string
  week_end: string
  week_label: string
  tutors: Tutor[]
  courses: { course_id: string; course_code: string | null; course_name: string }[]
  days: Day[]
  hours: number[]
  slotStatus: Record<string, "available" | "booked">
}

interface WeekScheduleGridProps {
  /** API path for week data, e.g. /api/scheduling/schedule-week */
  apiPath?: string
  /** Title above week range, e.g. "STEM Center" */
  title?: string
  /** Show "Back to Replica" link */
  showBackLink?: boolean
  /** Controlled week start (YYYY-MM-DD, Sunday). When set with onWeekChange, parent controls the week. */
  weekStart?: string
  /** Called when the user changes the week (e.g. Previous/Next/Current Week). */
  onWeekChange?: (weekStart: string) => void
  /** When true, only render the grid card (no title, instructions, or display options). Use when parent provides those. */
  gridOnly?: boolean
  /** When provided (e.g. from parent Display Options), filter grid to this staff id or "all". */
  staffFilter?: string
  /** When provided, filter by course id or "all". */
  courseFilter?: string
}

export function WeekScheduleGrid({
  apiPath = "/api/scheduling/schedule-week",
  title = "STEM Center",
  showBackLink = false,
  weekStart: controlledWeekStart,
  onWeekChange,
  gridOnly = false,
  staffFilter: controlledStaffFilter,
  courseFilter: controlledCourseFilter,
}: WeekScheduleGridProps) {
  const [internalWeekStart, setInternalWeekStart] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    return d
  })
  const weekStartDate = controlledWeekStart != null ? parseISO(controlledWeekStart) : internalWeekStart
  const startStr = format(weekStartDate, "yyyy-MM-dd")

  const setWeekStart = (d: Date) => {
    const str = format(d, "yyyy-MM-dd")
    if (onWeekChange) onWeekChange(str)
    else setInternalWeekStart(d)
  }

  const [data, setData] = useState<WeekData | null>(null)
  const [loading, setLoading] = useState(true)
  const [internalStaffFilter, setInternalStaffFilter] = useState<string>("all")
  const [internalCourseFilter, setInternalCourseFilter] = useState<string>("all")
  const staffFilter = controlledStaffFilter ?? internalStaffFilter
  const courseFilter = controlledCourseFilter ?? internalCourseFilter

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${apiPath}?week_start=${startStr}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiPath, startStr])

  const goPrev = () => setWeekStart(subWeeks(weekStartDate, 1))
  const goNext = () => setWeekStart(addWeeks(weekStartDate, 1))
  const goCurrent = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setWeekStart(startOfWeek(d, { weekStartsOn: 0 }))
  }

  const tutors = data?.tutors ?? []
  const days = data?.days ?? []
  const hours = data?.hours ?? []
  const slotStatus = data?.slotStatus ?? {}
  const courses = data?.courses ?? []

  const slotKey = (tutorId: string, dateStr: string, hour: number) =>
    `${tutorId}|${dateStr}|${hour}`

  const filteredTutors =
    staffFilter === "all"
      ? tutors
      : tutors.filter((t) => t.tutor_id === staffFilter)

  const gridCard = (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-blue-700 text-white p-3 text-left font-semibold sticky left-0 z-10 shadow-md min-w-[140px]">
                    Tutor
                  </th>
                  {days.map((day) => (
                    <th
                      key={day.date}
                      className="border border-gray-300 bg-blue-700 text-white p-3 text-center font-semibold whitespace-nowrap"
                    >
                      {formatDateHeader(day.date)}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="border border-gray-300 bg-blue-700 text-white p-1 sticky left-0 z-10 shadow-md" />
                  {days.map((day) => (
                    <th key={day.date} className="border border-gray-300 bg-blue-700 text-white p-1">
                      <div className="flex flex-col gap-0.5">
                        {hours.map((hour) => (
                          <div
                            key={hour}
                            className="text-[10px] text-blue-100 h-6 flex items-center justify-center"
                          >
                            {formatTimeLabel(hour)}
                          </div>
                        ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTutors.map((tutor) => (
                  <tr key={tutor.tutor_id}>
                    <td className="border border-gray-300 bg-gray-50 p-3 font-medium sticky left-0 z-10 shadow-md">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">✎</span>
                        <span>{tutor.tutor_name}</span>
                      </div>
                    </td>
                    {days.map((day) => (
                      <td key={day.date} className="p-0 border border-gray-300 align-top">
                        <div className="flex flex-col">
                          {hours.map((hour) => {
                            const key = slotKey(tutor.tutor_id, day.date, hour)
                            const status = slotStatus[key]
                            const isAvailable = status === "available"
                            const isBooked = status === "booked"
                            let cellClass =
                              "h-6 w-full min-w-[28px] border-b border-gray-300 transition-colors "
                            if (isBooked) {
                              cellClass += "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                            } else if (isAvailable) {
                              cellClass += "bg-gray-200 hover:bg-gray-300 cursor-pointer"
                            } else {
                              cellClass += "bg-gray-600 cursor-not-allowed"
                            }
                            return (
                              <div
                                key={hour}
                                className={cellClass}
                                title={
                                  isAvailable
                                    ? `Available - ${formatDateHeader(day.date)} ${formatTimeLabel(hour)}`
                                    : isBooked
                                    ? "Booked"
                                    : "Not available"
                                }
                              />
                            )
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filteredTutors.length === 0 && (
            <p className="p-6 text-muted-foreground text-center">No tutors to display.</p>
          )}
        </CardContent>
      </Card>
  )

  if (gridOnly) {
    return gridCard
  }

  return (
    <div className="space-y-6">
      {/* Title and week nav - WCOnline style */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f]">
            {title}
          </h2>
          <p className="text-muted-foreground mt-1">
            {data?.week_label ?? format(weekStartDate, "MMMM d") + " - ..."}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
              Previous Week
            </Button>
            <Button variant="outline" size="sm" onClick={goCurrent}>
              Current Week
            </Button>
            <Button variant="outline" size="sm" onClick={goNext}>
              Next Week
              <CalendarIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        {showBackLink && (
          <Link href="/replica">
            <Button variant="outline" size="sm">Back to Replica</Button>
          </Link>
        )}
      </div>

      {/* Instructions - blue text box like WCOnline */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-4 pb-4 text-sm text-blue-800 space-y-1">
          <p>
            Use the <strong>&quot;Course or Focus&quot;</strong> drop-down to filter by tutors who can help with the course you need.
          </p>
          <p>
            Click on a <strong>start time</strong> block for a tutor to book an appointment.
          </p>
          <p>
            Complete the appointment form; we recommend choosing a <strong>60-minute</strong> slot by adjusting the end time.
          </p>
          <p>
            Email stemcenter@gannon.edu for assistance.
          </p>
        </CardContent>
      </Card>

      {/* Display options - dropdowns */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Display Options</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Staff &amp; Resources</label>
            <select
              value={staffFilter}
              onChange={(e) => setInternalStaffFilter(e.target.value)}
              className="border rounded px-3 py-2 bg-background text-foreground min-w-[200px]"
            >
              <option value="all">Show All Staff &amp; Resources</option>
              {tutors.map((t) => (
                <option key={t.tutor_id} value={t.tutor_id}>
                  {t.tutor_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Course or Focus</label>
            <select
              value={courseFilter}
              onChange={(e) => setInternalCourseFilter(e.target.value)}
              className="border rounded px-3 py-2 bg-background text-foreground min-w-[220px]"
            >
              <option value="all">Show All &quot;Course or Focus&quot; Options</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_code ? `${c.course_code}: ` : ""}{c.course_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Meeting Types</label>
            <select className="border rounded px-3 py-2 bg-background text-foreground min-w-[180px]">
              <option>Show All Meeting Types</option>
            </select>
          </div>
        </div>
      </div>

      {gridCard}
    </div>
  )
}
