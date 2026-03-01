import { NextRequest, NextResponse } from 'next/server'

/**
 * Scheduled Sync Endpoint — DISABLED
 *
 * Data is no longer fetched from the WCOnline API. The system uses Supabase as the
 * single source of truth: all data is read from and written to Supabase. Existing
 * data in Supabase is kept; new appointments and tutors are created on the website
 * and stored in Supabase. See docs/DATA-SOURCE-POLICY.md.
 *
 * POST /api/sync/wconline/scheduled
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    disabled: true,
    message: 'WCOnline sync is disabled. Data is stored and read from Supabase only.',
    timestamp: new Date().toISOString(),
  })
}

/**
 * GET endpoint to check scheduled sync status
 */
export async function GET() {
  return NextResponse.json({
    message: 'Scheduled sync endpoint (disabled)',
    usage: 'POST /api/sync/wconline/scheduled',
    disabled: true,
    description: 'WCOnline sync is disabled. All data is read from and written to Supabase. See docs/DATA-SOURCE-POLICY.md.',
  })
}

