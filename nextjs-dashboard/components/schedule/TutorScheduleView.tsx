"use client"

import { useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Pencil, Trash2, Plus, Clock } from "lucide-react"
import { SlotEditDialog } from "./SlotEditDialog"
import { SlotAddDialog } from "./SlotAddDialog"

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
}

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function TutorScheduleView({ schedules, onEditSlot, onDeleteSlot, onAddSlot }: TutorScheduleViewProps) {
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
        const sortedDays = DAY_ORDER.filter(day => tutor.days[day])

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
                                {tutor.days[day].length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="px-4 pb-2 space-y-2">
                              {tutor.days[day].map((slot) => (
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
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    {/* Add Slot Button */}
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
