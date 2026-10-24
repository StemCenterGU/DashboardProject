import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/report-config/populate-from-tables
 * Populates client report questions 3, 4, and 5 with data from the normalized tables
 */
export async function POST(request: NextRequest) {
  try {
    await requirePermission('EDIT_SYSTEM_SETTINGS')
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Fetch all courses from the courses table
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('code, name')
      .order('code', { ascending: true })

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ error: 'Failed to fetch courses: ' + coursesError.message }, { status: 500 })
    }

    // Fetch all instructors from the instructors table
    const { data: instructors, error: instructorsError } = await supabase
      .from('instructors')
      .select('name, department, email_id, email_address')
      .order('name', { ascending: true })

    if (instructorsError) {
      console.error('Error fetching instructors:', instructorsError)
      return NextResponse.json({ error: 'Failed to fetch instructors: ' + instructorsError.message }, { status: 500 })
    }

    // Build Question 3 possible_answers: "N/A,ACCT_313 (Accounting Information Systems),..."
    const coursesString = 'N/A,' + courses.map(c => `${c.code} (${c.name})`).join(',')

    // Build Question 4 possible_answers: "N/A,Abdelal Ahmed (Speech-Language Pathology-Rusk): ABDELAL001,..."
    const instructorsString = 'N/A,' + instructors.map(i => `${i.name} (${i.department}): ${i.email_id}`).join(',')

    // Build Question 5 possible_answers: "AUTOEMAIL,ABDELAL001@gannon.edu,..."
    const emailsString = 'AUTOEMAIL,' + instructors.map(i => i.email_address).join(',')

    // Update Question 3 (Course)
    const { error: updateQ3Error } = await supabase
      .from('client_report_questions')
      .update({ possible_answers: coursesString })
      .eq('question_number', 3)

    if (updateQ3Error) {
      console.error('Error updating question 3:', updateQ3Error)
      return NextResponse.json({ error: 'Failed to update question 3: ' + updateQ3Error.message }, { status: 500 })
    }

    // Update Question 4 (Instructor)
    const { error: updateQ4Error } = await supabase
      .from('client_report_questions')
      .update({ possible_answers: instructorsString })
      .eq('question_number', 4)

    if (updateQ4Error) {
      console.error('Error updating question 4:', updateQ4Error)
      return NextResponse.json({ error: 'Failed to update question 4: ' + updateQ4Error.message }, { status: 500 })
    }

    // Update Question 5 (Automated instructor email)
    const { error: updateQ5Error } = await supabase
      .from('client_report_questions')
      .update({ possible_answers: emailsString })
      .eq('question_number', 5)

    if (updateQ5Error) {
      console.error('Error updating question 5:', updateQ5Error)
      return NextResponse.json({ error: 'Failed to update question 5: ' + updateQ5Error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully populated questions 3, 4, and 5 from normalized tables',
      stats: {
        courses_count: courses.length,
        instructors_count: instructors.length,
        emails_count: instructors.length,
      },
    })
  } catch (error: any) {
    console.error('POST populate-from-tables error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
