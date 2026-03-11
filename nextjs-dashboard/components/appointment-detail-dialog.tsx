"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronDown, AlertCircle, XCircle, Send, Paperclip, X, Calendar, Printer, User, Repeat, FilePlus, FileText } from "lucide-react"

interface FocusOption {
  focus_id: string
  course_code: string | null
  focus_label: string
}

export interface AppointmentDetailData {
  appointment_id: string
  tutor_id: string
  tutor_name: string | null
  student_name: string
  student_email: string | null
  course_name: string | null
  course_code: string | null
  start_time: string
  end_time: string
  status: string
  is_online: boolean | null
  is_walk_in: boolean | null
  notes: string | null
}

interface AppointmentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: AppointmentDetailData | null
  tutorName: string
  date: string
  onUpdate?: () => void
}

interface ParsedNotes {
  courseInstructor: string
  purposes: string[]
  courseFocus: string
  courseCorrect: string
  classmates: string
  notes: string
}

function parseNotesField(rawNotes: string): ParsedNotes {
  const result: ParsedNotes = {
    courseInstructor: "",
    purposes: [],
    courseFocus: "",
    courseCorrect: "",
    classmates: "",
    notes: "",
  }

  const lines = rawNotes.split("\n")
  for (const line of lines) {
    if (line.startsWith("Course Instructor:")) {
      result.courseInstructor = line.replace("Course Instructor:", "").trim()
      if (result.courseInstructor === "N/A") result.courseInstructor = ""
    } else if (line.startsWith("Purpose:")) {
      const purposeStr = line.replace("Purpose:", "").trim()
      result.purposes = purposeStr.split(",").map(p => p.trim()).filter(Boolean)
    } else if (line.startsWith("Course Focus:")) {
      result.courseFocus = line.replace("Course Focus:", "").trim()
    } else if (line.startsWith("Course Correction:")) {
      result.courseCorrect = line.replace("Course Correction:", "").trim()
    } else if (line.startsWith("Classmates:")) {
      result.classmates = line.replace("Classmates:", "").trim()
    } else if (line.startsWith("Notes:")) {
      result.notes = line.replace("Notes:", "").trim()
    }
  }

  return result
}

