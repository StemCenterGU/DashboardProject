import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'

// GET /api/admin/form-questions - Retrieve all questions ordered by number
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

    // Check permissions
    const userRole = user.role ?? ''
    if (!hasPermission(userRole, 'EDIT_SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { data: questions, error } = await supabase
      .from('appointment_form_questions')
      .select('*')
      .order('question_number', { ascending: true })

    if (error) {
      console.error('Error fetching form questions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('GET form questions error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/form-questions - Create a new question
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

    // Check permissions
    const userRole = user.role ?? ''
    if (!hasPermission(userRole, 'EDIT_SYSTEM_SETTINGS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.question_text || body.question_number === undefined) {
      return NextResponse.json(
        { error: 'question_text and question_number are required' },
        { status: 400 }
      )
    }

    // Check max limit of 20 questions
    const { count } = await supabase
      .from('appointment_form_questions')
      .select('*', { count: 'exact', head: true })

    if (count && count >= 20) {
      return NextResponse.json(
        { error: 'Maximum of 20 questions reached' },
        { status: 400 }
      )
    }

    // Validate question_number is between 1 and 20
    if (body.question_number < 1 || body.question_number > 20) {
      return NextResponse.json(
        { error: 'question_number must be between 1 and 20' },
        { status: 400 }
      )
    }

    const questionData = {
      question_number: body.question_number,
      question_text: body.question_text,
      possible_answers: body.possible_answers || null,
      is_required: body.is_required ?? false,
      visibility: body.visibility || 'Normal Visibility',
      send_to_staff: body.send_to_staff ?? false,
      schedule_restrictions: body.schedule_restrictions || [],
    }

    const { data: question, error } = await supabase
      .from('appointment_form_questions')
      .insert(questionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating form question:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ question }, { status: 201 })
  } catch (error: any) {
    console.error('POST form questions error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
