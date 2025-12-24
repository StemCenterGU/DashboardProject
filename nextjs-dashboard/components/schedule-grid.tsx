"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { format, addDays, subDays, parseISO } from "date-fns"

interface Tutor {
  tutor_id: string
  tutor_name: string
}

interface Appointment {
  tutor_id: string
  tutor_name: string
  start_time: string
  end_time: string
  student_name: string
  course_name: string | null
  status: string
  is_online: boolean | null
  is_walk_in: boolean | null
  is_missed: boolean | null
}

interface Availability {
  tutor_id: string
  start_time: string
  end_time: string
}

interface ScheduleData {
  date: string
  tutors: Tutor[]
  appointments: Appointment[]
  availability: Availability[]
}

// Generate time slots dynamically from data
function generateTimeSlots(availability: Availability[], appointments: Appointment[]): string[] {
  const allTimes = new Set<string>()
  
  // Add times from availability
  availability.forEach(avail => {
    const start = avail.start_time.substring(0, 5) // HH:MM
    const end = avail.end_time.substring(0, 5)
    allTimes.add(start)
    allTimes.add(end)
  })
  
  // Add times from appointments
  appointments.forEach(apt => {
    const start = apt.start_time.substring(0, 5)
    const end = apt.end_time.substring(0, 5)
    allTimes.add(start)
    allTimes.add(end)
  })
  
  // Convert to array, sort, and fill in hourly slots
  const sortedTimes = Array.from(allTimes).sort()
  if (sortedTimes.length === 0) {
    // Default fallback: 1 PM to 8 PM
    return ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]
  }
  
  const minHour = parseInt(sortedTimes[0].split(':')[0])
  const maxHour = parseInt(sortedTimes[sortedTimes.length - 1].split(':')[0])
  const slots: string[] = []
  
  for (let hour = minHour; hour <= maxHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`)
  }
  
  return slots
}

function formatTimeLabel(timeSlot: string): string {
  const [hours, minutes] = timeSlot.split(':').map(Number)
  const period = hours >= 12 ? 'pm' : 'am'
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

function getCellStatus(
  tutorId: string,
  timeSlot: string,
  appointments: Appointment[],
  availability: Availability[]
): "available" | "booked" | "unavailable" {
  // Check if there's an appointment at this time
  const appointment = appointments.find(apt => {
    const aptStart = apt.start_time.substring(0, 5) // HH:MM
    const aptEnd = apt.end_time.substring(0, 5)
    return apt.tutor_id === tutorId && aptStart <= timeSlot && aptEnd > timeSlot
  })

  if (appointment) {
    return "booked"
  }

  // Check if tutor is available at this time
  const isAvailable = availability.some(avail => {
    const availStart = avail.start_time.substring(0, 5)
    const availEnd = avail.end_time.substring(0, 5)
    return avail.tutor_id === tutorId && availStart <= timeSlot && availEnd > timeSlot
  })

  return isAvailable ? "available" : "unavailable"
}

function getAppointmentForCell(
  tutorId: string,
  timeSlot: string,
  appointments: Appointment[]
): Appointment | undefined {
  return appointments.find(apt => {
    const aptStart = apt.start_time.substring(0, 5)
    const aptEnd = apt.end_time.substring(0, 5)
    return apt.tutor_id === tutorId && aptStart <= timeSlot && aptEnd > timeSlot
  })
}

export function ScheduleGrid() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScheduleData = async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/scheduling/schedule-grid?date=${date}`)
      if (!response.ok) {
        throw new Error("Failed to fetch schedule data")
      }
      const data = await response.json()
      setScheduleData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduleData(selectedDate)
  }, [selectedDate])

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate)
  }

  const handlePreviousDay = () => {
    const date = parseISO(selectedDate)
    const prevDate = subDays(date, 1)
    setSelectedDate(format(prevDate, "yyyy-MM-dd"))
  }

  const handleNextDay = () => {
    const date = parseISO(selectedDate)
    const nextDate = addDays(date, 1)
    setSelectedDate(format(nextDate, "yyyy-MM-dd"))
  }

  const formatDateHeader = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      const dayName = format(date, "EEEE") // Full day name
      const monthDay = format(date, "MMM. d") // "Aug. 24"
      return `${monthDay}: ${dayName}`
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading schedule...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!scheduleData) {
    return null
  }

  // Generate time slots dynamically from data
  const timeSlots = generateTimeSlots(scheduleData.availability, scheduleData.appointments)
  const timeLabels = timeSlots.map(formatTimeLabel)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              {formatDateHeader(scheduleData.date)}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-[180px]"
            />
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => fetchScheduleData(selectedDate)}>
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-blue-700 text-white p-3 text-left font-semibold sticky left-0 z-10 shadow-md">
                    {formatDateHeader(scheduleData.date)}
                  </th>
                  {timeLabels.map((time, index) => (
                    <th
                      key={index}
                      className="border border-gray-300 bg-blue-700 text-white p-3 text-center font-semibold min-w-[100px]"
                    >
                      {time}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleData.tutors.map((tutor) => (
                  <tr key={tutor.tutor_id}>
                    <td className="border border-gray-300 bg-gray-50 p-3 font-medium sticky left-0 z-10 shadow-md">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">✎</span>
                        <span>{tutor.tutor_name}</span>
                      </div>
                    </td>
                    {timeSlots.map((timeSlot, index) => {
                      const status = getCellStatus(
                        tutor.tutor_id,
                        timeSlot,
                        scheduleData.appointments,
                        scheduleData.availability
                      )
                      const appointment = getAppointmentForCell(
                        tutor.tutor_id,
                        timeSlot,
                        scheduleData.appointments
                      )

                      let cellClass = "border border-gray-300 p-2 min-h-[50px] transition-colors "
                      if (status === "booked") {
                        // Priority: Walk-in (green) > No-show (yellow) > Online (blue) > Regular (orange)
                        const isWalkIn = appointment?.is_walk_in === true
                        const isMissed = appointment?.is_missed === true
                        const isOnline = appointment?.is_online === true
                        
                        if (isWalkIn) {
                          cellClass += "bg-green-500 hover:bg-green-600 cursor-pointer"
                        } else if (isMissed) {
                          cellClass += "bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
                        } else if (isOnline) {
                          cellClass += "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                        } else {
                          cellClass += "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                        }
                      } else if (status === "available") {
                        cellClass += "bg-gray-200 hover:bg-gray-300 cursor-pointer"
                      } else {
                        cellClass += "bg-gray-600 hover:bg-gray-700 cursor-not-allowed"
                      }

                      const appointmentInfo = appointment 
                        ? `${appointment.student_name} - ${appointment.course_name || "No course"}${appointment.is_online ? " (Online)" : ""}`
                        : status

                      return (
                        <td key={index} className={cellClass} title={appointmentInfo}>
                          {appointment && (
                            <div className="text-xs text-white font-medium">
                              {appointment.student_name}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

