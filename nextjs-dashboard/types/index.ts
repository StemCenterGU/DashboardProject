/**
 * TypeScript type definitions for the dashboard application
 * Organized by domain
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'tutor' | 'lead_tutor' | 'manager' | 'admin'

export interface User {
  user_id: string
  email: string
  full_name: string
  role: UserRole
  active: boolean
  tutor_id?: string
  created_at?: string
  last_login?: string
}

export interface AuthSession {
  user: User
  token?: string
  expiresAt?: string
}

// ============================================================================
// TUTOR TYPES
// ============================================================================

export interface Tutor {
  tutor_id: string
  tutor_name: string
  user_id?: string
  email?: string
  is_available: boolean
  active?: boolean
  created_at?: string
}

export interface TutorAvailability {
  availability_id: string
  tutor_id: string
  day_of_week: number // 0 = Sunday, 6 = Saturday
  start_time: string
  end_time: string
  is_recurring: boolean
  effective_date?: string
  end_date?: string
}

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'missed' | 'no_show'

export interface Appointment {
  appointment_id: string
  tutor_id: string
  tutor_name?: string
  student_name: string
  student_email?: string
  course_id?: string
  course_name?: string
  appointment_date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  duration?: number
  notes?: string
  is_online?: boolean
  is_walk_in?: boolean
  is_missed?: boolean
  is_repeating?: boolean
  source?: string
  created_at?: string
}

export interface AvailableSlot {
  slot_id: string
  tutor_id: string
  tutor_name?: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
  schedule_title?: string
}

// ============================================================================
// COURSE TYPES
// ============================================================================

export interface Course {
  course_id: string
  course_code?: string
  course_name: string
  department?: string
  instructor?: string
  active: boolean
  created_at?: string
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardSummary {
  total_appointments: number
  total_hours: number
  unique_tutors: number
  unique_courses: number
  average_duration: number
  pending_confirmations?: number
  cancelled_count?: number
  active_tutors?: number
}

export interface DashboardAlert {
  id?: string
  type: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
  dismissable?: boolean
}

export interface RecentActivity {
  id: string
  type: 'appointment' | 'availability' | 'tutor' | 'course'
  action: 'created' | 'updated' | 'deleted' | 'completed' | 'cancelled'
  description: string
  timestamp: string
  user?: string
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    [key: string]: any
  }[]
  summary?: {
    total: number
    average: number
    min: number
    max: number
    [key: string]: any
  }
}

export interface AnalyticsFilters {
  tutor_ids?: string[]
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  status?: string | string[]
  course_ids?: string[]
  course_instructor?: string | string[]
  duration?: number
  min_duration?: number
  max_duration?: number
  day_of_week?: number | number[]
  day_type?: string
  shift_start_hour?: number
  shift_end_hour?: number
  is_online?: boolean
  is_walk_in?: boolean
  is_missed?: boolean
  is_repeating?: boolean
  source?: string | string[]
}

export type ChartDataset =
  | 'appointments_per_tutor'
  | 'hours_per_tutor'
  | 'daily_appointments'
  | 'appointments_by_status'
  | 'course_popularity'
  | 'hourly_appointments_dist'
  | 'online_vs_inperson'
  | 'walk_in_analytics'
  | 'missed_noshow_analytics'
  | 'day_of_week_analytics'
  | 'monthly_trends'
  | 'instructor_analytics'

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  total: number
  page: number
  totalPages: number
  limit: number
}

export interface ApiError {
  error: string
  code?: string
  details?: any
}

// ============================================================================
// WCONLINE SYNC TYPES
// ============================================================================

export interface WCOnlineAppointment {
  id?: string
  appointment_id?: string
  student_name?: string
  student_email?: string
  tutor_name?: string
  tutor_email?: string
  course?: string
  course_code?: string
  course_name?: string
  date?: string
  appointment_date?: string
  time?: string
  start_time?: string
  end_time?: string
  duration?: number
  status?: string
  schedule_title?: string
  notes?: string
  [key: string]: any
}

export interface SyncResult {
  success: boolean
  appointments: {
    fetched: number
    synced: number
    errors: number
  }
  tutors: {
    fetched: number
    synced: number
    errors: number
  }
  courses: {
    fetched: number
    synced: number
    errors: number
  }
  errors: string[]
  timestamp?: string
}

export interface SyncStatus {
  lastSync: string | null
  isRunning: boolean
  progress?: number
  currentStep?: string
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export interface TabItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: number
}

export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
  label: string
}

export interface FilterOption {
  id: string
  label: string
  value: any
  selected?: boolean
}
