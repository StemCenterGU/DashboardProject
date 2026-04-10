"use client"

import { CheckCircle2, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApprovedNotificationModalProps {
  open: boolean
  onClose: () => void
  approvedAt?: string
  changeCount?: number
  adminNotes?: string
}

export function ApprovedNotificationModal({
  open,
  onClose,
  approvedAt,
  changeCount,
  adminNotes,
}: ApprovedNotificationModalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'recently'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl text-green-900">
                Schedule Approved!
              </DialogTitle>
              <DialogDescription className="text-green-700">
                Your schedule changes are now live
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-sm text-green-800">
              Your request with {changeCount || 0} change{changeCount !== 1 ? 's' : ''} was approved{' '}
              {formatDate(approvedAt)}.
            </AlertDescription>
          </Alert>

          {adminNotes && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Admin Notes:</p>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">{adminNotes}</p>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600">
            Your confirmed schedule is now visible below. Students can book appointments based on your approved availability.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            View My Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
