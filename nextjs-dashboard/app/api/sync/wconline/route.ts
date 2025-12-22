import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { WCOnlineSyncService } from '@/lib/wconline-sync'

/**
 * Sync WCOnline data to Supabase
 * 
 * POST /api/sync/wconline
 * 
 * Query parameters:
 * - date: YYYY-MM-DD format (optional, defaults to today)
 * 
 * Returns sync results with counts of synced items
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin/manager only)
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // TODO: Add authentication check here
    // For now, allow anyone (add auth later)

    // Get optional date parameter
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    
    let syncDate: Date | undefined
    if (dateParam) {
      syncDate = new Date(dateParam)
      if (isNaN(syncDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }
    }

    // Initialize sync service
    const syncService = new WCOnlineSyncService(supabase)

    // Perform complete sync (AVAIL + CUSTOM)
    const result = await syncService.syncAll(syncDate)

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Sync completed successfully' 
        : 'Sync completed with errors',
      results: {
        appointments: {
          fetched: result.appointments.fetched,
          synced: result.appointments.synced,
          errors: result.appointments.errors,
        },
        availableSlots: {
          fetched: result.availableSlots.fetched,
          synced: result.availableSlots.synced,
          errors: result.availableSlots.errors,
        },
        tutors: {
          fetched: result.tutors.fetched,
          synced: result.tutors.synced,
          errors: result.tutors.errors,
        },
        courses: {
          fetched: result.courses.fetched,
          synced: result.courses.synced,
          errors: result.courses.errors,
        },
      },
      errors: result.errors,
      syncTime: result.syncTime,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('WCOnline sync API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync WCOnline data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check sync status or test connection
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Check if WCOnline is configured
    const apiKey = process.env.WCONLINE_API_KEY
    const isConfigured = !!apiKey

    return NextResponse.json({
      configured: isConfigured,
      message: isConfigured 
        ? 'WCOnline API is configured' 
        : 'WCOnline API key not found in environment variables',
      endpoints: {
        sync: 'POST /api/sync/wconline',
        syncWithDate: 'POST /api/sync/wconline?date=YYYY-MM-DD',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check sync status' },
      { status: 500 }
    )
  }
}

