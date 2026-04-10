"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Clock, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/contexts/AuthContext"
import { hasPermission } from "@/lib/roles"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface SlotChange {
  change_slot_id: string
  action: 'add' | 'delete' | 'modify'
  day_of_week: number
  start_time: string
  end_time: string
  original_slot_id?: string
  tutor_availability?: {
    availability_id: string
    day_of_week: number
    start_time: string
    end_time: string
  }
}

interface RequestDetails {
  request_id: string
  tutor_id: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  admin_notes?: string
  rejection_reason?: string
  tutors: {
    tutor_id: string
    tutor_name: string
    username: string
    role: string
  }
  users: {
    user_id: string
    email: string
    full_name: string
  }
  schedule_change_slots: SlotChange[]
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function ScheduleRequestDetailPage() {
  const params = useParams()
  const requestId = params.id as string

  const [request, setRequest] = useState<RequestDetails | null>(null)
  const [currentSchedule, setCurrentSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [processing, setProcessing] = useState(false)

  const { toast } = useToast()
  const { role, isLoading: authLoading } = useUser()
  const router = useRouter()

  const canApprove = role ? hasPermission(role, 'APPROVE_SCHEDULE_REQUESTS') : false
  const canReject = role ? hasPermission(role, 'REJECT_SCHEDULE_REQUESTS') : false

  useEffect(() => {
    if (!authLoading && !canApprove && !canReject) {
      router.push('/tutor-schedules')
      toast({
        title: "Access Denied",
        description: "You don't have permission to view schedule requests.",
        variant: "destructive",
      })
    }
  }, [authLoading, canApprove, canReject, router, toast])

  const fetchRequestDetails = async () => {
    // Validate requestId
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      console.error('Invalid request ID:', requestId)
      toast({
        title: "Invalid Request",
        description: "No request ID provided. Redirecting to requests list.",
        variant: "destructive",
      })
      router.push('/admin/schedule-requests')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/schedule-requests/${requestId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch request details')
      }

      const data = await response.json()
      setRequest(data.request)
      setCurrentSchedule(data.currentSchedule || [])
    } catch (error: any) {
      console.error('Fetch request details error:', error)
      toast({
        title: "Error Loading Request",
        description: error.message,
        variant: "destructive",
      })
      router.push('/admin/schedule-requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Redirect immediately if no valid requestId
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      router.push('/admin/schedule-requests')
      return
    }

    if (canApprove || canReject) {
      fetchRequestDetails()
    }
  }, [requestId, canApprove, canReject])

  const handleApprove = async () => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/schedule-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          adminNotes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to approve request')
      }

      toast({
        title: "Request Approved",
        description: "Schedule changes have been applied successfully.",
      })

      setShowApproveDialog(false)
      router.push('/admin/schedule-requests')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this request.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/schedule-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason,
          adminNotes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reject request')
      }

      toast({
        title: "Request Rejected",
        description: "The tutor has been notified of the rejection.",
      })

      setShowRejectDialog(false)
      router.push('/admin/schedule-requests')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'add':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Add</Badge>
      case 'delete':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Delete</Badge>
      case 'modify':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Modify</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!request) {
    return null
  }

  const isPending = request.status === 'pending'
  const sortedChanges = [...request.schedule_change_slots].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
    return a.start_time.localeCompare(b.start_time)
  })

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/schedule-requests')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule Change Request</h1>
        <p className="text-gray-600 mt-1">Review and approve changes for {request.tutors.tutor_name}</p>
      </div>

      {/* Request Info Card */}
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Tutor</h3>
            <p className="text-lg font-semibold">{request.tutors.tutor_name}</p>
            <p className="text-sm text-gray-600">{request.tutors.username}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            {request.status === 'pending' && (
              <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700">
                <Clock className="h-3 w-3 mr-1" />
                Pending Review
              </Badge>
            )}
            {request.status === 'approved' && (
              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            )}
            {request.status === 'rejected' && (
              <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
                <XCircle className="h-3 w-3 mr-1" />
                Rejected
              </Badge>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted</h3>
            <p className="text-sm">{formatDate(request.submitted_at)}</p>
          </div>
          {request.reviewed_at && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Reviewed</h3>
              <p className="text-sm">{formatDate(request.reviewed_at)}</p>
            </div>
          )}
        </div>

        {request.admin_notes && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">Admin Notes:</p>
            <p className="text-sm text-blue-700">{request.admin_notes}</p>
          </div>
        )}

        {request.rejection_reason && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
            <p className="text-sm text-red-700">{request.rejection_reason}</p>
          </div>
        )}
      </Card>

      {/* Schedule Changes */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Proposed Changes ({sortedChanges.length})</h3>
        <div className="space-y-3">
          {sortedChanges.map((change) => (
            <div
              key={change.change_slot_id}
              className="p-4 border rounded-lg flex items-start justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getActionBadge(change.action)}
                  <span className="font-medium">{DAY_NAMES[change.day_of_week]}</span>
                </div>
                <div className="space-y-1 text-sm">
                  {change.action === 'add' && (
                    <p className="text-green-700">
                      <span className="font-medium">New slot:</span>{' '}
                      {formatTime(change.start_time)} - {formatTime(change.end_time)}
                    </p>
                  )}
                  {change.action === 'delete' && change.tutor_availability && (
                    <p className="text-red-700">
                      <span className="font-medium">Remove slot:</span>{' '}
                      {formatTime(change.tutor_availability.start_time)} -{' '}
                      {formatTime(change.tutor_availability.end_time)}
                    </p>
                  )}
                  {change.action === 'modify' && change.tutor_availability && (
                    <>
                      <p className="text-gray-600">
                        <span className="font-medium">From:</span>{' '}
                        {formatTime(change.tutor_availability.start_time)} -{' '}
                        {formatTime(change.tutor_availability.end_time)}
                      </p>
                      <p className="text-blue-700">
                        <span className="font-medium">To:</span>{' '}
                        {formatTime(change.start_time)} - {formatTime(change.end_time)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      {isPending && canApprove && canReject && (
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Review Actions</h3>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => setShowRejectDialog(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Request
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => setShowApproveDialog(true)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve Changes
            </Button>
          </div>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Schedule Changes</DialogTitle>
            <DialogDescription>
              This will apply all proposed changes to {request.tutors.tutor_name}'s schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add any notes or feedback for the tutor..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Schedule Changes</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. The tutor will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="border-red-200 focus:border-red-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-notes-reject">Additional Notes (Optional)</Label>
              <Textarea
                id="admin-notes-reject"
                placeholder="Add any additional feedback..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
