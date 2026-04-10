import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for current user
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

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.user_id)
      .eq('read', false)

    if (error) throw error

    return NextResponse.json({
      unreadCount: count || 0,
    })
  } catch (error: any) {
    console.error('Get unread count error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
