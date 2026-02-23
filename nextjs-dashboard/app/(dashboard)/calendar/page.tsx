"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, X, Clock, User, BookOpen, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { format, parseISO, isToday, isSameDay } from "date-fns"

interface Appointment {
  appointment_id: string
  appointment_date: string
  start_time: string
  end_time: string
  student_name: string
  tutor_name: string
  course_name: string | null
  status: string
  is_online?: boolean
  is_walk_in?: boolean
  is_missed?: boolean
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<Appointment[]>([])
  
  const month = currentDate.toLocaleString('default', { month: 'long' })
  const year = currentDate.getFullYear()
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Helper to format a Date as local YYYY-MM-DD (avoids UTC timezone shifts)
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Fetch appointments for the current month
  useEffect(() => {
    fetchAppointmentsForMonth()
  }, [currentDate])

  const fetchAppointmentsForMonth = async () => {
    setLoading(true)
    try {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      // Use local-date strings so they match how appointment_date is stored
      const startDate = formatLocalDate(firstDay)
      const endDate = formatLocalDate(lastDay)

      const response = await fetch(
        `/api/scheduling/appointments-by-range?start_date=${startDate}&end_date=${endDate}`
      )
      if (!response.ok) throw new Error('Failed to fetch appointments')
      
      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate calendar days
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()
  
  const days = []
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointments.filter(apt => apt.appointment_date === dateStr)
  }

  // Handle day click
  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(date)
    const dayAppointments = getAppointmentsForDay(day)
    setSelectedDayAppointments(dayAppointments)
  }

  // Get status color
  const getStatusColor = (status: string, isOnline?: boolean, isWalkIn?: boolean, isMissed?: boolean) => {
    if (isMissed) return 'bg-yellow-500'
    if (isWalkIn) return 'bg-green-500'
    if (isOnline) return 'bg-blue-500'
    if (status === 'completed') return 'bg-green-600'
    if (status === 'cancelled') return 'bg-red-500'
    return 'bg-orange-500'
  }

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${period}`
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">View appointments and schedule</p>
        </div>
        <Button onClick={goToToday} variant="outline">
          Today
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{month} {year}</CardTitle>
              <CardDescription>Monthly appointment calendar</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              const dayAppointments = day ? getAppointmentsForDay(day) : []
              const dayDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null
              const isCurrentDay = dayDate && isToday(dayDate)
              const isSelected = dayDate && selectedDate && isSameDay(dayDate, selectedDate)
              
              return (
                <div
                  key={index}
                  onClick={() => day && handleDayClick(day)}
                  className={`aspect-square border rounded-lg p-2 transition-all ${
                    day === null
                      ? 'bg-muted/30 cursor-default'
                      : isSelected
                      ? 'bg-primary/20 border-primary border-2 shadow-md'
                      : isCurrentDay
                      ? 'bg-primary/10 border-primary hover:bg-primary/15 cursor-pointer'
                      : 'bg-background hover:bg-muted/50 cursor-pointer border-gray-200'
                  }`}
                >
                  {day && (
                    <div className="h-full flex flex-col">
                      <div className={`text-sm font-medium ${
                        isCurrentDay ? 'text-primary' : isSelected ? 'text-primary font-bold' : ''
                      }`}>
                        {day}
                      </div>
                      <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                        {loading ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          </div>
                        ) : dayAppointments.length > 0 ? (
                          <>
                            <div className="text-xs font-semibold text-primary">
                              {dayAppointments.length} {dayAppointments.length === 1 ? 'appt' : 'appts'}
                            </div>
                            <div className="flex flex-wrap gap-0.5">
                              {dayAppointments.slice(0, 3).map((apt, idx) => (
                                <div
                                  key={apt.appointment_id || idx}
                                  className={`w-2 h-2 rounded-full ${getStatusColor(apt.status, apt.is_online, apt.is_walk_in, apt.is_missed)}`}
                                  title={`${apt.student_name} - ${formatTime(apt.start_time)}`}
                                />
                              ))}
                              {dayAppointments.length > 3 && (
                                <div className="text-[8px] text-muted-foreground">+{dayAppointments.length - 3}</div>
                              )}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Appointments Panel */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <CardDescription>
                  {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'appointment' : 'appointments'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No appointments scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayAppointments
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((apt) => (
                    <div
                      key={apt.appointment_id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{apt.student_name}</span>
                            {apt.is_online && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                Online
                              </span>
                            )}
                            {apt.is_walk_in && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                Walk-in
                              </span>
                            )}
                            {apt.is_missed && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                Missed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(apt.start_time)} - {formatTime(apt.end_time)}</span>
                            </div>
                            {apt.tutor_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{apt.tutor_name}</span>
                              </div>
                            )}
                            {apt.course_name && (
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                <span>{apt.course_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                            apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            apt.status === 'missed' || apt.status === 'no_show' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
          <CardDescription>Calendar indicators and appointment types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Day Indicators</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/10 border border-primary"></div>
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/20 border-2 border-primary"></div>
                  <span>Selected day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-background border border-gray-200"></div>
                  <span>Regular day</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Appointment Types</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Regular appointment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Online appointment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Walk-in appointment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Missed/No-show</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

