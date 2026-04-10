import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/notifications
 * Fetch user's notifications
 * Query params: limit (default 20), offset, unreadOnly
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.user_id)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/notifications
 * Mark notification(s) as read
 * Body: { notificationId: string } | { notificationIds: string[] } | { markAllRead: true }
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { notificationId, notificationIds, markAllRead } = body

    if (markAllRead) {
      // Mark all as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.user_id)
        .eq('read', false)

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      })
    } else if (notificationId) {
      // Mark single notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('notification_id', notificationId)
        .eq('user_id', user.user_id) // Security: ensure user owns notification

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark multiple notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('notification_id', notificationIds)
        .eq('user_id', user.user_id) // Security: ensure user owns notifications

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: `${notificationIds.length} notifications marked as read`,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Update notifications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
