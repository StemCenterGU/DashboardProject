"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Paperclip, X } from "lucide-react"

interface FocusOption {
  focus_id: string
  course_code: string | null
  focus_label: string
}

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
  const [endTime, setEndTime] = useState("")
  const [meetingType, setMeetingType] = useState<"face-to-face" | "online">("face-to-face")
  const [courseInstructor, setCourseInstructor] = useState("")
  const [academicIntegrity, setAcademicIntegrity] = useState(false)
  const [confidentiality, setConfidentiality] = useState(false)
  const [purposes, setPurposes] = useState({
    orientation: false,
    homework: false,
    study: false,
    lecture: false,
    prepare: false,
    other: false,
  })
  const [classmates, setClassmates] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notes, setNotes] = useState("")
  const [courseCorrect, setCourseCorrect] = useState("")
  const [courseFocus, setCourseFocus] = useState("")
  const [focusOptions, setFocusOptions] = useState<FocusOption[]>([])

  // Fetch focus options when dialog opens
  useEffect(() => {
    if (open) {
      fetch("/api/scheduling/focus-options")
        .then((res) => res.ok ? res.json() : { options: [] })
        .then((data) => setFocusOptions(data.options ?? []))
        .catch(() => setFocusOptions([]))
    }
  }, [open])

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

    // Validate required fields
    if (!academicIntegrity) {
      setError("You must affirm the Academic Integrity statement")
      return
    }
    if (!confidentiality) {
      setError("You must accept the Confidentiality statement")
      return
    }
    if (!Object.values(purposes).some((v) => v)) {
      setError("Please select at least one purpose for the appointment")
      return
    }

    // Validate that the appointment is not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const appointmentDate = new Date(date + "T00:00:00")

    if (appointmentDate < today) {
      setError("Cannot book appointments for past dates. Please select a future date.")
      return
    }

    // If booking for today, check if the time is in the past
    if (appointmentDate.getTime() === today.getTime()) {
      const now = new Date()
      const [startHours, startMinutes] = startTime.split(":").map(Number)
      const appointmentDateTime = new Date()
      appointmentDateTime.setHours(startHours, startMinutes || 0, 0, 0)

      if (appointmentDateTime < now) {
        setError("Cannot book appointments for past times. Please select a future time slot.")
        return
      }
    }

    setLoading(true)
    setUploadError(null)

    try {
      // Upload file first (if one was selected)
      let attachmentPath: string | undefined
      if (selectedFile) {
        const fd = new FormData()
        fd.append("file", selectedFile)
        const uploadRes = await fetch("/api/scheduling/appointments/upload", {
          method: "POST",
          body: fd,
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          setError(uploadData.error || "File upload failed")
          setLoading(false)
          return
        }
        attachmentPath = uploadData.path
      }

      // Build notes with all the details
      const purposesList = Object.entries(purposes)
        .filter(([_, checked]) => checked)
        .map(([key, _]) => key)
        .join(", ")

      const detailedNotes = [
        `Course Instructor: ${courseInstructor || "N/A"}`,
        `Purpose: ${purposesList}`,
        courseFocus ? `Course Focus: ${courseFocus}` : "",
        courseCorrect ? `Course Correction: ${courseCorrect}` : "",
        classmates ? `Classmates: ${classmates}` : "",
        notes ? `Notes: ${notes}` : "",
      ].filter(Boolean).join("\n")

      const response = await fetch("/api/scheduling/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_id: tutorId,
          tutor_name: tutorName,
          student_name: studentName,
          student_email: studentEmail || undefined,
          appointment_date: date,
          start_time: startTime,
          end_time: endTime,
          status: "scheduled",
          is_online: meetingType === "online",
          is_walk_in: false,
          notes: detailedNotes,
          attachment_path: attachmentPath,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create appointment")
      }

      // Success - reset form and close
      setStudentName("")
      setStudentEmail("")
      setCourseInstructor("")
      setAcademicIntegrity(false)
      setConfidentiality(false)
      setPurposes({
        orientation: false,
        homework: false,
        study: false,
        lecture: false,
        prepare: false,
        other: false,
      })
      setClassmates("")
      setNotes("")
      setMeetingType("face-to-face")
      setCourseCorrect("")
      setCourseFocus("")
      setSelectedFile(null)
      setUploadError(null)
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
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    } catch {
      return dateStr
    }
  }

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "pm" : "am"
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHours}:${String(minutes || 0).padStart(2, "0")} ${period}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-blue-700">Create New Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Label className="text-base font-semibold">Client</Label>
              <span className="text-gray-400">?</span>
            </div>
            <div className="space-y-2">
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Your Name (name@gannon.edu)"
                required
                className="bg-gray-50"
              />
              <Input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="your.email@gannon.edu"
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Date/Time Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-lg font-bold">
                  {formatDate(date)} | {formatTime(startTime)} to{" "}
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="inline-block border rounded px-2 py-1 ml-1"
                    required
                  >
                    {[...Array(4)].map((_, i) => {
                      const [h, m] = startTime.split(":").map(Number)
                      const endH = h + i + 1
                      // Cap at 8pm (20:00)
                      if (endH > 20) return null
                      const endTimeStr = `${String(endH).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`
                      return (
                        <option key={i} value={endTimeStr}>
                          {formatTime(endTimeStr)}
                        </option>
                      )
                    }).filter(Boolean)}
                  </select>
                </p>
                <p className="text-sm text-gray-600">{tutorName} | STEM Center</p>
              </div>
            </div>
            <div className="p-3 bg-blue-50 border-2 border-blue-600 rounded">
              <p className="font-semibold">APPOINTMENT LIMITS: <span className="font-normal">Appointments must be 1 hour in length.</span></p>
            </div>
          </div>

          {/* Meet Online Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold text-blue-700 mb-3">Meet Online?</h3>
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="meetingType"
                  checked={meetingType === "face-to-face"}
                  onChange={() => setMeetingType("face-to-face")}
                  className="mt-1"
                />
                <span>No. Schedule <strong>Face-to-Face</strong> appointment.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="meetingType"
                  checked={meetingType === "online"}
                  onChange={() => setMeetingType("online")}
                  className="mt-1"
                />
                <div>
                  <span>Yes. Schedule <strong>Online</strong> appointment.</span>
                  <p className="text-sm text-gray-600 ml-6 mt-1">
                    If you choose an online appointment, log back in to this website approximately five to ten minutes before the start of your appointment. Then, open this appointment and click "Start or Join Online Consultation."
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold text-blue-700 mb-2">Appointment Details</h3>
            <p className="text-sm mb-4">
              Questions marked with a <span className="text-red-500">*</span> are required.
            </p>

            <div className="space-y-4">
              {/* Course Instructor */}
              <div>
                <Label htmlFor="instructor">
                  Course instructor <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="instructor"
                  value={courseInstructor}
                  onChange={(e) => setCourseInstructor(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {/* Academic Integrity */}
              <div>
                <Label className="font-semibold">
                  Academic Integrity <span className="text-red-500">*</span> <span className="font-normal">(check all that apply)</span>
                </Label>
                <label className="flex items-start gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={academicIntegrity}
                    onChange={(e) => setAcademicIntegrity(e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm">
                    I affirm that I am not attempting to directly or indirectly get help with an online exam (or similar assessment) after it has been opened and its content is visible to me or others.
                  </span>
                </label>
              </div>

              {/* Confidentiality */}
              <div>
                <Label className="font-semibold">
                  Confidentiality <span className="text-red-500">*</span> <span className="font-normal">(check all that apply)</span>
                </Label>
                <label className="flex items-start gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confidentiality}
                    onChange={(e) => setConfidentiality(e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm">
                    I understand that the academic material I go over with the tutor may be shared with my course instructor in order to help maintain academic integrity. Appointments cannot be strictly confidential at this time.
                  </span>
                </label>
              </div>

              {/* Purpose */}
              <div>
                <Label className="font-semibold">
                  Purpose(s) of appointment <span className="text-red-500">*</span> <span className="font-normal">(check all that apply)</span>
                </Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purposes.orientation}
                      onChange={(e) => setPurposes({ ...purposes, orientation: e.target.checked })}
                    />
                    <span>Orientation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purposes.homework}
                      onChange={(e) => setPurposes({ ...purposes, homework: e.target.checked })}
                    />
                    <span>Complete homework (or other assessment)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purposes.study}
                      onChange={(e) => setPurposes({ ...purposes, study: e.target.checked })}
                    />
                    <span>Study for quiz/test/exam/gateway</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purposes.lecture}
                      onChange={(e) => setPurposes({ ...purposes, lecture: e.target.checked })}
                    />
                    <span>Go over class lecture/notes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purposes.prepare}
                      onChange={(e) => setPurposes({ ...purposes, prepare: e.target.checked })}
                    />
                    <span>Prepare for future class lectures</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purposes.other}
                      onChange={(e) => setPurposes({ ...purposes, other: e.target.checked })}
                    />
                    <span>Other</span>
                  </label>
                </div>
              </div>

              {/* Classmates */}
              <div>
                <Label htmlFor="classmates">
                  Are you bringing any classmates? If so, list full names or their network IDs here.
                </Label>
                <Input
                  id="classmates"
                  value={classmates}
                  onChange={(e) => setClassmates(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Course Correct */}
              <div>
                <Label htmlFor="courseCorrect">
                  Is the course listing correct? If not, what should it be?
                </Label>
                <Input
                  id="courseCorrect"
                  value={courseCorrect}
                  onChange={(e) => setCourseCorrect(e.target.value)}
                  placeholder="Leave blank if correct"
                  className="mt-1"
                />
              </div>

              {/* Course Focus */}
              <div>
                <Label htmlFor="courseFocus">
                  What is the main focus or topic of this course?
                </Label>
                <select
                  id="courseFocus"
                  value={courseFocus}
                  onChange={(e) => setCourseFocus(e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">-- please select --</option>
                  {focusOptions.map((option) => (
                    <option key={option.focus_id} value={option.focus_label}>
                      {option.focus_label}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Attachment */}
              <div>
                <Label className="font-semibold">
                  Attach a file to share with your tutor{" "}
                  <span className="font-normal text-gray-500">(optional — PDF, Word, Excel, images, up to 10 MB)</span>
                </Label>
                <div className="mt-2">
                  {selectedFile ? (
                    <div className="flex items-center gap-2 p-2 border rounded bg-blue-50">
                      <Paperclip className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {(selectedFile.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null)
                          setUploadError(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 w-fit px-3 py-2 border rounded cursor-pointer hover:bg-gray-50 text-sm">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <span>Choose file</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null
                          setUploadError(null)
                          if (f && f.size > 10 * 1024 * 1024) {
                            setUploadError("File too large. Maximum size is 10 MB.")
                            e.target.value = ""
                            return
                          }
                          setSelectedFile(f)
                        }}
                      />
                    </label>
                  )}
                  {uploadError && (
                    <p className="text-sm text-red-600 mt-1">{uploadError}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">
                  Brief notes/comments, such as the topic(s) you would like to work on or anything else you would like us to know about your appointment <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                  className="w-full min-h-[100px] mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  maxLength={1000}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800"
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Appointment...
                </>
              ) : (
                "Create Appointment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
