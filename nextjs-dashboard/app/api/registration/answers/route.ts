import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// POST /api/registration/answers - Submit registration answers (upsert)
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

    const body = await request.json()

    // Validate required fields
    if (!Array.isArray(body.answers)) {
      return NextResponse.json(
        { error: 'answers array is required' },
        { status: 400 }
      )
    }

    // Prepare answers for upsert
    const answersData = body.answers.map((answer: any) => ({
      user_id: user.user_id,
      question_id: answer.question_id,
      answer_text: answer.answer_text,
    }))

    // Upsert all answers (insert or update if exists)
    const { data, error } = await supabase
      .from('user_registration_answers')
      .upsert(answersData, {
        onConflict: 'user_id,question_id',
      })
      .select()

    if (error) {
      console.error('Error saving registration answers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ answers: data }, { status: 201 })
  } catch (error: any) {
    console.error('POST registration answers error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// GET /api/registration/answers - Get user's registration answers
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
    const userId = searchParams.get('user_id') || user.user_id

    const { data: answers, error } = await supabase
      .from('user_registration_answers')
      .select(`
        *,
        question:registration_form_questions(*)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching registration answers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ answers })
  } catch (error: any) {
    console.error('GET registration answers error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