export function AppointmentDetailDialog({
  open,
  onOpenChange,
  appointment,
  tutorName,
  date,
  onUpdate,
}: AppointmentDetailDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form fields for edit mode
  const [studentName, setStudentName] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [endTime, setEndTime] = useState("")
  const [startTime, setStartTime] = useState("")
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
  const [courseCorrect, setCourseCorrect] = useState("")
  const [courseFocus, setCourseFocus] = useState("")
  const [notes, setNotes] = useState("")
  const [focusOptions, setFocusOptions] = useState<FocusOption[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parsed data for view mode
  const [parsedData, setParsedData] = useState<ParsedNotes | null>(null)

  // Fetch focus options when dialog opens
  useEffect(() => {
    if (open) {
      fetch("/api/scheduling/focus-options")
        .then((res) => res.ok ? res.json() : { options: [] })
        .then((data) => setFocusOptions(data.options ?? []))
        .catch(() => setFocusOptions([]))
    }
  }, [open])

  // Parse appointment data
  useEffect(() => {
    if (appointment && open) {
      const parsed = parseNotesField(appointment.notes || "")
      setParsedData(parsed)

      // Set form fields for edit mode
      setStudentName(appointment.student_name || "")
      setStudentEmail(appointment.student_email || "")
      setStartTime(appointment.start_time.slice(0, 5))
      setEndTime(appointment.end_time.slice(0, 5))
      setMeetingType(appointment.is_online ? "online" : "face-to-face")
      setCourseInstructor(parsed.courseInstructor)
      setCourseFocus(parsed.courseFocus)
      setCourseCorrect(parsed.courseCorrect)
      setClassmates(parsed.classmates)
      setNotes(parsed.notes)

      // Set purpose checkboxes
      const purposeLower = parsed.purposes.map(p => p.toLowerCase())
      setPurposes({
        orientation: purposeLower.includes("orientation"),
        homework: purposeLower.includes("homework"),
        study: purposeLower.includes("study"),
        lecture: purposeLower.includes("lecture"),
        prepare: purposeLower.includes("prepare"),
        other: purposeLower.includes("other"),
      })

      setAcademicIntegrity(true)
      setConfidentiality(true)
      setIsEditing(false)
      setError(null)
      setShowCancelConfirm(false)
      setSelectedFile(null)
      setUploadError(null)
    }
  }, [appointment, open])

  if (!appointment) {
    return null
  }

  const displayTutorName = appointment.tutor_name || tutorName
  const isAppointmentCancelled = appointment.status.toLowerCase() === "cancelled"
  const isAppointmentNoShow = appointment.status.toLowerCase() === "no_show" || appointment.status.toLowerCase() === "missed"

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00")
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "pm" : "am"
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHours}:${String(minutes || 0).padStart(2, "0")} ${period}`
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

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
          throw new Error(uploadData.error || "Failed to upload file")
        }
        attachmentPath = uploadData.path
      }

      const purposesList = Object.entries(purposes)
        .filter(([_, checked]) => checked)
        .map(([key, _]) => key)
        .join(", ")

      const combinedNotes = [
        `Course Instructor: ${courseInstructor || "N/A"}`,
        `Purpose: ${purposesList || "N/A"}`,
        courseFocus ? `Course Focus: ${courseFocus}` : "",
        courseCorrect ? `Course Correction: ${courseCorrect}` : "",
        classmates ? `Classmates: ${classmates}` : "",
        notes ? `Notes: ${notes}` : "",
        attachmentPath ? `Attachment: ${attachmentPath}` : "",
      ].filter(Boolean).join("\n")

      const response = await fetch("/api/scheduling/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: appointment.appointment_id,
          student_name: studentName,
          student_email: studentEmail || null,
          start_time: startTime,
          end_time: endTime,
          is_online: meetingType === "online",
          notes: combinedNotes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update appointment")
      }

      onUpdate?.()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to save changes")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/scheduling/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: appointment.appointment_id,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update status")
      }

      onUpdate?.()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to update status")
    } finally {
      setLoading(false)
      setShowCancelConfirm(false)
    }
  }

  const handleCancelAppointment = () => {
    handleStatusUpdate("cancelled")
  }

  const handleMarkNoShow = () => {
    handleStatusUpdate("no_show")
  }

  const handleEmailClient = () => {
    if (appointment.student_email) {
      const subject = encodeURIComponent(`Regarding your appointment on ${formatDate(date)}`)
      const body = encodeURIComponent(`Dear ${appointment.student_name},\n\nRegarding your appointment scheduled for ${formatDate(date)} at ${formatTime(appointment.start_time)}.\n\n`)
      window.open(`mailto:${appointment.student_email}?subject=${subject}&body=${body}`, "_blank")
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const purposesList = parsedData?.purposes?.join("; ") || "N/A"
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Appointment - ${appointment.student_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
            .header h1 { color: #1e3a8a; margin: 0 0 8px 0; font-size: 18px; }
            .header p { color: #1e40af; margin: 4px 0; }
            .title { color: #1d4ed8; font-size: 20px; margin: 20px 0 16px 0; }
            .field { margin-bottom: 16px; }
            .field-label { font-weight: 600; color: #1f2937; margin-bottom: 4px; }
            .field-value { color: #4b5563; }
            .status-cancelled { background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 4px; color: #dc2626; }
            .status-noshow { background: #fefce8; border: 1px solid #fde68a; padding: 12px; border-radius: 4px; color: #ca8a04; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h2 style="color: #1f2937; margin-bottom: 4px;">Existing Appointment</h2>
          <p style="color: #6b7280; font-size: 14px;">Printed on ${new Date().toLocaleString()}</p>
          
          <div class="header">
            <h1>${appointment.student_name}</h1>
            <p><strong>${formatDate(date)}</strong> | ${formatTime(startTime)} to ${formatTime(endTime)}</p>
            <p>${displayTutorName} | STEM Center</p>
          </div>

          ${isAppointmentCancelled ? '<div class="status-cancelled"><strong>This appointment has been cancelled.</strong></div>' : ''}
          ${isAppointmentNoShow ? '<div class="status-noshow"><strong>This appointment was marked as No-Show.</strong></div>' : ''}

          <h3 class="title">Appointment Details</h3>

          ${parsedData?.courseInstructor ? `
            <div class="field">
              <p class="field-label">Course instructor</p>
              <p class="field-value">${parsedData.courseInstructor}</p>
            </div>
          ` : ''}

          <div class="field">
            <p class="field-label">Academic Integrity</p>
            <p class="field-value">I affirm that I am not attempting to directly or indirectly get help with an online exam (or similar assessment) after it has been opened and its content is visible to me or others.</p>
          </div>

          <div class="field">
            <p class="field-label">Confidentiality</p>
            <p class="field-value">I understand that the academic material I go over with the tutor may be shared with my course instructor in order to help maintain academic integrity. Appointments cannot be strictly confidential at this time.</p>
          </div>

          ${parsedData?.purposes && parsedData.purposes.length > 0 ? `
            <div class="field">
              <p class="field-label">Purpose(s) of appointment</p>
              <p class="field-value">${purposesList}</p>
            </div>
          ` : ''}

          ${parsedData?.notes ? `
            <div class="field">
              <p class="field-label">Brief notes/comments</p>
              <p class="field-value">${parsedData.notes}</p>
            </div>
          ` : ''}

          ${parsedData?.courseCorrect ? `
            <div class="field">
              <p class="field-label">Is the course listing correct?</p>
              <p class="field-value">${parsedData.courseCorrect}</p>
            </div>
          ` : ''}

          ${parsedData?.courseFocus ? `
            <div class="field">
              <p class="field-label">Course or Focus</p>
              <p class="field-value">${parsedData.courseFocus}</p>
            </div>
          ` : ''}

          ${parsedData?.classmates ? `
            <div class="field">
              <p class="field-label">Classmates</p>
              <p class="field-value">${parsedData.classmates}</p>
            </div>
          ` : ''}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleCancelEdit = () => {
    if (parsedData) {
      setCourseInstructor(parsedData.courseInstructor)
      setCourseFocus(parsedData.courseFocus)
      setCourseCorrect(parsedData.courseCorrect)
      setClassmates(parsedData.classmates)
      setNotes(parsedData.notes)
      const purposeLower = parsedData.purposes.map(p => p.toLowerCase())
      setPurposes({
        orientation: purposeLower.includes("orientation"),
        homework: purposeLower.includes("homework"),
        study: purposeLower.includes("study"),
        lecture: purposeLower.includes("lecture"),
        prepare: purposeLower.includes("prepare"),
        other: purposeLower.includes("other"),
      })
    }
    setStudentName(appointment.student_name || "")
    setStudentEmail(appointment.student_email || "")
    setStartTime(appointment.start_time.slice(0, 5))
    setEndTime(appointment.end_time.slice(0, 5))
    setMeetingType(appointment.is_online ? "online" : "face-to-face")
    setIsEditing(false)
    setError(null)
  }

  // VIEW MODE
  if (!isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-print-content>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl text-gray-800">Existing Appointment</DialogTitle>
              {!isAppointmentCancelled && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                      Appointment Tools
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isAppointmentNoShow && (
                      <DropdownMenuItem onClick={handleMarkNoShow}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Mark as a No-Show
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => router.push(`/clients/${appointment.appointment_id}`)}>
                      <User className="mr-2 h-4 w-4" />
                      Manage Client Account
                    </DropdownMenuItem>
                    {appointment.student_email && (
                      <DropdownMenuItem onClick={handleEmailClient}>
                        <Send className="mr-2 h-4 w-4" />
                        Email Client
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => router.push(`/scheduling/repeat?appointmentId=${appointment.appointment_id}`)}>
                      <Repeat className="mr-2 h-4 w-4" />
                      Repeat Appointment
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-blue-700 font-semibold">
                      CLIENT REPORT FORMS
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push(`/scheduling/reports/new?appointmentId=${appointment.appointment_id}`)}>
                      <FilePlus className="mr-2 h-4 w-4" />
                      Add New Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/scheduling/reports?appointmentId=${appointment.appointment_id}`)}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Existing Reports
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Appointment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </DialogHeader>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {showCancelConfirm && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md space-y-3">
              <p className="text-sm font-medium text-destructive">
                Are you sure you want to cancel this appointment?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelAppointment}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Yes, Cancel Appointment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={loading}
                >
                  No, Keep It
                </Button>
              </div>
            </div>
          )}

          {/* Blue header banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-blue-900">{appointment.student_name}</p>
                <p className="text-blue-800">
                  <span className="font-semibold">{formatDate(date)}</span> | {formatTime(startTime)} to {formatTime(endTime)}
                </p>
                <p className="text-blue-700">{displayTutorName} | STEM Center</p>
              </div>
              <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                <Calendar className="mr-1 h-4 w-4" />
                Add to Calendar (.ics)
              </Button>
            </div>
          </div>

          {/* Appointment Details - Read Only */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-700">Appointment Details</h3>

            {parsedData?.courseInstructor && (
              <div>
                <p className="font-semibold text-gray-800">Course instructor</p>
                <p className="text-gray-600">{parsedData.courseInstructor}</p>
              </div>
            )}

            <div>
              <p className="font-semibold text-gray-800">Academic Integrity</p>
              <p className="text-gray-600 text-sm">
                I affirm that I am not attempting to directly or indirectly get help with an online exam (or similar assessment) after it has been opened and its content is visible to me or others.
              </p>
            </div>

            <div>
              <p className="font-semibold text-gray-800">Confidentiality</p>
              <p className="text-gray-600 text-sm">
                I understand that the academic material I go over with the tutor may be shared with my course instructor in order to help maintain academic integrity. Appointments cannot be strictly confidential at this time.
              </p>
            </div>

            {parsedData?.purposes && parsedData.purposes.length > 0 && (
              <div>
                <p className="font-semibold text-gray-800">Purpose(s) of appointment</p>
                <p className="text-gray-600">{parsedData.purposes.join("; ")}</p>
              </div>
            )}

            {parsedData?.notes && (
              <div>
                <p className="font-semibold text-gray-800">Brief notes/comments, such as the topic(s) you would like to work on or anything else you would like us to know about your appointment</p>
                <p className="text-gray-600">{parsedData.notes}</p>
              </div>
            )}

            {parsedData?.courseCorrect && (
              <div>
                <p className="font-semibold text-gray-800">Is the course listed below EXACTLY the course you want to get help with?</p>
                <p className="text-gray-600">{parsedData.courseCorrect}</p>
              </div>
            )}

            {parsedData?.courseFocus && (
              <div>
                <p className="font-semibold text-gray-800">Course or Focus:</p>
                <p className="text-gray-600">{parsedData.courseFocus}</p>
              </div>
            )}

            {parsedData?.classmates && (
              <div>
                <p className="font-semibold text-gray-800">Classmates</p>
                <p className="text-gray-600">{parsedData.classmates}</p>
              </div>
            )}

            {appointment.is_online !== null && (
              <div>
                <p className="font-semibold text-gray-800">Meeting Type</p>
                <p className="text-gray-600">{appointment.is_online ? "Online" : "Face-to-Face"}</p>
              </div>
            )}

            {isAppointmentCancelled && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-600 font-semibold">This appointment has been cancelled.</p>
              </div>
            )}

            {isAppointmentNoShow && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-yellow-700 font-semibold">This appointment was marked as No-Show.</p>
              </div>
            )}

            {/* File Attachment Section */}
            {!isAppointmentCancelled && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Attached Files</h4>
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
                  <p className="text-sm text-gray-500">No files attached.</p>
                )}
                {uploadError && (
                  <p className="text-sm text-red-600 mt-1">{uploadError}</p>
                )}
              </div>
            )}
          </div>

          {/* Hidden file input */}
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

          {/* Bottom Buttons */}
          <DialogFooter className="flex flex-wrap gap-2 justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="bg-cyan-500 text-white hover:bg-cyan-600 border-cyan-500"
              disabled={isAppointmentCancelled}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="mr-1 h-4 w-4" />
              Attach Files
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
              onClick={() => setIsEditing(true)}
              disabled={isAppointmentCancelled}
            >
              Edit Appointment
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-red-500 text-white hover:bg-red-600 border-red-500"
              onClick={() => setShowCancelConfirm(true)}
              disabled={isAppointmentCancelled || loading}
            >
              Cancel Appointment
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-500 text-white hover:bg-gray-600 border-gray-500"
              onClick={handlePrint}
            >
              <Printer className="mr-1 h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-700 text-white hover:bg-gray-800 border-gray-700"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // EDIT MODE - Full booking form layout
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-print-content>
        <DialogHeader>
          <DialogTitle className="text-2xl text-blue-700">Edit Appointment</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
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
                  >
                    {[...Array(4)].map((_, i) => {
                      const [h, m] = startTime.split(":").map(Number)
                      const endH = h + i + 1
                      if (endH > 21) return null
                      const endTimeStr = `${String(endH).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`
                      return (
                        <option key={i} value={endTimeStr}>
                          {formatTime(endTimeStr)}
                        </option>
                      )
                    }).filter(Boolean)}
                  </select>
                </p>
                <p className="text-sm text-gray-600">{displayTutorName} | STEM Center</p>
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
                    If you choose an online appointment, log back in to this website approximately five to ten minutes before the start of your appointment. Then, open this appointment and click &quot;Start or Join Online Consultation.&quot;
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
                  className="w-full min-h-[100px] mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  maxLength={1000}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelEdit}
            disabled={loading}
            className="bg-black text-white hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !studentName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
