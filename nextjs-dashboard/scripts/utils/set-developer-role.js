/**
 * Set a user's role to developer (so they see the Replica / new features).
 *
 * Usage:
 *   node scripts/utils/set-developer-role.js your-email@example.com
 *
 * Requires the Next.js dev server to be running (or a deployed app with set-role API).
 */

require('dotenv').config({ path: '.env.local' })

const fetch = globalThis.fetch || require('node-fetch')

async function setDeveloperRole(email) {
  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: node scripts/utils/set-developer-role.js your-email@example.com')
    process.exit(1)
  }

  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3001'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`
  const apiUrl = `${baseUrl}/api/admin/set-role`

  console.log('🔧 Setting developer role...')
  console.log(`📧 Email: ${email}`)
  console.log(`🔗 URL: ${apiUrl}`)
  console.log('')

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: 'developer' }),
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
    console.log('✨ Log in with this account to see the Replica link and new changes.')
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('')
    console.error('💡 Make sure:')
    console.error('   1. Next.js dev server is running (npm run dev)')
    console.error('   2. .env.local has Supabase credentials')
    process.exit(1)
  }
}

setDeveloperRole(process.argv[2])
