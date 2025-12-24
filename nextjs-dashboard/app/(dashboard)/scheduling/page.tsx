"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Users, BookOpen, Plus, Search, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { ScheduleGrid } from "@/components/schedule-grid"

interface Appointment {
  appointment_id: string
  tutor_name: string
  student_name: string
  course_name: string | null
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

export default function SchedulingPage() {
  const [activeTab, setActiveTab] = useState("schedule")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState({ appointments: false, tutors: false, availability: false })

  useEffect(() => {
    if (activeTab === "appointments") {
      fetchAppointments()
    } else if (activeTab === "tutors") {
      fetchTutors()
    } else if (activeTab === "availability") {
      fetchAvailability()
    }
  }, [activeTab])

  const fetchAppointments = async () => {
    setLoading(prev => ({ ...prev, appointments: true }))
    try {
      const response = await fetch("/api/scheduling/appointments?limit=50")
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setLoading(prev => ({ ...prev, appointments: false }))
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

      {/* Schedule Grid View */}
      {activeTab === "schedule" && (
        <ScheduleGrid />
      )}

      {/* Appointments View */}
      {activeTab === "appointments" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Appointments</CardTitle>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading.appointments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2" />
                  <p>No appointments found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.appointment_id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{apt.student_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {apt.tutor_name} • {apt.course_name || "No course"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{apt.appointment_date}</p>
                          <p className="text-xs text-muted-foreground">
                            {apt.start_time} - {apt.end_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          apt.status === 'missed' || apt.status === 'no_show' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
              <Button className="w-full" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
              <Button className="w-full" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Tutors
              </Button>
            </CardContent>
          </Card>
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

      <Card>
        <CardHeader>
          <CardTitle>Scheduling Features</CardTitle>
          <CardDescription>Available scheduling capabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appointment Booking
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Book new appointments</li>
                <li>• Cancel appointments</li>
                <li>• Reschedule appointments</li>
                <li>• View appointment history</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Tutor Management
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• View tutor schedules</li>
                <li>• Manage tutor availability</li>
                <li>• Assign courses to tutors</li>
                <li>• Track tutor workload</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule Grid
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Weekly schedule view</li>
                <li>• Time slot management</li>
                <li>• Availability checking</li>
                <li>• Conflict detection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

