import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Get unique statuses from appointments table
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('status')
      .not('status', 'is', null)

    if (error) {
      throw error
    }

    // Extract unique statuses
    const uniqueStatuses = Array.from(
      new Set(appointments?.map(apt => apt.status).filter(Boolean))
    ).sort()

    // Map to label format
    const statusOptions = uniqueStatuses.map(status => ({
      value: status,
      label: status
        .split('_')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }))

    return NextResponse.json(statusOptions)
  } catch (error: any) {
    console.error('Error getting statuses:', error)
    return NextResponse.json([], { status: 500 })
  }
}

