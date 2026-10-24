/**
 * Create one test account per role (safe to re-run).
 * Uses SUPABASE_SERVICE_ROLE_KEY from .env.local, so it only works on a trusted machine.
 *
 * Usage:
 *   node scripts/utils/create-test-accounts.js you@gmail.com [--reset-passwords]
 *
 * Accounts use plus-addresses of the given email (you+admin@gmail.com, you+tutor@gmail.com, ...),
 * so every message lands in one inbox. Tutor-type accounts get a linked tutors row so they
 * have "own" appointments. New passwords are printed once; existing accounts keep theirs
 * unless --reset-passwords is passed.
 *
 * Run the role/RLS migration (20261024000000_role_restructure_and_rls.sql) first.
 */

require('dotenv').config({ path: '.env.local' })
const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

const ACCOUNTS = [
  { role: 'admin', slug: 'admin', name: 'Test Admin' },
  { role: 'project_manager', slug: 'projectmanager', name: 'Test Project Manager' },
  { role: 'student_manager', slug: 'studentmanager', name: 'Test Student Manager', tutor: true },
  { role: 'tutor', slug: 'tutor', name: 'Test Tutor', tutor: true },
  { role: 'stem_pass_tutor', slug: 'stempasstutor', name: 'Test STEM PASS Tutor', tutor: true },
  { role: 'student', slug: 'student', name: 'Test Student' },
]

function plusAddress(base, slug) {
  const [local, domain] = base.split('@')
  return `${local}+${slug}@${domain}`.toLowerCase()
}

function newPassword() {
  return crypto.randomBytes(12).toString('base64url')
}

async function main() {
  const base = process.argv[2]
  const resetPasswords = process.argv.includes('--reset-passwords')
  if (!base || !base.includes('@')) {
    console.error('Usage: node scripts/utils/create-test-accounts.js you@gmail.com [--reset-passwords]')
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

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) {
    console.error('❌ Could not list Auth users:', listError.message)
    process.exit(1)
  }

  const results = []
  for (const account of ACCOUNTS) {
    const email = plusAddress(base, account.slug)
    let authUser = list.users.find((u) => u.email?.toLowerCase() === email)
    let password = '(unchanged)'

    if (!authUser) {
      password = newPassword()
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: account.name },
      })
      if (error) {
        console.error(`❌ ${email}: ${error.message}`)
        process.exit(1)
      }
      authUser = data.user
    } else if (resetPasswords) {
      password = newPassword()
      const { error } = await supabase.auth.admin.updateUserById(authUser.id, { password })
      if (error) {
        console.error(`❌ ${email}: ${error.message}`)
        process.exit(1)
      }
    }

    const { error: rowError } = await supabase
      .from('users')
      .upsert(
        { user_id: authUser.id, email, full_name: account.name, role: account.role, active: true },
        { onConflict: 'user_id' }
      )
    if (rowError) {
      console.error(`❌ ${email} users row: ${rowError.message}`)
      process.exit(1)
    }

    if (account.tutor) {
      const { data: linked } = await supabase
        .from('tutors')
        .select('tutor_id')
        .eq('user_id', authUser.id)
        .maybeSingle()
      if (!linked) {
        const { error: tutorError } = await supabase
          .from('tutors')
          .insert({ tutor_name: account.name, username: account.slug, user_id: authUser.id })
        if (tutorError) {
          console.error(`❌ ${email} tutors row: ${tutorError.message}`)
          process.exit(1)
        }
      }
    }

    results.push({ role: account.role, email, password })
  }

  console.log('\n✅ Test accounts ready:\n')
  console.table(results)
  console.log('\nSave the new passwords now; they are not stored anywhere.')
}

main()
