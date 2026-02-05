"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { AppointmentCard } from "./appointment-card"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { Pagination } from "@/components/shared/pagination"

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

interface UpcomingAppointmentsProps {
    appointments: Appointment[]
    loading?: boolean
    // Pagination props
    currentPage: number
    totalPages: number
    totalCount: number
    itemsPerPage: number
    onPageChange: (page: number) => void
}

export function UpcomingAppointments({
    appointments,
    loading = false,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    onPageChange
}: UpcomingAppointmentsProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Upcoming Appointments
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Future scheduled sessions</p>
                    </div>
                    <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {totalCount} total
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <LoadingSpinner />
                ) : appointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2" />
                        <p>No upcoming appointments</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {appointments.map((apt) => (
                            <AppointmentCard
                                key={apt.appointment_id}
                                studentName={apt.student_name}
                                tutorName={apt.tutor_name}
                                courseName={apt.course_name}
                                date={apt.appointment_date}
                                startTime={apt.start_time}
                                endTime={apt.end_time}
                                status={apt.status}
                            />
                        ))}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            itemsPerPage={itemsPerPage}
                            onPageChange={onPageChange}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
