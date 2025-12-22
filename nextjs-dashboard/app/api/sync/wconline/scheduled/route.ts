import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { WCOnlineSyncService } from '@/lib/wconline-sync'

/**
 * Scheduled Sync Endpoint
 * 
 * This endpoint is designed to be called by a cron job or scheduled task
 * every hour to keep data in sync with WCOnline.
 * 
 * POST /api/sync/wconline/scheduled
 * 
 * Headers:
 * - Authorization: Bearer <CRON_SECRET> (optional, for security)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.WCONLINE_CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    // Sync for today and next 7 days
    const today = new Date()
    const syncResults = []
    
    for (let i = 0; i < 7; i++) {
      const syncDate = new Date(today)
      syncDate.setDate(today.getDate() + i)
      
      const syncService = new WCOnlineSyncService(supabase)
      const result = await syncService.syncAll(syncDate)
      
      syncResults.push({
        date: syncDate.toISOString().split('T')[0],
        success: result.success,
        appointments: result.appointments.synced,
        slots: result.availableSlots.synced,
        errors: result.errors.length,
      })
    }

    const totalSuccess = syncResults.every(r => r.success)
    const totalAppointments = syncResults.reduce((sum, r) => sum + r.appointments, 0)
    const totalSlots = syncResults.reduce((sum, r) => sum + r.slots, 0)

    return NextResponse.json({
      success: totalSuccess,
      message: `Scheduled sync completed for 7 days`,
      summary: {
        totalAppointments: totalAppointments,
        totalSlots: totalSlots,
        daysSynced: syncResults.length,
      },
      dailyResults: syncResults,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Scheduled sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to perform scheduled sync',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check scheduled sync status
 */
export async function GET() {
  return NextResponse.json({
    message: 'Scheduled sync endpoint',
    usage: 'POST /api/sync/wconline/scheduled',
    description: 'Syncs WCOnline data for today and next 7 days',
    schedule: 'Recommended: Run every hour',
    security: 'Set CRON_SECRET or WCONLINE_CRON_SECRET env variable for authentication',
  })
}

