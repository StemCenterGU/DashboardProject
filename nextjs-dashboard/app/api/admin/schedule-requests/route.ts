import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAuth, hasPermissionCheck } from '@/lib/auth'

/**
 * GET /api/admin/schedule-requests
 * List all schedule change requests (admin only)
 * Query params: status (pending|all), search (tutor name), limit, offset
 */
export async function GET(request: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin permission
  if (!hasPermissionCheck(user, 'VIEW_ALL_SCHEDULES')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'pending'
    const searchQuery = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('schedule_change_requests')
      .select(`
        request_id,
        tutor_id,
        submitted_by,
        status,
        submitted_at,
        reviewed_at,
        reviewed_by,
        admin_notes,
        rejection_reason,
        created_at,
        updated_at,
        tutors!schedule_change_requests_tutor_id_fkey (
          tutor_id,
          tutor_name,
          username,
          role
        ),
        users!schedule_change_requests_submitted_by_fkey (
          email,
          full_name
        ),
        schedule_change_slots (
          change_slot_id,
          day_of_week,
          start_time,
          end_time,
          action
        )
      `, { count: 'exact' })

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    // Apply search filter (tutor name)
    if (searchQuery) {
      const { data: tutors } = await supabase
        .from('tutors')
        .select('tutor_id')
        .ilike('tutor_name', `%${searchQuery}%`)

      if (tutors && tutors.length > 0) {
        const tutorIds = tutors.map(t => t.tutor_id)
        query = query.in('tutor_id', tutorIds)
      } else {
        // No matching tutors, return empty
        return NextResponse.json({
          requests: [],
          total: 0,
          limit,
          offset,
        })
      }
    }

    // Apply pagination and ordering
    const { data: requests, error, count } = await query
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Calculate change counts for each request
    const requestsWithCounts = (requests || []).map(req => ({
      ...req,
      changeCount: req.schedule_change_slots?.length || 0,
      addCount: req.schedule_change_slots?.filter((s: any) => s.action === 'add').length || 0,
      deleteCount: req.schedule_change_slots?.filter((s: any) => s.action === 'delete').length || 0,
      modifyCount: req.schedule_change_slots?.filter((s: any) => s.action === 'modify').length || 0,
    }))

    return NextResponse.json({
      requests: requestsWithCounts,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get schedule requests error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
