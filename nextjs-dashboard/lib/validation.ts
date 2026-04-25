/**
 * Input validation schemas using Zod
 * Use these schemas to validate API request inputs
 */

import { z } from 'zod'

// Common schemas
export const emailSchema = z.string().email('Invalid email address').max(255)
export const uuidSchema = z.string().uuid('Invalid UUID')
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
export const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format. Use HH:MM or HH:MM:SS')

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  offset: z.number().int().nonnegative().optional(),
})

// Date range schema
export const dateRangeSchema = z.object({
  start_date: dateSchema,
  end_date: dateSchema,
}).refine(
  (data) => new Date(data.start_date) <= new Date(data.end_date),
  { message: 'Start date must be before or equal to end date' }
)

// Appointment status schema
export const appointmentStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'booked',
  'missed',
  'no_show',
])

// User role schema
export const userRoleSchema = z.enum([
  'tutor',
  'lead_tutor',
  'manager',
  'admin',
  'developer',
])

// Recurrence pattern schema
export const recurrencePatternSchema = z.object({
  frequency: z.enum(['daily', 'weekly']),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // For weekly recurrence
  interval: z.number().int().positive().optional(), // e.g., every 2 weeks
})

// Appointment creation schema
export const createAppointmentSchema = z.object({
  tutor_id: uuidSchema,
  tutor_name: z.string().max(255).optional(),
  student_name: z.string().min(1, 'Student name is required').max(255),
  student_email: emailSchema.optional(),
  course_id: uuidSchema.optional(),
  course_name: z.string().max(255).optional(),
  course_code: z.string().max(50).optional(),
  appointment_date: dateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  status: appointmentStatusSchema.default('scheduled'),
  is_online: z.boolean().default(false),
  is_walk_in: z.boolean().default(false),
  is_missed: z.boolean().default(false),
  is_placeholder: z.boolean().default(false),
  is_no_show: z.boolean().default(false),
  notify_client: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
  attachment_path: z.string().max(500).optional(),
  recurrence_pattern: z.string().optional(), // JSON string of RecurrencePattern
  recurrence_end_date: dateSchema.optional(),
  parent_appointment_id: z.string().optional(),
}).refine(
  (data) => {
    // Validate that end_time is after start_time
    const start = data.start_time.split(':').map(Number)
    const end = data.end_time.split(':').map(Number)
    const startMinutes = start[0] * 60 + start[1]
    const endMinutes = end[0] * 60 + end[1]
    return endMinutes > startMinutes
  },
  { message: 'End time must be after start time' }
).refine(
  (data) => {
    // If recurrence_pattern exists, recurrence_end_date must also exist
    if (data.recurrence_pattern && !data.recurrence_end_date) {
      return false
    }
    return true
  },
  { message: 'Recurrence end date is required when creating recurring appointments' }
).refine(
  (data) => {
    // If recurrence_end_date exists, it must be after appointment_date
    if (data.recurrence_end_date) {
      return new Date(data.recurrence_end_date) > new Date(data.appointment_date)
    }
    return true
  },
  { message: 'Recurrence end date must be after appointment start date' }
)

// Appointment update schema
export const updateAppointmentSchema = z.object({
  appointment_id: z.string().min(1, 'Appointment ID is required'),
  student_name: z.string().min(1).max(255).optional(),
  student_email: emailSchema.optional().nullable(),
  course_name: z.string().max(255).optional().nullable(),
  course_code: z.string().max(50).optional().nullable(),
  appointment_date: dateSchema.optional(),
  start_time: timeSchema.optional(),
  end_time: timeSchema.optional(),
  notes: z.string().max(2000).optional().nullable(),
  is_online: z.boolean().optional(),
  status: appointmentStatusSchema.optional(),
}).refine(
  (data) => {
    if (data.start_time && data.end_time) {
      const start = data.start_time.split(':').map(Number)
      const end = data.end_time.split(':').map(Number)
      const startMinutes = start[0] * 60 + start[1]
      const endMinutes = end[0] * 60 + end[1]
      return endMinutes > startMinutes
    }
    return true
  },
  { message: 'End time must be after start time' }
)

// Tutor creation schema
export const createTutorSchema = z.object({
  tutor_name: z.string().min(1, 'Tutor name is required').max(255).trim(),
})

// Schedule week query schema
export const scheduleWeekQuerySchema = z.object({
  week_start: dateSchema.optional(),
  meeting_type: z.enum(['all', 'online', 'face_to_face']).default('all'),
  course_code: z.string().max(50).default(''),
  focus_name: z.string().max(255).default(''),
  instructor: z.string().max(255).default(''),
})

// Appointment query schema (for GET /api/scheduling/appointments)
export const appointmentQuerySchema = z.object({
  limit: z.number().int().positive().max(100).default(10),
  page: z.number().int().positive().default(1),
  status: appointmentStatusSchema.optional(),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  sort: z.enum(['asc', 'desc']).default('desc'),
})

// Analytics filter schema
export const analyticsFilterSchema = z.object({
  date_range: z.enum(['all', 'today', 'week', 'month', 'custom']).default('all'),
  custom_start_date: dateSchema.optional(),
  custom_end_date: dateSchema.optional(),
  tutor_ids: z.array(uuidSchema).optional(),
  course_ids: z.array(uuidSchema).optional(),
  status: z.array(appointmentStatusSchema).optional(),
  is_online: z.boolean().optional(),
  is_walk_in: z.boolean().optional(),
  is_repeating: z.boolean().optional(),
  start_time: timeSchema.optional(),
  end_time: timeSchema.optional(),
  min_duration: z.number().positive().optional(),
  max_duration: z.number().positive().optional(),
  day_of_week: z.array(z.number().int().min(0).max(6)).optional(),
  course_instructor: z.array(z.string().max(255)).optional(),
})

// Helper function to parse and validate search params
export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params: any = {}
    searchParams.forEach((value, key) => {
      // Handle array parameters (e.g., tutor_ids=uuid1,uuid2)
      if (value.includes(',')) {
        params[key] = value.split(',')
      }
      // Handle boolean parameters
      else if (value === 'true' || value === 'false') {
        params[key] = value === 'true'
      }
      // Handle numeric parameters
      else if (!isNaN(Number(value)) && value !== '') {
        params[key] = Number(value)
      }
      // Handle string parameters
      else {
        params[key] = value
      }
    })

    const result = schema.safeParse(params)
    if (!result.success) {
      const errorMessage = result.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ')
      return { success: false, error: errorMessage }
    }

    return { success: true, data: result.data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Validation failed' }
  }
}

// Helper function to validate JSON body
export function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(body)
    if (!result.success) {
      const errorMessage = result.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('; ')
      return { success: false, error: errorMessage }
    }

    return { success: true, data: result.data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Validation failed' }
  }
}
