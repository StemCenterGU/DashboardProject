import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/roles'

// GET /api/reports/focus-options - Get all focus options by category
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('report_focus_options')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: options, error } = await query

    if (error) {
      console.error('Error fetching focus options:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by category if no specific category requested
    if (!category) {
      const grouped = options.reduce((acc: any, option: any) => {
        if (!acc[option.category]) {
          acc[option.category] = []
        }
        acc[option.category].push(option)
        return acc
      }, {})
      return NextResponse.json({ options: grouped })
    }

    return NextResponse.json({ options })
  } catch (error: any) {
    console.error('GET focus options error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reports/focus-options - Create a new focus option (admin only)
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
    if (!hasPermission(userRole, 'MANAGE_REPORT_OPTIONS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.category || !body.option_text) {
      return NextResponse.json(
        { error: 'category and option_text are required' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['broad_focus', 'resources', 'wrc_detailed', 'wrc_categories', 'missing_info']
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Get the highest display_order for this category
    const { data: lastOption } = await supabase
      .from('report_focus_options')
      .select('display_order')
      .eq('category', body.category)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const displayOrder = body.display_order ?? (lastOption ? lastOption.display_order + 1 : 1)

    const optionData = {
      category: body.category,
      option_text: body.option_text,
      display_order: displayOrder,
      is_active: body.is_active ?? true,
    }

    const { data: option, error } = await supabase
      .from('report_focus_options')
      .insert(optionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating focus option:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ option }, { status: 201 })
  } catch (error: any) {
    console.error('POST focus options error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
