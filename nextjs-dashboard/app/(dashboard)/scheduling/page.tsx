"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Users, BookOpen, Plus, Search } from "lucide-react"
import { useState } from "react"

export default function SchedulingPage() {
  const [activeTab, setActiveTab] = useState("schedule")

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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>View and manage weekly appointment schedule</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input type="date" className="w-[180px]" />
                <Button variant="outline">Refresh</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Weekly schedule grid will be displayed here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Shows appointments organized by tutor and time slot
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2" />
                  <p>No upcoming appointments</p>
                </div>
              </div>
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
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>Tutor list will be displayed here</p>
            </div>
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
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <p>Availability management will be displayed here</p>
            </div>
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

