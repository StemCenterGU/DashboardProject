/**
 * Set a user's role directly in Supabase (bootstrap the first admin, fix a role, etc.)
 * Uses SUPABASE_SERVICE_ROLE_KEY from .env.local, so it only works on a trusted machine.
 *
 * Usage:
 *   node scripts/utils/set-role.js your-email@example.com [role]
 *   npm run set-admin -- your-email@example.com
 *
 * Roles: admin, project_manager, student_manager, tutor, stem_pass_tutor, student (default: admin)
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const VALID_ROLES = ['admin', 'project_manager', 'student_manager', 'tutor', 'stem_pass_tutor', 'student']

async function setRole(email, role) {
  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: node scripts/utils/set-role.js your-email@example.com [role]')
    process.exit(1)
  }
  if (!VALID_ROLES.includes(role)) {
    console.error(`❌ Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`)
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const emailNorm = email.toLowerCase().trim()

  console.log(`🔧 Setting role "${role}" for ${emailNorm}...`)

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) {
    console.error('❌ Could not look up Auth users:', listError.message)
    process.exit(1)
  }
  const authUser = list.users.find((u) => u.email?.toLowerCase() === emailNorm)
  if (!authUser) {
    console.error('❌ No Supabase Auth account with that email. Sign up first.')
    process.exit(1)
  }

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        user_id: authUser.id,
        email: emailNorm,
        full_name: authUser.user_metadata?.full_name ?? emailNorm,
        role,
        active: true,
      },
      { onConflict: 'user_id' }
    )
    .select('email, role')
    .single()

  if (error) {
    console.error('❌ Failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Success!')
  console.log(`   User: ${data.email}`)
  console.log(`   Role: ${data.role}`)
}

setRole(process.argv[2], process.argv[3] || 'admin')
