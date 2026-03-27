"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface SlotEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slot: {
    id: string
    tutorName: string
    dayOfWeek: number
    dayName: string
    startTime: string
    endTime: string
  } | null
  onSave: (slotId: string, updates: {
    day_of_week?: number
    start_time?: string
    end_time?: string
  }) => Promise<void>
}

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

export function SlotEditDialog({ open, onOpenChange, slot, onSave }: SlotEditDialogProps) {
  const [dayOfWeek, setDayOfWeek] = useState(0)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when slot changes
  useEffect(() => {
    if (slot) {
      setDayOfWeek(slot.dayOfWeek)
      // Convert HH:MM:SS to HH:MM for input
      setStartTime(slot.startTime.substring(0, 5))
      setEndTime(slot.endTime.substring(0, 5))
      setError(null)
    }
  }, [slot])

  // Auto-adjust end time to be 1 hour after start time
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime)

    // Calculate end time (1 hour later)
    if (newStartTime) {
      const [hours, minutes] = newStartTime.split(':').map(Number)
      const endHours = hours + 1
      const endMinutes = minutes

      // Format as HH:MM
      const newEndTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
      setEndTime(newEndTime)
    }
  }

  const handleSave = async () => {
    if (!slot) return

    setError(null)
    setLoading(true)

    try {
      // Check if duration is 1 hour (warning only)
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      const durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)

      if (durationMinutes !== 60) {
        setError(`Warning: Slot duration is ${durationMinutes} minutes. Recommended duration is 60 minutes (1 hour).`)
        // Don't return, just show warning but allow save
      }

      // Convert HH:MM to HH:MM:SS
      const updates: any = {}
      if (dayOfWeek !== slot.dayOfWeek) {
        updates.day_of_week = dayOfWeek
      }
      if (startTime !== slot.startTime.substring(0, 5)) {
        updates.start_time = `${startTime}:00`
      }
      if (endTime !== slot.endTime.substring(0, 5)) {
        updates.end_time = `${endTime}:00`
      }

      if (Object.keys(updates).length === 0 && !error) {
        setError("No changes detected")
        setLoading(false)
        return
      }

      await onSave(slot.id, updates)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to update slot")
    } finally {
      setLoading(false)
    }
  }

  if (!slot) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-700">Edit Time Slot</DialogTitle>
          <p className="text-sm text-gray-600">Tutor: {slot.tutorName}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Day Selection */}
          <div>
            <Label htmlFor="day">Day of Week</Label>
            <select
              id="day"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {DAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">End time will auto-adjust to 1 hour later</p>
          </div>

          {/* End Time */}
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Automatically set to 1 hour after start</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
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
