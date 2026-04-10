import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAuth, hasPermissionCheck } from '@/lib/auth'

/**
 * GET /api/admin/schedule-requests/[id]
 * Get detailed schedule change request (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermissionCheck(user, 'VIEW_ALL_SCHEDULES')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { id } = await params

    console.log('Fetching schedule request with ID:', id)

    // First, get the basic request data
    const { data: basicReq, error: basicError } = await supabase
      .from('schedule_change_requests')
      .select('*')
      .eq('request_id', id)
      .single()

    if (basicError) {
      console.error('Error fetching basic request:', basicError)
      throw basicError
    }

    console.log('Basic request data:', basicReq)

    // Get tutor info
    const { data: tutorData, error: tutorError } = await supabase
      .from('tutors')
      .select('tutor_id, tutor_name, username, role')
      .eq('tutor_id', basicReq.tutor_id)
      .single()

    if (tutorError) {
      console.error('Error fetching tutor:', tutorError)
    }

    // Get submitter info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, email, full_name')
      .eq('user_id', basicReq.submitted_by)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
    }

    // Get slots
    const { data: slotsData, error: slotsError } = await supabase
      .from('schedule_change_slots')
      .select('*')
      .eq('request_id', id)

    if (slotsError) {
      console.error('Error fetching slots:', slotsError)
    }

    // Combine the data
    const req = {
      ...basicReq,
      tutors: tutorData,
      users: userData,
      schedule_change_slots: slotsData || [],
    }

    console.log('Request fetched successfully, slots:', req.schedule_change_slots?.length || 0)

    // Manually fetch original slot details for modify/delete actions
    if (req && req.schedule_change_slots) {
      for (const slot of req.schedule_change_slots) {
        console.log('Processing slot:', slot.change_slot_id, 'action:', slot.action, 'original_slot_id:', slot.original_slot_id)
        if (slot.original_slot_id && slot.original_slot_id !== null) {
          const { data: originalSlot, error: slotError } = await supabase
            .from('tutor_availability')
            .select('availability_id, day_of_week, start_time, end_time')
            .eq('availability_id', slot.original_slot_id)
            .single()

          if (slotError) {
            console.error('Error fetching original slot:', slot.original_slot_id, slotError)
          } else if (originalSlot) {
            slot.tutor_availability = originalSlot
          }
        }
      }
    }

    // Get current schedule for comparison
    const { data: currentSchedule } = await supabase
      .from('tutor_availability')
      .select('*')
      .eq('tutor_id', req.tutor_id)
      .eq('is_available', true)
      .order('day_of_week')
      .order('start_time')

    return NextResponse.json({
      request: req,
      currentSchedule: currentSchedule || [],
    })
  } catch (error: any) {
    console.error('Get request details error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/admin/schedule-requests/[id]
 * Approve or reject schedule change request (admin only)
 * Body: { action: 'approve' | 'reject', rejectionReason?: string, modifiedSlots?: [...] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user
  try {
    user = await requireAuth()
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermissionCheck(user, 'EDIT_ALL_SCHEDULES')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, rejectionReason, modifiedSlots, adminNotes } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get the request
    const { data: req, error: fetchError } = await supabase
      .from('schedule_change_requests')
      .select('*, schedule_change_slots(*), tutors!schedule_change_requests_tutor_id_fkey(tutor_name), users!schedule_change_requests_submitted_by_fkey(user_id)')
      .eq('request_id', id)
      .single()

    if (fetchError || !req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (req.status !== 'pending') {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
    }

    const now = new Date().toISOString()

    if (action === 'reject') {
      // Reject the request
      const { error: updateError } = await supabase
        .from('schedule_change_requests')
        .update({
          status: 'rejected',
          reviewed_at: now,
          reviewed_by: user.user_id,
          rejection_reason: rejectionReason || 'No reason provided',
          admin_notes: adminNotes,
        })
        .eq('request_id', id)

      if (updateError) throw updateError

      // Create notification for tutor
      await supabase.from('notifications').insert({
        user_id: req.submitted_by,
        type: 'schedule_rejected',
        title: 'Schedule Change Request Rejected',
        message: `Your schedule change request has been rejected. Reason: ${rejectionReason || 'No reason provided'}`,
        link: '/tutor-schedules',
        related_request_id: id,
      })

      return NextResponse.json({
        success: true,
        action: 'rejected',
        message: 'Request rejected successfully',
      })
    } else {
      // Approve - apply changes to tutor_availability
      const slotsToApply = modifiedSlots || req.schedule_change_slots

      for (const slot of slotsToApply) {
        if (slot.action === 'add') {
          // Add new slot
          await supabase.from('tutor_availability').insert({
            tutor_id: req.tutor_id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: true,
            approved_at: now,
            approved_by: user.user_id,
          })
        } else if (slot.action === 'delete') {
          // Delete slot
          await supabase
            .from('tutor_availability')
            .delete()
            .eq('availability_id', slot.original_slot_id)
        } else if (slot.action === 'modify') {
          // Modify existing slot
          await supabase
            .from('tutor_availability')
            .update({
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              approved_at: now,
              approved_by: user.user_id,
            })
            .eq('availability_id', slot.original_slot_id)
        }
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('schedule_change_requests')
        .update({
          status: 'approved',
          reviewed_at: now,
          reviewed_by: user.user_id,
          admin_notes: adminNotes,
        })
        .eq('request_id', id)

      if (updateError) throw updateError

      // Create notification for tutor
      await supabase.from('notifications').insert({
        user_id: req.submitted_by,
        type: 'schedule_approved',
        title: 'Schedule Change Approved!',
        message: `Your schedule change request has been approved by the admin. Your new schedule is now live.`,
        link: '/tutor-schedules',
        related_request_id: id,
      })

      return NextResponse.json({
        success: true,
        action: 'approved',
        message: 'Request approved and schedule updated',
        changesApplied: slotsToApply.length,
      })
    }
  } catch (error: any) {
    console.error('Review request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
