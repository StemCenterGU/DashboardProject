/**
 * Schedule Parser for CSV/Excel files
 * Parses tutor availability from uploaded schedules
 */

import * as XLSX from 'xlsx'

export interface ParsedSlot {
  tutorId: string
  tutorName?: string
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
  dayName: string   // 'Sunday', 'Monday', etc.
  startTime: string // 24-hour format HH:MM:SS
  endTime: string   // 24-hour format HH:MM:SS
}

export interface ParseResult {
  success: boolean
  slots: ParsedSlot[]
  tutors: string[]
  errors: string[]
  warnings: string[]
}

const DAY_MAP: Record<string, number> = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
}

/**
 * Parse time slot string like "('Sunday 08:00AM', '08:30AM')"
 */
function parseTimeSlotCell(cellValue: string): { day: string; startTime: string; endTime: string } | null {
  try {
    // Remove parentheses and quotes
    const cleaned = cellValue.replace(/['()]/g, '').trim()

    // Split by comma
    const parts = cleaned.split(',').map(s => s.trim())
    if (parts.length < 2) return null

    // First part: "Sunday 08:00AM"
    const firstPart = parts[0]
    const dayTimeMatch = firstPart.match(/^(\w+)\s+(.+)$/)
    if (!dayTimeMatch) return null

    const day = dayTimeMatch[1]
    const startTime = dayTimeMatch[2]

    // Second part: "08:30AM"
    const endTime = parts[1]

    return { day, startTime, endTime }
  } catch (error) {
    return null
  }
}

/**
 * Convert 12-hour time (08:00AM) to 24-hour format (08:00:00)
 */
function convertTo24Hour(time12: string): string {
  try {
    const timeStr = time12.trim().toUpperCase()
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)

    if (!match) return '00:00:00' // Default fallback

    let hours = parseInt(match[1], 10)
    const minutes = match[2]
    const period = match[3].toUpperCase()

    // Convert to 24-hour
    if (period === 'PM' && hours !== 12) {
      hours += 12
    } else if (period === 'AM' && hours === 12) {
      hours = 0
    }

    return `${String(hours).padStart(2, '0')}:${minutes}:00`
  } catch (error) {
    return '00:00:00'
  }
}

/**
 * Extract tutor IDs from header row (row 1, starting from column 6)
 */
function extractTutorIds(headerRow: any[]): string[] {
  const tutors: string[] = []

  // Start from index 5 (column 6 in 1-indexed)
  for (let i = 5; i < headerRow.length; i++) {
    const cellValue = headerRow[i]
    if (cellValue && typeof cellValue === 'string' && cellValue.trim() !== '') {
      tutors.push(cellValue.trim())
    }
  }

  return tutors
}

/**
 * Parse the schedule CSV/Excel file
 */
export async function parseScheduleFile(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    success: false,
    slots: [],
    tutors: [],
    errors: [],
    warnings: [],
  }

  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Get first sheet
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Convert to JSON (array of arrays)
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (data.length === 0) {
      result.errors.push('File is empty')
      return result
    }

    // Extract tutor IDs from row 1 (index 0)
    const tutorIds = extractTutorIds(data[0])
    if (tutorIds.length === 0) {
      result.errors.push('No tutor IDs found in header row')
      return result
    }
    result.tutors = tutorIds

    // Parse data rows (starting from row 14, index 13)
    let slotsFound = 0
    for (let rowIndex = 13; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      if (!row || row.length === 0) continue

      // Parse first column for day/time info
      const firstCell = row[0]
      if (!firstCell || typeof firstCell !== 'string') continue

      const timeSlot = parseTimeSlotCell(firstCell)
      if (!timeSlot) {
        result.warnings.push(`Row ${rowIndex + 1}: Could not parse time slot "${firstCell}"`)
        continue
      }

      const { day, startTime, endTime } = timeSlot
      const dayLower = day.toLowerCase()
      const dayOfWeek = DAY_MAP[dayLower]

      if (dayOfWeek === undefined) {
        result.warnings.push(`Row ${rowIndex + 1}: Unknown day "${day}"`)
        continue
      }

      const startTime24 = convertTo24Hour(startTime)
      const endTime24 = convertTo24Hour(endTime)

      // Check each tutor column (starting from column 6, index 5)
      for (let colIndex = 5; colIndex < row.length && (colIndex - 5) < tutorIds.length; colIndex++) {
        const cellValue = row[colIndex]

        // Only 'X' indicates availability
        if (cellValue === 'X') {
          const tutorId = tutorIds[colIndex - 5]
          result.slots.push({
            tutorId,
            dayOfWeek,
            dayName: day,
            startTime: startTime24,
            endTime: endTime24,
          })
          slotsFound++
        }
      }
    }

    if (slotsFound === 0) {
      result.warnings.push('No availability slots found (no "X" values detected)')
    }

    // Combine consecutive 30-minute slots into 1-hour blocks
    result.slots = combineIntoHourlySlots(result.slots)

    // Deduplicate - remove any duplicate slots
    result.slots = deduplicateSlots(result.slots)

    result.success = true
    return result

  } catch (error: any) {
    result.errors.push(`File parsing error: ${error.message}`)
    return result
  }
}

