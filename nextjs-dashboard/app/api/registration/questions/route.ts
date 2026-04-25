import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/registration/questions - Get all active registration questions (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { data: questions, error } = await supabase
      .from('registration_form_questions')
      .select('*')
      .order('question_number', { ascending: true })

    if (error) {
      console.error('Error fetching registration questions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('GET registration questions error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
