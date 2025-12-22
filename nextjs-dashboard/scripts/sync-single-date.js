/**
 * Local Script to Sync WCOnline Data for a Single Date
 * 
 * Usage:
 *   node scripts/sync-single-date.js
 *   node scripts/sync-single-date.js 2024-10-15
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

async function syncSingleDate(date) {
  // Check for port in environment or default to 3001 (common alternative port)
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3001'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`
  const syncUrl = `${baseUrl}/api/sync/wconline${date ? `?date=${date}` : ''}`

  console.log('🔄 Syncing WCOnline data...')
  console.log(`📅 Date: ${date || 'Today'}`)
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
    console.log('📊 Results:')
    console.log(`   Appointments: ${result.results.appointments.synced}/${result.results.appointments.fetched}`)
    console.log(`   Available Slots: ${result.results.availableSlots.synced}/${result.results.availableSlots.fetched}`)
    console.log(`   Tutors: ${result.results.tutors.synced}/${result.results.tutors.fetched}`)
    console.log(`   Courses: ${result.results.courses.synced}/${result.results.courses.fetched}`)
    console.log('')

    if (result.errors && result.errors.length > 0) {
      console.log('⚠️  Errors:')
      result.errors.forEach(error => console.log(`   - ${error}`))
    }

    return result
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
    console.error('')
    console.error('💡 Make sure:')
    console.error('   1. Next.js dev server is running (npm run dev)')
    console.error('   2. .env.local has WCONLINE_API_KEY set')
    process.exit(1)
  }
}

// Get date from command line or use today
const date = process.argv[2]

if (date) {
  const testDate = new Date(date)
  if (isNaN(testDate.getTime())) {
    console.error('❌ Invalid date format. Use YYYY-MM-DD')
    process.exit(1)
  }
}

syncSingleDate(date)
  .then(() => {
    console.log('✨ Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