/**
 * Normalize slots to 1-hour blocks
 * - Combines consecutive 30-minute slots into 1-hour blocks
 * - Breaks slots longer than 1 hour into individual 1-hour blocks
 */
function combineIntoHourlySlots(slots: ParsedSlot[]): ParsedSlot[] {
  if (slots.length === 0) return slots

  // First, break down any slots longer than 1 hour into 1-hour chunks
  const normalizedSlots: ParsedSlot[] = []

  for (const slot of slots) {
    const duration = getMinutesDifference(slot.startTime, slot.endTime)

    if (duration > 60) {
      // Break into 1-hour chunks
      const chunks = breakIntoHourlyChunks(slot)
      normalizedSlots.push(...chunks)
    } else {
      normalizedSlots.push(slot)
    }
  }

  // Group slots by tutor and day
  const grouped: Record<string, ParsedSlot[]> = {}

  for (const slot of normalizedSlots) {
    const key = `${slot.tutorId}-${slot.dayOfWeek}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(slot)
  }

  // Process each group - combine 30-minute slots into 1-hour blocks
  const combinedSlots: ParsedSlot[] = []

  for (const key in grouped) {
    const groupSlots = grouped[key]

    // Sort by start time
    groupSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))

    let i = 0
    while (i < groupSlots.length) {
      const currentSlot = groupSlots[i]

      // Check if this is a 30-minute slot
      const duration = getMinutesDifference(currentSlot.startTime, currentSlot.endTime)

      if (duration === 30 && i + 1 < groupSlots.length) {
        const nextSlot = groupSlots[i + 1]
        const nextDuration = getMinutesDifference(nextSlot.startTime, nextSlot.endTime)

        // Only combine if BOTH slots are 30 minutes and consecutive
        if (nextDuration === 30 && currentSlot.endTime === nextSlot.startTime) {
          // Combine into 1-hour slot
          combinedSlots.push({
            ...currentSlot,
            endTime: nextSlot.endTime, // Extend to next slot's end time
          })
          i += 2 // Skip both slots
          continue
        }
      }

      // Keep original slot if not combined or already 1 hour
      combinedSlots.push(currentSlot)
      i++
    }
  }

  return combinedSlots
}

/**
 * Break a slot longer than 1 hour into multiple 1-hour chunks
 */
function breakIntoHourlyChunks(slot: ParsedSlot): ParsedSlot[] {
  const chunks: ParsedSlot[] = []
  const [startHours, startMinutes] = slot.startTime.split(':').map(Number)
  const [endHours, endMinutes] = slot.endTime.split(':').map(Number)

  let currentHour = startHours
  let currentMinute = startMinutes

  while (true) {
    const nextHour = currentHour + 1
    const nextMinute = currentMinute

    const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`
    const endTime = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}:00`

    // Check if this end time exceeds the original end time
    const endTimeMinutes = nextHour * 60 + nextMinute
    const originalEndMinutes = endHours * 60 + endMinutes

    if (endTimeMinutes > originalEndMinutes) {
      // Create a final chunk that might be less than 1 hour
      const finalEndTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`
      const duration = getMinutesDifference(startTime, finalEndTime)

      // Only add if there's actual time remaining
      if (duration > 0) {
        chunks.push({
          ...slot,
          startTime,
          endTime: finalEndTime,
        })
      }
      break
    }

    // Add 1-hour chunk
    chunks.push({
      ...slot,
      startTime,
      endTime,
    })

    currentHour = nextHour
    currentMinute = nextMinute

    // Check if we've reached the end
    if (currentHour * 60 + currentMinute >= originalEndMinutes) {
      break
    }
  }

  return chunks
}

/**
 * Calculate minute difference between two time strings (HH:MM:SS)
 */
function getMinutesDifference(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)

  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  return endTotalMinutes - startTotalMinutes
}

/**
 * Remove duplicate slots from the array
 * A duplicate is defined as having the same tutor, day, start time, and end time
 */
function deduplicateSlots(slots: ParsedSlot[]): ParsedSlot[] {
  const seen = new Set<string>()
  const unique: ParsedSlot[] = []

  for (const slot of slots) {
    const key = `${slot.tutorId}|${slot.dayOfWeek}|${slot.startTime}|${slot.endTime}`

    if (!seen.has(key)) {
      seen.add(key)
      unique.push(slot)
    }
  }

  return unique
}

/**
 * Validate a parsed slot
 */
export function validateSlot(slot: ParsedSlot): { valid: boolean; error?: string } {
  if (!slot.tutorId || slot.tutorId.trim() === '') {
    return { valid: false, error: 'Tutor ID is required' }
  }

  if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
    return { valid: false, error: 'Invalid day of week' }
  }

  // Basic time format validation
  const timeRegex = /^\d{2}:\d{2}:\d{2}$/
  if (!timeRegex.test(slot.startTime)) {
    return { valid: false, error: 'Invalid start time format' }
  }

  if (!timeRegex.test(slot.endTime)) {
    return { valid: false, error: 'Invalid end time format' }
  }

  return { valid: true }
}
