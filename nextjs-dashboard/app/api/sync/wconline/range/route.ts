import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { WCOnlineSyncService } from '@/lib/wconline-sync'

/**
 * Sync WCOnline data for a date range
 * 
 * POST /api/sync/wconline/range?start=2024-10-01&end=2024-12-07
 * 
 * Or use default range (Oct 1 - Dec 7, 2024):
 * POST /api/sync/wconline/range
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')

    // Default: October 1, 2024 to December 7, 2024
    const defaultStart = new Date('2024-10-01')
    const defaultEnd = new Date('2024-12-07')

    let startDate = startParam ? new Date(startParam) : defaultStart
    let endDate = endParam ? new Date(endParam) : defaultEnd

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    const syncService = new WCOnlineSyncService(supabase)
    const results = []
    const errors: string[] = []

    // Loop through each date
    const currentDate = new Date(startDate)
    let totalAppointments = 0
    let totalSlots = 0
    let totalTutors = 0
    let totalCourses = 0

    console.log(`🔄 Starting sync for date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      console.log(`📅 Syncing date: ${dateStr}`)

      try {
        const result = await syncService.syncAll(new Date(currentDate))

        results.push({
          date: dateStr,
          success: result.success,
          appointments: result.appointments.synced,
          slots: result.availableSlots.synced,
          tutors: result.tutors.synced,
          courses: result.courses.synced,
          errors: result.errors.length,
        })

        totalAppointments += result.appointments.synced
        totalSlots += result.availableSlots.synced
        totalTutors += result.tutors.synced
        totalCourses += result.courses.synced

        if (result.errors.length > 0) {
          errors.push(...result.errors.map(e => `${dateStr}: ${e}`))
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error: any) {
        console.error(`Error syncing ${dateStr}:`, error)
        errors.push(`${dateStr}: ${error.message}`)
        results.push({
          date: dateStr,
          success: false,
          appointments: 0,
          slots: 0,
          tutors: 0,
          courses: 0,
          errors: 1,
        })
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const successCount = results.filter(r => r.success).length
    const totalDays = results.length

    return NextResponse.json({
      success: errors.length === 0,
      message: `Synced ${totalDays} days (${successCount} successful)`,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        totalDays: totalDays,
      },
      summary: {
        totalAppointments: totalAppointments,
        totalSlots: totalSlots,
        totalTutors: totalTutors,
        totalCourses: totalCourses,
        successfulDays: successCount,
        failedDays: totalDays - successCount,
      },
      dailyResults: results,
      errors: errors,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Date range sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync date range',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check range sync info
 */
export async function GET() {
  return NextResponse.json({
    message: 'Date range sync endpoint',
    usage: 'POST /api/sync/wconline/range?start=YYYY-MM-DD&end=YYYY-MM-DD',
    defaultRange: 'October 1, 2024 to December 7, 2024',
    example: 'POST /api/sync/wconline/range (uses default range)',
    example2: 'POST /api/sync/wconline/range?start=2024-10-01&end=2024-12-07',
  })
}

