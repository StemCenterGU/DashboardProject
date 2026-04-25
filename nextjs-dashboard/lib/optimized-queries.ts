/**
 * Optimized Query Patterns
 * Examples of efficient database queries that avoid N+1 problems
 * and use proper joining/selection
 */

import { createServerClient } from '@/lib/supabase/server'

/**
 * ❌ BAD: N+1 Query Pattern
 * Fetches appointments, then makes separate query for each student
 *
 * const appointments = await supabase.from('appointments').select('*')
 * for (const apt of appointments.data) {
 *   const student = await supabase.from('students').select('*').eq('id', apt.student_id)
 * }
 */

/**
 * ✅ GOOD: Single Query with Join
 * Fetches all data in one query using Supabase's automatic join syntax
 */
export async function getAppointmentsWithStudents(startDate: string, endDate: string) {
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Database connection failed')

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      appointment_id,
      appointment_date,
      start_time,
      end_time,
      status,
      tutor:tutors!tutor_id(tutor_id, tutor_name),
      course:courses(course_code, course_name)
    `)
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate)
    .not('status', 'in', '(cancelled,no_show,missed)')
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  return { data, error }
}

/**
 * ✅ GOOD: Select Only Needed Columns
 * Reduces data transfer and improves performance
 */
export async function getTutorScheduleSummary(tutorId: string) {
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Database connection failed')

  // Only select the columns we need
  const { data, error } = await supabase
    .from('tutor_availability')
    .select('availability_id, day_of_week, start_time, end_time')
    .eq('tutor_id', tutorId)
    .eq('is_available', true)
    .order('day_of_week')
    .order('start_time')

  return { data, error }
}

/**
 * ✅ GOOD: Parallel Queries for Independent Data
 * Fetches multiple resources concurrently instead of sequentially
 */
export async function getDashboardData(userId: string) {
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Database connection failed')

  // Execute all queries in parallel
  const [
    tutorsResult,
    appointmentsResult,
    notificationsResult,
  ] = await Promise.all([
    supabase
      .from('tutors')
      .select('tutor_id, tutor_name, role')
      .eq('is_active', true)
      .order('tutor_name'),

    supabase
      .from('appointments')
      .select('appointment_id, appointment_date, start_time, student_name')
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .limit(10),

    supabase
      .from('notifications')
      .select('notification_id, title, message, created_at')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return {
    tutors: tutorsResult.data || [],
    appointments: appointmentsResult.data || [],
    notifications: notificationsResult.data || [],
  }
}

/**
 * ✅ GOOD: Pagination for Large Datasets
 * Prevents loading too much data at once
 */
export async function getReportsPaginated(page: number = 1, pageSize: number = 20) {
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Database connection failed')

  const offset = (page - 1) * pageSize

  const { data, error, count } = await supabase
    .from('client_reports')
    .select(`
      report_id,
      client_name,
      report_date,
      location,
      staff:tutors!staff_resource_id(tutor_name),
      course:courses(course_code)
    `, { count: 'exact' })
    .order('report_date', { ascending: false })
    .range(offset, offset + pageSize - 1)

  return {
    data,
    error,
    totalCount: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * ✅ GOOD: Efficient Counting with Filters
 * Uses count without fetching all data
 */
export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Database connection failed')

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  return { count: count || 0, error }
}

/**
 * ✅ GOOD: Batch Operations
 * Updates/inserts multiple records in a single query
 */
export async function batchMarkNotificationsRead(notificationIds: string[]) {
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Database connection failed')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .in('notification_id', notificationIds)

  return { error }
}

/**
 * ✅ GOOD: Conditional Query Building
 * Builds query dynamically based on filters
 */
export async function searchAppointments(filters: {
  tutorId?: string
  startDate?: string
  endDate?: string
  status?: string[]
  isOnline?: boolean
}) {
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Database connection failed')

  let query = supabase
    .from('appointments')
    .select(`
      *,
      tutor:tutors(tutor_name)
    `)

  // Apply filters conditionally
  if (filters.tutorId) {
    query = query.eq('tutor_id', filters.tutorId)
  }

  if (filters.startDate) {
    query = query.gte('appointment_date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('appointment_date', filters.endDate)
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.isOnline !== undefined) {
    query = query.eq('is_online', filters.isOnline)
  }

  const { data, error } = await query.order('appointment_date', { ascending: false })

  return { data, error }
}

/**
 * ✅ GOOD: Aggregation Queries
 * Performs calculations on the database side
 */
export async function getTutorStatistics(tutorId: string, month: string) {
  const supabase = await createServerClient()
  if (!supabase) throw new Error('Database connection failed')

  // Get appointment counts by status
  const { data, error } = await supabase
    .from('appointments')
    .select('status')
    .eq('tutor_id', tutorId)
    .gte('appointment_date', `${month}-01`)
    .lt('appointment_date', `${month}-32`) // Next month

  if (error || !data) {
    return { total: 0, completed: 0, noShow: 0, cancelled: 0 }
  }

  // Aggregate in JavaScript (could be moved to a database function for better performance)
  const stats = data.reduce((acc, apt) => {
    acc.total++
    if (apt.status === 'completed') acc.completed++
    if (apt.status === 'no_show') acc.noShow++
    if (apt.status === 'cancelled') acc.cancelled++
    return acc
  }, { total: 0, completed: 0, noShow: 0, cancelled: 0 })

  return stats
}
