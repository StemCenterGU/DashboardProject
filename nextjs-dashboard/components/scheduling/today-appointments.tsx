"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Calendar } from "lucide-react"
import { AppointmentCard } from "./appointment-card"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

interface Appointment {
    appointment_id: string
    student_name: string
    tutor_name: string
    course_name?: string
    appointment_date: string
    start_time: string
    end_time: string
    status: string
}

interface TodayAppointmentsProps {
    appointments: Appointment[]
    date: string
    loading?: boolean
}

export function TodayAppointments({
    appointments,
    date,
    loading = false
}: TodayAppointmentsProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Today's Appointments
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{date}</p>
                    </div>
                    <span className="text-sm font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        {appointments.length} scheduled
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <LoadingSpinner />
                ) : appointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2" />
                        <p>No appointments scheduled for today</p>
                    </div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {appointments.map((apt) => (
                            <AppointmentCard
                                key={apt.appointment_id}
                                studentName={apt.student_name}
                                tutorName={apt.tutor_name}
                                startTime={apt.start_time}
                                endTime={apt.end_time}
                                status={apt.status}
                                variant="today"
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
