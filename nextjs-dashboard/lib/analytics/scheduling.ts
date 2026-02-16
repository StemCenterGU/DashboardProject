/**
 * Scheduling Analytics Module
 * Handles data analysis, statistics, and chart data generation for appointments
 */

import { createServerClient } from '../supabase-server'

export interface ChartDataPoint {
  label: string
  value: number
  [key: string]: any
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

export class SchedulingAnalytics {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  /**
   * Get appointments data with filters
   */
  async getAppointments(filters: AnalyticsFilters = {}) {
    let query = this.supabase
      .from('appointments')
      .select('*')

    // Apply filters
    if (filters.start_date) {
      query = query.gte('appointment_date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('appointment_date', filters.end_date)
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', filters.status)
      }
    }
    if (filters.tutor_ids && filters.tutor_ids.length > 0) {
      query = query.in('tutor_id', filters.tutor_ids)
    }
    if (filters.course_ids && filters.course_ids.length > 0) {
      query = query.in('course_id', filters.course_ids)
    }
    if (filters.is_online !== undefined) {
      query = query.eq('is_online', filters.is_online)
    }
    if (filters.is_walk_in !== undefined) {
      query = query.eq('is_walk_in', filters.is_walk_in)
    }
    if (filters.is_missed !== undefined) {
      query = query.eq('is_missed', filters.is_missed)
    }
    if (filters.source) {
      if (Array.isArray(filters.source)) {
        query = query.in('source', filters.source)
      } else {
        query = query.eq('source', filters.source)
      }
    }
    if (filters.start_time) {
      query = query.gte('start_time', filters.start_time)
    }
    if (filters.end_time) {
      query = query.lte('end_time', filters.end_time)
    }
    if (filters.course_instructor) {
      if (Array.isArray(filters.course_instructor)) {
        query = query.in('course_instructor', filters.course_instructor)
      } else {
        query = query.eq('course_instructor', filters.course_instructor)
      }
    }
    if (filters.is_repeating !== undefined) {
      query = query.eq('is_repeating', filters.is_repeating)
    }
    if (filters.min_duration !== undefined) {
      query = query.gte('duration', filters.min_duration)
    }
    if (filters.max_duration !== undefined) {
      query = query.lte('duration', filters.max_duration)
    }
    const { data, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return []
    }

    let filteredData = data || []

    // Filter by day of week (client-side since we need to extract from date)
    if (filters.day_of_week !== undefined) {
      const daysToFilter = Array.isArray(filters.day_of_week) ? filters.day_of_week : [filters.day_of_week]
      filteredData = filteredData.filter((apt: any) => {
        if (!apt.appointment_date) return false
        const date = new Date(apt.appointment_date)
        const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
        return daysToFilter.includes(dayOfWeek)
      })
    }

    return filteredData
  }

  /**
   * Calculate duration in hours from start_time and end_time
   */
  calculateDuration(startTime: string, endTime: string): number {
    try {
      // Handle time formats like "HH:MM" or "HH:MM:SS"
      const start = new Date(`2000-01-01T${startTime}`)
      const end = new Date(`2000-01-01T${endTime}`)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0
      }

      const diffMs = end.getTime() - start.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)

      // Handle cases where end time is before start time (overnight appointments)
      if (diffHours < 0) {
        return diffHours + 24
      }

