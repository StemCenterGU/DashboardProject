"use client"

import { useState, useEffect } from "react"
import { UploadSection } from "@/components/schedule/UploadSection"
import { TutorScheduleView } from "@/components/schedule/TutorScheduleView"
import { Input } from "@/components/ui/input"
import { Loader2, Search, RefreshCw, Zap, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

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
  const { toast } = useToast()

  // Fetch schedules
  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/schedule")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || "Failed to fetch schedules")
      }

      const data = await response.json()

      console.log("Schedules fetched:", data) // Debug log

      setSchedules(data.schedules || [])
      setFilteredSchedules(data.schedules || [])
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

  // Initial load
  useEffect(() => {
    fetchSchedules()
  }, [])

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
  const handleUploadSuccess = () => {
    toast({
      title: "Success",
      description: "Schedule uploaded successfully",
    })
    fetchSchedules()
  }

  // Handle edit slot
  const handleEditSlot = async (slotId: string, updates: any) => {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tutor Schedule Management</h1>
        <p className="text-gray-600 mt-1">Upload and manage tutor availability schedules</p>
      </div>

      {/* Upload Section */}
      <UploadSection onUploadSuccess={handleUploadSuccess} />

      {/* Schedule View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Current Schedules</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeduplicate}
              disabled={loading || deduplicating}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Filter className={`h-4 w-4 mr-2 ${deduplicating ? 'animate-pulse' : ''}`} />
              {deduplicating ? "Removing..." : "Remove Duplicates"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReprocess}
              disabled={loading || reprocessing}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Zap className={`h-4 w-4 mr-2 ${reprocessing ? 'animate-pulse' : ''}`} />
              {reprocessing ? "Processing..." : "Break into 1-Hour Slots"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSchedules}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

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
      </div>
    </div>
  )
}
