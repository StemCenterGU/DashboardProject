import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'

// GET /api/admin/report-config - Retrieve report configuration and questions
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

    // Fetch email configuration
    const { data: config, error: configError } = await supabase
      .from('client_report_config')
      .select('*')
      .limit(1)
      .single()

    if (configError && configError.code !== 'PGRST116') {
      console.error('Error fetching report config:', configError)
      return NextResponse.json({ error: configError.message }, { status: 500 })
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('client_report_questions')
      .select('*')
      .order('question_number', { ascending: true })

    if (questionsError) {
      console.error('Error fetching report questions:', questionsError)
      return NextResponse.json({ error: questionsError.message }, { status: 500 })
    }

    return NextResponse.json({
      email_body: config?.email_body || '',
      email_subject: config?.email_subject || 'Automated Tutoring Report - [username], [date]',
      questions: questions || [],
    })
  } catch (error: any) {
    console.error('GET report config error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/report-config - Update report configuration and questions
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
    const { email_body, email_subject, questions } = body

    // Update email configuration
    const { error: configError } = await supabase
      .from('client_report_config')
      .upsert({
        id: 1,
        email_body,
        email_subject,
        updated_at: new Date().toISOString(),
      })

    if (configError) {
      console.error('Error updating report config:', configError)
      return NextResponse.json({ error: configError.message }, { status: 500 })
    }

    // Delete all existing questions and insert new ones
    const { error: deleteError } = await supabase
      .from('client_report_questions')
      .delete()
      .neq('id', 0) // Delete all

    if (deleteError) {
      console.error('Error deleting questions:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Insert new questions if any
    if (questions && questions.length > 0) {
      const { error: insertError } = await supabase
        .from('client_report_questions')
        .insert(questions.map((q: any) => ({
          question_number: q.question_number,
          question_text: q.question_text,
          possible_answers: q.possible_answers,
          is_required: q.is_required,
        })))

      if (insertError) {
        console.error('Error inserting questions:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT report config error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
