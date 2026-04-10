"use client"

import { useState, useEffect } from "react"
import { UploadSection } from "@/components/schedule/UploadSection"
import { TutorScheduleView } from "@/components/schedule/TutorScheduleView"
import LeadTutorSchedulesView from "@/components/schedule/LeadTutorSchedulesView"
import { DraftModeBanner } from "@/components/schedule/DraftModeBanner"
import { PendingRequestBanner } from "@/components/schedule/PendingRequestBanner"
import { ApprovedNotificationModal } from "@/components/schedule/ApprovedNotificationModal"
import { Input } from "@/components/ui/input"
import { Loader2, Search, RefreshCw, Zap, Filter, User, Users, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useUser } from "@/contexts/AuthContext"
import { hasPermission } from "@/lib/roles"

interface TutorSchedule {
  tutorId: string
  tutorName: string
  days: Record<string, any[]>
  totalSlots: number
}

export default function TutorSchedulesPage() {
  const [schedules, setSchedules] = useState<TutorSchedule[]>([])
  const [filteredSchedules, setFilteredSchedules] = useState<TutorSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [reprocessing, setReprocessing] = useState(false)
  const [deduplicating, setDeduplicating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("accordion")
  const [viewMode, setViewMode] = useState<'own' | 'all'>('own')
  const [canViewAll, setCanViewAll] = useState(false)

  // Draft mode states
  const [draftMode, setDraftMode] = useState(false)
  const [draftChanges, setDraftChanges] = useState<any[]>([])
  const [currentRequest, setCurrentRequest] = useState<any>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showApprovedModal, setShowApprovedModal] = useState(false)
  const [approvedRequestData, setApprovedRequestData] = useState<any>(null)

  const { toast } = useToast()
  const { user, role, isLoading: authLoading } = useUser()

  // Check if user can view all schedules and ensure regular tutors only see accordion view
  useEffect(() => {
    if (role) {
      const hasViewAllPermission = hasPermission(role, 'VIEW_ALL_SCHEDULES')
      setCanViewAll(hasViewAllPermission)
      // Default to 'all' for users with permission, 'own' for regular tutors
      if (hasViewAllPermission) {
        setViewMode('all')
      }
      // Force regular tutors to accordion view
      if (role === 'tutor' && activeTab === 'excel') {
        setActiveTab('accordion')
      }
    }
  }, [role, activeTab])

  // Fetch draft status on component mount
  const fetchDraftStatus = async () => {
    if (!user || !role || !hasPermission(role, 'CREATE_SCHEDULE_DRAFT')) return

    try {
      const response = await fetch('/api/schedule/draft')
      if (!response.ok) {
        if (response.status === 404) {
          // No draft exists
          setDraftMode(false)
          setCurrentRequest(null)
          setDraftChanges([])
          return
        }
        throw new Error('Failed to fetch draft status')
      }

      const data = await response.json()

      if (data.request) {
        setCurrentRequest(data.request)
        setDraftChanges(data.request.schedule_change_slots || [])
        setDraftMode(data.request.status === 'draft')

        // Check if recently approved
        if (data.request.status === 'approved' && !sessionStorage.getItem(`approved_shown_${data.request.request_id}`)) {
          setApprovedRequestData(data.request)
          setShowApprovedModal(true)
          sessionStorage.setItem(`approved_shown_${data.request.request_id}`, 'true')
        }
      }
    } catch (error: any) {
      console.error('Fetch draft status error:', error)
    }
  }

  // Enter draft mode
  const enterDraftMode = () => {
    if (currentRequest && currentRequest.status === 'pending') {
      toast({
        title: "Cannot Edit",
        description: "You have a pending request awaiting approval. Please wait for admin review.",
        variant: "destructive",
      })
      return
    }
    setDraftMode(true)
    setDraftChanges([])
  }

  // Save draft
  const saveDraft = async () => {
    if (draftChanges.length === 0) {
      toast({
        title: "No Changes",
        description: "Make some changes to your schedule before saving.",
        variant: "destructive",
      })
      return
    }

    setIsSavingDraft(true)
    try {
      const response = await fetch('/api/schedule/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: draftChanges }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save draft')
      }

      const data = await response.json()
      setCurrentRequest(data.request)

      toast({
        title: "Draft Saved",
        description: "Your changes have been saved as a draft.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Submit for approval
  const submitForApproval = async () => {
    if (draftChanges.length === 0) {
      toast({
        title: "No Changes",
        description: "Make some changes to your schedule before submitting.",
        variant: "destructive",
      })
      return
    }

    // Save draft first if not saved
    if (!currentRequest) {
      await saveDraft()
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/schedule/submit', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit for approval')
      }

      const data = await response.json()

      toast({
        title: "Submitted Successfully",
        description: "Your schedule changes have been sent to admin for review.",
      })

      // Refresh to show pending banner
      await fetchDraftStatus()
      setDraftMode(false)
      setDraftChanges([])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Discard draft
  const discardDraft = async () => {
    if (!confirm('Are you sure you want to discard your draft changes? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/schedule/draft', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to discard draft')
      }

      setDraftMode(false)
      setDraftChanges([])
      setCurrentRequest(null)

      toast({
        title: "Draft Discarded",
        description: "Your draft changes have been deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Fetch schedules with viewMode parameter
  const fetchSchedules = async () => {
    setLoading(true)
    try {
      // Build API URL with viewMode parameter
      const url = `/api/schedule?viewMode=${viewMode}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || "Failed to fetch schedules")
      }

      const data = await response.json()

      console.log("Schedules fetched:", data) // Debug log

      setSchedules(data.schedules || [])
      setFilteredSchedules(data.schedules || [])

      // Update canViewAll based on API response
      if (data.canViewAll !== undefined) {
        setCanViewAll(data.canViewAll)
      }
    } catch (error: any) {
      console.error("Fetch schedules error:", error) // Debug log
      toast({
        title: "Error Loading Schedules",
        description: error.message || "Failed to load schedules",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch schedules and draft status when viewMode changes
  useEffect(() => {
    if (!authLoading && user) {
      fetchSchedules()
      fetchDraftStatus()
    }
  }, [viewMode, authLoading, user])

  // Filter schedules by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSchedules(schedules)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredSchedules(
        schedules.filter((schedule) =>
          schedule.tutorName.toLowerCase().includes(query) ||
          schedule.tutorId.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, schedules])

  // Handle upload success
  const handleUploadSuccess = (responseData?: any) => {
    let description = "Schedule uploaded successfully"

    if (responseData) {
      const parts = []
      if (responseData.tutorsMatched > 0) {
        parts.push(`${responseData.tutorsMatched} tutor(s) matched`)
      }
      if (responseData.tutorsCreated > 0) {
        parts.push(`${responseData.tutorsCreated} new tutor(s) created`)
      }
      if (responseData.slotsCreated > 0) {
        parts.push(`${responseData.slotsCreated} slot(s) imported`)
      }
      if (parts.length > 0) {
        description = parts.join(", ")
      }
    }

    toast({
      title: "Success",
      description,
    })
    fetchSchedules()
  }

  // Handle edit slot
  const handleEditSlot = async (slotId: string, updates: any) => {
    // If in draft mode, add to draft changes instead of directly updating
    if (draftMode) {
      const newChange = {
        action: 'modify',
        original_slot_id: slotId,
        day_of_week: updates.day_of_week,
        start_time: updates.start_time,
        end_time: updates.end_time,
      }
      setDraftChanges([...draftChanges, newChange])

      toast({
        title: "Change Added to Draft",
        description: "Remember to save your draft or submit for approval.",
      })
      return
    }

    // Otherwise, update directly (for admins/managers editing all schedules)
    try {
      const response = await fetch(`/api/schedule/slot/${slotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update slot")
      }

      toast({
        title: "Success",
        description: "Time slot updated successfully",
      })
      fetchSchedules()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Handle delete slot
  const handleDeleteSlot = async (slotId: string) => {
    // If in draft mode, add deletion to draft changes
    if (draftMode) {
      const newChange = {
        action: 'delete',
        original_slot_id: slotId,
      }
      setDraftChanges([...draftChanges, newChange])

      toast({
        title: "Deletion Added to Draft",
        description: "Remember to save your draft or submit for approval.",
      })
      return
    }

    // Otherwise, delete directly (for admins/managers)
    try {
      const response = await fetch(`/api/schedule/slot/${slotId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete slot")
      }

      toast({
        title: "Success",
        description: "Time slot deleted successfully",
      })
      fetchSchedules()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Handle add slot
  const handleAddSlot = async (data: any) => {
    // If in draft mode, add to draft changes
    if (draftMode) {
      const newChange = {
        action: 'add',
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
      }
      setDraftChanges([...draftChanges, newChange])

      toast({
        title: "Addition Added to Draft",
        description: "Remember to save your draft or submit for approval.",
      })
      return
    }

    // Otherwise, add directly (for admins/managers)
    try {
      const response = await fetch("/api/schedule/slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.error || "Failed to add slot")
      }

      toast({
        title: "Success",
        description: "Time slot added successfully",
      })
      fetchSchedules()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Handle re-process schedules
  const handleReprocess = async () => {
    if (!confirm("This will break all slots longer than 1 hour into individual 1-hour chunks. Continue?")) {
      return
    }

    setReprocessing(true)
    try {
      const response = await fetch("/api/schedule/reprocess", {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to re-process schedules")
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: result.message || `Processed ${result.slotsProcessed} slots into ${result.newSlotsCreated} 1-hour slots`,
      })
      fetchSchedules()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setReprocessing(false)
    }
  }

  // Handle deduplicate schedules
  const handleDeduplicate = async () => {
    if (!confirm("This will remove all duplicate time slots. Continue?")) {
      return
    }

    setDeduplicating(true)
    try {
      const response = await fetch("/api/schedule/deduplicate", {
        method: "POST",
      })

      const result = await response.json()
      console.log("Deduplicate result:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove duplicates")
      }

      const message = result.duplicatesRemoved > 0
        ? `Removed ${result.duplicatesRemoved} of ${result.duplicatesFound} duplicates`
        : `Found ${result.duplicatesFound} duplicates but couldn't remove them`

      toast({
        title: result.duplicatesRemoved > 0 ? "Success" : "Warning",
        description: message + (result.errorCount > 0 ? ` (${result.errorCount} errors)` : ""),
        variant: result.duplicatesRemoved > 0 ? "default" : "destructive",
      })

      if (result.duplicatesRemoved > 0) {
        fetchSchedules()
      }
    } catch (error: any) {
      console.error("Deduplicate error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeduplicating(false)
    }
  }

  const canCreateDraft = role ? hasPermission(role, 'CREATE_SCHEDULE_DRAFT') : false
  const hasPendingRequest = currentRequest?.status === 'pending'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tutor Schedule Management</h1>
        <p className="text-gray-600 mt-1">Upload and manage tutor availability schedules</p>
      </div>

      {/* Draft Mode Banner */}
      {draftMode && draftChanges.length > 0 && (
        <DraftModeBanner
          onSave={saveDraft}
          onSubmit={submitForApproval}
          onDiscard={discardDraft}
          isSaving={isSavingDraft}
          isSubmitting={isSubmitting}
          changeCount={draftChanges.length}
        />
      )}

      {/* Pending Request Banner */}
      {!draftMode && hasPendingRequest && (
        <PendingRequestBanner
          requestId={currentRequest.request_id}
          submittedAt={currentRequest.submitted_at}
          changeCount={currentRequest.schedule_change_slots?.length || 0}
        />
      )}

      {/* Approved Notification Modal */}
      <ApprovedNotificationModal
        open={showApprovedModal}
        onClose={() => setShowApprovedModal(false)}
        approvedAt={approvedRequestData?.reviewed_at}
        changeCount={approvedRequestData?.schedule_change_slots?.length}
        adminNotes={approvedRequestData?.admin_notes}
      />

      {/* Upload Section */}
      <UploadSection onUploadSuccess={handleUploadSuccess} />

      {/* Schedule View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Current Schedules</h2>
            {canViewAll && (
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'own' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('own')}
                  className="h-8 px-3"
                >
                  <User className="h-4 w-4 mr-1" />
                  My Schedule
                </Button>
                <Button
                  variant={viewMode === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('all')}
                  className="h-8 px-3"
                >
                  <Users className="h-4 w-4 mr-1" />
                  All Schedules
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {/* Edit Schedule Button for tutors */}
            {canCreateDraft && viewMode === 'own' && !draftMode && !hasPendingRequest && (
              <Button
                variant="default"
                size="sm"
                onClick={enterDraftMode}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit My Schedule
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeduplicate}
              disabled={loading || deduplicating || activeTab === "excel"}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Filter className={`h-4 w-4 mr-2 ${deduplicating ? 'animate-pulse' : ''}`} />
              {deduplicating ? "Removing..." : "Remove Duplicates"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReprocess}
              disabled={loading || reprocessing || activeTab === "excel"}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Zap className={`h-4 w-4 mr-2 ${reprocessing ? 'animate-pulse' : ''}`} />
              {reprocessing ? "Processing..." : "Break into 1-Hour Slots"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSchedules}
              disabled={loading || activeTab === "excel"}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs for switching views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="accordion">Accordion View</TabsTrigger>
            {/* Excel Grid View - only for lead_tutor and above */}
            {role && role !== 'tutor' && (
              <TabsTrigger value="excel">Excel Grid View</TabsTrigger>
            )}
          </TabsList>

          {/* Accordion View Tab */}
          <TabsContent value="accordion" className="space-y-4">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tutors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading schedules...</span>
              </div>
            )}

            {/* Schedule Display */}
            {!loading && (
              <>
                {filteredSchedules.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Showing {filteredSchedules.length} tutor{filteredSchedules.length !== 1 ? 's' : ''}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                    <TutorScheduleView
                      schedules={filteredSchedules}
                      onEditSlot={handleEditSlot}
                      onDeleteSlot={handleDeleteSlot}
                      onAddSlot={handleAddSlot}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {searchQuery ? (
                      <p>No tutors found matching "{searchQuery}"</p>
                    ) : (
                      <p>No schedules available. Upload a schedule file to get started.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Excel Grid View Tab */}
          <TabsContent value="excel">
            <LeadTutorSchedulesView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
