/**
 * Analytics Types
 * Type definitions for analytics data structures
 */

export interface ChartDataPoint {
    label: string
    value: number
}

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
        [key: string]: any  // Allow additional properties like online, walkIn, missed
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

export interface SummaryStats {
    total_appointments: number
    total_hours: number
    unique_students: number
    unique_tutors: number
    avg_duration: number
    completion_rate: number
    busiest_day: string
    busiest_hour: string
}

export interface Appointment {
    appointment_id: string
    tutor_id: string
    tutor_name?: string
    student_name?: string
    student_email?: string
    course_id?: string
    course_name?: string
    appointment_date: string
    start_time: string
    end_time: string
    status: string
    is_online?: boolean
    is_walk_in?: boolean
    is_missed?: boolean
    is_repeating?: boolean
    source?: string
    duration?: number
}
