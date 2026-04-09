"use client"

import { useState, useEffect } from "react"
import TutorSchedulesExcelGrid from "./TutorSchedulesExcelGrid"
import { SlotEditDialog } from "./SlotEditDialog"
import { SlotAddDialog } from "./SlotAddDialog"
import { SlotSelectionDialog } from "./SlotSelectionDialog"
import { RefreshCw, AlertCircle, Filter } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createServerClient } from "@/lib/supabase-server"

interface TutorSchedule {
  tutorId: string
  tutorName: string
  role: string
  days: {
    [dayName: string]: Array<{
      id: string
      dayOfWeek: number
      dayName: string
      startTime: string
      endTime: string
    }>
  }
  totalSlots: number
}

interface ApiResponse {
  schedules: TutorSchedule[]
  totalTutors: number
  totalSlots: number
}

export default function LeadTutorSchedulesView() {
  const [schedules, setSchedules] = useState<TutorSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [deduplicating, setDeduplicating] = useState(false)

  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showSelectionDialog, setShowSelectionDialog] = useState(false)

  // Current editing data
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [selectedTutorId, setSelectedTutorId] = useState<string>("")
  const [selectedTutorName, setSelectedTutorName] = useState<string>("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<any[]>([])

  const { toast } = useToast()

  const fetchSchedules = async () => {
    try {
      setError(null)
      const response = await fetch('/api/schedule?role=lead_tutor')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch schedules')
      }

      const data: ApiResponse = await response.json()
      setSchedules(data.schedules || [])
    } catch (err: any) {
      console.error('Error fetching lead tutor schedules:', err)
      setError(err.message || 'An error occurred while fetching schedules')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSchedules()
  }

  // Handle cell click in grid
  const handleCellClick = async (tutorId: string, tutorName: string, timeSlot: string, days: number[]) => {
    setSelectedTutorId(tutorId)
    setSelectedTutorName(tutorName)
    setSelectedTimeSlot(timeSlot)

    // Fetch all slots for this tutor at this time
    try {
      // Convert display time "2:00 PM" to 24-hour format "14:00"
      const hour24 = timeSlot.includes('PM')
        ? (parseInt(timeSlot.split(':')[0]) % 12) + 12
        : parseInt(timeSlot.split(':')[0]) % 12 || 12
      const startTime = `${hour24.toString().padStart(2, '0')}:00:00`

      const response = await fetch(`/api/schedule?role=lead_tutor`)
      if (!response.ok) throw new Error('Failed to fetch slots')

      const data: ApiResponse = await response.json()
      const tutor = data.schedules.find(s => s.tutorId === tutorId)

      if (!tutor) {
        // No slots found - open add dialog
        setShowAddDialog(true)
        return
      }

      // Collect all slots at this time across all days
      const slotsAtTime: any[] = []
      Object.entries(tutor.days).forEach(([dayName, daySlots]: [string, any]) => {
        daySlots.forEach((slot: any) => {
          if (slot.startTime.startsWith(startTime.substring(0, 5))) {
            slotsAtTime.push({
              ...slot,
              tutorName,
            })
          }
        })
      })

      if (slotsAtTime.length === 0) {
        // No slots at this time - open add dialog
        setShowAddDialog(true)
      } else if (slotsAtTime.length === 1) {
        // Single slot - edit directly
        setSelectedSlot(slotsAtTime[0])
        setShowEditDialog(true)
      } else {
        // Multiple slots - show selection dialog
        setAvailableSlots(slotsAtTime)
        setShowSelectionDialog(true)
      }
    } catch (err) {
      console.error('Error fetching slot details:', err)
      toast({
        title: "Error",
        description: "Failed to load slot details",
        variant: "destructive",
      })
    }
  }

  // Handle edit slot from selection dialog
  const handleEditFromSelection = (slot: any) => {
    setSelectedSlot(slot)
    setShowSelectionDialog(false)
    setShowEditDialog(true)
  }

  // Handle delete slot from selection dialog
  const handleDeleteFromSelection = async (slotId: string, dayName: string) => {
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
        description: `${dayName} slot deleted successfully`,
      })

      setShowSelectionDialog(false)
      fetchSchedules()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  // Handle save from edit dialog
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

      setShowEditDialog(false)
      fetchSchedules()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
      throw err
    }
  }

  // Handle add new slot
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

      setShowAddDialog(false)
      fetchSchedules()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
      throw err
    }
  }

  // Handle remove duplicates
  const handleRemoveDuplicates = async () => {
    if (!confirm("This will remove all duplicate time slots. Continue?")) {
      return
    }

    setDeduplicating(true)
    try {
      const response = await fetch("/api/schedule/deduplicate", {
        method: "POST",
      })

      const result = await response.json()

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
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setDeduplicating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading lead tutor schedules...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-semibold">Error loading schedules</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Lead Tutor Schedules - Excel View
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {schedules.length} lead tutor{schedules.length !== 1 ? 's' : ''} with{' '}
            {schedules.reduce((sum, s) => sum + s.totalSlots, 0)} total slots
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRemoveDuplicates}
            disabled={loading || deduplicating}
            className="flex items-center gap-2 px-4 py-2 border border-orange-200 text-orange-700 rounded hover:bg-orange-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors text-sm"
          >
            <Filter className={`h-4 w-4 ${deduplicating ? 'animate-pulse' : ''}`} />
            {deduplicating ? "Removing..." : "Remove Duplicates"}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How to read and edit this grid:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Rows:</strong> Time slots (2:00 PM - 8:00 PM in 1-hour intervals)</p>
          <p>• <strong>Columns:</strong> Lead tutors</p>
          <p>• <strong>Cells:</strong> Show which days the tutor is available at that time</p>
          <p>• <strong>Green cells:</strong> Tutor is available - click to edit/delete</p>
          <p>• <strong>White cells:</strong> Not available - click to add new slot</p>
          <p>• <strong>Day abbreviations:</strong> Sun, Mon, Tue, Wed, Thu, Fri, Sat</p>
        </div>
      </div>

      {/* Excel Grid */}
      <TutorSchedulesExcelGrid schedules={schedules} onCellClick={handleCellClick} />

      {/* Print hint */}
      <div className="text-center text-sm text-gray-500 pt-4">
        <p>Tip: Use your browser's print function (Ctrl+P) to print this schedule</p>
      </div>

      {/* Dialogs */}
      <SlotSelectionDialog
        open={showSelectionDialog}
        onOpenChange={setShowSelectionDialog}
        slots={availableSlots}
        tutorName={selectedTutorName}
        timeSlot={selectedTimeSlot}
        onEdit={handleEditFromSelection}
        onDelete={handleDeleteFromSelection}
      />

      <SlotEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        slot={selectedSlot}
        onSave={handleEditSlot}
      />

      <SlotAddDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        tutorId={selectedTutorId}
        tutorName={selectedTutorName}
        onAdd={handleAddSlot}
      />
    </div>
  )
}
