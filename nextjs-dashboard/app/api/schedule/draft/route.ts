import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAuth, getUserTutor } from '@/lib/auth'

/**
 * GET /api/schedule/draft
 * Fetch tutor's current draft request or pending request
 */
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
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
      console.error('GET draft: user_id is undefined', user)
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Get tutor info
    const tutorInfo = await getUserTutor(user.user_id)
    if (!tutorInfo) {
      return NextResponse.json({ error: 'No tutor profile found' }, { status: 404 })
    }

    // Get draft or pending request
    const { data: request, error } = await supabase
      .from('schedule_change_requests')
      .select(`
        *,
        schedule_change_slots(*)
      `)
      .eq('tutor_id', tutorInfo.tutor_id)
      .in('status', ['draft', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      request: request || null,
      hasDraft: request?.status === 'draft',
      hasPending: request?.status === 'pending',
    })
  } catch (error: any) {
    console.error('Get draft error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/schedule/draft
 * Create or update a draft schedule change request
 */
export async function POST(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
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
      console.error('POST draft: user_id is undefined', user)
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Get tutor info
    const tutorInfo = await getUserTutor(user.user_id)
    if (!tutorInfo) {
      return NextResponse.json({ error: 'No tutor profile found' }, { status: 404 })
    }

    const body = await request.json()
    const { slots } = body // Array of {action, day_of_week, start_time, end_time, original_slot_id?}

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: 'Invalid slots data' }, { status: 400 })
    }

    // Check if tutor already has a pending request
    const { data: pendingRequest } = await supabase
      .from('schedule_change_requests')
      .select('request_id')
      .eq('tutor_id', tutorInfo.tutor_id)
      .eq('status', 'pending')
      .single()

    if (pendingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request. Please wait for admin approval.' },
        { status: 409 }
      )
    }

    // Check if draft exists
    const { data: existingDraft } = await supabase
      .from('schedule_change_requests')
      .select('request_id')
      .eq('tutor_id', tutorInfo.tutor_id)
      .eq('status', 'draft')
      .single()

    let requestId: string

    if (existingDraft) {
      // Update existing draft
      requestId = existingDraft.request_id

      // Delete old slots
      await supabase
        .from('schedule_change_slots')
        .delete()
        .eq('request_id', requestId)
    } else {
      // Create new draft request
      const { data: newRequest, error: createError } = await supabase
        .from('schedule_change_requests')
        .insert({
          tutor_id: tutorInfo.tutor_id,
          submitted_by: user.user_id,
          status: 'draft',
        })
        .select('request_id')
        .single()

      if (createError) throw createError
      requestId = newRequest.request_id
    }

    // Insert new slots
    const slotsToInsert = slots.map((slot: any) => ({
      request_id: requestId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      action: slot.action,
      original_slot_id: slot.original_slot_id || null,
    }))

    const { error: insertError } = await supabase
      .from('schedule_change_slots')
      .insert(slotsToInsert)

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Draft saved successfully',
    })
  } catch (error: any) {
    console.error('Save draft error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/schedule/draft
 * Discard current draft
 */
export async function DELETE(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
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
      console.error('DELETE draft: user_id is undefined', user)
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Get tutor info
    const tutorInfo = await getUserTutor(user.user_id)
    if (!tutorInfo) {
      return NextResponse.json({ error: 'No tutor profile found' }, { status: 404 })
    }

    // Delete draft request (cascade will delete slots)
    const { error } = await supabase
      .from('schedule_change_requests')
      .delete()
      .eq('tutor_id', tutorInfo.tutor_id)
      .eq('status', 'draft')

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Draft discarded',
    })
  } catch (error: any) {
    console.error('Delete draft error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
