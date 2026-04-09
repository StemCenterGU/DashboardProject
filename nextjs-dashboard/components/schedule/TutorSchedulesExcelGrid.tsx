"use client"

import { useMemo } from "react"

interface TimeSlot {
  time: string // "08:00"
  displayTime: string // "8:00 AM"
}

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

interface GridCell {
  days: number[] // Array of day numbers (0=Sunday, 6=Saturday)
  dayNames: string[] // Array of day abbreviations
}

interface ExcelGridProps {
  schedules: TutorSchedule[]
  onCellClick?: (tutorId: string, tutorName: string, timeSlot: string, days: number[]) => void
}

const DAY_ABBREVIATIONS: Record<string, string> = {
  Sunday: 'Sun',
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
}

export default function TutorSchedulesExcelGrid({ schedules, onCellClick }: ExcelGridProps) {
  // Generate time slots (2 PM - 8 PM, 1-hour intervals)
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = []
    for (let hour = 14; hour <= 19; hour++) {  // 14 = 2 PM, 19 = 7 PM (last slot is 7-8 PM)
      const time = `${hour.toString().padStart(2, '0')}:00`
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayTime = `${displayHour}:00 ${period}`
      slots.push({ time, displayTime })
    }
    return slots
  }, [])

  // Transform schedules into grid format: [timeSlot][tutorId] = GridCell
  const gridData = useMemo<Record<string, Record<string, GridCell>>>(() => {
    const grid: Record<string, Record<string, GridCell>> = {}

    // Initialize grid
    timeSlots.forEach(slot => {
      grid[slot.time] = {}
      schedules.forEach(tutor => {
        grid[slot.time][tutor.tutorId] = { days: [], dayNames: [] }
      })
    })

    // Populate grid with availability data
    schedules.forEach(tutor => {
      Object.entries(tutor.days).forEach(([dayName, slots]) => {
        slots.forEach(slot => {
          const startTime = slot.startTime.substring(0, 5) // "HH:MM"
          const endTime = slot.endTime.substring(0, 5)

          // Find all time slots that fall within this availability window
          timeSlots.forEach(timeSlot => {
            if (timeSlot.time >= startTime && timeSlot.time < endTime) {
              const cell = grid[timeSlot.time][tutor.tutorId]
              if (!cell.days.includes(slot.dayOfWeek)) {
                cell.days.push(slot.dayOfWeek)
                cell.dayNames.push(DAY_ABBREVIATIONS[dayName] || dayName.substring(0, 3))
              }
            }
          })
        })
      })
    })

    return grid
  }, [schedules, timeSlots])

  if (schedules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500">No lead tutor schedules found</p>
          <p className="text-sm text-gray-400 mt-2">
            Make sure tutors have the "lead_tutor" role assigned
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-auto border rounded-lg shadow-sm">
      <table className="min-w-full bg-white">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 bg-blue-600 text-white px-4 py-3 text-left text-sm font-semibold border-r border-blue-700">
              Time
            </th>
            {schedules.map(tutor => (
              <th
                key={tutor.tutorId}
                className="bg-blue-600 text-white px-4 py-3 text-center text-sm font-semibold border-l border-blue-500 min-w-[120px]"
              >
                <div className="flex flex-col">
                  <span>{tutor.tutorName}</span>
                  <span className="text-xs text-blue-200 mt-1">
                    ({tutor.totalSlots} slots)
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((timeSlot, rowIndex) => (
            <tr
              key={timeSlot.time}
              className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              <td className="sticky left-0 z-10 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 border-r border-gray-300 whitespace-nowrap">
                {timeSlot.displayTime}
              </td>
              {schedules.map(tutor => {
                const cell = gridData[timeSlot.time][tutor.tutorId]
                const hasAvailability = cell.dayNames.length > 0

                const handleCellClick = () => {
                  if (onCellClick) {
                    onCellClick(tutor.tutorId, tutor.tutorName, timeSlot.displayTime, cell.days)
                  }
                }

                return (
                  <td
                    key={`${timeSlot.time}-${tutor.tutorId}`}
                    onClick={handleCellClick}
                    className={`px-2 py-2 text-center text-xs border-l border-gray-200 ${
                      hasAvailability
                        ? 'bg-green-100 text-green-800 font-medium'
                        : 'bg-white text-gray-300'
                    } hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer`}
                    title={
                      hasAvailability
                        ? `Click to edit: ${cell.dayNames.join(', ')}`
                        : 'Click to add availability'
                    }
                  >
                    {hasAvailability ? (
                      <span className="inline-block">
                        {cell.dayNames.join(', ')}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
