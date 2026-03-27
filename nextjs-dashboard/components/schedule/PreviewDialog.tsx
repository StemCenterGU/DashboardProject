"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { ParsedSlot } from "@/lib/scheduleParser"
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"

interface PreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slots: ParsedSlot[]
  tutors: string[]
  warnings: string[]
  onConfirm: () => void
  loading?: boolean
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function PreviewDialog({
  open,
  onOpenChange,
  slots,
  tutors,
  warnings,
  onConfirm,
  loading = false,
}: PreviewDialogProps) {
  // Group slots by tutor for preview
  const slotsByTutor: Record<string, ParsedSlot[]> = {}
  slots.forEach(slot => {
    if (!slotsByTutor[slot.tutorId]) {
      slotsByTutor[slot.tutorId] = []
    }
    slotsByTutor[slot.tutorId].push(slot)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-blue-700">Preview Parsed Schedule</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 bg-blue-50">
              <p className="text-sm text-gray-600">Tutors Found</p>
              <p className="text-3xl font-bold text-blue-700">{tutors.length}</p>
            </div>
            <div className="border rounded-lg p-4 bg-green-50">
              <p className="text-sm text-gray-600">Total Slots</p>
              <p className="text-3xl font-bold text-green-700">{slots.length}</p>
            </div>
            <div className="border rounded-lg p-4 bg-purple-50">
              <p className="text-sm text-gray-600">Avg Slots/Tutor</p>
              <p className="text-3xl font-bold text-purple-700">
                {tutors.length > 0 ? Math.round(slots.length / tutors.length) : 0}
              </p>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="font-semibold text-yellow-800">Warnings ({warnings.length})</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-1 max-h-24 overflow-y-auto">
                  {warnings.slice(0, 5).map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                  {warnings.length > 5 && (
                    <li className="font-semibold">...and {warnings.length - 5} more warnings</li>
                  )}
                </ul>
              </div>
            </Alert>
          )}

          {/* Tutors List */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Tutors ({tutors.length})</h3>
            <div className="flex flex-wrap gap-2">
              {tutors.map((tutor) => (
                <Badge key={tutor} variant="outline" className="text-sm">
                  {tutor} ({slotsByTutor[tutor]?.length || 0} slots)
                </Badge>
              ))}
            </div>
          </div>

          {/* Sample Slots Preview */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Sample Slots (first 10)</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Tutor</th>
                    <th className="px-4 py-2 text-left">Day</th>
                    <th className="px-4 py-2 text-left">Start Time</th>
                    <th className="px-4 py-2 text-left">End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.slice(0, 10).map((slot, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{slot.tutorId}</td>
                      <td className="px-4 py-2">{DAY_NAMES[slot.dayOfWeek]}</td>
                      <td className="px-4 py-2 font-mono">{slot.startTime}</td>
                      <td className="px-4 py-2 font-mono">{slot.endTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {slots.length > 10 && (
                <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-600">
                  ...and {slots.length - 10} more slots
                </div>
              )}
            </div>
          </div>

          {/* Import Action Info */}
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <div className="ml-2">
              <p className="font-semibold text-blue-800">What will happen:</p>
              <ul className="list-disc list-inside text-sm text-blue-700 mt-1">
                <li>Existing schedules for these {tutors.length} tutors will be replaced</li>
                <li>{slots.length} new availability slots will be created</li>
                <li>Other tutors' schedules will not be affected</li>
              </ul>
            </div>
          </Alert>
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
            onClick={onConfirm}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Confirm Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
