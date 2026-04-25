import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'

// PUT /api/reports/focus-options/[id] - Update a focus option (admin only)
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

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Check permissions
    const userRole = user.role ?? ''
    if (!hasPermission(userRole, 'MANAGE_REPORT_OPTIONS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}

    // Only update fields that are provided
    if ('option_text' in body) updateData.option_text = body.option_text
    if ('display_order' in body) updateData.display_order = body.display_order
    if ('is_active' in body) updateData.is_active = body.is_active

    const { data: option, error } = await supabase
      .from('report_focus_options')
      .update(updateData)
      .eq('option_id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Focus option not found' }, { status: 404 })
      }
      console.error('Error updating focus option:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ option })
  } catch (error: any) {
    console.error('PUT focus option error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/reports/focus-options/[id] - Delete a focus option (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check permissions
    const userRole = user.role ?? ''
    if (!hasPermission(userRole, 'MANAGE_REPORT_OPTIONS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('report_focus_options')
      .delete()
      .eq('option_id', id)

    if (error) {
      console.error('Error deleting focus option:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Focus option deleted successfully' })
  } catch (error: any) {
    console.error('DELETE focus option error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
