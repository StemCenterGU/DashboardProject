"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

interface Slot {
  id: string
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
}

interface SlotSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slots: Slot[]
  tutorName: string
  timeSlot: string // e.g., "2:00 PM"
  onEdit: (slot: Slot) => void
  onDelete: (slotId: string, dayName: string) => void
}

export function SlotSelectionDialog({
  open,
  onOpenChange,
  slots,
  tutorName,
  timeSlot,
  onEdit,
  onDelete,
}: SlotSelectionDialogProps) {
  const formatTime = (time: string) => {
    // Convert "HH:MM:SS" to "H:MM AM/PM"
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const period = hour >= 12 ? 'PM' : 'AM'
    return `${displayHour}:${minutes} ${period}`
  }

  const handleDelete = (slotId: string, dayName: string) => {
    if (confirm(`Delete ${dayName} slot for ${tutorName}?`)) {
      onDelete(slotId, dayName)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Select Slot to Edit - {tutorName}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Time: {timeSlot}
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          {slots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No slots found for this time
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                {slots.length} slot{slots.length !== 1 ? 's' : ''} at this time:
              </p>
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {slot.dayName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(slot)}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(slot.id, slot.dayName)}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
