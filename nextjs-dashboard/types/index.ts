/**
 * TypeScript type definitions for the dashboard application
 */

// User types
export interface User {
  user_id: string
  email: string
  full_name: string
  role: 'tutor' | 'lead_tutor' | 'manager' | 'admin'
  active: boolean
  tutor_id?: string
  created_at?: string
  last_login?: string
}

// Appointment types
export interface Appointment {
  appointment_id: string
  tutor_id: string
  student_name: string
  course_id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  duration?: number
  notes?: string
}

// Tutor types
export interface Tutor {
  tutor_id: string
  user_id: string
  is_available: boolean
  full_name?: string
}

// Course types
export interface Course {
  course_id: string
  course_code: string
  course_name: string
  active: boolean
}

// Dashboard types
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
  type: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
}

// Analytics types
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    [key: string]: any
  }[]
  summary?: {
    total: number
    average: number
    min: number
    max: number
  }
}

export interface AnalyticsFilters {
  tutor_ids?: string[]
  start_date?: string
  end_date?: string
  status?: string
  course_ids?: string[]
  duration?: number
  day_type?: string
  shift_start_hour?: number
  shift_end_hour?: number
}

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

// WCOnline types
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
}

