"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Clock, Users, BookOpen, Plus, Search, Loader2, ChevronDown } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO } from "date-fns"
import { WeekAsDayGrids } from "@/components/week-as-day-grids"
import { TodayAppointments, UpcomingAppointments } from "@/components/scheduling"

interface Appointment {
  appointment_id: string
  tutor_name: string
  student_name: string
  course_name?: string
  appointment_date: string
  start_time: string
  end_time: string
  status: string
}

interface Tutor {
  tutor_id: string
  tutor_name: string
}

interface Availability {
  availability_id: string
  tutor_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface Course {
  course_id: string
  course_code: string | null
  course_name: string
}

interface FocusOption {
  focus_id: string
  course_code: string | null
  focus_label: string
}

export default function SchedulingPage() {
  const [activeTab, setActiveTab] = useState("schedule")
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState({ today: false, upcoming: false, tutors: false, availability: false })

  // Pagination state for upcoming appointments
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  // Schedule grid tab: selected date and WCOnline-style filters
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })
  const [scheduleTutors, setScheduleTutors] = useState<Tutor[]>([])
  const [scheduleCourses, setScheduleCourses] = useState<Course[]>([])
  const [scheduleFocusOptions, setScheduleFocusOptions] = useState<FocusOption[]>([])
  const [staffFilter, setStaffFilter] = useState<string>("all")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [meetingTypeFilter, setMeetingTypeFilter] = useState<string>("all")
  const scheduleDateInputRef = useRef<HTMLInputElement>(null)

  const normalizeFocusName = (label: string) => {
    const trimmed = label.trim()
    return trimmed.endsWith(" Only") ? trimmed.slice(0, -5).trim() : trimmed
  }

  const parseInstructorFromLabel = (label: string) => {
    const noOnly = normalizeFocusName(label)
    const dashIdx = noOnly.lastIndexOf(" - ")
    if (dashIdx < 0) return "any instructors"
    const instr = noOnly.slice(dashIdx + 3).trim()
    return instr || "any instructors"
  }

  // Get today's date in local timezone (YYYY-MM-DD format)
  const getLocalDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const today = getLocalDate(new Date())

  // Get tomorrow's date for upcoming appointments
  const getTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return getLocalDate(tomorrow)
  }

  useEffect(() => {
    if (activeTab === "appointments") {
      fetchTodayAppointments()
      fetchUpcomingAppointments(currentPage)
    } else if (activeTab === "tutors") {
      fetchTutors()
    } else if (activeTab === "availability") {
      fetchAvailability()
      fetchTutors()
    } else if (activeTab === "schedule") {
      // Fetch tutors and courses for schedule grid
      Promise.all([
        fetch("/api/scheduling/tutors").then((res) => res.ok ? res.json() : { tutors: [] }),
        fetch("/api/scheduling/schedule-week").then((res) => res.ok ? res.json() : { courses: [] }),
        fetch("/api/scheduling/focus-options").then((res) => res.ok ? res.json() : { options: [] }),
      ])
        .then(([tutorsData, weekData, focusData]) => {
          setScheduleTutors(tutorsData.tutors ?? [])
          setScheduleCourses(weekData.courses ?? [])
          setScheduleFocusOptions(focusData.options ?? [])
        })
        .catch(() => {
          setScheduleTutors([])
          setScheduleCourses([])
          setScheduleFocusOptions([])
        })
    }
  }, [activeTab, currentPage])

  const fetchTodayAppointments = async () => {
    setLoading(prev => ({ ...prev, today: true }))
    try {
      // Fetch only today's appointments
      const response = await fetch(`/api/scheduling/appointments?limit=50&start_date=${today}&end_date=${today}&sort=asc`)
      if (response.ok) {
        const data = await response.json()
        setTodayAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error("Error fetching today's appointments:", error)
    } finally {
      setLoading(prev => ({ ...prev, today: false }))
    }
  }

  const fetchUpcomingAppointments = async (page: number = 1) => {
    setLoading(prev => ({ ...prev, upcoming: true }))
    try {
      // Fetch appointments starting from tomorrow
      const tomorrow = getTomorrow()
      const response = await fetch(`/api/scheduling/appointments?limit=${itemsPerPage}&page=${page}&start_date=${tomorrow}&sort=asc`)
      if (response.ok) {
        const data = await response.json()
        setUpcomingAppointments(data.appointments || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.total || 0)
      }
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error)
    } finally {
      setLoading(prev => ({ ...prev, upcoming: false }))
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const fetchTutors = async () => {
    setLoading(prev => ({ ...prev, tutors: true }))
    try {
      const response = await fetch("/api/scheduling/tutors")
      if (response.ok) {
        const data = await response.json()
        setTutors(data.tutors || [])
      }
    } catch (error) {
      console.error("Error fetching tutors:", error)
    } finally {
      setLoading(prev => ({ ...prev, tutors: false }))
    }
  }

  const fetchAvailability = async () => {
    setLoading(prev => ({ ...prev, availability: true }))
    try {
      const response = await fetch("/api/scheduling/availability")
      if (response.ok) {
        const data = await response.json()
        setAvailability(data.availability || [])
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
    } finally {
      setLoading(prev => ({ ...prev, availability: false }))
    }
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[dayOfWeek]
  }

  // Week range and nav for schedule grid (WCOnline-style)
  const scheduleDate = parseISO(selectedScheduleDate)
  const weekStart = startOfWeek(scheduleDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(scheduleDate, { weekStartsOn: 0 })
  const weekRangeLabel = `${format(weekStart, "MMMM d")} - ${format(weekEnd, "MMMM d, yyyy")}`
  const weekStartStr = format(weekStart, "yyyy-MM-dd")
  const goPrevWeek = () => setSelectedScheduleDate(format(subWeeks(weekStart, 1), "yyyy-MM-dd"))
  const goNextWeek = () => setSelectedScheduleDate(format(addWeeks(weekStart, 1), "yyyy-MM-dd"))
  const goCurrentWeek = () => setSelectedScheduleDate(today)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduling</h1>
          <p className="text-muted-foreground">Manage appointments and availability</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === "schedule" ? "default" : "ghost"}
          onClick={() => setActiveTab("schedule")}
        >
          Schedule Grid
        </Button>
        <Button
          variant={activeTab === "appointments" ? "default" : "ghost"}
          onClick={() => setActiveTab("appointments")}
        >
          Appointments
        </Button>
        <Button
          variant={activeTab === "tutors" ? "default" : "ghost"}
          onClick={() => setActiveTab("tutors")}
        >
          Tutors
        </Button>
        <Button
          variant={activeTab === "availability" ? "default" : "ghost"}
          onClick={() => setActiveTab("availability")}
        >
          Availability
        </Button>
      </div>

      {/* Schedule Grid View - WCOnline-style: title, week nav, instructions, display options, then grid */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          {/* Title and week navigation - WCOnline style */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a5f]">STEM Center</h2>
              <p className="text-muted-foreground mt-1">{weekRangeLabel}</p>
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                <Button variant="link" className="p-0 h-auto text-blue-600 underline" onClick={goPrevWeek}>
                  Previous Week
                </Button>
                <span className="text-muted-foreground">|</span>
                <Button variant="link" className="p-0 h-auto text-blue-600 underline" onClick={goCurrentWeek}>
                  Current Week
                </Button>
                <span className="text-muted-foreground">|</span>
                <Button variant="link" className="p-0 h-auto text-blue-600 underline" onClick={goNextWeek}>
                  Next Week
                </Button>
                <input
                  ref={scheduleDateInputRef}
                  type="date"
                  className="sr-only"
                  value={selectedScheduleDate}
                  onChange={(e) => setSelectedScheduleDate(e.target.value)}
                  aria-label="Pick date"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-1"
                  onClick={() => {
                    const el = scheduleDateInputRef.current
                    if (el) {
                      if (typeof (el as HTMLInputElement).showPicker === "function") (el as HTMLInputElement).showPicker()
                      else el.click()
                    }
                  }}
                  type="button"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
              Area Tools
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Instructions box - light grey, blue text */}
          <Card className="border-gray-200 bg-gray-100/80 rounded-lg">
            <CardContent className="pt-4 pb-4 text-sm text-blue-800 space-y-2">
              <p>
                Use the &quot;Course or Focus&quot; drop-down menu to filter by tutors who will be able to work with the course you need help with!
              </p>
              <p>
                Click on the start time block for a tutor who can assist you with the course you have chosen.
              </p>
              <p>
                Then, complete the appointment registration form pop-up; we encourage you to choose a 60-minute appointment by adjusting the end time, near the top.
              </p>
              <p>
                Email stemcenter@gannon.edu for any further assistance!
              </p>
            </CardContent>
          </Card>

          {/* Display Options */}
          <div className="w-full space-y-2">
            <h3 className="text-sm font-semibold">Display Options</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex min-w-0 flex-col gap-1">
                <label className="text-xs text-muted-foreground">Staff &amp; Resources</label>
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
                >
                  <option value="all">Show All Staff &amp; Resources</option>
                  {scheduleTutors.map((t) => (
                    <option key={t.tutor_id} value={t.tutor_id}>{t.tutor_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label className="text-xs text-muted-foreground">Course or Focus</label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-full min-w-0 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&>span]:truncate"
                    >
                      <span className="truncate">
                        {courseFilter === "all"
                          ? "Show All \"Course or Focus\" Options"
                          : (() => {
                              const o = scheduleFocusOptions.find((x) => {
                                const base =
                                  x.course_code ?? `name:${normalizeFocusName(x.focus_label)}`
                                const instr = parseInstructorFromLabel(x.focus_label)
                                const value = `${base}|instr:${instr}`
                                return value === courseFilter
                              })
                              return o ? o.focus_label : "Show All \"Course or Focus\" Options"
                            })()}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] min-w-[var(--radix-dropdown-menu-trigger-width)]">
                    <DropdownMenuItem onClick={() => setCourseFilter("all")}>
                      Show All &quot;Course or Focus&quot; Options
                    </DropdownMenuItem>
                    {scheduleFocusOptions.map((o) => (
                      <DropdownMenuItem
                        key={o.focus_id}
                        onClick={() => {
                          const base =
                            o.course_code ?? `name:${normalizeFocusName(o.focus_label)}`
                          const instr = parseInstructorFromLabel(o.focus_label)
                          setCourseFilter(`${base}|instr:${instr}`)
                        }}
                      >
                        {o.focus_label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label className="text-xs text-muted-foreground">Meeting Types</label>
                <select
                  value={meetingTypeFilter}
                  onChange={(e) => setMeetingTypeFilter(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
                >
                  <option value="all">Show All Meeting Types</option>
                  <option value="face_to_face">Face-to-Face Only</option>
                  <option value="online">Online Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* All 7 days in previous single-day style: one table per day, same layout (date + time across top, tutors as rows), scrollable */}
          <WeekAsDayGrids
            weekStart={weekStartStr}
            staffFilter={staffFilter}
            courseFilter={courseFilter}
            meetingTypeFilter={meetingTypeFilter}
          />
        </div>
      )}

      {/* Appointments View */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          {/* Today's Appointments - Using reusable component */}
          <TodayAppointments
            appointments={todayAppointments}
            date={today}
            loading={loading.today}
          />

          {/* Upcoming Appointments - Using reusable component */}
          <UpcomingAppointments
            appointments={upcomingAppointments}
            loading={loading.upcoming}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Tutors View */}
      {activeTab === "tutors" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tutor Management</CardTitle>
                <CardDescription>View and manage tutors</CardDescription>
              </div>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Tutor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading.tutors ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tutors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>No tutors found</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {tutors.map((tutor) => (
                  <div key={tutor.tutor_id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">{tutor.tutor_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Availability View */}
      {activeTab === "availability" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tutor Availability</CardTitle>
              <CardDescription>Manage tutor availability schedules</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading.availability ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availability.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <p>No availability schedules found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tutors.map((tutor) => {
                  const tutorAvailability = availability.filter(avail => avail.tutor_id === tutor.tutor_id)
                  if (tutorAvailability.length === 0) return null

                  return (
                    <div key={tutor.tutor_id} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">{tutor.tutor_name}</h3>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {tutorAvailability.map((avail) => (
                          <div key={avail.availability_id} className="text-sm border rounded p-2">
                            <p className="font-medium">{getDayName(avail.day_of_week)}</p>
                            <p className="text-muted-foreground">
                              {avail.start_time} - {avail.end_time}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}

