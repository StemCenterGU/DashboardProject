"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface AppointmentBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tutorId: string
  tutorName: string
  date: string
  startTime: string
  onSuccess?: () => void
}

export function AppointmentBookingDialog({
  open,
  onOpenChange,
  tutorId,
  tutorName,
  date,
  startTime,
  onSuccess,
}: AppointmentBookingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [studentName, setStudentName] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [courseName, setCourseName] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [endTime, setEndTime] = useState("")
  const [notes, setNotes] = useState("")
  const [isOnline, setIsOnline] = useState(false)

  // Calculate default end time (1 hour after start)
  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(":").map(Number)
      const endHours = hours + 1
      const endMinutes = minutes || 0
      setEndTime(`${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`)
    }
  }, [startTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/scheduling/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_id: tutorId,
          tutor_name: tutorName,
          student_name: studentName,
          student_email: studentEmail || undefined,
          course_name: courseName || undefined,
          course_code: courseCode || undefined,
          appointment_date: date,
          start_time: startTime,
          end_time: endTime,
          status: "scheduled",
          is_online: isOnline,
          is_walk_in: false,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create appointment")
      }

      // Success - close dialog and reset form
      setStudentName("")
      setStudentEmail("")
      setCourseName("")
      setCourseCode("")
      setNotes("")
      setIsOnline(false)
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T00:00:00")
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    } catch {
      return dateStr
    }
  }

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHours}:${String(minutes || 0).padStart(2, "0")} ${period}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Complete the appointment registration form below. We encourage you to choose a 60-minute appointment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Appointment Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Tutor</p>
              <p className="text-base font-semibold">{tutorName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Date</p>
              <p className="text-base font-semibold">{formatDate(date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Start Time</p>
              <p className="text-base font-semibold">{formatTime(startTime)}</p>
            </div>
            <div>
              <Label htmlFor="end_time">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Adjust for 60-minute appointment
              </p>
            </div>
          </div>

          {/* Student Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="student_name">
                Your Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="student_name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="student_email">Your Email (Optional)</Label>
              <Input
                id="student_email"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="your.email@gannon.edu"
              />
            </div>

            <div>
              <Label htmlFor="course_code">Course Code (Optional)</Label>
              <Input
                id="course_code"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                placeholder="e.g., MATH101"
              />
            </div>

            <div>
              <Label htmlFor="course_name">Course Name (Optional)</Label>
              <Input
                id="course_name"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., Calculus I"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific topics or questions you'd like to cover?"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                maxLength={1000}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_online"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_online" className="font-normal cursor-pointer">
                This will be an online appointment
              </Label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
