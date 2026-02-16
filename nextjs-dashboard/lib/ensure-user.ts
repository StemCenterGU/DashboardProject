/**
 * Ensures the authenticated user has a row in the users table.
 * If missing (e.g. after clearing the table or an old Auth-only user), inserts one on first load.
 * Tries insert with the user's client first (RLS allows authenticated insert); falls back to service role if needed.
 */

import { createClient } from '@supabase/supabase-js'
import type { User as AuthUser } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface UsersRow {
  user_id: string
  email: string
  full_name: string | null
  role: string
  active: boolean
}

/**
 * If the auth user has no row in public.users, insert one and return it.
 * Uses the provided supabase client (user's session) first so it works without service role key.
 * Falls back to service role client if insert fails (e.g. stricter RLS).
 */
export async function ensureUserRow(
  supabase: SupabaseClient,
  authUser: AuthUser
): Promise<UsersRow | null> {
  const email = authUser.email?.toLowerCase().trim() ?? ''
  const fullName = authUser.user_metadata?.full_name ?? authUser.email ?? ''
  const allowedRoles = ['tutor', 'lead_tutor', 'manager', 'admin', 'developer']
  const metaRole = authUser.user_metadata?.role ?? 'tutor'
  const role = allowedRoles.includes(metaRole) ? metaRole : 'tutor'
  const row = {
    user_id: authUser.id,
    email,
    full_name: fullName,
    role,
    active: true,
  }

  // 1) Check if row already exists (user's client)
  const { data: existing } = await supabase
    .from('users')
    .select('user_id, email, full_name, role, active')
    .eq('user_id', authUser.id)
    .single()

  if (existing) {
    return existing as UsersRow
  }

  // 2) Try insert with user's client (RLS: "insertable by authenticated users")
  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert(row)
    .select('user_id, email, full_name, role, active')
    .single()

  if (!insertError && inserted) {
    return inserted as UsersRow
  }

  // 3) Fallback: service role (e.g. if RLS blocks or env only has service key)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.warn('ensureUserRow: insert failed (user client) and no service key:', insertError?.message)
    return null
  }

  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: insertedService, error: serviceError } = await serviceClient
    .from('users')
    .insert(row)
    .select('user_id, email, full_name, role, active')
    .single()

  if (serviceError) {
    console.warn('ensureUserRow: service insert failed:', serviceError.message)
    return null
  }

  return insertedService as UsersRow
}
