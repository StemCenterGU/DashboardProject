import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'

// PUT /api/admin/form-questions/[id] - Update an existing question
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
    if (!hasPermission(userRole, 'EDIT_SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const updateData: any = {}

    // Only update fields that are provided
    if ('question_text' in body) updateData.question_text = body.question_text
    if ('possible_answers' in body) updateData.possible_answers = body.possible_answers
    if ('is_required' in body) updateData.is_required = body.is_required
    if ('visibility' in body) updateData.visibility = body.visibility
    if ('send_to_staff' in body) updateData.send_to_staff = body.send_to_staff
    if ('schedule_restrictions' in body) updateData.schedule_restrictions = body.schedule_restrictions

    const { data: question, error } = await supabase
      .from('appointment_form_questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }
      console.error('Error updating form question:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ question })
  } catch (error: any) {
    console.error('PUT form question error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/form-questions/[id] - Remove a question and adjust subsequent numbers
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
    if (!hasPermission(userRole, 'EDIT_SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    // Get the question to be deleted
    const { data: questionToDelete, error: fetchError } = await supabase
      .from('appointment_form_questions')
      .select('question_number')
      .eq('id', id)
      .single()

    if (fetchError || !questionToDelete) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Delete the question
    const { error: deleteError } = await supabase
      .from('appointment_form_questions')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting form question:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Adjust subsequent question numbers (decrement all questions with higher numbers)
    const { error: updateError } = await supabase.rpc('decrement_question_numbers', {
      deleted_number: questionToDelete.question_number
    })

    // If the RPC doesn't exist, manually update
    if (updateError) {
      const { data: subsequentQuestions } = await supabase
        .from('appointment_form_questions')
        .select('id, question_number')
        .gt('question_number', questionToDelete.question_number)

      if (subsequentQuestions) {
        for (const q of subsequentQuestions) {
          await supabase
            .from('appointment_form_questions')
            .update({ question_number: q.question_number - 1 })
            .eq('id', q.id)
        }
      }
    }

    return NextResponse.json({ message: 'Question deleted successfully' })
  } catch (error: any) {
    console.error('DELETE form question error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
