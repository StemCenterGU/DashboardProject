/**
 * Script to set a user's role to admin
 * 
 * Usage:
 *   node scripts/utils/set-admin-role.js your-email@example.com
 */

require('dotenv').config({ path: '.env.local' })

// Use built-in fetch (Node 18+)
const fetch = globalThis.fetch || require('node-fetch')

async function setAdminRole(email) {
  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: node scripts/utils/set-admin-role.js your-email@example.com')
    process.exit(1)
  }

  // Check for port in environment or default to 3001 (common alternative port)
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3001'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`
  const apiUrl = `${baseUrl}/api/admin/set-role`

  console.log('🔧 Setting admin role...')
  console.log(`📧 Email: ${email}`)
  console.log(`🔗 URL: ${apiUrl}`)
  console.log('')

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role: 'admin' }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Failed:', result.error || 'Unknown error')
      process.exit(1)
    }

    console.log('✅ Success!')
    console.log(`   User: ${result.user.email}`)
    console.log(`   Role: ${result.user.role}`)
    console.log('')
    console.log('✨ You can now login with admin privileges!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('')
    console.error('💡 Make sure:')
    console.error('   1. Next.js dev server is running (npm run dev)')
    console.error('   2. .env.local has Supabase credentials')
    process.exit(1)
  }
}

const email = process.argv[2]
setAdminRole(email)

