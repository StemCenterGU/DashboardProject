import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase-server'
import { FULL_ACCESS_ROLES } from '@/lib/roles'
import { requirePermission, getUserTutor } from '@/lib/auth'

/**
 * POST /api/schedule/submit
 * Submit draft schedule change request for admin approval
 */
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requirePermission('SUBMIT_SCHEDULE_CHANGES')
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Validate user_id
    if (!user.user_id) {
      console.error('POST submit: user_id is undefined', user)
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Get tutor info
    const tutorInfo = await getUserTutor(user.user_id)
    if (!tutorInfo) {
      return NextResponse.json({ error: 'No tutor profile found' }, { status: 404 })
    }

    // Check if tutor already has a pending request
    const { data: pendingRequest } = await supabase
      .from('schedule_change_requests')
      .select('request_id, status')
      .eq('tutor_id', tutorInfo.tutor_id)
      .eq('status', 'pending')
      .single()

    if (pendingRequest) {
      return NextResponse.json(
        {
          error: 'You already have a pending request. Please wait for admin approval.',
          requestId: pendingRequest.request_id
        },
        { status: 409 }
      )
    }

    // Get draft request
    const { data: draftRequest, error: draftError } = await supabase
      .from('schedule_change_requests')
      .select('request_id')
      .eq('tutor_id', tutorInfo.tutor_id)
      .eq('status', 'draft')
      .single()

    if (draftError || !draftRequest) {
      return NextResponse.json(
        { error: 'No draft found. Please save your changes first.' },
        { status: 404 }
      )
    }

    // Get draft slots count
    const { count: slotsCount } = await supabase
      .from('schedule_change_slots')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', draftRequest.request_id)

    if (!slotsCount || slotsCount === 0) {
      return NextResponse.json(
        { error: 'Draft has no changes. Please add some schedule changes first.' },
        { status: 400 }
      )
    }

    // Update request status to pending
    const { error: updateError } = await supabase
      .from('schedule_change_requests')
      .update({
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .eq('request_id', draftRequest.request_id)

    if (updateError) throw updateError

    // Get all approvers (admins and project managers).
    // Uses the admin client: tutors cannot read other users or write their notifications under RLS.
    const adminClient = createAdminClient() ?? supabase
    const { data: admins } = await adminClient
      .from('users')
      .select('user_id, email, full_name')
      .in('role', FULL_ACCESS_ROLES)

    // Create notifications for all admins
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.user_id,
        type: 'schedule_submitted',
        title: 'New Schedule Change Request',
        message: `${tutorInfo.tutor_name} has submitted a schedule change request with ${slotsCount} change(s).`,
        link: `/admin/schedule-requests/${draftRequest.request_id}`,
        related_request_id: draftRequest.request_id,
      }))

      await adminClient.from('notifications').insert(notifications)
    }

    // TODO: Send email notifications to admins
    // This can be implemented using Supabase Edge Functions or an email service

    return NextResponse.json({
      success: true,
      requestId: draftRequest.request_id,
      message: 'Schedule change request submitted successfully',
      changeCount: slotsCount,
    })
  } catch (error: any) {
    console.error('Submit request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
