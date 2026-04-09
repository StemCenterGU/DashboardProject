"use client"

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Pencil, Trash2, Plus, Clock } from "lucide-react"
import { SlotEditDialog } from "./SlotEditDialog"
import { SlotAddDialog } from "./SlotAddDialog"
import { useUser } from "@/contexts/AuthContext"
import { hasPermission } from "@/lib/roles"

interface Slot {
  id: string
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
}

interface TutorSchedule {
  tutorId: string
  tutorName: string
  days: Record<string, Slot[]>
  totalSlots: number
}

interface TutorScheduleViewProps {
  schedules: TutorSchedule[]
  onEditSlot: (slotId: string, updates: any) => Promise<void>
  onDeleteSlot: (slotId: string) => Promise<void>
  onAddSlot: (data: any) => Promise<void>
  readOnly?: boolean  // Optional: hide all edit buttons
}

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function TutorScheduleView({ schedules, onEditSlot, onDeleteSlot, onAddSlot, readOnly = false }: TutorScheduleViewProps) {
  const [editSlot, setEditSlot] = useState<{
    id: string
    tutorName: string
    dayOfWeek: number
    dayName: string
    startTime: string
    endTime: string
  } | null>(null)
  const [addSlotTutor, setAddSlotTutor] = useState<{
    tutorId: string
    tutorName: string
  } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { role, isLoading: authLoading } = useUser()

  // Check if user can edit their own schedule OR all schedules
  const canEditOwn = role ? hasPermission(role, 'EDIT_OWN_SCHEDULE') : false
  const canEditAll = role ? hasPermission(role, 'EDIT_ALL_SCHEDULES') : false
  const canEdit = !readOnly && !authLoading && (canEditOwn || canEditAll)

  // Debug log for permissions
  if (typeof window !== 'undefined' && role) {
    console.log('TutorScheduleView permissions:', {
      role,
      canEditOwn,
      canEditAll,
      canEdit,
      readOnly,
      authLoading
    })
  }

  const handleDelete = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this time slot?")) return

    setDeletingId(slotId)
    try {
      await onDeleteSlot(slotId)
    } finally {
      setDeletingId(null)
    }
  }

  const formatTime = (time: string) => {
    // Convert HH:MM:SS to 12-hour format
    const [hours, minutes] = time.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
  }

  if (schedules.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Schedules Found</h3>
        <p className="text-gray-500">Upload a schedule file to get started</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tutor Accordions */}
      {schedules.map((tutor) => {
        // Show all 7 days if tutor has no slots, otherwise only show days with slots
        const sortedDays = tutor.totalSlots === 0
          ? DAY_ORDER
          : DAY_ORDER.filter(day => tutor.days[day])

        return (
          <Card key={tutor.tutorId} className="overflow-hidden">
            <Accordion type="single" collapsible>
              <AccordionItem value={tutor.tutorId} className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3 w-full">
                    <span className="font-semibold text-lg">{tutor.tutorName}</span>
                    <Badge variant="outline" className="ml-auto mr-2">
                      {tutor.totalSlots} slots
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-4 space-y-3">
                    {/* Day Accordions */}
                    <Accordion type="single" collapsible>
                      {sortedDays.map((day) => (
                        <AccordionItem key={day} value={day} className="border rounded-lg">
                          <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{day}</span>
                              <Badge variant="secondary" className="text-xs">
                                {tutor.days[day]?.length || 0}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="px-4 pb-2 space-y-2">
                              {tutor.days[day] && tutor.days[day].length > 0 ? (
                                tutor.days[day].map((slot) => (
                                <div
                                  key={slot.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="font-mono text-sm">
                                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                    </span>
                                  </div>
                                  {canEdit && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditSlot({
                                          id: slot.id,
                                          tutorName: tutor.tutorName,
                                          dayOfWeek: slot.dayOfWeek,
                                          dayName: slot.dayName,
                                          startTime: slot.startTime,
                                          endTime: slot.endTime,
                                        })}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(slot.id)}
                                        disabled={deletingId === slot.id}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))
                              ) : (
                                // Empty day template - show clickable hourly slots from 2PM-8PM
                                <div className="py-2 px-4">
                                  {canEdit ? (
                                    <>
                                      <p className="text-sm text-gray-500 mb-3 text-center">
                                        Click a time slot to add availability
                                      </p>
                                      <div className="space-y-2">
                                        {[14, 15, 16, 17, 18, 19].map((hour) => {
                                      const startTime = `${String(hour).padStart(2, '0')}:00:00`
                                      const endTime = `${String(hour + 1).padStart(2, '0')}:00:00`
                                      const dayIndex = DAY_ORDER.indexOf(day)

                                      return (
                                        <button
                                          key={hour}
                                          onClick={async () => {
                                            try {
                                              await onAddSlot({
                                                tutor_id: tutor.tutorId,
                                                day_of_week: dayIndex,
                                                start_time: startTime,
                                                end_time: endTime,
                                              })
                                            } catch (error) {
                                              // Error is handled by parent component
                                            }
                                          }}
                                          className="w-full flex items-center justify-between p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                                            <span className="font-mono text-sm text-gray-600 group-hover:text-blue-900">
                                              {formatTime(startTime)} - {formatTime(endTime)}
                                            </span>
                                          </div>
                                          <span className="text-xs text-gray-400 group-hover:text-blue-600">
                                            Click to add
                                          </span>
                                        </button>
                                      )
                                    })}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-center py-6 text-gray-400">
                                      <p className="text-sm">No availability set</p>
                                      <p className="text-xs mt-2">
                                        Debug: canEdit={String(canEdit)}, role={role || 'null'}, authLoading={String(authLoading)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    {/* Add Slot Button */}
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddSlotTutor({
                          tutorId: tutor.tutorId,
                          tutorName: tutor.tutorName,
                        })}
                        className="w-full mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Time Slot
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        )
      })}

      {/* Edit Dialog */}
      <SlotEditDialog
        open={!!editSlot}
        onOpenChange={(open) => !open && setEditSlot(null)}
        slot={editSlot}
        onSave={onEditSlot}
      />

      {/* Add Dialog */}
      {addSlotTutor && (
        <SlotAddDialog
          open={!!addSlotTutor}
          onOpenChange={(open) => !open && setAddSlotTutor(null)}
          tutorId={addSlotTutor.tutorId}
          tutorName={addSlotTutor.tutorName}
          onAdd={onAddSlot}
        />
      )}
    </div>
  )
}
