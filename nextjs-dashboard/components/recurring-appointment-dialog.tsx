"use client"

import { useState } from "react"
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
import { Alert } from "@/components/ui/alert"
import { RecurrencePattern } from "@/types"

interface RecurringAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  startDate: string
  onApply: (recurrencePattern: RecurrencePattern, endDate: string) => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

export function RecurringAppointmentDialog({
  open,
  onOpenChange,
  startDate,
  onApply,
}: RecurringAppointmentDialogProps) {
  const [frequency, setFrequency] = useState<"daily" | "weekly">("weekly")
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const calculateOccurrences = () => {
    if (!endDate) return 0

    const start = new Date(startDate + "T00:00:00")
    const end = new Date(endDate + "T00:00:00")
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (frequency === "daily") {
      return diffDays + 1
    } else {
      // Weekly: count occurrences based on selected days
      if (selectedDays.length === 0) return 0
      const weeks = Math.floor(diffDays / 7) + 1
      return weeks * selectedDays.length
    }
  }

  const handleApply = () => {
    setError(null)

    // Validation
    if (!endDate) {
      setError("Please select an end date")
      return
    }

    const start = new Date(startDate + "T00:00:00")
    const end = new Date(endDate + "T00:00:00")

    if (end <= start) {
      setError("End date must be after the start date")
      return
    }

    if (frequency === "weekly" && selectedDays.length === 0) {
      setError("Please select at least one day of the week")
      return
    }

    const occurrences = calculateOccurrences()
    if (occurrences > 52) {
      setError(`Too many occurrences (${occurrences}). Maximum is 52 appointments.`)
      return
    }

    const pattern: RecurrencePattern = {
      frequency,
      daysOfWeek: frequency === "weekly" ? selectedDays : undefined,
      interval: 1,
    }

    onApply(pattern, endDate)
    onOpenChange(false)

    // Reset form
    setFrequency("weekly")
    setSelectedDays([])
    setEndDate("")
    setError(null)
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T00:00:00")
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-700">Repeating Options</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Frequency Selection */}
          <div>
            <Label className="font-semibold mb-2 block">Repeat Frequency</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  checked={frequency === "daily"}
                  onChange={() => setFrequency("daily")}
                />
                <span>Daily (every day)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="frequency"
                  checked={frequency === "weekly"}
                  onChange={() => setFrequency("weekly")}
                />
                <span>Weekly (on selected days)</span>
              </label>
            </div>
          </div>

          {/* Days of Week (only for weekly) */}
          {frequency === "weekly" && (
            <div>
              <Label className="font-semibold mb-2 block">
                Select Days <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* End Date */}
          <div>
            <Label htmlFor="endDate" className="font-semibold mb-2 block">
              Repeat Until <span className="text-red-500">*</span>
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Appointments will be created from {formatDate(startDate)} to{" "}
              {endDate ? formatDate(endDate) : "end date"}
            </p>
          </div>

          {/* Preview */}
          {endDate && (
            <Alert className="bg-blue-50 border-blue-200">
              <p className="text-sm">
                <strong>Preview:</strong> This will create approximately{" "}
                <strong>{calculateOccurrences()}</strong> recurring appointment(s).
              </p>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setError(null)
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
