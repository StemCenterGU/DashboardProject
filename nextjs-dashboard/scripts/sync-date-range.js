/**
 * Local Script to Sync WCOnline Data for Date Range
 * 
 * Usage:
 *   node scripts/sync-date-range.js                    # Uses default dates (2025-01-01 to 2025-01-14)
 *   node scripts/sync-date-range.js 2025-01-01 2025-01-14  # Custom date range
 */

// Load environment variables from .env.local
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  // dotenv not installed, try to load manually or use process.env
  console.warn('⚠️  dotenv not found. Make sure .env.local exists and env vars are set.')
}

// Use built-in fetch (Node 18+) or node-fetch if needed
const fetch = globalThis.fetch || require('node-fetch')

// Default dates - change these or pass as arguments
const DEFAULT_START = '2025-01-01'  // Change this to your desired start date
const DEFAULT_END = '2025-01-14'    // Change this to your desired end date

async function syncDateRange(startDate, endDate) {
  // Check for port in environment or default to 3001 (common alternative port)
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3001'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`
  const syncUrl = `${baseUrl}/api/sync/wconline/range?start=${startDate}&end=${endDate}`

  console.log('🔄 Starting date range sync...')
  console.log(`📅 Range: ${startDate} to ${endDate}`)
  console.log(`🔗 URL: ${syncUrl}`)
  console.log('')

  try {
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()

    console.log('✅ Sync completed!')
    console.log('')
    console.log('📊 Summary:')
    console.log(`   Total Days: ${result.dateRange.totalDays}`)
    console.log(`   Successful: ${result.summary.successfulDays}`)
    console.log(`   Failed: ${result.summary.failedDays}`)
    console.log('')
    console.log('📈 Data Synced:')
    console.log(`   Appointments: ${result.summary.totalAppointments}`)
    console.log(`   Available Slots: ${result.summary.totalSlots}`)
    console.log(`   Tutors: ${result.summary.totalTutors}`)
    console.log(`   Courses: ${result.summary.totalCourses}`)
    console.log('')

    if (result.errors && result.errors.length > 0) {
      console.log('⚠️  Errors:')
      result.errors.forEach(error => console.log(`   - ${error}`))
      console.log('')
    }

    // Show first 5 days results
    if (result.dailyResults && result.dailyResults.length > 0) {
      console.log('📅 First 5 Days:')
      result.dailyResults.slice(0, 5).forEach(day => {
        const status = day.success ? '✅' : '❌'
        console.log(`   ${status} ${day.date}: ${day.appointments} appointments, ${day.slots} slots`)
      })
      if (result.dailyResults.length > 5) {
        console.log(`   ... and ${result.dailyResults.length - 5} more days`)
      }
      console.log('')
    }

    return result
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    console.error('')
    console.error('💡 Troubleshooting:')
    console.error('   1. Make sure your Next.js dev server is running (npm run dev)')
    console.error('   2. Check that .env.local has WCONLINE_API_KEY set')
    console.error('   3. Verify Supabase credentials are correct')
    process.exit(1)
  }
}

// Get date range from command line arguments or use defaults
const startDate = process.argv[2] || DEFAULT_START
const endDate = process.argv[3] || DEFAULT_END

// Validate dates
const start = new Date(startDate)
const end = new Date(endDate)

if (isNaN(start.getTime()) || isNaN(end.getTime())) {
  console.error('❌ Invalid date format. Use YYYY-MM-DD')
  console.error('   Example: node scripts/sync-date-range.js 2025-01-01 2025-01-14')
  process.exit(1)
}

if (start > end) {
  console.error('❌ Start date must be before end date')
  process.exit(1)
}

// Run sync
syncDateRange(startDate, endDate)
  .then(() => {
    console.log('✨ Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

