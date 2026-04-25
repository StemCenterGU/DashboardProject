import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'

// PUT /api/admin/form-questions/reorder - Bulk update question numbers for reordering
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

    // Check permissions
    const userRole = user.role ?? ''
    if (!hasPermission(userRole, 'EDIT_SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate that we have an array of {id, question_number} objects
    if (!Array.isArray(body.questions)) {
      return NextResponse.json(
        { error: 'Expected array of questions with id and question_number' },
        { status: 400 }
      )
    }

    // Update each question's number
    const updates = body.questions.map(async (q: { id: string; question_number: number }) => {
      return supabase
        .from('appointment_form_questions')
        .update({ question_number: q.question_number })
        .eq('id', q.id)
    })

    await Promise.all(updates)

    return NextResponse.json({ message: 'Questions reordered successfully' })
  } catch (error: any) {
    console.error('PUT reorder error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
