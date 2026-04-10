"use client"

import { Clock, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface PendingRequestBannerProps {
  requestId: string
  submittedAt: string
  changeCount: number
  onViewDetails?: () => void
}

export function PendingRequestBanner({
  requestId,
  submittedAt,
  changeCount,
  onViewDetails,
}: PendingRequestBannerProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <Clock className="h-5 w-5 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-yellow-900">Schedule Change Pending Approval</p>
          <p className="text-sm text-yellow-700 mt-1">
            Your request with {changeCount} change{changeCount !== 1 ? 's' : ''} was submitted on{' '}
            {formatDate(submittedAt)} and is awaiting admin review.
          </p>
        </div>
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="ml-4 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