      return diffHours
    } catch (error) {
      console.warn('Error calculating duration:', error, { startTime, endTime })
      return 0
    }
  }

  /**
   * Get appointments per tutor
   */
  async getAppointmentsPerTutor(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    // Get tutors
    const { data: tutors } = await this.supabase
      .from('tutors')
      .select('tutor_id, tutor_name')

    const tutorMap = new Map(tutors?.map((t: any) => [t.tutor_id, t.tutor_name]) || [])

    // Count appointments per tutor
    const tutorCounts = new Map<string, number>()

    appointments.forEach((apt: any) => {
      const tutorName = apt.tutor_name || tutorMap.get(apt.tutor_id) || `Tutor ${apt.tutor_id}`
      tutorCounts.set(tutorName, (tutorCounts.get(tutorName) || 0) + 1)
    })

    const labels = Array.from(tutorCounts.keys())
    const data = Array.from(tutorCounts.values())

    return {
      labels,
      datasets: [{
        label: 'Appointments',
        data
      }],
      summary: {
        total: data.reduce((a, b) => a + b, 0),
        average: data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0,
        min: data.length > 0 ? Math.min(...data) : 0,
        max: data.length > 0 ? Math.max(...data) : 0
      }
    }
  }

  /**
   * Get hours per tutor
   */
  async getHoursPerTutor(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    // Get tutors
    const { data: tutors } = await this.supabase
      .from('tutors')
      .select('tutor_id, tutor_name')

    const tutorMap = new Map(tutors?.map((t: any) => [t.tutor_id, t.tutor_name]) || [])

    // Calculate hours per tutor
    const tutorHours = new Map<string, number>()

    appointments.forEach((apt: any) => {
      if (apt.start_time && apt.end_time) {
        const hours = this.calculateDuration(apt.start_time, apt.end_time)
        const tutorName = apt.tutor_name || tutorMap.get(apt.tutor_id) || `Tutor ${apt.tutor_id}`
        tutorHours.set(tutorName, (tutorHours.get(tutorName) || 0) + hours)
      }
    })

    const labels = Array.from(tutorHours.keys())
    const data = Array.from(tutorHours.values())

    return {
      labels,
      datasets: [{
        label: 'Hours',
        data
      }],
      summary: {
        total: data.reduce((a, b) => a + b, 0),
        average: data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0,
        min: data.length > 0 ? Math.min(...data) : 0,
        max: data.length > 0 ? Math.max(...data) : 0
      }
    }
  }

  /**
   * Get daily appointments
   */
  async getDailyAppointments(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    // Group by date
    const dateCounts = new Map<string, number>()

    appointments.forEach((apt: any) => {
      const date = apt.appointment_date?.split('T')[0] || apt.appointment_date
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1)
    })

    // Sort by date
    const sortedDates = Array.from(dateCounts.keys()).sort()
    const labels = sortedDates
    const data = sortedDates.map(date => dateCounts.get(date) || 0)

    return {
      labels,
      datasets: [{
        label: 'Appointments',
        data
      }],
      summary: {
        total: data.reduce((a, b) => a + b, 0),
        average: data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0,
        min: data.length > 0 ? Math.min(...data) : 0,
        max: data.length > 0 ? Math.max(...data) : 0
      }
    }
  }

  /**
   * Get appointments by status
   */
  async getAppointmentsByStatus(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    const statusCounts = new Map<string, number>()

    appointments.forEach((apt: any) => {
      const status = apt.status || 'unknown'
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
    })

    const labels = Array.from(statusCounts.keys())
    const data = Array.from(statusCounts.values())

    return {
      labels,
      datasets: [{
        label: 'Appointments',
        data
      }],
      summary: {
        total: data.reduce((a, b) => a + b, 0),
        average: data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0,
        min: data.length > 0 ? Math.min(...data) : 0,
        max: data.length > 0 ? Math.max(...data) : 0
      }
    }
  }

  /**
   * Get course popularity
   */
  async getCoursePopularity(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    // Get courses
    const { data: courses } = await this.supabase
      .from('courses')
      .select('course_id, course_name, course_code')

    const courseMap = new Map(
      courses?.map((c: any) => [c.course_id, c.course_code ? `${c.course_code} - ${c.course_name}` : c.course_name]) || []
    )

    // Count appointments per course - use course_name from appointment if available
    const courseCounts = new Map<string, number>()

    appointments.forEach((apt: any) => {
      // Prefer course_name from appointment, fallback to course_id lookup
      const courseName = apt.course_name || courseMap.get(apt.course_id) || 'No course'
      courseCounts.set(courseName, (courseCounts.get(courseName) || 0) + 1)
    })

    const labels = Array.from(courseCounts.keys())
    const data = Array.from(courseCounts.values())

    return {
      labels,
      datasets: [{
        label: 'Appointments',
        data
      }],
      summary: {
        total: data.reduce((a, b) => a + b, 0),
        average: data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0,
        min: data.length > 0 ? Math.min(...data) : 0,
        max: data.length > 0 ? Math.max(...data) : 0
      }
    }
  }

  /**
   * Get hourly appointment distribution
   */
  async getHourlyDistribution(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    // Initialize hours (0-23)
    const hourCounts = new Map<number, number>()
    for (let i = 0; i < 24; i++) {
      hourCounts.set(i, 0)
    }

    appointments.forEach((apt: any) => {
      if (apt.start_time) {
        const hour = parseInt(apt.start_time.split(':')[0])
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      }
    })

    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
    const data = Array.from({ length: 24 }, (_, i) => hourCounts.get(i) || 0)

    return {
      labels,
      datasets: [{
        label: 'Appointments',
        data
      }],
      summary: {
        total: data.reduce((a, b) => a + b, 0),
        average: data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0,
        min: data.length > 0 ? Math.min(...data) : 0,
        max: data.length > 0 ? Math.max(...data) : 0
      }
    }
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats(filters: AnalyticsFilters = {}) {
    const appointments = await this.getAppointments(filters)

    const totalAppointments = appointments.length
    const totalHours = appointments.reduce((sum: number, apt: any) => {
      // First try to use the duration field from database (in hours)
      if (apt.duration !== null && apt.duration !== undefined) {
        const duration = typeof apt.duration === 'number' ? apt.duration : parseFloat(apt.duration)
        if (!isNaN(duration) && duration > 0) {
          return sum + duration
        }
      }
      // Fallback to calculating from start_time and end_time
      if (apt.start_time && apt.end_time) {
        try {
          const calculatedDuration = this.calculateDuration(apt.start_time, apt.end_time)
          if (!isNaN(calculatedDuration) && calculatedDuration > 0) {
            return sum + calculatedDuration
          }
        } catch (error) {
          console.warn('Error calculating duration for appointment:', apt.appointment_id, error)
        }
      }
      // If neither is available, return sum (don't add anything)
      return sum
    }, 0)

    // Count unique tutors from appointments (tutors who have appointments)
    const uniqueTutors = new Set(appointments.map((apt: any) => apt.tutor_id).filter((id: any) => id)).size

    // Count unique courses - use course_name if course_id is null
    const uniqueCourseNames = new Set(
      appointments
        .map((apt: any) => apt.course_name || apt.course_id)
        .filter((name: any) => name)
    ).size

    // Also get total count from courses table
    const { data: allCourses } = await this.supabase
      .from('courses')
      .select('course_id')
      .eq('active', true)

    const totalCourses = allCourses?.length || 0

    return {
      total_appointments: totalAppointments,
      total_hours: Math.round(totalHours * 10) / 10,
      unique_tutors: uniqueTutors,
      unique_courses: Math.max(uniqueCourseNames, totalCourses), // Use the larger of the two
      average_duration: totalAppointments > 0 ? Math.round((totalHours / totalAppointments) * 10) / 10 : 0
    }
  }

  /**
   * Get online vs in-person appointments
   */
  async getOnlineVsInPerson(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    let online = 0
    let inPerson = 0

    appointments.forEach((apt: any) => {
      if (apt.is_online === true) {
        online++
      } else {
        inPerson++
      }
    })

    const total = online + inPerson
    const onlinePercent = total > 0 ? ((online / total) * 100).toFixed(1) : '0.0'
    const inPersonPercent = total > 0 ? ((inPerson / total) * 100).toFixed(1) : '0.0'

    return {
      labels: ['Online', 'In-Person'],
      datasets: [{
        label: 'Appointments',
        data: [online, inPerson]
      }],
      summary: {
        total,
        average: total / 2,
        min: Math.min(online, inPerson),
        max: Math.max(online, inPerson),
        online,
        inPerson,
        onlinePercent,
        inPersonPercent
      }
    }
  }

  /**
   * Get walk-in vs scheduled appointments
   */
  async getWalkInAnalytics(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    let walkIn = 0
    let scheduled = 0

    appointments.forEach((apt: any) => {
      if (apt.is_walk_in === true) {
        walkIn++
      } else {
        scheduled++
      }
    })

    const total = walkIn + scheduled
    const walkInPercent = total > 0 ? ((walkIn / total) * 100).toFixed(1) : '0.0'
    const scheduledPercent = total > 0 ? ((scheduled / total) * 100).toFixed(1) : '0.0'

    return {
      labels: ['Walk-In', 'Scheduled'],
      datasets: [{
        label: 'Appointments',
        data: [walkIn, scheduled]
      }],
      summary: {
        total,
        average: total / 2,
        min: Math.min(walkIn, scheduled),
        max: Math.max(walkIn, scheduled),
        walkIn,
        scheduled,
        walkInPercent,
        scheduledPercent
      }
    }
  }

  /**
   * Get missed/no-show analytics
   */
  async getMissedNoShowAnalytics(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    let missed = 0
    let completed = 0

    appointments.forEach((apt: any) => {
      if (apt.is_missed === true || apt.status === 'missed' || apt.status === 'no_show') {
        missed++
      } else {
        completed++
      }
    })

    const total = missed + completed
    const missedPercent = total > 0 ? ((missed / total) * 100).toFixed(1) : '0.0'
    const completedPercent = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0'

    return {
      labels: ['Missed/No-Show', 'Completed'],
      datasets: [{
        label: 'Appointments',
        data: [missed, completed]
      }],
      summary: {
        total,
        average: total / 2,
        min: Math.min(missed, completed),
        max: Math.max(missed, completed),
        missed,
        completed,
        missedPercent,
        completedPercent
      }
    }
  }

  /**
   * Get appointments by day of week
   */
  async getDayOfWeekAnalytics(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    // Initialize all 7 days with 0 to ensure all days are shown
    const dayCounts = new Array(7).fill(0)

    appointments.forEach((apt: any) => {
      if (apt.appointment_date) {
        // Parse date string properly to avoid timezone issues
        // If date is in format "YYYY-MM-DD", parse it as local date
        let date: Date
        if (typeof apt.appointment_date === 'string') {
          // Handle ISO date strings (YYYY-MM-DD)
          const dateParts = apt.appointment_date.split('T')[0].split('-')
          if (dateParts.length === 3) {
            // Create date in local timezone to avoid UTC conversion issues
            date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
          } else {
            date = new Date(apt.appointment_date)
          }
        } else {
          date = new Date(apt.appointment_date)
        }

        // Validate date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', apt.appointment_date)
          return
        }

        const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
        // Ensure dayOfWeek is valid (0-6)
        if (dayOfWeek >= 0 && dayOfWeek <= 6) {
          dayCounts[dayOfWeek]++
        } else {
          console.warn('Invalid day of week:', dayOfWeek, 'for date:', apt.appointment_date)
        }
      }
    })

    return {
      labels: dayNames,
      datasets: [{
        label: 'Appointments',
        data: dayCounts
      }],
      summary: {
        total: dayCounts.reduce((a, b) => a + b, 0),
        average: dayCounts.length > 0 ? dayCounts.reduce((a, b) => a + b, 0) / dayCounts.length : 0,
        min: Math.min(...dayCounts),
        max: Math.max(...dayCounts)
      }
    }
  }

  /**
   * Get monthly/weekly trends
   */
  async getMonthlyTrends(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    // Group by month
    const monthMap = new Map<string, number>()

    appointments.forEach((apt: any) => {
      if (apt.appointment_date) {
        const date = new Date(apt.appointment_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
      }
    })

    // Sort by date
    const sortedMonths = Array.from(monthMap.entries()).sort()
    const labels = sortedMonths.map(([month]) => {
      const [year, monthNum] = month.split('-')
      const date = new Date(parseInt(year), parseInt(monthNum) - 1)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    })
    const data = sortedMonths.map(([, count]) => count)

    return {
      labels,
      datasets: [{
        label: 'Appointments',
        data
      }],
      summary: {
        total: data.reduce((a, b) => a + b, 0),
        average: data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0,
        min: data.length > 0 ? Math.min(...data) : 0,
        max: data.length > 0 ? Math.max(...data) : 0
      }
    }
  }

  /**
   * Get instructor analytics
   */
  async getInstructorAnalytics(filters: AnalyticsFilters = {}): Promise<ChartData> {
    const appointments = await this.getAppointments(filters)

    const instructorMap = new Map<string, number>()

    appointments.forEach((apt: any) => {
      if (apt.course_instructor) {
        instructorMap.set(apt.course_instructor, (instructorMap.get(apt.course_instructor) || 0) + 1)
      }
    })

    // Sort by count (descending)
    const sorted = Array.from(instructorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20) // Top 20 instructors

    const labels = sorted.map(([instructor]) => instructor)
    const data = sorted.map(([, count]) => count)

    return {
      labels,
      datasets: [{
        label: 'Appointments',
        data
      }],
      summary: {
        total: data.reduce((a, b) => a + b, 0),
        average: data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0,
        min: data.length > 0 ? Math.min(...data) : 0,
        max: data.length > 0 ? Math.max(...data) : 0
      }
    }
  }

  /**
   * Get chart data by dataset name
   */
  async getChartData(dataset: string, filters: AnalyticsFilters = {}): Promise<ChartData> {
    switch (dataset) {
      case 'appointments_per_tutor':
        return this.getAppointmentsPerTutor(filters)
      case 'hours_per_tutor':
        return this.getHoursPerTutor(filters)
      case 'daily_appointments':
        return this.getDailyAppointments(filters)
      case 'appointments_by_status':
        return this.getAppointmentsByStatus(filters)
      case 'course_popularity':
        return this.getCoursePopularity(filters)
      case 'hourly_appointments_dist':
        return this.getHourlyDistribution(filters)
      case 'online_vs_inperson':
        return this.getOnlineVsInPerson(filters)
      case 'walk_in_analytics':
        return this.getWalkInAnalytics(filters)
      case 'missed_noshow_analytics':
        return this.getMissedNoShowAnalytics(filters)
      case 'day_of_week_analytics':
        return this.getDayOfWeekAnalytics(filters)
      case 'monthly_trends':
        return this.getMonthlyTrends(filters)
      case 'instructor_analytics':
        return this.getInstructorAnalytics(filters)
      default:
        throw new Error(`Unknown dataset: ${dataset}`)
    }
  }
}

