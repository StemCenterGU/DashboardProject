"use client"

import { AlertCircle, Save, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DraftModeBannerProps {
  onSave: () => void
  onSubmit: () => void
  onDiscard: () => void
  isSaving: boolean
  isSubmitting: boolean
  changeCount: number
}

export function DraftModeBanner({
  onSave,
  onSubmit,
  onDiscard,
  isSaving,
  isSubmitting,
  changeCount,
}: DraftModeBannerProps) {
  return (
    <Alert className="border-blue-200 bg-blue-50">
      <AlertCircle className="h-5 w-5 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-blue-900">Draft Mode Active</p>
          <p className="text-sm text-blue-700 mt-1">
            You have {changeCount} unsaved change{changeCount !== 1 ? 's' : ''}.
            Save your draft or submit for admin approval.
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onDiscard}
            disabled={isSaving || isSubmitting}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Discard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving || isSubmitting}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isSaving || isSubmitting || changeCount === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-1" />
            {isSubmitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
