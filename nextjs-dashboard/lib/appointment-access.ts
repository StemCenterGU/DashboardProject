/**
 * Appointment access rules (who can see and change which appointments)
 *
 * - Full access (admin, project manager): view and edit every appointment
 * - Student manager: view every appointment, edit only their own
 * - Tutor / STEM PASS tutor: view and edit only appointments where they are the tutor
 * - Student: view and edit only appointments they booked (matched by email)
 *
 * "Own" for tutor-type roles = appointments.tutor_id is linked to the user via tutors.user_id.
 * "Own" for students = appointments.student_email matches the student's login email.
 */

import { getUserTutorIds, type User } from './auth'
import { canViewAll, hasPermission, isStudent } from './roles'

export interface AppointmentAccess {
  viewAll: boolean
  editAll: boolean
  tutorIds: string[]
  studentEmail: string | null
}

export interface OwnableAppointment {
  tutor_id?: string | null
  student_email?: string | null
}

/**
 * Resolve what a user can see/change. Call once per request.
 */
export async function getAppointmentAccess(user: User): Promise<AppointmentAccess> {
  return {
    viewAll: canViewAll(user.role),
    editAll: hasPermission(user.role, 'EDIT_ALL_APPOINTMENTS'),
    tutorIds: await getUserTutorIds(user),
    studentEmail: isStudent(user.role) ? user.email.toLowerCase().trim() : null,
  }
}

/**
 * Is this appointment the user's own (as tutor, or as the student who booked it)?
 */
export function ownsAppointment(access: AppointmentAccess, apt: OwnableAppointment): boolean {
  if (apt.tutor_id && access.tutorIds.includes(apt.tutor_id)) return true
  if (access.studentEmail && apt.student_email?.toLowerCase().trim() === access.studentEmail) return true
  return false
}

export function canViewAppointment(access: AppointmentAccess, apt: OwnableAppointment): boolean {
  return access.viewAll || ownsAppointment(access, apt)
}

export function canEditAppointment(access: AppointmentAccess, apt: OwnableAppointment): boolean {
  return access.editAll || ownsAppointment(access, apt)
}

/**
 * PostgREST `or` filter limiting a query to the user's own appointments,
 * or null when the user may view everything.
 * Returns a filter that matches nothing when the user owns nothing.
 */
export function ownAppointmentsFilter(access: AppointmentAccess): string | null {
  if (access.viewAll) return null
  const parts: string[] = []
  if (access.tutorIds.length > 0) {
    parts.push(`tutor_id.in.(${access.tutorIds.join(',')})`)
  }
  if (access.studentEmail) {
    parts.push(`student_email.ilike."${access.studentEmail.replace(/"/g, '')}"`)
  }
  return parts.length > 0 ? parts.join(',') : 'appointment_id.is.null'
}

/**
 * What someone who doesn't own an appointment sees in a schedule: only that the
 * time is taken. No student, course, notes or ID, so it cannot be opened.
 */
export function redactAppointment<T extends { tutor_id?: string | null; start_time: string; end_time: string }>(apt: T) {
  return {
    appointment_id: null,
    tutor_id: apt.tutor_id ?? null,
    tutor_name: null,
    student_name: 'Booked',
    student_email: null,
    course_name: null,
    course_code: null,
    start_time: apt.start_time,
    end_time: apt.end_time,
    status: 'booked',
    is_online: null,
    is_walk_in: null,
    is_missed: null,
    notes: null,
    is_restricted: true as const,
  }
}

// ============================================================================
// Client reports: tutors see/edit reports where they are the staff member or
// the author; VIEW_ALL_REPORTS roles see all; only full access edits any report.
// ============================================================================

export interface OwnableReport {
  staff_resource_id?: string | null
  created_by?: string | null
}

export function ownsReport(user: User, tutorIds: string[], report: OwnableReport): boolean {
  if (report.created_by && report.created_by === user.user_id) return true
  if (report.staff_resource_id && tutorIds.includes(report.staff_resource_id)) return true
  return false
}

/**
 * PostgREST `or` filter limiting client_reports to the user's own reports
 */
export function ownReportsFilter(user: User, tutorIds: string[]): string {
  const parts = [`created_by.eq.${user.user_id}`]
  if (tutorIds.length > 0) {
    parts.push(`staff_resource_id.in.(${tutorIds.join(',')})`)
  }
  return parts.join(',')
}
